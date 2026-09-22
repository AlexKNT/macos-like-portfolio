# 0012. Build the Archive window as the desktop's bin

**Date**: 2026-09-22
**Status**: Accepted

## Summary

The Archive window is the desktop's bin: it shows the leftover files the content layer already keeps in its Trash place, and one press empties it. Because the site has no server and no database, emptying is a gesture inside the window rather than a deletion: the leftovers leave, the window says it is empty, and closing and opening the window again brings them back. The window holds its own state (one value naming where the gesture stands), reuses the stage, the quiet line and the reveal the other windows already share, and adds one small piece of frame machinery so a window can carry a control at the right of its title bar. It adds no dependency, no colour name, no schema and no content entry.

## Requirements

**User stories**:

- As a hiring manager, I want the desktop's bin to open and show what is in it, so that the metaphor I am browsing reads as a real desktop rather than a set of windows.
- As a curious visitor, I want to empty it and watch it go, so that the desktop rewards a press with something to look at rather than a dead end.
- As a keyboard or screen reader user, I want the Empty control reachable and named, and the emptied state spoken once, so that I know what happened without watching the movement.
- As the engineer who ships this, I want the leftovers to be impossible to lose, so that a playful gesture can never take content away from a visitor who reloads.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the dock, the menu bar and the desktop items. Row 7 (spec 0004) owns the frame: its geometry, its focus, dragging, minimising, zooming and closing. This feature adds one registry slot for a title bar control and no manager action.
- Row 9 (spec 0006) owns the shared stage, the quiet line, the staggered reveal and the rules every body follows. This window composes them and changes none of them.
- Row 8 (spec 0005) owns the Finder and the Trash place. The Finder keeps its Trash row, its own empty line and its own behaviour exactly as verified. This feature reads the Trash place and changes nothing about how the Finder shows it.
- Rows 13 and 14 (specs 0010 and 0011) own the Gallery and the Articles windows. The three share the stage and nothing else.
- This feature owns the `archive` body, its control and its state. It is the last window to leave the stand in body.
- The content layer gains no schema, no entry, no reader and no rule. The window reads `LOCATIONS.trash` through `findPlace`, the way the Finder reads the place it is showing.
- No shell list changes: the archive window already has an entry in `WINDOWS`, an app in `DOCK_APPS` and a tile in `HOME_APPS`. It gains no desktop icon, and the menu bar's links are left alone.
- The window has no sidebar, no search, no filter, no sort control, no selection, no multiple selection, no drop target, no rename, no put back, no undo and no confirmation step. It never deletes anything.
- Row 16 (light and dark appearance) and row 18 (sound effects) are not designed here, so the gesture makes no sound.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The Archive window opens from its button in the dock and from its tile on a phone's home surface, showing one item per leftover the Trash place holds, in the order the content lists them, each item carrying the file's own icon and its own name. It opens one instance, focused, never a second, and a press on the dock button or the tile while the window is already open focuses that same window.
- **AC-2**: The face each leftover shows is the one face the desktop gives an entry of its file tree, drawn by one shared module that the Finder's own grid uses too, so the two windows cannot drift apart. A press on a leftover opens it where its own kind says, through the same path the Finder takes: an image leftover opens in the image window, which arrives above the Archive, and the Archive window stays open behind it.
- **AC-3**: The window says how many leftovers it holds, in one quiet line above them, built from the number of items the Trash place holds, and that line is gone once the window is empty.
- **AC-4**: The Empty control sits in the window's title bar at the right, beside the three lights and the window's name. Its visible word is short and its accessible name names the window it empties, with the visible word inside the announced name. It carries `aria-disabled` whenever it has nothing to answer, which is an empty already taken and a window that opened on a place holding nothing, and it keeps its place in the tab order in every state, so a press while it is not answering does nothing and never moves the keyboard. It is reachable by keyboard in order with the visible focus ring, its own box measures at least 24 by 24 pixels (the floor WCAG 2.2 sets for a control), and it keeps its visible word and its place at every width, so it needs no second face on a phone.
- **AC-5**: One press on Empty starts the gesture. The block that holds the count and the items fades and shrinks where it stands, in one movement timed from the motion tokens, and each leftover stops answering a press the moment the gesture starts. When the movement lands the window is empty, and the control then reads as having nothing left to do, with the keyboard still on it.
- **AC-6**: An empty Archive shows one quiet line in the content area, through the shared `QuietLine`, saying that the Archive is empty. The same surface is what a build whose Trash place holds nothing shows from its first paint, and no empty list is rendered in either case.
- **AC-7**: The window's state is its own: one value naming where the gesture stands (`holding`, `clearing`, `emptied`), built only by the window's own pure transitions, held in the window and dropped when it closes. Nothing in the content layer, the window manager, the frame, any other window or any storage changes.
- **AC-8**: An emptied Archive lasts only as long as its window: closing it and opening it again shows the leftovers again, exactly as the content layer holds them. No content entry changes, no file under `public/` is removed, and nothing is written to `localStorage`, `sessionStorage` or a cookie.
- **AC-9**: Under reduced motion the leftovers go and the quiet line arrives with no movement at all, through the same one code path: every duration the gesture reads resolves to zero, no timeline is started, and the window lands in its empty state at once rather than waiting on a movement that will never run.
- **AC-10**: The movement lives in one place, inside a GSAP context that its own cleanup reverts, so a window closed mid gesture and an effect that runs twice in development both leave nothing running and nothing half applied. The landing is safe to call twice, a second press during the gesture changes nothing, and no state is set on a component that has unmounted.
- **AC-11**: The emptied state is announced once, through the stage's single polite live region, in the same words the quiet line shows on screen.
- **AC-12**: At 360 pixels the window fills the work area, the title bar keeps the Empty control, the leftovers flow inside the window's own width, and nothing in the window scrolls sideways.
- **AC-13**: The window is built on the shared stage: it renders exactly one `WindowStage`, one named content area and one live region, no module under `src/windows/archive/` carries a colour literal or a palette utility, and every literal the window itself writes comes from the window's own words module, while the file names a leftover shows are read from the content layer rather than written in the window.
- **AC-14**: The stand in body retires with this feature: every window id in `WINDOW_BODIES` carries a real body of its own, and `Placeholder`, its line record and its suite are removed rather than left dead in the tree.

