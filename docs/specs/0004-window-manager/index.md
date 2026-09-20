# 0004. Adopt one window manager for every window

**Date**: 2026-09-20
**Status**: In Progress

## Summary

One module owns every open window: what is open, where it sits, how big it is, which one has focus and which one is put away in the dock. Windows are dragged by their title bar, move with the arrow keys, minimise toward their dock icon, fill and unfill from the green light, and close with the focus handed back to whatever opened them. Every rule is a pure function over plain data, so the manager is tested without a browser and every window feature later composes the same one.

## Requirements

**User stories**:

- As a visitor, I want the window I am working in to sit on top and look alive, so that I never wonder which one has my keyboard.
- As a visitor with a mouse, I want to drag a window by its title bar and have it stay where I put it, so that I can arrange two windows side by side.
- As a keyboard user, I want to move, minimise, fill and close a window without a pointer, so that the desktop is fully usable from the keyboard.
- As the engineer building the eighth window, I want the manager to own position, size, focus and stacking, so that my window body only renders content.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the desktop container, the greeting, the desktop icons and the dock. This feature clamps against the work area that container defines and never measures the viewport itself.
- Rows 8 to 15 own window bodies. This feature owns the frame's behaviour and the frame's focused and quiet treatments, and nothing about a body.
- Row 12 owns the compact switcher. This feature fixes the rule the switcher inherits: below the compact breakpoint the focused window fills the work area and no window offers a drag.
- Window resizing by the visitor is not in this pass. A window opens at the size its layout gives it.
- Row 18 owns sounds. This feature plays none.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: `WindowInstance` carries `key`, `windowId`, `title`, `target`, `position`, `size`, `status`, `z`, `filled` and `opener`. `WindowLayout` carries `windowId`, `defaultSize` and `minSize`, written as a `Record` over `WindowId` so a missing entry fails the typecheck. A pure resolver maps an `OpenTarget` to a window id, a key and a title for every target kind, `external` included. The manager is a pure reducer behind one context provider in `#store`: no DOM, no timers and no storage inside it, so every rule is unit tested without a render and without a browser.
- **AC-2**: Opening a target returns a window. The resolver picks the window id and the key, the instance takes `WindowLayout.defaultSize`, spawns at the next cascade step clamped into the work area, and takes the top stacking number. The first window opens at the work area's top left corner plus half a step, each later one steps by the cascade token, only the windows that are not minimised count toward the step, and the offset wraps after four steps rather than walking out of the work area. Opening a key that already exists focuses that window, un-minimises it, and replaces its `target` and `title` with the ones just requested, so a second click on a different project icon moves the Projects window to that project instead of doing nothing. It never creates a second window for the key.
- **AC-3**: The focused window is the one with the largest `z` among the instances that are not minimised. A pointer press anywhere in a window and a Tab into its controls both focus it. Stacking numbers only ever grow, so two windows never share one. The focused window renders the frame as it is, and every other window renders the quiet treatment: a softer shadow from `--shadow-window-quiet`, a muted title, and the three lights dimmed by opacity rather than recoloured, since the light colours are deliberately literal and not held at 3:1. The muted title pair and the quiet shadow pair join the contrast suite in both modes.
- **AC-4**: The title bar is the drag handle and the three lights are not. A pointer press on the handle focuses the window and starts the drag: the pointer is captured, the window follows it as a transform written straight to the element, and the position is clamped into the work area on every move. Release commits one position through the move action. A `pointercancel` and a release outside the window both commit the last valid position. A change to the work area while the pointer is down re-clamps from the live value on the next move, and a close during a drag commits the last valid position and then closes. No React re-render happens per pointer event.
- **AC-5**: With focus inside a window, the arrow keys move it by one step and Shift with an arrow moves it by a larger step, both clamped by the same rule and committed through the same move action, so the keyboard and the pointer share one writer for geometry. The move is skipped when the event's target is editable or scrollable in the arrow's direction, so a body that already uses the arrow keys keeps them, and the page never scrolls as a side effect. Escape inside a focused window closes it, and the three lights are ordinary buttons reached by Tab and pressed with Enter or Space.
- **AC-6**: Minimising plays a transform timeline toward that window's dock button, then sets `status` to `minimised`, keeps the geometry and the `filled` flag, leaves the stacking order, and hands focus to the next window down, or to the dock button when no window is left. A minimised window is out of the tab order, is out of the stacking order, and is skipped by the handoff chain, so it is never reachable by the arrow key paths. Its dock button restores it at the geometry it left with, with the movement played back and a fresh stacking number, so it comes back on top. A window whose id has no dock button (`textFile`, `imageFile`) renders its yellow light disabled rather than offering a minimise with no way back. The timeline's target position comes from the dock, which registers each button's element into a `windowId` keyed map the frame reads, so the manager stays free of the DOM.
- **AC-7**: The green light toggles a window between the work area and its layout default size. Filling sets `filled`, sizes the window to the work area and places it at the work area's top left corner. Unfilling returns it to `defaultSize`, anchored at that same corner and clamped. Nothing about the pre fill geometry is stored, so an unfilled window does not go back to where it was before it was filled.
- **AC-8**: Closing plays the exit timeline first and removes the instance after it, so a window is never removed mid movement. On removal focus walks the handoff chain: the `opener` recorded when the window opened, else the next window down, else the window's own dock button, else the desktop, skipping any hop that has gone or is minimised, so focus never rests on a removed element. A close on a key that is already leaving is a no-op, and a minimise arriving during an exit timeline is ignored. The same rule runs for a close from the red light, from Escape, and from any other caller of the close action.
- **AC-9**: The work area is the box the desktop container passes in, with the dock band already subtracted by the container and that band at 0 below the compact breakpoint. Until the first observation arrives the manager holds no work area and clamps nothing, and a measurement of zero is ignored, so a window never collapses into a corner while the container is still unmeasured. When the work area changes (a viewport resize, a rotation, the dock leaving at the compact breakpoint, the first measurement) every window clamps back inside it, and a window that no longer fits shrinks to the work area but never below its layout `minSize`. When the work area is itself smaller than `minSize`, `minSize` wins and the window overflows, clamped at the work area's top left corner so its title bar stays reachable; the compact fill is the one size rule that ignores `minSize`. Below the compact breakpoint the focused window fills the work area and no window offers a drag.
- **AC-10**: Under `prefers-reduced-motion: reduce` every duration reads 0 through the motion tokens, so opening, closing, minimising and restoring finish with no movement, the state after each is the same as with motion, and no timeline callback is left hanging. Under React's development double invoke in `StrictMode` the same holds: listeners, timelines and the resize observer are cleaned up, so a window opens once, drags once and closes once.

