/**
 * Proactive triggers.
 *
 * Offers help when someone looks stuck: idle on a settings page, rage
 * clicking, an error toast on screen. Like a good shop assistant who steps in
 * after you have been staring at the shelf for a while.
 *
 * The guiding rule is that a proactive message must never interrupt. If a
 * walkthrough is running or the panel is already open, the moment has passed
 * and we stay quiet.
 */

const PAGE_HELP: Record<string, { message: string; delay: number }> = {
  "/settings/payments": { message: "Need help connecting Stripe? I can walk you through it.", delay: 15000 },
  "/settings/business": { message: "Setting up your business profile? I can guide you through each field.", delay: 20000 },
  "/settings/rooms": { message: "Want help creating a room or a floor plan? Just ask.", delay: 15000 },
  "/settings/staff": { message: "Need to invite team members? I can show you how.", delay: 15000 },
  "/settings/ticketing": { message: "Setting up ticketing defaults? I can explain what each option does.", delay: 20000 },
  "/settings/quick-setup": { message: "The Quick Setup gets you going fast. Need help with any step?", delay: 10000 },
  "/ticketing": { message: "Want to create your first ticket link? I can walk you through it.", delay: 20000 },
  "/membership": { message: "Ready to set up memberships? I can guide you through your first plan.", delay: 20000 },
  "/pos": { message: "Setting up Point of Sale? I can help you create your first outlet.", delay: 20000 },
  "/audience": { message: "Want to create a campaign or set up automations? Ask me.", delay: 25000 },
  "/reports": { message: "Need help reading your reports? I can explain what each metric means.", delay: 20000 },
  "/calendar": { message: "Want to create your first event? I can show you in 30 seconds.", delay: 25000 },
  "/staff": { message: "Planning shifts? I can show you how to assign your team.", delay: 25000 },
  "/website": { message: "Building your site? I can show you how sections fit together.", delay: 25000 },
  "/welcome": { message: "Welcome to OpenEvent. Want a quick tour of the platform?", delay: 5000 },
};

/** Longest prefix wins, so /settings/rooms beats a bare /settings entry. */
function helpForPath(path: string): { message: string; delay: number } | null {
  let best: { message: string; delay: number } | null = null;
  let bestLen = -1;
  for (const [prefix, config] of Object.entries(PAGE_HELP)) {
    if (path.startsWith(prefix) && prefix.length > bestLen) {
      best = config;
      bestLen = prefix.length;
    }
  }
  return best;
}

interface TriggerState {
  active: boolean;
  idleTimer: ReturnType<typeof setTimeout> | null;
  pollTimer: ReturnType<typeof setInterval> | null;
  lastActivityAt: number;
  clickTimes: number[];
  currentPath: string;
  offered: Set<string>;
  dismissedUntil: number;
  onTrigger: ((message: string) => void) | null;
  isBusy: (() => boolean) | null;
}

const tState: TriggerState = {
  active: false,
  idleTimer: null,
  pollTimer: null,
  lastActivityAt: Date.now(),
  clickTimes: [],
  currentPath: "",
  offered: new Set(),
  dismissedUntil: 0,
  onTrigger: null,
  isBusy: null,
};

/**
 * mousemove fires continuously, and this used to clear a timeout and scan the
 * whole help table on every single event. Once every 500ms is plenty for
 * deciding whether someone has gone idle.
 */
const ACTIVITY_THROTTLE_MS = 500;

function onUserActivity(): void {
  const now = Date.now();
  if (now - tState.lastActivityAt < ACTIVITY_THROTTLE_MS) return;
  tState.lastActivityAt = now;
  resetIdleTimer();
}

function onUserClick(): void {
  const now = Date.now();
  tState.clickTimes = tState.clickTimes.filter((t) => now - t < 2000);
  tState.clickTimes.push(now);

  if (tState.clickTimes.length >= 4) {
    tState.clickTimes = [];
    triggerHelp("It looks like something isn't working as expected. Can I help?");
  }

  tState.lastActivityAt = 0; // force the throttle to let this one through
  onUserActivity();
}

function resetIdleTimer(): void {
  if (tState.idleTimer) clearTimeout(tState.idleTimer);
  tState.idleTimer = null;

  const path = window.location.pathname;
  const help = helpForPath(path);
  if (!help || tState.offered.has(path)) return;

  tState.idleTimer = setTimeout(() => {
    // Re-check on fire: the user may have navigated away while we waited.
    if (window.location.pathname !== path) return;
    tState.offered.add(path);
    triggerHelp(help.message);
  }, help.delay);
}

function checkPathChange(): void {
  const path = window.location.pathname;
  if (path !== tState.currentPath) {
    tState.currentPath = path;
    resetIdleTimer();
  }
}

function checkForErrors(): void {
  const errorSelectors = [
    "[data-sonner-toast][data-type='error']",
    ".Toastify__toast--error",
    ".toast-error",
    "[role='alert']",
  ];

  for (const sel of errorSelectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim();
    if (!text) continue;
    const key = "error-" + text.slice(0, 40);
    if (tState.offered.has(key)) continue;
    tState.offered.add(key);
    triggerHelp("I noticed an error on this page. Want me to help sort it out?");
    return;
  }
}

/**
 * The single gate every proactive message passes through.
 *
 * This check used to exist only as a comment claiming the widget would not be
 * interrupted, while nothing actually stopped a hint from landing in the
 * middle of a running walkthrough.
 */
function triggerHelp(message: string): void {
  if (!tState.active || !tState.onTrigger) return;
  if (Date.now() < tState.dismissedUntil) return;
  if (tState.isBusy?.()) return;
  tState.onTrigger(message);
}

/** Called by the SDK when the user waves a proactive message away. */
export function dismissTrigger(): void {
  tState.dismissedUntil = Date.now() + 5 * 60 * 1000;
}

export interface TriggerOptions {
  onTrigger: (message: string) => void;
  /** True while a flow is running or the panel is open. Suppresses hints. */
  isBusy: () => boolean;
}

export function startTriggers(options: TriggerOptions): void {
  if (tState.active) return;
  tState.active = true;
  tState.onTrigger = options.onTrigger;
  tState.isBusy = options.isBusy;
  tState.currentPath = window.location.pathname;

  document.addEventListener("mousemove", onUserActivity, { passive: true });
  document.addEventListener("keydown", onUserActivity, { passive: true });
  document.addEventListener("scroll", onUserActivity, { passive: true });
  document.addEventListener("click", onUserClick, { passive: true });

  tState.pollTimer = setInterval(() => {
    checkPathChange();
    checkForErrors();
  }, 2000);

  resetIdleTimer();
}

export function stopTriggers(): void {
  tState.active = false;
  tState.onTrigger = null;
  tState.isBusy = null;
  if (tState.idleTimer) clearTimeout(tState.idleTimer);
  if (tState.pollTimer) clearInterval(tState.pollTimer);
  tState.idleTimer = null;
  tState.pollTimer = null;
  tState.offered.clear();

  document.removeEventListener("mousemove", onUserActivity);
  document.removeEventListener("keydown", onUserActivity);
  document.removeEventListener("scroll", onUserActivity);
  document.removeEventListener("click", onUserClick);
}