## Decision

**Chosen option**: Option 1, the Archive as a body of its own on the shared stage, with its own state and a title bar control, sharing the Finder's item face rather than the Finder's whole window.

One line registers it: `archive: { Body: ArchiveWindow, Trail: ArchiveEmptyButton, Scope: ArchiveScope }` in `WINDOW_BODIES`, replacing the `Placeholder` entry. The body composes `WindowStage`: the Trash place's items in the stage's one named content area, the count line above them, the shared quiet line for the empty case, and the emptied state announced through the stage's single live region. The window holds its own state, so it registers a `Scope`: the state wraps the frame, which is what lets the title bar's control read the same value the body draws from, exactly the way the Finder's Back arrow reads the place history.

The leftovers stay where they are. The content layer already keeps them in `LOCATIONS.trash`, `findFile` already finds them so an image opens in the image window, and the Finder's sidebar already lists the place. The window reads `findPlace({ kind: 'location', locationId: 'trash' })`, which is the same call the Finder makes for the place it is showing, so the window names no path into the tree and no new reader is written. Emptying changes the window's state and nothing else: the content is a constant, so an emptied Archive is a surface saying it is empty, and a reopened window holds the leftovers again. That limit is the honest one for a site with no server, and it is recorded in `## Consequences` rather than hidden.

The state is one value naming where the gesture stands, held in the window's own folder as a pure machine: `holding`, `clearing` (the movement is under way) and `emptied`. Only its own transitions build a state, and a transition asked for at the wrong moment hands back the same object, so React bails out and a repeated press is a genuine no op. One derived value decides whether the control answers: `canEmpty(state, count)`, true only while the window is `holding` and the place holds at least one item, so a window that opened on an empty place never offers an empty with nothing behind it. While it does not answer, the control carries `aria-disabled` rather than the native `disabled`. A disabled button drops the keyboard to the body the moment it is pressed, which would send a keyboard visitor back to the top of the page; `aria-disabled` keeps their place, and the machine's own guard makes a press in that state change nothing.

The title bar control needed one small piece of shared machinery. `Window` has carried both a `leading` and a `trailing` slot since spec 0005, but the registry only exposed the leading one, so `WindowBodyEntry` gains an optional `Trail` and `ManagedWindow` passes it through, the way `Lead` already travels. That is the same mechanism the Finder's Back arrow arrived with, and this control is its second user. The control's own word is one short word, so it needs no icon on a phone and no second face to keep named.