## Decision

**Chosen option**: Option 1, one pure reducer owning every window, with the model as plain data and the frame reading only the focus it is given.

The manager owns the state of every window, keeps it as immutable data in a pure reducer behind one provider, and exposes actions for open, focus, move, minimise, restore, zoom, close and the focus handoff. Geometry is written by one action whether it comes from a pointer or from the keyboard. Animations are the frame's business and are driven by the motion tokens, so reduced motion needs no second code path.

**Implementation skills**: `gsap-timeline` (`greensock/gsap-skills`, `.agents/skills/gsap-timeline/`) · `gsap-react` (`greensock/gsap-skills`, `.agents/skills/gsap-react/`) · `gsap-utils` (`greensock/gsap-skills`, `.agents/skills/gsap-utils/`) · `gsap-performance` (`greensock/gsap-skills`, `.agents/skills/gsap-performance/`) · `illegal-states` (`.copilot/skills/illegal-states/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`)

## Feature design

**Data model sketch**:

Two entities, both plain immutable data in `#store`. `WindowLayout` is static and `WindowInstance` is runtime.

| Entity | Field | Type | Required | Notes |
|---|---|---|---|---|
| `WindowLayout` | `windowId` | `WindowId` | yes | The key of the `Record`, so every window id has an entry or the build fails. |
| | `defaultSize` | `{ width: number; height: number }` | yes | Pixels. The size a window opens at, the size it fills to, and the size it returns to. |
| | `minSize` | `{ width: number; height: number }` | yes | Pixels. The floor for the shrink to fit rule, never below the width the frame's title bar needs. |
| `WindowInstance` | `key` | `` `${WindowId}` \| `${WindowId}:${string}` `` | yes | The primary key. A single window app uses its id (`projects`); an item window appends the item (`textFile:nike-about`). |
| | `windowId` | `WindowId` | yes | The app, which is how the layout, the icon and the title are found. |
| | `title` | `string` | yes | What the title bar reads, which for an item window is the item's name. |
| | `target` | `OpenTarget` | yes | What a second open of the same key focuses. |
| | `position` | `{ x: number; y: number }` | yes | Pixels from the work area's top left corner. |
| | `size` | `{ width: number; height: number }` | yes | Seeded from `defaultSize`, or the work area while filled. |
| | `status` | `'normal' \| 'minimised'` | yes | Whether the window is on the desktop or waiting in the dock. |
| | `filled` | `boolean` | yes | Whether the green light has filled it. Kept while minimised, so restore brings back what left. |
| | `z` | `number` | yes | The stacking number, from one counter that only grows. |
| | `opener` | `{ kind: 'dock' } \| { kind: 'desktop' } \| { kind: 'bar' } \| { kind: 'window'; key: WindowKey }` | yes | What asked for this window, so focus can go back to it. The caller passes it to `open`. |

