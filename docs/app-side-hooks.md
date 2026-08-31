# `data-guide` hooks wanted in the OpenEvent app

The guide points at real elements. To find them it needs selectors that are
stable across languages, screen sizes and refactors. Most of what it needs
already exists: sidebar links have `href`, and several buttons carry `title` or
`aria-label`.

A few do not, and those are listed here. Each is a one-attribute change in
`fsoell/OpeneventGithub`.

## Why not select on text

The app ships EN, DE and FR. A selector that matches "Create Ticket Link" finds
nothing for two thirds of the people this guide exists for. Class names are no
better: they are Tailwind utilities that change whenever the button is
restyled, and `button.bg-primary` matches whichever primary-coloured button
happens to come first in the document.

That is not hypothetical. Two selectors that shipped were
`button:has(span:contains('Create Event'))`, which is jQuery syntax and not
valid CSS at all, and `button:has(svg)`, which reliably found the first icon
button in the sidebar rather than the intended Create button.

## The selector order the guide uses

`src/flows/targets.ts` lists selectors most-preferred first and takes the first
one that matches:

1. `[data-guide="..."]` : explicit, stable, invisible to users
2. `aria-label` / `title` : already present in places, and accessible
3. `a[href="..."]` : reliable for navigation
4. anything structural : avoided

Because `data-guide` is listed first, adding the attribute takes over
automatically. Nothing in this repo needs to change when the app ships one.

## Requested attributes

### 1. Ticketing: the desktop Create button

`src/pages/Tickets.tsx`, the desktop-only header button
(`className="hidden md:inline-flex md:w-[180px]"`).

```diff
  <Button
    variant="default"
    className="hidden md:inline-flex md:w-[180px]"
+   data-guide="ticketing-create-link"
    onClick={() => setCreateDialogOpen(true)}
  >
```

The mobile FAB in the same file already has
`aria-label="Create Ticket Link"` and needs nothing. The desktop button's only
distinguishing content is the i18n string `createTicketLink`, so there is
currently no language-safe way to find it.

### 2. Calendar: the Create Event button (optional, nice to have)

`src/pages/Calendar.tsx` already has `title="Create event"`, which works. A
`data-guide="calendar-create-event"` would make it explicit that the attribute
is load-bearing, so a future refactor does not drop it as decoration.

```diff
  <Button
    onClick={() => { setForceBlockMode(false); openNewEventDialog(); }}
    className="h-10 rounded-r-none border-r-0 px-3 sm:min-w-[120px]"
    title="Create event"
+   data-guide="calendar-create-event"
  >
```

## Permission-gated elements

Some targets legitimately are not on screen. The Create Event button sits
inside `<PermissionGate feature="events" action="create">`, and roles without
that permission see a Shift button instead. The guide handles this: a target
that cannot be found produces an honest message ("I couldn't find the Create
Event button on your screen : your role may not have access to it") rather than
narrating over a highlight that never appeared.

So these attributes are about *precision*, not about papering over access
control.

## Keeping this list honest

`src/flows/targets.ts` marks anything still waiting on an app-side attribute
with `needsAppHook: true`, and `targetsNeedingAppHooks()` returns the current
set. When the attribute lands, drop the flag and remove the entry here.