Two pieces move up to the shared folder, because two windows now draw the same thing and drift is what hurts. `ItemTile` is the one face an entry of the file tree shows: the file's icon above its name, a button when the press opens something inside the application and a real anchor when it leaves the page, with an optional `disabled` for the moment the leftovers stop answering. `itemTarget` is where a press on one leads, which is the Finder's own rule lifted out of its grid. The Finder's `FinderGrid` uses both and keeps its own list and its own empty line, because the two windows differ there: the Finder's empty line names a place a visitor navigated to, while the Archive's says a gesture just finished.

The movement is one timeline over the block that holds the count and the items: opacity to nothing and a slight shrink where they stand, on `readMotionToken('fast')` and `readEaseToken('out')`, so under reduced motion the durations read zero and the swap happens with no second code path. The quiet line arrives through the shared `useLineReveal`, which masks and uncovers it with the same tokens and does nothing at all under reduced motion. The timeline is held in one ref inside one hook, created inside a GSAP context that the same cleanup reverts, and the landing is safe to call twice, which is the lesson spec 0004's review taught this codebase the expensive way.

What the window renders follows the state and the count, in four cases. `holding` with items shows the count line and the list of leftovers. `holding` with nothing shows the quiet line, which is the surface a build whose place holds nothing shows from its first paint. `clearing` shows the same block, with the leftovers inert, while the block leaves. `emptied` shows the quiet line and no block at all, so nothing inert and no empty list stays in the accessibility tree. The stage's one live region carries the quiet line only when the state is `emptied`, so a window that opened on an empty place shows the line without announcing a change that never happened.

The quiet line needs one component of its own rather than a line inside the body, because `useLineReveal` arms itself once per mount: at the moment the window opens the line is not in the page at all, so a reveal owned by the body would have nothing to uncover and the line would simply appear. `ArchiveEmptyLine` owns its own container, mounts with the line and arms the reveal there, and the same component serves both the emptied window and the window that opened on an empty place.

The window's modules, with every one of them pure except where the DOM edge is named:

- `src/windows/ItemTile.tsx` (shared): one entry of the tree, drawn the one way. The button branch takes a native `disabled`; the anchor branch, which is what an entry that leaves the page renders as, takes `aria-disabled`, `tabIndex={-1}` and no pointer events, since an anchor has no `disabled` of its own.
- `src/windows/itemTarget.ts` (shared): where a press on one leads.
- `src/windows/archive/archiveState.ts`: the window's machine, pure and DOM free. `ArchiveState`, `seededArchive`, `emptyRequested`, `archiveCleared`, `archiveAnswers` and `canEmpty`.
- `src/windows/archive/useArchiveState.ts`: the context the window's own value travels in, the value type, and `useArchiveState()`, the consumer hook that hands it over and refuses to answer outside the window's scope.
- `src/windows/archive/ArchiveScope.tsx`: the registry's `Scope`. It names the Trash place once, reads it once through `findPlace`, holds the machine and provides the items, the state, `canEmpty`, `requestEmpty` and `landed` around the frame, so the title bar reads exactly what the body draws from.
- `src/windows/archive/ArchiveWindow.tsx`: the body: the stage, the count, the leftovers, and the quiet line.
- `src/windows/archive/ArchiveEmptyLine.tsx`: the quiet line, owning its own container so the shared reveal is armed the moment the line mounts.
- `src/windows/archive/ArchiveEmptyButton.tsx`: the title bar control, the registry's first `Trail`.
- `src/windows/archive/useEmptyMovement.ts`: the one timeline, its GSAP context and its cleanup.
- `src/windows/archive/archiveLines.ts`: every literal the window shows.