Relationship: `WindowLayout` 1:1 `WindowId`, and `WindowInstance` N:1 `WindowId`. The opener is stored on the instance as that small union rather than as a link to another instance, so nothing breaks when the opener closes or is minimised: the handoff walks the chain and skips a hop that is gone.

The confirmed model is the eight fields above; two join it. `filled` is what the zoom decision needs, since a filled window that is minimised and restored has to come back filled without a second field to remember it. `opener` is what the focus handoff needs, since the manager is pure and cannot ask the DOM which control was pressed.

Derived, never stored: the work area (the desktop container's measured content box, from spec 0003), the focused key (the largest `z` among instances whose status is not `minimised`), the dock's per app state (whether any instance has that `windowId`, and whether all of them are minimised), and `onDesktop` (`status !== 'minimised'`).

**State transitions**:

```
opening ──► normal ◄──► filled        (green light toggles)
              │            │
              └──► minimised ◄──┘      (yellow light, geometry and filled kept)
                       │
                       └──► back to what it was, focused (dock button)
normal | filled | minimised ──► (exit timeline) ──► removed
```

A window is created by the open action, which either adds an instance or focuses and un-minimises the existing one. It leaves only through the close action, and only after the frame reports its exit timeline finished. Nothing transitions to a state outside this set: `status` and `filled` are the two fields, and every combination of them that this diagram names is legal.

**API surface**:

The manager is a module of actions, not an HTTP surface. Inputs marked optional default to the instance's own values.

| Action | Key inputs | Key outputs | Failure |
|---|---|---|---|
| `open(target: OpenTarget, opener: WindowOpener)` | an `OpenTarget` from the content layer, and what asked for it (`dock`, `desktop`, `bar`, or a window key) | the focused `key` of the window that opened, was focused, or was re-targeted | a resolver miss returns a `Result` failure and no window opens; an `external` target changes nothing |
| `focus(key: WindowKey)` | a window key | the new focused key | an unknown key is a no-op |
| `close(key: WindowKey)` | a window key | the state without it, plus the focus handoff | an unknown key is a no-op |
| `minimise(key: WindowKey)` | a window key | status `minimised`, focus handed on | an unknown key is a no-op |
| `restore(key: WindowKey)` | a window key | the window back at its geometry, filled or not, focused on top | an unknown key is a no-op |
| `zoom(key: WindowKey)` | a window key | `filled` toggled with the matching geometry | an unknown key is a no-op |
| `move(key: WindowKey, position: { x, y })` | a key and a position in work area pixels | the clamped position | a position outside the work area is clamped, not rejected |
| `setWorkArea(size: { width, height })` | the container's measured size | every window clamped back in, and the shrink to fit rule applied | a size of 0 is ignored, so the first unmeasured render changes nothing |

Every action returns the same shape (the new instances, and the focused key), so a caller never reads a partial state, and each one is a pure function from the old state to the new one.

**Resolver** (an `OpenTarget` to a window id, a key and a title; pure, and the one place a target becomes a window):

| Target | Window id | Key | Title | Notes |
|---|---|---|---|---|
| `{ kind: 'window'; windowId }` | that id | that id | `WINDOWS[windowId].title` | Where a dock button, a menu bar link, the About icon and the resume desktop icon all arrive. |
| `{ kind: 'location'; locationId }` | `projects` | `projects` | `WINDOWS.projects.title` | The location is carried in the target, and the Projects window (row 8) decides how to show it. |
| `{ kind: 'project'; projectId }` | `projects` | `projects` | `WINDOWS.projects.title` | The same Projects window, re-targeted to that project. |
| `{ kind: 'file'; fileId }` | `textFile` for a text file, `imageFile` for an image | `` `${windowId}:${fileId}` `` | the file's `name` | Two notes from two places sit side by side, because the key carries the item. |
| `{ kind: 'external'; href }` | none | none | none | A new tab through `window.open` with `noopener`, no instance, the focused key unchanged. |

The window id for a file target comes from the file's own `kind` in the content layer, and its title from the entry's `name`, which every file kind carries.

**Value sourcing** (every value each action produces, computes or displays names where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| `open` | the window id, the key and the title | the resolver, from the `OpenTarget` and the content layer |
| `open` | the opener to record | passed in by the caller: the dock, a desktop icon, a menu bar control, or the window that asked |
| `open` | `defaultSize` | `WindowLayout` for that `windowId` |
| `open` | the spawn position | the cascade step (a token) applied to the count of open windows |
| `open` | the stacking number | the manager's counter, incremented |
| render | which window is focused | derived: the largest `z` among instances that are not minimised |
| render | the quiet treatment | `Window`'s own props, derived from the focused key |
| drag | the position while moving | the pointer position translated into work area pixels, written to the element and committed on release |
| drag | the clamping bounds | the work area, `position`, `size` |
| `move` (keyboard) | the step distance | the step token, and the larger step token with Shift |
| `minimise` | the timeline's target | that window's dock button, found by `windowId` in the dock's element map |
| `restore` | the geometry it returns to | the instance's own `position`, `size` and `filled` |
| `zoom` | the filled size and spot | the work area, and the work area's top left corner |
| `close` | where focus goes | the instance's own `opener`, else the next largest `z`, else that window's dock button, else the desktop |
| `setWorkArea` | the shrink to fit size | the work area, floored by the layout's `minSize` |
| render | the durations and easings | `readMotionToken` and `readEaseToken`, never literals |

**Key invariants**:

- One instance per key. A second open of the same key never adds an instance.
- A window's position always keeps the whole window inside the work area, so no window can be lost off screen.
- A window's size is never below its layout `minSize` and never above the work area.
- Stacking numbers only grow, and the focused window always has the largest one among the windows that are not minimised.
- At most one window is focused, and after any action either a window, a dock button, or the desktop holds focus, never nothing.
- A minimised window is out of the tab order, out of the stacking order, and skipped by the handoff chain.
- The opener is a small union recorded at open time, never a link to another instance, so a closed or minimised opener cannot break the chain.
- The reducer is pure: it reads no DOM, sets no timer, and writes no storage, so it can be replayed, logged and tested directly.

**Security model**:

None. The page is public, the manager touches no personal data beyond the content already in the repo, sends nothing anywhere and stores nothing. No user input reaches the model except a pointer position and a key press, both of which are clamped or ignored.

**Configuration required**:

No environment variables and no credentials. Three measure tokens join the token layer in `src/index.css`, for the reason `design.md` gives (a value the tokens do not name is a gap to bring to `/architect`):

- `--window-cascade-step`: how far each newly opened window steps down and right from the one before.
- `--window-nudge-step` and `--window-nudge-step-large`: the arrow key distances, and the Shift distances.
- `--shadow-window-quiet`: the softer window shadow the unfocused treatment uses.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: opening two different keys gives two windows, the second takes the top stacking number, and the first stays where it was, verifies **AC-2**, **AC-3**
- Happy path: a window is dragged to the bottom right, then the viewport narrows, and it comes back inside the work area, verifies **AC-4**, **AC-9**
- Edge case: opening the same key twice focuses the existing window, un-minimises it when it was minimised, re-targets it to the new item, and adds no instance, verifies **AC-2**, **AC-6**
- Edge case: an item window (`textFile:nike-about`) has no dock button, so its yellow light renders disabled while its red light and its move still work, verifies **AC-6**
- Edge case: a window opened by another window, where that opener is minimised before the close, hands focus past it to the next window down, verifies **AC-8**, **AC-6**
- Edge case: arrow keys with focus inside a scrollable body scroll it, and the window does not move, verifies **AC-5**
- Boundary: an `external` target opens a new tab, adds no instance and leaves the focused key alone, verifies **AC-1**
- Edge case: a filled window is minimised and restored, and it comes back filled at the geometry it left with, verifies **AC-6**, **AC-7**
- Failure case: a close while a window is mid exit, and a second close on the same key, both leave one window removed and focus somewhere reachable, verifies **AC-8**
- Failure case: a pointer that leaves the window mid drag, a `pointercancel`, and a work area change while the pointer is down, all commit or re-clamp a position and leave no listener behind, verifies **AC-4**, **AC-10**
- Keyboard: arrows move the focused window and never scroll the page, Escape closes it, and focus goes to the opener, verifies **AC-5**, **AC-8**
- Reduced motion: with motion reduced and `readMotionToken` returning 0, an open, a minimise and a close all reach their end state without a hanging callback, verifies **AC-10**
- Compact: below the compact breakpoint the focused window fills the work area and no drag starts from its title bar, verifies **AC-9**

## Build plan

Ordered as a Tracer Bullet: thin thread first, then one strand at a time. Task 1 and 2 extend the store spec 0003 starts, rather than replacing it.

1. The model, the layout config, the resolver and the reducer, with unit tests that need no DOM: the two entities, `WindowLayout` for all nine windows, the target to window rule, and the open, focus and close actions. satisfies **AC-1**, **AC-2**
2. The focus and stacking thread: the connecting counter, the focused key derivation, the click and Tab focus paths, and the quiet treatment on the frame. satisfies **AC-3**
3. The drag: the title bar as the handle, pointer capture, the transform written directly to the element, the clamp, and the single commit through `move`. satisfies **AC-4**
4. The keyboard paths: the arrow keys through the same `move` action, Escape inside a focused window, and the exit timeline with the focus handoff. satisfies **AC-5**, **AC-8**
5. Minimise, restore and the dock link: the shrink timeline toward the dock button, the status change, the handoff, the exclusion from the tab and stacking orders, and the restore path. satisfies **AC-6**
6. Zoom: the green light toggling between the work area and the layout default size, with `filled` kept through a minimise. satisfies **AC-7**
7. The work area observer: clamping on every change, the shrink to fit rule with `minSize` as its floor, the compact rule that fills the focused window, and the cleanup that survives `StrictMode` and unmount. satisfies **AC-9**, **AC-10**
8. The contrast pairs the quiet treatment adds, in both modes. satisfies **AC-3**

## Consequences

**Positive**:

- Every rule about a window is a pure function over plain data, so the tricky ones (clamping, the cascade, the handoff) are tested without a browser or a render.
- Geometry has one writer, so a drag and an arrow key cannot disagree, and a later feature that moves a window has one action to call.
- The frame learns one new thing (whether it is focused), so rows 8 to 15 compose it without knowing the manager exists.
- Reduced motion needs no second code path: the tokens are read at the call site, so a zero duration simply finishes at once.

**Negative / tradeoffs**:

- The manager holds every window in one context, so every window re-renders when any window's geometry changes, unless the frame subscribes narrowly. The content can open seventeen instances at most today (seven app windows, four text files and six images), which a page can afford; a real desktop of forty could not.
- Writing the transform directly during a drag means the element's transform and the state's position disagree while the pointer is down. The commit on release is what keeps them from drifting, and a bug there shows as a window that springs back.
- Zoom without remembered geometry is the one place the behaviour differs from the desktop it imitates: unfilling puts the window at the top left of the work area rather than where it was.
- Doing the exit timeline in the frame, before dispatch, means the store is briefly out of step with the screen: the instance is still there while the window is already leaving.

**Neutral**:

- GSAP arrives as a dependency, and this feature is the first to use it for timelines rather than a single transform.
- The window key format (`projects` and `textFile:nike-about`) becomes the convention later windows follow.
- `minSize` has no resize handle to serve yet, so its only job today is the shrink to fit rule and the compact fill.

## Follow-up

- [ ] Window resizing by the visitor was deliberately left out of this pass; enroll it as a scope feature in Deferred, where it can take the resize action, a grip on the frame, and `minSize` as its floor.
- [ ] The `accessibility-*` skills and `illegal-states` are installed and used by these specs but are not yet listed in the `## Agent skills` section of `AGENTS.md`; `/sync` should add them.
- [ ] If a window body later needs to keep a draft's state across a minimise, that state belongs to the body, not to the instance. Worth naming in `src/windows/AGENTS.md` when the first body needs it.
- [ ] The narrow subscription the Negative section mentions is a known cost, not a defect. Revisit it if the window count ever passes twenty.

**Rationale, options and the design conversation**: see [rationale.md](rationale.md).
