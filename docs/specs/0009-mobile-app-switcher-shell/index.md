# 0009. A phone home surface that opens one window at a time

**Date**: 2026-09-21
**Status**: Accepted

## Summary

On a phone the desktop metaphor cannot fit, so it is reshaped rather than squeezed. Below the compact breakpoint (40rem) the menu bar and the dock give way to a slim bar holding the mark, the clock and the appearance control, over a home surface of seven tiles, one per window the desktop opens by name. A tap opens that window full screen, the keyboard moves into it, and only one window is ever on screen: opening another closes the one you leave, unless it is the Finder you came from. Close returns home, Minimise parks a window with a mark on its tile, and a back press closes what is open. Nothing is added to the stack and no asset is produced.

## Requirements

**User stories**:

- As a recruiter on a phone, I want every window one tap away from a single home screen, so that the portfolio works without a desktop.
- As a phone visitor, I want one window to fill the screen and one control to get back home, so that I am never lost and never scrolling sideways.
- As a keyboard, switch or screen reader user on a phone, I want the tiles and the window controls named and reachable, so that nothing depends on a pointer or on seeing a surface that is hidden underneath.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: Below the compact breakpoint (Tailwind's `sm`, 40rem) the app renders the phone shell, and the wide chrome is not mounted at all: the `Navbar`, the `Dock`, the greeting and the desktop item list are absent from the DOM rather than hidden by CSS, and the home surface stands where the greeting and the items stood. Above the breakpoint the desktop shell renders exactly as it does today, with all four present. The container is the same component on both sides of the breakpoint (the surface that owns the work area and holds the window layer), so the measured work area keeps one owner and a phone keeps one box, and only the chrome inside it swaps. The JavaScript side reads one media query, `(width < 40rem)`, from one constant in one module (`#store/useWorkArea`), which is the same width the stylesheet's own `@media (width < 40rem)` rule and Tailwind's `sm` already turn at, so the two branches never disagree and no second numeric breakpoint is introduced. The value is resolved once when the manager is created and again on every change, so a phone's first React render is already the phone surface and no frame paints the desktop chrome.
- **AC-2**: The home surface is the switcher: one heading naming the surface and, under it, one named list of exactly seven tiles read from `HOME_APPS`. The seven are the windows the desktop opens by name, in this order: projects, resume, contact, skills, articles, gallery, archive, so a recruiter meets the work, the resume and the way to reach you first. `textFile` and `imageFile` never get a tile. Each tile is a button whose accessible name is its own `name`, painting `WINDOWS[windowId].icon` and that same name as visible text on a `--color-scrim` wash in `--color-desktop-text`, at least `--spacing-touch` (44px) tall, in reading order, with the visible focus ring.
- **AC-3**: A press on a tile opens that window through the manager's one open action with a `home` opener, so a window is focused rather than doubled whichever branch of the open it lands on: a press on a tile whose window is parked brings it back through that same action rather than around it, and a tile whose window is already on screen cannot be pressed at all, since the surface is hidden behind that window. The keyboard moves into the window that opened, and the home surface is out of sight and out of reach by the time that window is painted: it stays in the page, hidden with `visibility: hidden`, which is the one hiding that leaves the tile a laid out box for a movement to read, and a hidden tile paints nothing, takes no pointer, sits out of the tab order and stays out of the accessibility tree.
- **AC-4**: On a phone exactly one window is painted: the focused instance takes the work area's own box, and every other live instance is hidden (`display: none`), so an instance that is covered is absent from the accessibility tree and unreachable by Tab. After any open on a phone, every hidden instance is either parked or the focused instance's opener. Arriving on the compact layout with the desktop's own stacked windows keeps them all alive and hidden behind the focused one rather than closing them, so widening the viewport puts each back at its stored geometry and status.
- **AC-5**: On a phone an open closes every instance that is neither parked nor the new instance's opener, and it applies to both of the open's two branches, a target whose key is new and one whose key is already open, so bringing a parked window back while another is on screen cannot leave two of them on screen. A tile press always dispatches the one open action and never the restore action, which is what puts a parked window through the same rule rather than around it. The rule lives in the manager's reducer, which already carries `compact`, so the close and the open are one transition and are proved with no DOM. An open never closes a parked instance.
- **AC-6**: A tile says what its window is doing, using the dock's own indicator vocabulary: a filled mark while its window is on screen, the same mark quieter while its window is parked, and nothing when its window does not exist. The mark is painted in `--color-desktop-text`, the ink the wallpaper already uses, rather than in the text ink that flips with the mode, because it sits on the `--color-scrim` wash and would otherwise be near black on near black in light mode. The mark is decorative, so a screen reader still hears the tile's name alone.
- **AC-7**: A window's lights on a phone: Close closes the window and returns to the home surface, Minimise parks it, and Zoom is disabled below the compact breakpoint, because the focused window already fills the work area and the frame already renders a light with no handler as disabled. On a phone the Minimise light is offered for exactly the windows the home surface has a tile for, decided by a pure predicate over `HOME_APPS`, so Resume offers Minimise too, where the dock's six entry list `hasDockButton` reads does not reach it. Nothing else about the frame changes: the title still names the region, the title bar starts no drag, and each light keeps the name built from that title.
- **AC-8**: Close hands the keyboard on to the window's opener when one is alive, otherwise to the container the home surface lives in, which is focusable without being tabbable. A phone never hands focus to a dock button, since none is mounted. The handoff runs once the movement has landed, so the element it names is painted again by then; where that element is not yet reachable, which is a window still `display: none` at the moment of the handoff, the window takes the keyboard as it becomes the focused one. Focus never comes to rest on the page body.
- **AC-9**: On a phone a window's box is exactly the work area: the layout `minSize` never applies below the compact breakpoint, whether the box is painted, fitted to a work area that shrank, or refitted when the viewport changes, so no window is wider or taller than the viewport and nothing scrolls sideways at 360px. A phone also never rewrites a window's stored size or spot, so the desktop comes back as the visitor arranged it. The work area is measured before any window can be painted, since the container reports it in its first layout and no tile can be pressed before that.
- **AC-10**: A text file or an image opened from the Finder on a phone opens over the Finder, which stays alive as its opener instead of being closed, and closing the file reveals the Finder still showing the place it was showing.
- **AC-11**: The shell owns exactly one history entry whenever a window is on screen, and none when it is home. A back press closes the window on screen through the same path as Close, revealing its opener or the home surface, and if a window is still on screen after that reveal the shell owns one entry again. A window that leaves the screen for any other reason (Close, or an open closing the one it replaces) is reconciled in the same transition, so the entry count can never drift from the manager. The entry carries no state and leaves the URL unchanged, so a copied link is unaffected and the shell never reads a value out of it. The hook is compact gated, so the desktop's own bar and dock never write history, and a back press with nothing open behaves as it does today and leaves the site. A resize across the breakpoint is a transition like any other: narrowing into the compact layout with a window on screen takes the entry, and widening gives it back, so the count follows what is on screen rather than how the visitor moved.
- **AC-12**: An opening window grows from the tile that opened it and a closing one shrinks back into it, resolved by one pure lookup that returns the window's own tile, or its opener's tile when it has none of its own, so every window on a phone has a home to come from and go back to. A window the desktop already had, carried into the compact layout by a resize, is the one exception and is named here rather than left to the build: it opened somewhere the visitor could see, so it is put at its new box rather than made to arrive, and it still leaves into its tile. Every movement (the grow and the shrink, the minimise and the grow back) is timed through `readMotionToken` and `readEaseToken` rather than a literal duration, so reduced motion needs no second path: with every duration resolved to zero the window is simply there. All of them are gated on the compact layout, so the desktop's own open and close are unchanged.
- **AC-13**: Below the compact breakpoint the wallpaper is the content layer's compact crop (already written onto the document element by `#lib/appearance`) and the greeting is not rendered. No new asset is produced, and no module writes an image path.
- **AC-14**: Every word the phone shell prints is either a content value (a tile name, a window title, a value the profile already carries) or a string from the phone shell's one words module. No component in the shell writes a sentence, a heading or a control label of its own, and the frame's accessible names keep coming from the window title.
- **AC-15**: Above the compact breakpoint the desktop behaves exactly as it does today. No dependency is added, no content schema changes beyond `HOME_APPS`, no manager action is added, no storage, cookie or network call is made, and no new module carries a colour literal or a palette utility. The checks whose premise this decision changes are rewritten in the same change rather than deleted: the shell's own 360px check, the window manager's compact fill check (which opened through the desktop item list that a phone no longer renders), the Finder's 360px check and the design system's 360px bar check, both of which opened a window or read a bar a phone no longer shows.

## Decision

**Chosen option**: Option 1, a phone home surface of seven window tiles over a slim bar, with one window on screen at a time.

Below the compact breakpoint the desktop's chrome is replaced rather than adapted, while the container the windows sit in (the surface that owns the work area and holds the window layer) is shared by both shells. A slim bar carries the mark, the clock and the appearance control. Under it a home surface carries one heading and one named list of seven tiles, read from a new content list `HOME_APPS` in `#content/shell.ts`, each tile showing its window's own icon and name. A press opens that window at the work area's exact box, hides the home surface and moves the keyboard into the window. The manager's reducer owns the one window on screen rule: on a phone an open closes every instance that is neither parked nor the new window's opener, so a file opened from the Finder still opens over it. Close closes the window and lands the visitor home; Minimise parks it with a mark on its tile; Zoom is disabled, since a window on a phone already fills the screen. One history entry is held while a window is on screen, so the phone's own back gesture closes what is open. The frame, the content registry, the icons, the wallpaper crop, the motion tokens, the state utilities and the contrast suite are all reused, and nothing new is added to the stack.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `gsap-core` (`greensock/gsap-skills`, `.agents/skills/gsap-core/`) · `gsap-react` (`greensock/gsap-skills`, `.agents/skills/gsap-react/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

| Entity / field | Type | Where it lives | What it is for |
|---|---|---|---|
| `HOME_APPS` | `readonly HomeApp[]`, seven entries | `#content/shell.ts` (new) | the phone shell's one list, in reading order |
| `HomeApp.id` | `homeAppIdSchema`, a literal union of seven members | `#content/types.ts` (new) | the tile's stable identity |
| `HomeApp.name` | string, at least 1 | the content entry | the tile's visible text and its accessible name |
| `HomeApp.windowId` | `windowIdSchema` | the content entry | the window a press opens; the icon is read from `WINDOWS[windowId].icon` |

No entity is added to the manager. `WindowInstance`, `WindowStatus` and `WindowLayout` are unchanged, and `WindowOpener` gains one member, `{ kind: 'home' }`. There is no persistence and no migration: the content layer is a TypeScript source tree.

**State transitions**:

- An instance: `normal` (on screen) to `minimised` (parked) by Minimise; `minimised` to `normal` by its tile, or from the dock above the breakpoint.
- The surface: `home` when no instance is focused, `window` when one is. Derived from the instances, never stored.
- The layout: `wide` and `compact`, which changes what is painted and what an open closes, and changes no stored geometry and no status.
- The history: no window on screen holds no entry the shell owns; a window on screen holds one; the pop takes it back and closes that window.

**API surface**:

| Surface | Kind | Key inputs | Key outputs | Notes |
|---|---|---|---|---|
| `HOME_APPS` | new content constant, `#content/shell.ts` | none | the seven tile entries | strict schema, registered in the development check, the shape `DOCK_APPS` already has |
| `homeAppSchema`, `homeAppIdSchema` | new schemas, `#content/types.ts` | id, name, windowId | `HomeApp` | no icon field: the icon comes from `WINDOWS`, so each window's image is written down once |
| `WindowOpener` | widened union, `#store/windowManager.ts` | the new member `{ kind: 'home' }` | a press from the home surface records no opener window | the wide chrome keeps `dock`, `bar`, `desktop` and `window` |
| `openWindow` | rule change in the reducer (private) | `state.compact`, the new instance's opener | the state with the on screen instances closed, in both of the open's branches | AC-5; one transition, no second dispatch |
| `hasHomeTile` | new pure predicate, `#store/windowManager.ts` | a `windowId` | whether the home surface has a tile for that window | AC-7; reads `HOME_APPS` the way `hasDockButton` reads `DOCK_APPS` |
| `focusHopAfter` | signature change, pure | `instances`, `key`, `compact` | a hop that is never a dock hop on a phone, ending at the container hop | AC-8 |
| `windowGeometry`, `filledSize`, `shrinkToFit` | rule change, pure | `compact` | a box that is the work area, with no `minSize` floor | AC-9 |
| `setWorkArea`, `fitInto` | rule change, pure | `compact` | a resize that never rewrites a window's stored size or spot on a phone | AC-9; the only writer of a stored size today |
| `exitTargetFor` | new pure lookup, `#components` | one instance, the instances, the tile registry | the element to grow from or shrink to: its own tile, else its opener's tile | AC-12; the instances are read for the opener's own window, since a key is not a window id |
| `registerHomeTile`, `homeTileFor` | new members of the element registry, `#store` | a `windowId`, and the element to hold or let go | the tile a window's movement starts and ends at | AC-12; joined the way a dock button joins, so neither the tile nor the frame queries the document |
| `useWindowFrame` | extended | `compact` | `onZoom` absent on a phone, and the keyboard into the window when it becomes focused there | AC-3, AC-7, AC-12 |
| `useWorkArea` | extended | the container ref | `setWorkArea`, `setCompact`, the one breakpoint constant and a pure read for the initial state | AC-1 |
| `HomeSurface.tsx` | new component, `#components` | `HOME_APPS`, the instances | the heading and the named list of seven tiles | AC-2, AC-6 |
| `HomeTile.tsx` | new component, `#components` | one `HomeApp`, its open and parked states, its activate handler | a button carrying the icon, the name and the mark, registered as that window's exit target | AC-2, AC-3, AC-6, AC-12 |
| `PhoneBar.tsx` | new component, `#components` | the manager | the mark, the clock and the appearance control | AC-1, AC-7 |
| `Clock.tsx` | extracted component, `#components` | none | the live time | moved out of `Navbar`, so both bars read one clock |
| `homeLines.ts` | new words module, `#components` | none | the surface's heading and list name | AC-14 |
| `useShellHistory.ts` | new hook, `#store` | whether an instance is on screen | one pushed entry and the pop handler | AC-11; `window.history` directly, no library |
| `App.tsx`, `Desktop.tsx`, `ManagedWindow.tsx` | changed | `compact` | the shell that mounts, the hidden instances, the tile a window grows from | AC-1, AC-4, AC-12 |

**Value sourcing** (every value each action produces, computes or displays names where it comes from):

| Action | Value produced or displayed | Source |
|---|---|---|
| A tile press | the window to open | `HomeApp.windowId` |
| A tile press | the opener recorded | `{ kind: 'home' }`, the new union member |
| The tiles | each visible and accessible name | `HomeApp.name` |
| The tiles | each icon | `WINDOWS[windowId].icon`, the content registry |
| The tiles | each mark (nothing, on screen, or parked) | derived: `instances.filter(instance => instance.windowId === tile.windowId)` |
| The home surface | the heading and the list's own name | `homeLines.ts` |
| The home surface | whether it is shown or hidden | derived: `focusedKey !== null`, read in `HomeSurface` |
| The shell that mounts | `compact` | `window.matchMedia('(width < 40rem)')`, one constant in `#store/useWorkArea` |
| A window on a phone | its position and its size | `windowGeometry(instance, workArea, compact, isFocused)`, the work area corner and the work area |
| The work area | its width and height | the desktop container's ResizeObserver, through `useWorkArea` |
| The movement | its duration and easing | `readMotionToken` and `readEaseToken`, read at the edge, once per movement: `base` for the grow and the shrink, `slow` for the minimise and the grow back |
| The movement | where a window grows from and shrinks to | `exitTargetFor(instance, instances, elements)`: its own tile, else its opener's tile, resolved through the elements registry the tile joins the way a dock button does |
| The ground | the wallpaper | `WALLPAPER.compact.imageUrl`, already written to `--wallpaper-image-compact` by `#lib/appearance` |
| The slim bar | the time | `useCurrentMinute`, extracted from `Navbar`, formatted by `Intl.DateTimeFormat` |
| Each light | its accessible name | the frame, built from `WindowInstance.title` |
| The history | the entry | `window.history.pushState`, carrying no state and leaving the URL as it is |
| The history | how many entries the shell owns | derived from the instances, one while a window is on screen and none at home, reconciled on every transition |
| A window's region | its name | `WindowInstance.title`, from the resolver |
| The lights on a phone | whether a window offers Minimise | `hasHomeTile(windowId)`, read from `HOME_APPS` |
| The tiles' marks | the ink they are painted in | `--color-desktop-text`, from the token layer |
| A window's stored size on a phone | never rewritten by a resize | `setWorkArea` and `fitInto`, which skip the rewrite on the compact layout |
| The keyboard after a close | the element focus moves to | `focusHopAfter(instances, key, compact)` through the elements registry |

**Key invariants**:

- On a phone exactly one instance is painted, and it is the focused one.
- After any open on a phone, every hidden instance is parked, or it is the focused instance's opener. A breakpoint crossing is the one case outside that, since the desktop's own stacked windows survive it hidden rather than parked.
- No window is larger than the work area on a phone.
- The compact breakpoint is one value in one module.
- A hidden instance is unreachable by the keyboard and absent from the accessibility tree.
- The shell owns one history entry while a window is on screen, and none when it is home.
- Above the compact breakpoint nothing about the desktop changes.

**Security model**: no accounts, no data and no authorisation. The shell writes one history entry, reaches no storage, sets no cookie and makes no request. Every tile paints a value the bundle already carries, and the surface accepts no typed input, so nothing a visitor enters can reach the page.

**Configuration required**: none.

**Critical test scenarios** (each maps to an acceptance criterion):

- Happy path: at 360px a tile opens its window, the window holds the viewport's width, Close returns home, and neither the page nor the frame scrolls sideways, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-7**, **AC-9**
- Switching: opening a second window closes the first on screen, while a parked window keeps its mark and comes back when its tile is pressed, verifies **AC-5**, **AC-6**
- Reading a file: from the Finder, a text file opens over it, the Finder is not reachable by Tab while it is covered, and closing the file reveals the Finder in the same place, verifies **AC-4**, **AC-10**
- Back press: the shell holds one entry while a window is on screen, a back press closes it and returns home, and a close by any other route leaves no entry behind, verifies **AC-11**
- Reduced motion: every duration resolves to zero, and the window is simply there with no movement, verifies **AC-12**
- Keyboard: a tile press moves the keyboard into the window, and Close hands it to the opener or to the home surface, never to the body or to an absent dock button, verifies **AC-3**, **AC-8**
- Regression: at 1280px the menu bar, the dock, the desktop items, dragging and the focus handoff behave as they did before, verifies **AC-15**

## Build plan

1. The content and the words: `HOME_APPS` with its seven entries and the tiles' order, `homeAppSchema` and `homeAppIdSchema` in `#content/types.ts`, the registration in the development check, and `homeLines.ts` with the surface's heading and list name, satisfies **AC-2**, **AC-14**
2. The thin thread, end to end: the `home` opener member, the reducer's one window on screen rule in both of the open's branches, the `hasHomeTile` predicate, the compact aware `setWorkArea` and `fitInto`, the `minSize` exemption on a phone, the manager's first read of the breakpoint, `App` choosing the chrome inside the shared container, a `PhoneBar` with the mark and the clock, a `HomeSurface` with the seven tiles, one tile opening its window at the work area, Close returning home and landing the keyboard on the container, and the compact wallpaper with no greeting at 360px, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-8**, **AC-9**, **AC-13**
3. The surface completed: the heading over the named list, the tiles' names and their marks from the dock's vocabulary, and the appearance control in the slim bar, satisfies **AC-2**, **AC-6**, **AC-14**
4. The frame, the file and the movement: the three lights with Zoom rendered disabled through an absent handler and Minimise offered from `hasHomeTile`, Minimise parking a window and its tile bringing it back through the one open action, the keyboard moving into the window when it becomes focused on a phone, a file opening over the Finder and revealing it on close, and the grow and shrink resolved by `exitTargetFor` and timed through the motion tokens, satisfies **AC-3**, **AC-6**, **AC-7**, **AC-8**, **AC-10**, **AC-12**
5. The history, the suites and the records: the owned entry reconciled on every transition with the compact gated back press, the reducer tests for the compact rule, the shell's unit suites, the rewritten 360px shell check and the window manager's rewritten compact fill check with a new phone spec, and the `design.md` note, satisfies **AC-11**, **AC-15**

## Consequences

**Positive**:

- Every window the desktop opens by name becomes reachable on a phone from one screen, which today's shell cannot do: below 40rem the bar's links and the entire dock are both hidden, so Gallery, Skills, Articles and Archive have no way in at all.
- The phone's rule is one transition in the pure reducer, so it is proved without a browser and cannot drift away from the desktop's own behaviour unnoticed.
- The surface reuses what exists: the frame, the content registry, the window icons, the wallpaper crop, the motion tokens, the interaction utilities and the contrast suite. No dependency, no new asset, and one browser API already on the platform.
- A window on a phone can no longer be wider than the screen, which also removes a sideways overflow the narrowest phones carried.

**Negative / tradeoffs**:

- Two shells now exist, so a change to one chrome has to be checked against the other. The suites are the guard, and this feature is the moment that debt is accepted consciously.
- A phone loses the desktop's shortcuts: the three project folders and the greeting. A recruiter on a phone reaches a project through the Projects tile and then the Finder, one step more than the desktop's own route.
- A phone visit now writes to browser history, so the first back press no longer leaves the site. That is the phone's own expectation, and it is still a change to what a visitor's back button does.
- The desktop layout is no longer reachable on a phone at all, so the two surfaces cannot be compared on one device without resizing the window.
- The `minSize` exemption amends a rule spec 0004 recorded, so that spec's line is stale until it is reconciled.
- A phone decides which windows offer Minimise from a second list predicate (`hasHomeTile`) beside the desktop's own `hasDockButton`, so two predicates now answer a question that used to have one answer.
- The exit movement borrows `--window-dock-shrink`, a measure whose name says dock while a phone's target is a tile.

**Neutral**:

- No migration is needed. The content layer is a TypeScript source tree, and the model change is one list plus one union member.
- A phone still paints a portrait crop of the light wallpaper, because no dedicated mobile wallpaper exists. The crop is already shipped, so a replacement image needs no code change.
- The two file windows keep their bodies and get no tile, so they arrive only through the Finder.
- The breakpoint stays Tailwind's `sm` (40rem), the value `design.md` and every window body already use.

## Follow-up

- [x] Reconcile the specs this decision amends: spec 0004's compact rule (the layout minimum no longer applies on a phone) and spec 0003's AC-10 with its 360px verify steps (the greeting and the desktop items are no longer rendered there).
- [ ] Rewrite the window manager's own compact fill check (420px), which opens a window through the desktop item list that a phone no longer renders.
- [ ] Review the shell's one invented word, the surface name (`Home` throughout this spec), and the seven tiles' order (`projects`, `resume`, `contact`, `skills`, `articles`, `gallery`, `archive`, chosen so a recruiter meets the work, the resume and the way to reach you first).
- [x] `src/components/` has no `AGENTS.md`. This feature adds four modules and a words file there, which is the moment for `/audit` or `/sync` to draft one.
- [ ] The exit movement borrows `--window-dock-shrink`. If a second borrowed measure appears, rename it to a window measure and update the suite with it.
- [ ] Listing the two file windows on the phone surface would need an empty state in each file body. That is a separate decision, not this one.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
