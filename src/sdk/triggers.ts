/**
 * Proactive Triggers
 *
 * Monitors user behavior and proactively offers help when the user
 * seems stuck or confused. Like a good salesperson who approaches
 * when you've been staring at the shelf for too long.
 *
 * Triggers:
 * 1. Idle on page - user hasn't interacted for N seconds
 * 2. Rage clicks - rapid clicking indicates frustration
 * 3. New page, no action - landed on a page and did nothing
 * 4. First visit - never seen this user before
 * 5. Error visible - an error toast/alert appeared on screen
 */

// ── Page-specific help suggestions ────────────────────────────────

const PAGE_HELP: Record<string, { message: string; delay: number }> = {
  "/settings/payments": {
    message: "Need help connecting Stripe? I can walk you through it step by step.",
    delay: 15000,
  },
  "/settings/business": {
    message: "Setting up your business profile? I can guide you through each field.",
    delay: 20000,
  },
  "/settings/rooms": {
    message: "Want help creating a room or floor plan? Just ask!",
    delay: 15000,
  },
  "/settings/staff": {
    message: "Need to invite team members? I can show you how.",
    delay: 15000,
  },
  "/settings/ticketing": {
    message: "Setting up ticketing defaults? I can explain what each option does.",
    delay: 20000,
  },
  "/ticketing": {
    message: "Want to create your first ticket link? I can walk you through it.",
    delay: 20000,
  },
  "/membership": {
    message: "Ready to set up memberships? I can guide you through creating your first plan.",
    delay: 20000,
  },
  "/membership/plans": {
    message: "Need help creating a membership plan? Just say the word.",
    delay: 15000,
  },
  "/pos": {
    message: "Setting up Point of Sale? I can help you create your first outlet.",
    delay: 20000,
  },
  "/audience": {
    message: "Want to create your first email campaign or set up automations? Ask me!",
    delay: 25000,
  },
  "/reports": {
    message: "Need help understanding your reports? I can explain what each metric means.",
    delay: 20000,
  },
  "/calendar": {
    message: "Want to create your first event? I can show you how in 30 seconds.",
    delay: 25000,
  },
  "/settings/quick-setup": {
    message: "The Quick Setup will get you going fast. Need help with any step?",
    delay: 10000,
  },
  "/welcome": {
    message: "Welcome to OpenEvent! Want a quick tour of the platform?",
    delay: 5000,
  },
};

// ── Trigger state ─────────────────────────────────────────────────

interface TriggerState {
  active: boolean;
  idleTimer: ReturnType<typeof setTimeout> | null;
  lastInteraction: number;
  clickTimes: number[];
  currentPath: string;
  hasOfferedHelp: Set<string>;
  dismissedUntil: number;
  onTrigger: ((message: string) => void) | null;
}

const tState: TriggerState = {
  active: false,
  idleTimer: null,
  lastInteraction: Date.now(),
  clickTimes: [],
  currentPath: "",
  hasOfferedHelp: new Set(),
  dismissedUntil: 0,
  onTrigger: null,
};

// ── Behavior monitors ─────────────────────────────────────────────

function onUserActivity(): void {
  tState.lastInteraction = Date.now();
  resetIdleTimer();
}

function onUserClick(): void {
  const now = Date.now();
  tState.clickTimes.push(now);

  // Keep only last 2 seconds of clicks
  tState.clickTimes = tState.clickTimes.filter((t) => now - t < 2000);

  // Rage click: 4+ clicks in 2 seconds
  if (tState.clickTimes.length >= 4) {
    tState.clickTimes = [];
    triggerHelp("It looks like something isn't working as expected. Can I help?");
  }

  onUserActivity();
}

function resetIdleTimer(): void {
  if (tState.idleTimer) clearTimeout(tState.idleTimer);

  const path = window.location.pathname;
  const pageHelp = Object.entries(PAGE_HELP).find(([p]) => path.startsWith(p));

  if (pageHelp && !tState.hasOfferedHelp.has(path)) {
    const [, config] = pageHelp;
    tState.idleTimer = setTimeout(() => {
      tState.hasOfferedHelp.add(path);
      triggerHelp(config.message);
    }, config.delay);
  }
}

function checkPathChange(): void {
  const path = window.location.pathname;
  if (path !== tState.currentPath) {
    tState.currentPath = path;
    resetIdleTimer();
  }
}

function checkForErrors(): void {
  // Look for common error indicators in the DOM
  const errorSelectors = [
    "[role='alert']",
    ".toast-error",
    ".Toastify__toast--error",
    "[data-sonner-toast][data-type='error']",
  ];

  for (const sel of errorSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent && !tState.hasOfferedHelp.has("error-" + el.textContent.slice(0, 30))) {
      tState.hasOfferedHelp.add("error-" + el.textContent.slice(0, 30));
      triggerHelp("I noticed an error occurred. Can I help troubleshoot?");
      break;
    }
  }
}

// ── First visit detection ─────────────────────────────────────────

function checkFirstVisit(): void {
  const key = "oe-guide-seen";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, "1");
    // Delay to let the page load
    setTimeout(() => {
      triggerHelp("Welcome to OpenEvent! I'm your guide. Click here for a quick tour of the platform.");
    }, 3000);
  }
}

// ── Trigger delivery ──────────────────────────────────────────────

function triggerHelp(message: string): void {
  // Don't trigger if recently dismissed
  if (Date.now() < tState.dismissedUntil) return;
  // Don't trigger if widget is already open or a flow is running
  if (tState.onTrigger) {
    tState.onTrigger(message);
  }
}

/** Called by the SDK when the user dismisses a proactive message */
export function dismissTrigger(): void {
  // Don't bother the user again for 5 minutes
  tState.dismissedUntil = Date.now() + 5 * 60 * 1000;
}

// ── Lifecycle ─────────────────────────────────────────────────────

export function startTriggers(onTrigger: (message: string) => void): void {
  if (tState.active) return;
  tState.active = true;
  tState.onTrigger = onTrigger;
  tState.currentPath = window.location.pathname;

  // Listen for user activity
  document.addEventListener("mousemove", onUserActivity, { passive: true });
  document.addEventListener("keydown", onUserActivity, { passive: true });
  document.addEventListener("scroll", onUserActivity, { passive: true });
  document.addEventListener("click", onUserClick, { passive: true });

  // Poll for path changes and errors
  const pollInterval = setInterval(() => {
    if (!tState.active) { clearInterval(pollInterval); return; }
    checkPathChange();
    checkForErrors();
  }, 2000);

  // Check first visit
  checkFirstVisit();

  // Start idle timer for current page
  resetIdleTimer();
}

export function stopTriggers(): void {
  tState.active = false;
  tState.onTrigger = null;
  if (tState.idleTimer) clearTimeout(tState.idleTimer);
  document.removeEventListener("mousemove", onUserActivity);
  document.removeEventListener("keydown", onUserActivity);
  document.removeEventListener("scroll", onUserActivity);
  document.removeEventListener("click", onUserClick);
}
