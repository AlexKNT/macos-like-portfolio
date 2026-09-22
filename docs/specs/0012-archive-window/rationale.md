# Rationale: Archive window · spec 0012

The decision record behind [index.md](index.md). `/develop` skips this file.

## Context

The desktop has carried an Archive app in its dock and an Archive tile on a phone's home surface since spec 0003, and both open the same stand in body today, which says "The leftover files, and a way to empty them." Everything around the missing body is already in place: the window id, its title and icon in `WINDOWS`, its layout in `WINDOW_LAYOUT` (640 by 420, with a 340 by 240 floor), a dock app named `Archive`, a home tile, and a compiler enforced line in `WINDOW_BODIES`. Nothing else about the shell has to move for this window to exist.

The leftovers themselves already exist too, and that is what makes this feature small. The content layer models a `trash` location holding two image entries (`trash1.png` and `trash2.png`), both files are in `public/images`, `findFile` finds them through `TREE_FILES`, and the Projects window's Finder already lists `Trash` in its sidebar and shows the two files in its grid. The reference build this portfolio follows has the same two leftovers behind its own bin icon. So the content is settled, the entry points are settled, and what is missing is a surface, a gesture and a state.

The gesture is where the honesty problem lives. The site is front end only: no server, no database, and the content layer is a set of frozen module constants that its own rules say must stay immutable and pure. There is no delete, no soft delete and no place to put a tombstone. "Empty the bin" therefore cannot mean what it means on a real desktop, and a spec that quietly pretended otherwise would build a lie into a window a recruiter is meant to read as a real desktop.

The last force is what the desktop already shares. `WindowStage` gives every body the container query, one named content area, the optional heading and the single polite live region. `QuietLine` is the one way a window shows something missing. `useLineReveal` prints marked lines and does nothing under reduced motion. `readMotionToken` and `readEaseToken` are the only way a timeline gets its timing, so reduced motion needs no second path. `Window` has carried a `trailing` slot since spec 0005, and `WindowBodyEntry` exposes only `Lead`, so a control at the right of the title bar is one small addition rather than a new mechanism. And the Finder's grid holds a private item face that draws one entry of the file tree, which is exactly the face a leftover needs.

> ⚠️ Premise note: emptying cannot delete anything, and the scope's own words ("a visitor can empty it without errors") could be read as asking for a real delete. The right framing is a gesture with an honest limit. The window owns a small state, the leftovers leave, the surface says it is empty, and the content is untouched: closing and reopening the window brings the leftovers back, and the Finder's Trash place never changes. That keeps the metaphor smiling without either lying or inventing a persistence layer a static site cannot have. It also means the feature is deliberately not a deletion feature, and no later feature should read it as one.

## Options considered

### Option 1: A body of its own on the shared stage, with its own state and a title bar control

The `archive` window registers a body, a scope and a title bar control of its own. The body reads the Trash place through `findPlace`, prints the count and the leftovers through the Finder's own item face lifted into a shared module, holds a three moment state in its scope, and empties through one timeline that the shared reveal follows. The Finder, the content layer and the window manager are untouched.

**Pros**:

- One window per dock app stays true. The dock's indicator, the phone's one window rule and the movement from a tile all key on the window id, so an app that opens another app's window would break three behaviours at once.
- The gesture has a home. A control, a state and a movement all belong to the window that owns them, and the title bar's trailing slot already exists to carry the control.
- The leftovers stay in one place in the content layer, so `findFile` keeps finding them, an image still opens in the image window, and no test in the content suite moves.
- The shared pieces it needs are almost all built: the stage, the quiet line, the reveal, the motion tokens, and a title bar slot waiting for its second user.

**Cons**:

- It adds one registry slot (`Trail`) and lifts two modules out of another window's folder, so the change is wider than one folder even though its behaviour is small.
- The emptied state is the window's own, so the surface a visitor empties and the Finder's Trash row disagree the moment the gesture lands.
- A fourth control appears in a title bar the desktop taught visitors to read as three lights.

### Option 2: The Archive reuses the Finder's whole body, pointed at the Trash place

The dock's Archive button opens the Projects window on the Trash place, the way the reference build points its own bin icon at its file manager. Nothing new is written: the Finder already knows how to show a place's items, its empty line already reads "Nothing in Trash yet.".

**Pros**:

- The least new code of any option: no body, no state, no control, nothing to test beyond what spec 0005 already proves.
- One surface shows the leftovers, so there is nothing to disagree with.
- It matches the reference build's own shape, where the bin is the file manager with another place selected.

**Cons**:

- The scope's done line asks a visitor to empty the bin, and the Finder has no place to put a control that empties a place. Either the Finder grows a control that only makes sense for one location, or the feature's central promise is dropped.
- Two dock buttons would open one window, so `hasDockButton`, the dock's own indicator and the phone tile would all report a window the app does not really have, and the movement from a tile to the window would start from the wrong tile.
- The Trash place would have to become a real place with a history entry, so Back would appear beside a bin, which is not what a bin does.

### Option 3: Move the leftovers into a content collection of their own and take Trash out of the Finder

The two files leave `LOCATIONS`, the `trash` location leaves `locationIdSchema`, the Finder's sidebar shows three places, and a new content collection feeds the Archive alone.

**Pros**:

- One path to the leftovers and one truth about where they live, which is the strictest reading of the house rule that nothing is stored twice.
- The Finder stops listing a place a visitor can do nothing in, and the Archive becomes the only bin.

**Cons**:

- It rewrites a window that spec 0005 built, verified and tested, and the reference build lists Trash in the Finder sidebar, so the change moves away from the design the project is following.
- `TREE_FILES` walks `LOCATIONS`, so the two files would have to be re-attached to the tree lookup by hand or an image leftover would stop opening, which is more moving parts than the metaphor gain is worth.
- It buys consistency for a state that only exists while one window is open, at the cost of a supersession, three rewritten test files and two end to end checks.

### Option 4: Share the emptied flag, so the Finder's Trash place empties too

The state moves above both windows, and the Finder's Trash place reads it, so emptying the Archive empties the place a visitor sees in the Projects window as well.

**Pros**:

- The two surfaces agree, so the metaphor survives the second look that option 1 fails.
- The gesture becomes a desktop wide fact rather than a window's private state, which is closer to what a real bin does.

**Cons**:

- The Finder has to learn about a flag that is not its own, which weakens the rule that a window's state lives in that window and nowhere else.
- The flag would have to be rebuilt whenever a window that shows the Trash place mounts, or the place would show items in a Finder grid that the Archive has already emptied, which is the same disagreement with more machinery.
- A reload still brings the leftovers back, so the extra machinery buys nothing that survives the one moment a visitor is looking.

## Rationale

Option 1 wins on the two forces that matter here. The first is that the desktop's model is one window per app: the dock's indicator, the phone's one window rule and the tile to window movement all key on the window id, so an Archive that opens the Projects window would be a bin that reports itself as the file manager. The second is that the feature's whole promise is a gesture, and a gesture needs a home. Option 2 has no home for it; options 3 and 4 pay a real price in a verified window for a consistency that only matters while one window is open.

The state is the window's own because that is where this codebase already puts state the manager does not own. The Finder keeps its place history in a scope wrapped around its frame, and the Gallery keeps its album and its open photo in its own machine; both are dropped when the window closes. This feature follows them rather than inventing a fourth arrangement, and it is what makes the promise in `## Consequences` true: no visitor can destroy content, because the content is never written to and the state that pretends otherwise lives only as long as a window.

Sharing the face and not the grid is the same judgement at a smaller scale. Drift hurts where two windows draw the same thing: the icon size, the name wrapping, the button semantics, the anchor for an entry that leaves the page, and the disabled moment a leaving item needs. That is `ItemTile`. The list around it is not the same thing in the two windows: the Finder's empty line names a place a visitor navigated to, and its heading is the place's name, while the Archive's says a gesture just finished and its first line is a count. Sharing the wrapper would mean threading words and flags through it for no gain, so each window keeps its own list and both draw their items the one way.

The movement is one timeline over the block that holds the count and the items, on `readMotionToken('fast')` and `readEaseToken('out')`, with the quiet line arriving through the reveal the Skills and Articles windows already print with. Two details are load bearing rather than decorative. The first is that the tokens are read rather than written, so under reduced motion the durations are zero and the same code path performs the swap instantly. The second is that the timeline is held in one ref and killed on unmount, because this codebase has already paid for that lesson once: spec 0004's own review found a restore tween that was never cancelled and could move the keyboard on a window that had gone. A gesture with an exit is exactly the shape that fails that way, so the cleanup is written into the spec's invariants rather than left to review.

The last call is the one that keeps the keyboard still, and it went through one correction before the spec settled. The first shape kept the control mounted and read as having nothing left to do, which sounded like enough; it is not, because a natively disabled button drops the keyboard to the body the instant it is disabled, so a visitor pressing Empty with the keyboard would be sent back to the top of the page and their next Tab would start from the dock. The control therefore carries `aria-disabled` and stays in the tab order, the machine's own guard makes a press in that state a genuine no op, and the leftovers take a real `disabled` only while they are already leaving, which is the moment nothing else can be focused anyway.
