/**
 * The OpenEvent routes the guide is allowed to navigate to.
 *
 * Verified against fsoell/OpeneventGithub @ origin/staging on 2026-08-31 by
 * reading src/PrivateAppShell.tsx. This list is the contract the flow registry
 * is tested against (src/flows/registry.test.ts) so a renamed route in the app
 * fails the guide's build instead of dead-ending a user mid-walkthrough.
 *
 * Re-verify with:
 *   git grep -n 'path="/' origin/staging -- src/PrivateAppShell.tsx
 */

/** Routes that exist in the app and are safe to send a user to. */
export const APP_ROUTES = [
  "/updates",
  "/profile",
  "/calendar",
  "/email",
  "/files",
  "/tasks",
  "/notes",
  "/payments",
  "/ticketing",
  "/ticketing/reservations",
  "/pos",
  "/membership",
  "/membership/dashboard",
  "/membership/members",
  "/membership/plans",
  "/membership/events",
  "/membership/store",
  "/membership/member-app",
  "/website",
  "/audience",
  "/audience/clients",
  "/audience/outreach",
  "/staff",
  "/reports",
  "/scan",
  "/welcome",
  "/settings",
  "/settings/business",
  "/settings/brand",
  "/settings/payments",
  "/settings/ticketing",
  "/settings/rooms",
  "/settings/staff",
  "/settings/taxes",
  "/settings/formats",
  "/settings/calendar",
  "/settings/security",
  "/settings/quick-setup",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];

/**
 * Routes that render a sidebar <a href> the guide can click directly.
 *
 * Everything else has to go through the History API, because there is no
 * anchor to click. Note this set is desktop-only: on mobile the nav lives in
 * MobileFloatingMenu, a Radix Dialog whose content is unmounted while closed,
 * so no sidebar anchor exists in the DOM at all.
 */
export const SIDEBAR_ROUTES: string[] = [
  "/calendar",
  "/email",
  "/payments",
  "/ticketing",
  "/pos",
  "/membership",
  "/website",
  "/audience",
  "/staff",
  "/reports",
  "/files",
  "/tasks",
  "/notes",
  "/settings",
];

export function isKnownRoute(path: string): boolean {
  return (APP_ROUTES as readonly string[]).includes(path);
}

/**
 * Guard for paths that did not come from the flow registry (the voice agent
 * can pass an arbitrary string). Rejects anything that could escape the app
 * origin or smuggle a quote into an attribute selector.
 */
export function isSafePath(path: string): boolean {
  return /^\/[A-Za-z0-9\-._~/]*$/.test(path) && !path.startsWith("//");
}

/**
 * True when the browser is already on `target`. Some routes redirect on
 * arrival (/membership -> /membership/dashboard), so a prefix counts as a
 * match; otherwise the guide would bounce the user a second time.
 */
export function pathMatches(current: string, target: string): boolean {
  if (current === target) return true;
  return current.startsWith(target.endsWith("/") ? target : target + "/");
}
