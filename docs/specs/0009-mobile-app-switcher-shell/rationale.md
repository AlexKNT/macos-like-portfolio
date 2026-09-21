# 0009. Rationale: a phone home surface that opens one window at a time

## Context

The desktop is the product: a menu bar, a wallpaper with icons, a dock, and draggable windows that sit on top of each other. All of it assumes room. Below 40rem the app currently offers almost nothing: the menu bar keeps only its logo (its links and its four status icons all carry `max-sm:hidden`), the dock band is not rendered at all, and the four desktop items are the only way in. Two of the nine windows (Gallery and Articles) and two more of the six dock apps (Skills and Archive) have no route at all on a phone, so a recruiter on a phone sees a wallpaper with three folders and a resume icon.

Three earlier features met this edge deliberately and each left the seam for a later decision. Spec 0002 fixed the numbers the seam would use: a 44px minimum target, the 40rem breakpoint, and a solid surface in place of blur below it. Spec 0003 decided that below the breakpoint the dock is not rendered, that the desktop icons are the way in, and that the focused window fills the work area, and it named that absent dock as the seam this feature builds on. Spec 0004 decided that the compact fill ignores a window's own arrangement and that no window starts a drag there.

The forces that shape the answer are the audience and the constraints. The visitor is a hiring manager or a recruiter, often on a phone, scanning fast, and the two things they came for are the work and the resume. The project is front end only: no server, no database, no session, so a phone cannot remember anything and does not need to. Everything visual comes from a token layer with a contrast suite that fails the test run when a pair degrades, so a new surface must be built from named tokens rather than colours. The accessibility bar is an acceptance criterion of every feature, not a separate one. And the project's delivery approach is a tracer bullet: one thin real thread through every layer first, then thicken it.

## Options considered

### Option 1: A phone home surface of seven window tiles

Below the breakpoint, the shell becomes a slim bar (the mark, the clock, the appearance control) over a home surface: one heading and one named list of seven tiles, one per window the desktop opens by name. A tap opens that window at the work area's exact box; the manager holds the one window on screen rule; Close returns home.

**Pros**:

- Every window becomes reachable from one screen, which is the promise the scope makes and what the current shell fails to deliver.
- The metaphor survives: a home surface of app tiles is how a phone already reads, so a visitor needs no explanation.
- The rule that makes it work (one window on screen) is one transition in the pure reducer, so it is proved with no browser.
- It reuses the frame, the icons, the content registry, the wallpaper crop, the tokens and the contrast suite, and adds no dependency and no asset.

**Cons**:

- Two shells exist side by side, so each chrome's behaviour has to be checked against the other from now on.
- A phone loses the desktop's direct shortcuts (the three project folders), so reaching one project costs a tap more.
- A phone visitor never sees the desktop's own arrangement, so the two layouts cannot be compared on one device.

### Option 2: A bottom switcher bar, the dock reduced to icons

The dock stays at the bottom of a phone, shrunk to icon buttons within the reach of a thumb, and tapping one focuses or opens its window. The menu bar keeps only its logo.

**Pros**:

- The smallest change of the four: the dock's own list, marks, magnify and open action already exist, and only the panel's size and layout change.
- Every window stays one tap away while a window is on screen, since the bar never goes away.
- It keeps the desktop's own vocabulary, so nothing new has to be learned or explained.

**Cons**:

- A permanent bar costs the bottom of every screen, which is the scarcest room on a phone and where a browser's own chrome already sits.
- Six or seven icon buttons in one row at 360px leaves each about 44px, so the names have nowhere to live and the tiles become unlabelled pictures.
- It does not answer the desktop items: the three project folders would still be the only way into a specific project, so two vocabularies would share one screen.

### Option 3: A slim bar with a switcher control that opens a full screen list

The bar carries the mark, the clock, the appearance control and one switcher button. Pressing it opens a full screen list naming every window; picking one opens that window and closes the list.

**Pros**:

- The least chrome over the content: nothing sits at the bottom of the screen, and the list is only there when it is wanted.
- A named list is unambiguous to a screen reader and needs no icon vocabulary at all.
- It leaves the widest choice of what the list may contain later.

**Cons**:

- It makes switching two presses rather than one, and the list becomes a place a visitor has to learn.
- An overlay list is a second mechanism to build (its own open state, its own focus handling, its own dismissal), where the other options reuse what exists.
- It answers the switching problem but not the home problem: with a window open, a phone still has no surface that says what else is here.

### Option 4: Squeeze the desktop rather than reshape it

Keep the menu bar and the dock in place on a phone, let the bar's links wrap or scroll, and let the dock's icons shrink until they fit.

**Pros**:

- The cheapest option in code: almost entirely a Tailwind change, with no second shell and no new content.
- Nothing new to learn, because the desktop stays the desktop at every width.

**Cons**:

- The scope explicitly rejects this: on a phone the metaphor is reshaped rather than squeezed.
- It cannot hold the accessibility bar: controls shrink below the 44px floor or the chrome scrolls sideways, and both are already written as failures.
- Windows on top of a scaled down dock leaves almost no content area, which is the opposite of what a recruiter on a phone needs.

## Rationale

Option 1 is chosen because it is the only one that answers the whole problem at once and still fits the project's forces. The problem is not switching between open windows, it is that a phone has no surface on which the app's windows exist. A home surface of tiles is that surface: it names every window, it is where a window's Close returns to, and it is the shape a phone visitor already reads without instruction. Option 2 keeps the dock's own vocabulary but pays for it with a permanent bar and unlabelled icons, which cannot hold a 44px target and a name at 360px. Option 3 needs a second mechanism (an overlay with its own focus and dismissal) to reach a place Option 1 shows by default. Option 4 is the squeeze the scope rules out, and it fails the accessibility bar on the way.

The cost of Option 1 is honest and accepted here: from now on there are two shells, and the suites are what keep them from drifting. The one existing thing deliberately given up is the desktop's shortcut icons, which fold into the Projects tile and the Finder, one tap more expensive on a phone and unchanged on a desktop.

Smaller calls made while writing this spec, with the runner up each time, are these. The content list is named `HOME_APPS` with a `HomeApp` type, paralleling `DOCK_APPS` and `DockApp` rather than inventing a second vocabulary (`PHONE_TILES` was the runner up). A tile carries no icon field, so each window's image stays written down in one place, which is the reason `DOCK_APPS` carries none either (carrying the path on the tile was the runner up). The shell's words live in their own module, `homeLines.ts`, following the one words module per window convention the window bodies already hold (inlining the strings was the runner up). The tile's mark reuses the dock's dot vocabulary, including its quieter parked state, rather than inventing a second indicator (a filled tile for a parked window was the runner up). The exit movement reuses the existing shrink approach with the tile registered as the target, rather than adding a second movement mechanism (`--window-dock-shrink` was chosen over adding `--window-tile-shrink`, and its now misleading name is recorded as debt). The tiles' order puts the work, the resume and the way to reach you first, matching what the desktop items already lead with (the dock's own order was the runner up). And the container's landmark name follows the surface, `Desktop` above the breakpoint and the shell's own word below it, because a phone visitor hearing "Desktop" would be told about a thing they are not using (one name at every width was the runner up).
