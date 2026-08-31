/**
 * Command executor: runs inside the user's browser and drives the real DOM.
 *
 * Every command returns a CommandResult. A step that could not do its job says
 * so, and the SDK surfaces that to the user instead of narrating over a
 * highlight that never appeared.
 */

import type { AgentCommand, CommandResult } from "../shared/types.js";
import { isSafePath, pathMatches } from "../shared/appRoutes.js";
import {
  showSubtitle,
  hideSubtitle,
  highlightElement,
  clearHighlight,
  showClickRipple,
} from "./overlay.js";

export class AbortedError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortedError";
  }
}

const ok: CommandResult = { ok: true };

/** Sleep that wakes early when the flow is cancelled. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    let timer: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Resolve the first selector in a comma-separated list that both parses and
 * matches. Selector lists are ordered by preference (data-guide hook first),
 * so the first hit wins rather than the first entry.
 */
function queryFirst(selectorList: string): { el: Element; selector: string } | null {
  for (const sel of selectorList.split(",").map((s) => s.trim()).filter(Boolean)) {
    try {
      const el = document.querySelector(sel);
      if (el) return { el, selector: sel };
    } catch {
      // An unparseable selector is a bug in the registry, not a runtime
      // condition. Skip it so one bad entry cannot take out the whole list.
      console.warn(`[oe-guide] Invalid selector skipped: ${sel}`);
    }
  }
  return null;
}

/** Wait for any selector in the list to appear. */
function waitForElement(
  selectorList: string,
  timeout = 8000,
  signal?: AbortSignal,
): Promise<{ el: Element; selector: string } | null> {
  return new Promise((resolve) => {
    const existing = queryFirst(selectorList);
    if (existing) return resolve(existing);
    if (signal?.aborted) return resolve(null);

    let settled = false;
    const finish = (value: { el: Element; selector: string } | null) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(value);
    };

    const observer = new MutationObserver(() => {
      const found = queryFirst(selectorList);
      if (found) finish(found);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onAbort = () => finish(null);
    signal?.addEventListener("abort", onAbort, { once: true });

    const timer = setTimeout(() => finish(null), timeout);
  });
}

/**
 * Navigate without reloading the page.
 *
 * This used to fall back to `window.location.href = path`, which reloads the
 * SPA, tears down the guide mid-flow and loses the conversation. It fired for
 * every /settings/* route and for /updates, because the app renders no sidebar
 * anchor for those, and for every route on mobile, where the nav lives in a
 * Radix Dialog that is unmounted while closed.
 *
 * React Router (v6) subscribes to popstate, so pushState + a synthetic
 * popstate performs a genuine client-side navigation from outside React.
 */
async function navigateTo(path: string, signal?: AbortSignal): Promise<CommandResult> {
  if (!isSafePath(path)) {
    return { ok: false, reason: `"${path}" is not a valid page.`, fatal: true };
  }
  if (pathMatches(window.location.pathname, path)) return ok;

  // An exact sidebar anchor is still the best option when one exists: it goes
  // through the app's own handler, which also closes the mobile drawer.
  const link = document.querySelector<HTMLAnchorElement>(`a[href="${path}"]`);
  if (link) {
    link.click();
  } else if (typeof window.history?.pushState === "function") {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } else {
    window.location.assign(path);
    return ok; // the page is going away; nothing left to verify
  }

  // Verify we actually arrived. Some routes redirect on landing
  // (/membership -> /membership/dashboard), which pathMatches accepts.
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    if (signal?.aborted) return ok;
    if (pathMatches(window.location.pathname, path)) {
      // Let React render the new route before the next step looks for anything.
      await sleep(600, signal);
      return ok;
    }
    await sleep(100, signal);
  }

  return {
    ok: false,
    reason: `I couldn't open ${path}. Your account may not have access to that section.`,
    fatal: true,
  };
}

async function simulateClick(el: Element): Promise<void> {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  showClickRipple(x, y);

  for (const eventType of ["mousedown", "mouseup", "click"] as const) {
    el.dispatchEvent(
      new MouseEvent(eventType, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }),
    );
  }
}

async function simulateTyping(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  signal?: AbortSignal,
): Promise<void> {
  el.focus();
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));

  for (const char of value) {
    if (signal?.aborted) break;
    el.value += char;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
    await sleep(40, signal);
  }

  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** What to tell the user when an element simply is not on their screen. */
function notFound(label: string | undefined): CommandResult {
  const what = label ?? "that element";
  return {
    ok: false,
    reason: `I couldn't find ${what} on your screen. It may be hidden on this screen size, or your role may not have access to it.`,
  };
}

export async function executeCommand(
  command: AgentCommand,
  signal?: AbortSignal,
): Promise<CommandResult> {
  if (signal?.aborted) return ok;

  if ("subtitle" in command && command.subtitle) {
    showSubtitle(command.subtitle, 0); // 0 = hold until the next subtitle
  }

  switch (command.type) {
    case "navigate":
      return navigateTo(command.path, signal);

    case "highlight": {
      const found = await waitForElement(command.selector, 3000, signal);
      if (!found) return notFound(command.label);
      highlightElement(found.selector, command.duration);
      return ok;
    }

    case "click": {
      clearHighlight();
      const found = await waitForElement(command.selector, 5000, signal);
      if (!found) return notFound(command.label);
      highlightElement(found.selector);
      await sleep(1000, signal);
      if (signal?.aborted) return ok;
      await simulateClick(found.el);
      clearHighlight();
      await sleep(400, signal);
      return ok;
    }

    case "fill": {
      const found = await waitForElement(command.selector, 5000, signal);
      if (!found) return notFound(command.label);
      if (!(found.el instanceof HTMLInputElement) && !(found.el instanceof HTMLTextAreaElement)) {
        return { ok: false, reason: `${command.label ?? "That field"} isn't a text field I can type into.` };
      }
      highlightElement(found.selector);
      await sleep(400, signal);
      await simulateTyping(found.el, command.value, signal);
      clearHighlight();
      return ok;
    }

    case "scroll": {
      const found = await waitForElement(command.selector, 3000, signal);
      if (!found) return notFound(command.label);
      found.el.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(500, signal);
      return ok;
    }

    case "subtitle":
      showSubtitle(command.text, command.duration ?? 5000);
      return ok;

    case "wait":
      await sleep(command.ms, signal);
      return ok;

    case "clear":
      clearHighlight();
      hideSubtitle();
      return ok;
  }
}