**Implementation skills**: `gsap-core` (`greensock/gsap-skills`, `.agents/skills/gsap-core/`) · `gsap-react` (`greensock/gsap-skills`, `.agents/skills/gsap-react/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

Nothing in the content layer changes. This is what the window reads, and the one new value it holds.

| Entity | Where it lives | Fields | Rule |
|---|---|---|---|
| A leftover file (`FileEntry`, kind `image`) | the content layer, `LOCATIONS.trash.children` | `id: FileId`, `kind`, `name`, `icon`, `imageUrl`, `alt` | already exists and already validates; the Archive reads it and never writes it |
| The Trash place (`Place`) | the content layer | `{ kind: 'location', locationId: 'trash' }` | already exists; `openTargetSchema` is built from `placeSchema`, so a place is a target the manager already understands |
| The window's own state (`ArchiveState`) | the window, in `archiveState.ts` | the moment it is in: `holding`, `clearing`, `emptied` | new; it carries no field, no id and no reference to the content |

Relationships and rules settled in the design conversation:

- The Trash place holds nought to many leftovers. The list is allowed to be empty, and the content check requires no leftover, so a build with none is a valid build rather than a broken window.
- The window's state belongs to one open Archive window, one for one. It is made fresh every time the window mounts and is dropped with it, so two windows could never share a gesture and a closed window keeps nothing.
- The state relates to the content by reading it and nothing else: no transition receives an entry, removes an entry or names one.
- An item's own failed asset is not the window's business. The leftover shows the file's icon and its name, so a picture that is not on disk changes nothing here, and the image window already says so in its own words.

**State transitions**:

```
holding --emptyRequested--> clearing --archiveCleared--> emptied
```

- `seededArchive()` builds `holding`, which is what a window mounts as.
- `emptyRequested(state)` moves out of `holding` and into `clearing`. Asked in any other state it hands back the very same object, so nothing re-renders and a repeated press is a genuine no op.
- `archiveCleared(state)` is called by the movement when it lands and moves `clearing` into `emptied`. Asked in any other state it hands back the same object.
- `archiveAnswers(state)` is the predicate the leftovers read: only `holding` answers, so they stop answering in the same frame the gesture starts.
- `canEmpty(state, count)` is the predicate the control reads, and the case of a place that holds nothing is what it exists for: the state alone would say `holding` for a window whose place is empty, which must never offer an empty.
- There is no way back from `emptied`, and no second path in: a window that is already `emptied` cannot be emptied again, because leaving the window is the only way to hold the leftovers again.

**API surface**:

This is a browser only window, so the surface is its modules rather than endpoints. Every function is pure unless it is named as the DOM edge.

| Module | Shape | Inputs | Outputs | Notes |
|---|---|---|---|---|
| `WINDOW_BODIES.archive` | registry line | | | `{ Body: ArchiveWindow, Trail: ArchiveEmptyButton, Scope: ArchiveScope }`, replacing the `Placeholder` entry |
| `WindowBodyEntry.Trail` | registry slot | | | new optional `ComponentType<WindowBodyProps>`; `ManagedWindow` renders it into `Window`'s existing `trailing` slot, the way `Lead` travels into `leading` |
| `ArchiveWindow` | React component | `WindowBodyProps` (`windowId`, `windowKey`, `target`) | the staged window | renders exactly one `WindowStage`; reads the items, the state and `canEmpty` from the scope, and renders the quiet line in place of the block when the place holds nothing; the target is accepted for the shared contract and is not read, since the place it shows is fixed |
| `ArchiveScope` | React component | `WindowBodyScopeProps` | the provider around the frame | names the Trash place, reads it once through `findPlace`, holds the machine, and provides one value so the body and the title bar cannot disagree |
| `ArchiveEmptyButton` | React component | `WindowBodyProps` | one title bar control | reads `canEmpty` and `requestEmpty` from the scope; carries `aria-disabled` while it does not answer and keeps its place in the tab order; its words come from `archiveLines` |
| `ArchiveEmptyLine` | React component | | the quiet line | owns its container and arms the shared reveal as it mounts |
| `archiveState.seededArchive` | pure function | | `ArchiveState` | always `holding` |
| `archiveState.emptyRequested` | pure function | `ArchiveState` | `ArchiveState` | `holding` becomes `clearing`; anything else is handed back unchanged |
| `archiveState.archiveCleared` | pure function | `ArchiveState` | `ArchiveState` | `clearing` becomes `emptied`; anything else is handed back unchanged, so a landing called twice changes nothing |
| `archiveState.archiveAnswers` | pure function | `ArchiveState` | `boolean` | true only for `holding`, which is what the leftovers read |
| `archiveState.canEmpty` | pure function | `ArchiveState`, a count | `boolean` | true only for `holding` with at least one item, so a place holding nothing never offers an empty |
| `useArchiveState` | React hook | none | `{ state, items, canEmpty, requestEmpty, landed }` | the consumer hook the body and the control both call; it refuses to answer outside the window's scope, the way the Finder's history hook does |
| `useEmptyMovement` | React hook (DOM edge) | the state, the block's element and the landing callback | nothing | starts one timeline when the state becomes `clearing`, inside a GSAP context its own cleanup reverts; at zero duration it starts no timeline and lands at once; calls back when it lands, safely more than once |
| `itemTarget` | pure function | `TreeEntry` | `OpenTarget` | a folder opens the place it stands for; a file goes where its kind says |
| `ItemTile` | React component | the entry, what a press does, and an optional `disabled` | one control | a button inside the application, an anchor when the press leaves the page; the button takes the native `disabled`, the anchor takes `aria-disabled` with `tabIndex={-1}` and no pointer events |
| `archiveLines.countLine` | pure function | a count | the count's words | `2 items`, and `1 item` for one, so the plural is never wrong |
| `archiveLines.emptyLine` | pure function | | the quiet line's words | invented copy, flagged in `## Follow-up` |
| `archiveLines.emptyControlWord` | pure function | | the control's visible word | `Empty`, short enough for the title bar at 360 pixels |
| `archiveLines.emptyControlLabel` | pure function | | the control's accessible name | `Empty Archive`, which carries the visible word inside it, so the label in the name rule holds |

**Value sourcing** (every value the window displays or produces, and where it comes from):

| Action | Value produced or displayed | Source |
|---|---|---|
| the window renders its leftovers | the leftovers themselves | `findPlace({ kind: 'location', locationId: 'trash' }).items` in `#content/reads`, which reads `LOCATIONS.trash.children`, a bundled constant |
| the count line prints | the number | derived from the length of that same item list, through `countLine` |
| an item draws | the file's icon and its name | the entry's own `icon` and `name` |
| an item is pressed | where the press leads | derived from the entry's `kind` through `itemTarget`, which for a text or image file is the same `openTargetFor` the Finder uses |
| the window's title and the content area's name | `Archive` | `WINDOWS.archive.title`, the content layer's own entry |
| the control shows and is announced | its word and its name | `emptyControlWord()` and `emptyControlLabel()` in the window's words module |
| the control answers or not | whether it carries `aria-disabled` | `canEmpty(state, count)`, from the window's own state and the number of items the place holds |
| the quiet line shows | its words | `emptyLine()` in the window's words module (invented copy, flagged in `Follow-up`) |
| the window being empty is announced | the announced words and their timing | `emptyLine()` again, through the stage's one live region, and only when the state is `emptied` |
| the movement runs | its duration and its easing | `readMotionToken('fast')` and `readEaseToken('out')` from `#lib/motion`, which read the computed values on the document element, so reduced motion is already answered there |
| the quiet line arrives | its reveal | the shared `useLineReveal`, on `readMotionToken('base')` and `readMotionToken('stagger')` |
| the state changes | the moment it is in | the window's own state, built by its own transitions, never read from the content or the manager |

**Key invariants**:

- The content layer is never written to. No transition takes an entry, drops an entry or names a file id.
- The leftovers are never lost. A closed window is a window that holds them again, and nothing is written to any storage, so no visitor can destroy what the site ships.
- The state is one value. The body, the control and the movement all read the same one, so the control can never offer an empty that is already under way.
- Only a `holding` window answers a press on its leftovers, and the control answers only when `canEmpty` says so. `canEmpty` is the one value the control, the leftovers and the case of a place that holds nothing all read, so a window can never offer an empty it cannot perform.
- The control never takes the native `disabled`, because disabling a focused control moves the keyboard to the body. It carries `aria-disabled` instead and stays in the tab order, and the machine's own guard is what makes a press in that state change nothing.
- Every transition hands back a new state only when the moment genuinely changes, so a repeated press re-renders nothing. The landing is idempotent: called once, twice or never, the state it produces is the same.
- The window renders exactly one `WindowStage`, with one named content area and no live region of its own. The block of leftovers unmounts once the window is empty, so no inert list and no empty list ever stays in the accessibility tree.
- The frame stays named by `WINDOWS.archive.title`, and the content area is named by the window's own title too, the way the Work place names its frame and its content area.
- One timeline exists at a time, created inside a GSAP context that the same cleanup reverts, so an unmount and an effect that runs twice both leave nothing running on a window that has gone.
- A press on a leftover opens the image window through the window manager's existing `open` action, the same call the Finder's grid makes. `src/store` gains no new action, no new field and no new target kind.
- No module under `src/windows/archive/` carries a hex colour, a palette utility or a new token, and none of them reaches for `fetch`, storage, the clipboard or `window.open`.
- The Trash place, the Finder's sidebar, the dock, the phone tile and the window manager are untouched by this feature.

**Security model**: the window is public and reads only. It reads a bundled constant, holds state in memory, and writes nothing anywhere, so there is no visitor data, no cookie, no request and no compliance scope. The only thing in the window that could leave the page is a press on a leftover whose entry is a link file, which renders as a real anchor with `rel="noopener noreferrer"`, exactly as the Finder renders it, and the content schema already constrains such a link to an absolute `https://` address.

**Configuration required**: none. No environment variable, no secret and no third party credential is added.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: the window opens from the dock, the count line shows the number the place holds, one item per leftover follows in content order with its icon and its name, and a press on one opens the image window above it while the Archive stays open, verifies **AC-1**, **AC-2**, **AC-3**
- The gesture: one press on the control starts the movement, both leftovers stop answering in the same frame, the block leaves, and the quiet line is in the content area once it lands, verifies **AC-5**, **AC-6**
- Failure case: a build whose Trash place holds nothing shows the quiet line from the first paint with no empty list, and the control reports from the first paint that it has nothing to answer, verifies **AC-3**, **AC-6**
- The gesture cannot be doubled: a second press while the movement runs changes nothing, and the state stays one value rather than queuing a second landing, verifies **AC-10**
- Unmount mid gesture: closing the window while the block is leaving reverts the context, leaves no tween running and sets no state afterwards, verifies **AC-10**
- Nothing is deleted: after emptying, the content layer's entries are the same objects, and closing and reopening the window shows both leftovers again, verifies **AC-8**
- Reduced motion: with the system set to reduce motion, one press empties the window with no movement and the line is there at once, verifies **AC-9**
- Keyboard and the control: Tab reaches the control in order with the visible focus ring, its measured box is at least 24 by 24 pixels, it carries `aria-disabled` in every state but `holding`, and a press while it does not answer changes nothing, verifies **AC-4**, **AC-11**
- The keyboard keeps its place: after a press on the control the keyboard is still on it rather than on the body, and the next Tab continues into the window instead of restarting at the top of the page, verifies **AC-4**
- The first paint empty case: with the place holding nothing the control carries `aria-disabled` from the first paint and stays in the tab order, and a press changes nothing, verifies **AC-4**, **AC-6**
- Narrow: at 360 pixels the window fills the work area, the control keeps its word in the title bar, the leftovers flow inside the window's width, and the page and the window both scroll no sideways, verifies **AC-12**
- The registry and the tokens: the registry baseline passes for every entry including `archive`, exactly one stage and one named content area render, and no module under `src/windows/archive/` holds a colour literal or a palette utility, verifies **AC-13**
- Auth or permission: not applicable. The site has no accounts and the window reads only. The nearest rule worth a check is that nothing leaves the page except a press on an entry that is itself a link, verifies **AC-2**

## Build plan

Built as a Tracer Bullet: one thin real thread through the whole window first, proved from the real desktop, then thickened a strand at a time. There is no schema change and no migration anywhere in this plan.

1. The thin thread: `ItemTile` and `itemTarget` lifted out of the Finder's grid, the `Trail` slot added to `WindowBodyEntry` and threaded through `ManagedWindow` into `Window`'s existing trailing slot, the `archive` line in `WINDOW_BODIES`, and a body on the shared stage reading the Trash place and printing the count and the leftovers as real controls. Proved from the dock button and from a phone tile. satisfies **AC-1**, **AC-2**, **AC-3**
2. The control and the state: `archiveState.ts` with its suite, the window's scope reading the place once and providing the state and `canEmpty`, and `ArchiveEmptyButton` as the registry's first `Trail`, holding the keyboard through `aria-disabled` while it has nothing to answer. satisfies **AC-4**, **AC-7**
3. The gesture: `useEmptyMovement` with one timeline over the count and the items on the motion tokens, created inside a GSAP context its cleanup reverts and landing at once when the durations read zero, with the leftovers inert while the block leaves. satisfies **AC-5**, **AC-7**, **AC-9**
4. The quiet states: the quiet line in its own component, through the shared `QuietLine`, armed with the shared reveal as it mounts, the same surface for a place that holds nothing, and the announcement through the stage's one live region only when the state is `emptied`. satisfies **AC-6**, **AC-9**, **AC-11**
5. The hygiene pass: the cleanup that reverts the context, the idempotent landing, the guard that makes a second press a no op, and the narrow pass at 360 pixels with the token check over the window's modules. satisfies **AC-8**, **AC-10**, **AC-12**, **AC-13**
6. The stand in retires: `Placeholder.tsx`, its line record and `Placeholder.test.tsx` are removed now that no window id registers it, and the registry baseline still covers every entry. satisfies **AC-14**
7. The suites: the unit tests for the machine, the words module, the body, the control and the movement's cleanup, the shared tile's own test, and one end to end spec covering the dock, the phone tile, the press, the landing, the state a moment later and 360 pixels. satisfies **AC-1** through **AC-14**

## Consequences

**Positive**:

- The desktop's bin becomes a real surface, which is the one place the desktop metaphor is allowed to be funny, and it is reachable from the dock and from a phone's home surface.
- The window adds no dependency, no colour name, no token, no schema and no content entry. It is the fifth window built on the shared stage and the pattern holds.
- The item face becomes one module, so the Finder and the Archive draw a file the same way and a later change to the face moves both.
- The stand in body finally retires, so every window in the registry is a window a visitor can use.
- The state is one small pure machine with its own suite, so the gesture is provable without a browser.

**Negative / tradeoffs**:

- Emptying is a gesture, not a deletion. A visitor who empties the Archive, closes it and opens it again sees both leftovers back, and the Finder's Trash place lists them throughout. That is the honest limit of a site with no server, and it does mean the metaphor does not survive a determined second look.
- The title bar gains a control that is not one of the three lights, so a visitor meets a fourth control in a place the desktop had taught them to read as three. It reports itself as unavailable once it has nothing to answer, rather than leaving the bar.
- During the movement the leftovers are in the page but inert. A very fast press in that window opens nothing, which is a deliberate choice and the price of the gesture reading as one thing.
- `Trail` is a second registry slot and a second place a window's chrome can live. Each one is a mechanism the next window can lean on, and mechanisms accumulate.
- The control never takes the native `disabled`, so it can still be focused and pressed while it has nothing to do. That is the trade the keyboard rule asks for: a press in that state is handled as a no op rather than made impossible, and the machine is what decides, not the attribute.
- The control's word is English and short. `Empty` happens to fit the title bar at 360 pixels, and a longer word in another language would not, so a later translation owes this control a shorter label rather than more room.

**Neutral**:

- `Placeholder` retires with its line record and its suite, so `src/windows/` loses a module and gains no replacement. If a later window ever needs a stand in, it is a small file to bring back from history.
- The Finder's grid now draws its items through the shared tile, so `FinderGrid` and its suite move with it, and the Finder's behaviour is unchanged.
- Nothing in `design.md` changes: no new colour, no new measure, no new state utility. The window wears what the design system already names.
- The archive window still has no desktop icon, so the wallpaper keeps its four items.
- The Trash place keeps its own name and its own Finder row, so a visitor meets the leftovers under two names: `Trash` in the Finder sidebar and `Archive` in the window and the dock.
- No migration, no schema change and no content edit, so nothing has to be restored or re-authored.

## Follow-up

- [ ] Invented copy for review: the count line, the empty line and the control's word are written by hand in `src/windows/archive/archiveLines.ts`, and they are the only words a visitor reads in this window.
- [ ] Your own leftovers: the two files the Trash place holds are the reference build's leftover screenshots (`trash-1.png`, `trash-2.png`). Swapping in your own, or shipping the Archive empty on purpose, is a content decision rather than an acceptance criterion, so it deliberately fails no verification. It is the same shape as the contact window's own values and the articles window's own posts.
- [ ] `src/windows/AGENTS.md` gains a line for the new `archive/` folder and for the two shared pieces, and its conventions gain the `Trail` slot. That is a `/sync` job, not this feature's, and it is noted here so it is not lost.
- [ ] The two surfaces the leftovers appear on now disagree after an emptying: the Archive's own state is spent while the Finder's Trash place still lists the files. If a later feature wants them to agree, that is a shared state decision above both windows rather than a change to this one.

## Rationale

Reasoning, the options weighed and the record of what was already in place: see [rationale.md](rationale.md).
