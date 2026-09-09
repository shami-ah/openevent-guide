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
 * Wait for the route's main content to appear after a client-side navigation.
 *
 * React Router updates the URL synchronously but the component tree renders
 * asynchronously: Suspense boundaries, lazy-loaded chunks, data loaders, and
 * layout shifts from loading states all mean the page is not "ready" the
 * moment the URL changes. A fixed 600ms sleep used to approximate this, but
 * heavy pages (settings sub-routes, membership) often need more.
 *
 * Instead we watch for a DOM signal that new content has landed:
 *   1. A `main` or `[role="main"]` element gaining new children.
 *   2. Failing that, any substantive mutation in the body.
 * With a ceiling so we never wait forever.
 */
function waitForRouteContent(timeout = 3000, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      // One extra frame so the paint that triggered us is actually visible.
      requestAnimationFrame(() => resolve());
    };

    // We only need one meaningful mutation after the route changed.
    let mutationCount = 0;
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.addedNodes.length > 0) mutationCount += r.addedNodes.length;
      }
      // A few added nodes means the route's component tree rendered.
      if (mutationCount >= 3) finish();
    });

    const root = document.querySelector("main, [role='main']") ?? document.body;
    observer.observe(root, { childList: true, subtree: true });

    const onAbort = () => finish();
    signal?.addEventListener("abort", onAbort, { once: true });

    // Ceiling: if nothing mutates (page was already rendered), resolve anyway.
    const timer = setTimeout(finish, timeout);
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
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (signal?.aborted) return ok;
    if (pathMatches(window.location.pathname, path)) {
      // Wait for React to actually render the new route's content, rather
      // than sleeping a fixed duration that may be too short for heavy pages
      // or too long for lightweight ones.
      await waitForRouteContent(2000, signal);
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

/**
 * Helper: show the command's subtitle on the overlay, but only AFTER the
 * associated visual (navigation, highlight, etc.) has landed. Showing it
 * before the command executes was the root cause of the "subtitle says X
 * while the highlight points at Y" mismatch.
 */
function showCommandSubtitle(command: AgentCommand): void {
  if ("subtitle" in command && command.subtitle) {
    showSubtitle(command.subtitle, 0); // 0 = hold until the next subtitle
  }
}

export async function executeCommand(
  command: AgentCommand,
  signal?: AbortSignal,
): Promise<CommandResult> {
  if (signal?.aborted) return ok;

  // Clear the previous step's highlight before starting this one, so stale
  // boxes never overlap with the new subtitle.
  if (command.type !== "clear") clearHighlight();

  switch (command.type) {
    case "navigate": {
      // Show subtitle AFTER navigation completes so the text matches the
      // page the user is actually looking at.
      const result = await navigateTo(command.path, signal);
      if (result.ok) showCommandSubtitle(command);
      return result;
    }

    case "highlight": {
      const found = await waitForElement(command.selector, 3000, signal);
      if (!found) return notFound(command.label);
      // Subtitle appears together with the highlight, never before it.
      showCommandSubtitle(command);
      highlightElement(found.selector, command.duration);
      return ok;
    }

    case "click": {
      const found = await waitForElement(command.selector, 5000, signal);
      if (!found) return notFound(command.label);
      showCommandSubtitle(command);
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
      showCommandSubtitle(command);
      highlightElement(found.selector);
      await sleep(400, signal);
      await simulateTyping(found.el, command.value, signal);
      clearHighlight();
      return ok;
    }

    case "scroll": {
      const found = await waitForElement(command.selector, 3000, signal);
      if (!found) return notFound(command.label);
      showCommandSubtitle(command);
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
