/**
 * Semantic targets: a stable id -> the CSS selector that actually finds the
 * element in the OpenEvent DOM.
 *
 * Why this file exists
 * --------------------
 * Flows used to inline raw selectors, and two of them were silently wrong:
 *   - `button:has(span:contains('Create Event'))` : `:contains()` is jQuery,
 *     not CSS, so querySelector threw and the flow fell through to
 *     `button.bg-primary`, highlighting whatever primary button happened to
 *     come first in the document.
 *   - `button:has(svg)` : matched the first button containing an icon, which
 *     is in the sidebar, never the Create button it was aiming at.
 *
 * Routing every selector through here means there is one place to fix when the
 * app's markup moves, and one place for the test suite to assert against.
 *
 * Selector rules
 * --------------
 * 1. Never select on visible text. The app is EN/DE/FR, so text selectors
 *    break for two thirds of the users this guide exists for.
 * 2. Prefer, in order: `data-guide` -> `aria-label` / `title` -> `href` -> a
 *    structural class. Stop before "nth button in the toolbar".
 * 3. A selector list is tried left to right; the first match wins. Put the
 *    `data-guide` hook first so it takes over the moment the app ships one.
 *
 * `needsAppHook: true` marks a target that has no stable selector today and
 * wants a `data-guide` attribute added on the OpenEvent side. See
 * docs/app-side-hooks.md.
 *
 * All selectors verified against fsoell/OpeneventGithub @ origin/staging on
 * 2026-08-31.
 */

export interface GuideTarget {
  /** Selector list, tried left to right. */
  selector: string;
  /** Human-readable name, used in failure messages shown to the user. */
  label: string;
  /** Only present on some screen sizes / for some roles. */
  conditional?: string;
  /** No stable selector exists yet; the app needs a data-guide attribute. */
  needsAppHook?: boolean;
}

const navLink = (path: string): string => `a[href="${path}"]`;

export const TARGETS = {
  // ── Sidebar navigation (desktop only) ───────────────────────────
  "nav.calendar": { selector: navLink("/calendar"), label: "the Calendar link", conditional: "desktop sidebar only" },
  "nav.email": { selector: navLink("/email"), label: "the Email link", conditional: "desktop sidebar only" },
  "nav.payments": { selector: navLink("/payments"), label: "the Payments link", conditional: "desktop sidebar only" },
  "nav.ticketing": { selector: navLink("/ticketing"), label: "the Ticketing link", conditional: "desktop sidebar only" },
  "nav.pos": { selector: navLink("/pos"), label: "the POS link", conditional: "desktop sidebar only" },
  "nav.membership": { selector: navLink("/membership"), label: "the Members link", conditional: "desktop sidebar only" },
  "nav.website": { selector: navLink("/website"), label: "the Website link", conditional: "desktop sidebar only" },
  "nav.audience": { selector: navLink("/audience"), label: "the Audience link", conditional: "desktop sidebar only" },
  "nav.staff": { selector: navLink("/staff"), label: "the Staff link", conditional: "desktop sidebar only" },
  "nav.reports": { selector: navLink("/reports"), label: "the Reports link", conditional: "desktop sidebar only" },
  "nav.files": { selector: navLink("/files"), label: "the Files link", conditional: "desktop sidebar only" },
  "nav.tasks": { selector: navLink("/tasks"), label: "the Tasks link", conditional: "desktop sidebar only" },
  "nav.notes": { selector: navLink("/notes"), label: "the Notes link", conditional: "desktop sidebar only" },
  "nav.settings": { selector: navLink("/settings"), label: "the Settings link", conditional: "desktop sidebar only" },

  // ── Calendar ────────────────────────────────────────────────────
  // Calendar.tsx: <Button title="Create event"> inside
  // <PermissionGate feature="events" action="create">. Roles without that
  // permission get a "Shift" button in the same slot instead.
  "calendar.createEvent": {
    selector: '[data-guide="calendar-create-event"], button[title="Create event"]',
    label: "the Create Event button",
    conditional: "requires the events:create permission",
  },
  "calendar.createMore": {
    selector: 'button[aria-label="More create options"]',
    label: "the create options menu",
    conditional: "requires the events:create permission",
  },

  // ── Ticketing ───────────────────────────────────────────────────
  // The mobile FAB carries aria-label="Create Ticket Link". The desktop
  // header button has no stable hook: its only distinguishing content is the
  // i18n string `createTicketLink`, which we must not select on.
  "ticketing.createLink": {
    selector: '[data-guide="ticketing-create-link"], button[aria-label="Create Ticket Link"]',
    label: "the Create Ticket Link button",
    needsAppHook: true,
  },
  "ticketing.moreOptions": {
    selector: 'button[aria-label="More ticketing options"]',
    label: "the ticketing options menu",
  },

  // ── Membership tabs (present once you are on /membership/*) ──────
  "membership.tab.dashboard": { selector: navLink("/membership/dashboard"), label: "the Dashboard tab" },
  "membership.tab.members": { selector: navLink("/membership/members"), label: "the Members tab" },
  "membership.tab.plans": { selector: navLink("/membership/plans"), label: "the Plans tab" },
  "membership.tab.events": { selector: navLink("/membership/events"), label: "the Events tab" },
  "membership.tab.store": { selector: navLink("/membership/store"), label: "the Points Store tab" },
  "membership.tab.memberApp": { selector: navLink("/membership/member-app"), label: "the Member App tab" },

  // ── Audience tabs ───────────────────────────────────────────────
  "audience.tab.clients": { selector: navLink("/audience/clients"), label: "the Clients tab" },
  "audience.tab.outreach": { selector: navLink("/audience/outreach"), label: "the Outreach tab" },
} as const satisfies Record<string, GuideTarget>;

export type TargetId = keyof typeof TARGETS;

export function getTarget(id: string): GuideTarget | undefined {
  return (TARGETS as Record<string, GuideTarget>)[id];
}

export function targetIds(): TargetId[] {
  return Object.keys(TARGETS) as TargetId[];
}

/** Targets still waiting on a data-guide attribute in the OpenEvent app. */
export function targetsNeedingAppHooks(): Array<{ id: string; target: GuideTarget }> {
  return Object.entries(TARGETS as Record<string, GuideTarget>)
    .filter(([, t]) => t.needsAppHook)
    .map(([id, target]) => ({ id, target }));
}
