/**
 * The navigation contract.
 *
 * The bug this guards against: navigate used to try three selectors and then
 * fall back to `window.location.href = path`, a full page reload. OpenEvent
 * renders no sidebar anchor for any /settings/* route, none for /updates, and
 * none at all on mobile, so the fallback was the *common* case rather than the
 * rare one. Each time it fired, the SDK was torn down and rebooted, and the
 * walkthrough silently stopped after its first step.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeCommand } from "./executor.js";

function goTo(path: string): void {
  window.history.pushState({}, "", path);
}

/** An anchor that behaves like a React Router NavLink. */
function addRouterLink(href: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = href;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  document.body.appendChild(a);
  return a;
}

describe("navigate", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    goTo("/calendar");
  });

  it("does nothing when the user is already there", async () => {
    const result = await executeCommand({ type: "navigate", path: "/calendar" });
    expect(result.ok).toBe(true);
    expect(window.location.pathname).toBe("/calendar");
  });

  it("treats an on-arrival redirect as already arrived", async () => {
    goTo("/membership/dashboard");
    const result = await executeCommand({ type: "navigate", path: "/membership" });
    expect(result.ok).toBe(true);
    expect(window.location.pathname).toBe("/membership/dashboard");
  });

  it("clicks an exact sidebar anchor when one exists", async () => {
    const link = addRouterLink("/ticketing");
    const clicked = vi.fn();
    link.addEventListener("click", clicked);

    const result = await executeCommand({ type: "navigate", path: "/ticketing" });

    expect(result.ok).toBe(true);
    expect(clicked).toHaveBeenCalled();
    expect(window.location.pathname).toBe("/ticketing");
  });

  it("uses the History API when no anchor exists, instead of reloading", async () => {
    // /settings/business has no anchor anywhere in the app. This is the case
    // that used to hard-reload and kill the guide.
    const popstate = vi.fn();
    window.addEventListener("popstate", popstate);

    const result = await executeCommand({ type: "navigate", path: "/settings/business" });

    expect(result.ok).toBe(true);
    expect(window.location.pathname).toBe("/settings/business");
    expect(popstate, "React Router needs a popstate to pick the navigation up").toHaveBeenCalled();

    window.removeEventListener("popstate", popstate);
  });

  it("never picks an anchor whose href merely ends with the path", async () => {
    // The old selector chain included a[href$="..."], so navigating to /pos
    // could click a link to /settings/pos.
    addRouterLink("/settings/pos");
    const result = await executeCommand({ type: "navigate", path: "/pos" });

    expect(result.ok).toBe(true);
    expect(window.location.pathname).toBe("/pos");
  });

  it("refuses a path that could leave the app origin", async () => {
    const result = await executeCommand({ type: "navigate", path: "//evil.example.com" });
    expect(result.ok).toBe(false);
    expect(result.fatal).toBe(true);
    expect(window.location.pathname).toBe("/calendar");
  });
});

describe("element commands report failure", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("says which element it could not find instead of failing silently", async () => {
    const result = await executeCommand({
      type: "highlight",
      selector: '[data-guide="nope"]',
      label: "the Create Event button",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("the Create Event button");
  });

  it("skips an unparseable selector and still uses a valid one from the list", async () => {
    const btn = document.createElement("button");
    btn.setAttribute("data-guide", "real");
    document.body.appendChild(btn);

    const result = await executeCommand({
      type: "highlight",
      // The first entry is jQuery, not CSS: querySelector throws on it.
      selector: "button:has(span:contains('Create')), [data-guide=\"real\"]",
      label: "the button",
    });

    expect(result.ok).toBe(true);
  });

  it("stops early when the flow is cancelled", async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await executeCommand({ type: "wait", ms: 10_000 }, controller.signal);
    expect(result.ok).toBe(true);
  });
});
