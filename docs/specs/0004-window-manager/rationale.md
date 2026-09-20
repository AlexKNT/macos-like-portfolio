# 0004. Window manager: rationale

_Reasoning, options and context for [index.md](index.md). `/develop` does not need this file._

## Context

Spec 0002 shipped a window frame and deliberately stopped at its edges: `Window` sets neither `position` nor `z-index`, and its own comment says placing a window and deciding what sits on top is the window manager's business. Nine window features are queued behind this one, each of them expecting to render a body inside a frame and none of them expecting to arrange it. So something has to own what a window is, where it sits, and which one the keyboard belongs to, and it has to be something those nine features never think about.

The behaviour the desktop promises is not small. A window is opened from three different entry points, focused by a click or a tab, dragged by its title bar, moved with the arrow keys, put away in the dock and brought back, filled and unfilled from the green light, and closed, with focus handed back to whatever opened it. Every one of those is a state change over the same four things: which windows exist, where they are, how big they are, and which one is on top. That is a small state machine with a lot of ways in, which is exactly the shape that goes wrong when each entry point writes state itself.

Three constraints from the project shape the answer. The first is the house rule that functions are pure by default with side effects only at the edges, which fits a reducer and rules out a manager that touches the DOM. The second is the accessibility baseline: if an action has no keyboard path, it is not done, which means geometry needs a writer that a key press can call as easily as a pointer. The third is reduced motion: durations already resolve to zero through the motion tokens, so a design that reads its timing through those tokens gets the correct behaviour for free, while one that hardcodes its own durations does not.

Two smaller forces matter too. React 19 runs development effects twice in `StrictMode`, which catches listeners, timelines and observers that are not cleaned up, and this feature adds all three. And a phone cannot hold a desktop of windows at all, so the manager has to hand row 12 a rule it can build a switcher on rather than a desktop it has to dismantle.

## Options considered

### Option 1: One pure reducer owning every window, geometry through one action, animation in the frame

The manager keeps a list of window instances and a counter as plain immutable data, behind a pure reducer and one context provider. Open, focus, move, minimise, restore, zoom and close are actions, each a pure function from the old state to the new one. A drag writes a transform directly to the element while the pointer is down and commits one position through `move` on release, which is the same action the arrow keys call. The frame plays its own timelines, reading durations and easings from the motion tokens, and reports back when the exit timeline is done.

**Pros**:

- Every rule is testable without a DOM, so the clamping, the cascade and the focus handoff are covered by fast unit tests rather than by driving a browser.
- One writer for geometry, so the pointer and the keyboard can never disagree about where a window is.
- Nine window features compose the frame and never touch the manager.
- Reduced motion needs no second path, because a zero duration is simply a timeline that has already finished.

**Cons**:

- One provider means any change re-renders every open window unless a frame subscribes narrowly, which is fine for nine windows and wrong for a real desktop.
- The element's transform and the state's position disagree during a drag, so the commit on release is load bearing.
- The exit timeline runs before the state change, so the store is briefly behind the screen.

### Option 2: State per window inside each window component

Each window keeps its own position, size and status in its own state, and the desktop holds a list of open keys plus one stacking counter.

**Pros**:

- No central reducer, and each window owns what it knows.
- A window's state cannot be read by a window that should not care about it.

**Cons**:

- Focus, stacking, the handoff on close and the clamp on resize all need the whole picture, so the desktop ends up holding most of the state anyway and the model is split in two.
- A window body cannot be unmounted without losing its geometry, which breaks minimise and forces the desktop to keep a cache of what each window knew.
- The rules stop being testable without a render, which is where the project's testing story is weakest.

### Option 3: An external store read through `useSyncExternalStore`

The same state, held outside React and read by each consumer through a subscription, so a window re-renders only when its own slice changes.

**Pros**:

- Avoids the re-render cost of one provider, without a dependency.
- The dock and the drag can read the state without being inside the provider tree.

**Cons**:

- Subscriptions have to be written by hand, including the selector comparison, which is more code than the whole reducer in option 1.
- A second way to hold state in a project that has one, before any window count makes it worth it.
- The purity rules stay, but the ergonomics do not: every reader becomes a subscription to maintain.

### Option 4: A positioning library owns the drag and the geometry

A library such as react rnd, interact js or GSAP's Draggable handles the pointer, the bounds and the resize handles, and the manager stores whatever it reports.

**Pros**:

- Bounds, pointer capture and touch handling come tested and free.
- Less code to write for the drag, which is the fiddliest interaction here.

**Cons**:

- A second owner of placement and size, which the manager already owns, so the state has two writers and they can disagree.
- Keyboard movement sits outside the library anyway, so geometry keeps two paths, which is the thing option 1 exists to prevent.
- Resizing is out of this pass, so the part of the library that would be genuinely valuable is unused.

## Rationale

Option 1 wins on the two forces that decide this feature: one writer for geometry, and rules that can be tested without a browser. Every entry point in the requirements, a dock button, a title bar drag, an arrow key, a dock restore, has to leave the same state, and the only way to guarantee that is to make them all call the same action. A reducer does that in a way a reader can check by reading eight small functions, and it keeps the project's purity rule intact, which matters because the clamping rule is the one thing in this feature that a bug would make invisible until a visitor loses a window.

The rejected options lose on different counts rather than on taste. Option 2 splits the state at the exact seam (focus, stacking, the handoff) where it needs to be whole. Option 3 buys a re-render optimisation for a page that will hold at most nine windows, at the price of hand written subscriptions that are harder to read than the reducer they replace; it stays in view for a real desktop, and the negative consequence says so rather than pretending the cost is zero. Option 4 gives up the single writer to save drag code, and its most valuable part (resize) is deliberately out of this pass.

Several smaller calls are mine rather than the engineer's. Every action returns the whole new state, so a caller never sees a partial picture. Unknown keys are no-ops rather than errors, because a stale key is an expected outcome (a window closed while an animation was running) and a returned failure nobody can act on is noise; a resolver miss, which is a content problem, does return a failure. The exit timeline runs in the frame before the close action, so nothing is removed mid movement, and the cost (the store briefly being behind the screen) is written down rather than hidden. Escape closes a focused window but is read on the window itself, so a body that needs Escape for its own purposes can stop the event before the manager sees it. The larger arrow step with Shift is a keyboard convention that costs one token and saves a visitor thirty presses across a 1400px work area. `filled` was added to the confirmed field list because a filled window that is minimised and restored has to come back filled, and the only alternatives were a second field or a silent behaviour change on restore.
