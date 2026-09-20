# Verify: window manager · spec 0004 · created 2026-09-20

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

The manager's rules run in the store and are checkable by unit test before any window body exists. Where a step needs a real window body it uses the placeholder spec 0003 ships, and says so.

## Commands

- [ ] `npx tsc -b` → clean, with no `any` in `src/store` → AC-1
- [ ] `npm run lint` → clean → AC-1
- [ ] `npm test` → the store's unit tests pass, covering the cascade, the clamp, the shrink to fit, the focus handoff and the zoom toggle → AC-1, AC-2, AC-7, AC-8, AC-9
- [ ] `npm run build` → succeeds, and the built bundle contains GSAP → AC-10
- [ ] open the store's tests and confirm they import nothing from `react` and render nothing → AC-1
- [ ] search `src/store/**` for `window.`, `document.`, `setTimeout` and `localStorage` → no hit inside the reducer → AC-1
- [ ] open `windowLayout` → an entry for each of the nine window ids, each with a `defaultSize` and a `minSize`, and deleting one fails the typecheck → AC-1

## UI / manual

- [ ] `npm run dev`, open two windows from the dock → both are visible, the second is focused, and the first stays exactly where it was → AC-2, AC-3
- [ ] click inside the lower window → it comes to the top and takes the full frame, while the other goes quiet (softer shadow, muted title, dimmed lights) → AC-3
- [ ] click a desktop project icon while the Projects window is already open → the same window is focused and re-targeted to that project, not a second window → AC-2
- [ ] click the same dock button twice more → still two windows, and focus moves between the existing ones → AC-2
- [ ] open a text file window and look at its yellow light → it renders disabled, while its red light and its title bar drag still work → AC-6
- [ ] open a link file from a project (an `external` target) → a new tab opens, no window is added, and the focused window is unchanged → AC-1
- [ ] drag a window by its title bar → it follows the pointer smoothly, the page does not scroll, and no text is selected → AC-4
- [ ] release the drag → the window stays exactly where it was released, and a second drag from there starts from that spot → AC-4
- [ ] drag a window hard against each edge and each corner → it stops at the work area, with the whole window still inside it → AC-4
- [ ] start a drag and press Escape or switch windows mid drag → the window keeps its last valid position and nothing is left listening → AC-4
- [ ] release a drag outside the browser window → the window keeps its last valid position → AC-4
- [ ] with a window focused, press each arrow key, then Shift and each arrow → the window steps by the token distance, the page never scrolls, and the larger step is visibly larger → AC-5
- [ ] focus a scrollable part of a window body (the placeholder has none, so use a body with overflow once one lands) and press an arrow key → the body scrolls and the window does not move → AC-5
- [ ] press Escape with a window focused → it animates out, leaves, and focus lands on the dock button that opened it → AC-5, AC-8
- [ ] click the red light → the same exit movement and the same focus handoff → AC-8
- [ ] open two windows, close the top one, then close the last one → focus goes to the window below, then to the dock button, and never to nothing → AC-8
- [ ] click the yellow light → the window shrinks toward its own dock button, that button's indicator goes quiet, and focus moves to the window below → AC-6
- [ ] click that dock button → the window comes back at the same spot and size, focused and on top → AC-6
- [ ] Tab from the top of the page with one window minimised → the minimised window is not in the tab order → AC-6
- [ ] click the green light → the window fills the work area and sits flush at its top left corner; click it again → the window returns to its default size from that corner → AC-7
- [ ] fill a window, minimise it, then restore it from the dock → it comes back filled → AC-6, AC-7
- [ ] drag a window near the bottom right, then resize the browser window smaller → every window comes back inside the work area, and one that no longer fits shrinks without going under its `minSize` → AC-9
- [ ] shrink the browser window until the work area is narrower than a window's `minSize` → the window keeps its smallest legal size and overflows from the work area's top left corner, with its title bar still reachable → AC-9
- [ ] start a drag, then resize the browser window mid drag → the window re-clamps from the live work area on the next move → AC-4, AC-9
- [ ] narrow the window below the compact breakpoint → the focused window fills the work area and its title bar starts no drag → AC-9
- [ ] minimise every window → the dock shows the quiet indicator on each, and the desktop is reachable again → AC-6
- [ ] set the OS to reduce motion and repeat the open, minimise, close and zoom steps → each reaches its end state with no movement, and no window is left half animated → AC-10
- [ ] set the OS to reduce motion, then drag a window → the drag still works, since a drag is not an animation → AC-4, AC-10
- [ ] open the document in dark mode and repeat the focus and quiet treatment steps → the quiet window is still distinguishable from the focused one → AC-3

## Values that could be invented

Every row of the spec's Value sourcing table, checked rather than assumed.

- [ ] the window id, key and title from a target → open `textFile:nike-about`, then check the instance's key carries the item and the title bar reads the file name → AC-2
- [ ] `defaultSize` → read the rendered window's size and compare against the `windowLayout` entry for that id → AC-2
- [ ] the spawn position → open three windows and confirm each steps by the cascade token from the one before, wrapping inside the work area → AC-2
- [ ] the stacking number → open three windows and read the store's counter through the React devtools, or the `z` on each frame → AC-1, AC-3
- [ ] the focused key → the focused window is the one with the largest `z` among the visible ones, checked after a click and after a minimise → AC-3
- [ ] the position during a drag → watch the element's `transform` while the pointer moves, then the committed state on release → AC-4
- [ ] the clamp bounds → the edge drag steps above → AC-4, AC-9
- [ ] the arrow step distance → open the token layer, confirm `--window-nudge-step` and its larger pair exist and are what the component reads → AC-5
- [ ] the minimised window's dock target → minimise a window with two open and confirm it shrinks toward its own button, not the first one → AC-6
- [ ] the restored geometry → the restore step above → AC-6
- [ ] the filled size and spot → the green light steps above → AC-7
- [ ] where focus goes on close → the handoff steps above, including the case where the opener was another window that has since closed → AC-8
- [ ] the shrink to fit size → the resize step above, then read the size against the work area and the layout `minSize` → AC-9
- [ ] the durations and easings → in the console, `(await import('/src/lib/motion.ts')).readMotionToken('base')` under reduced motion returns 0, and no component holds its own millisecond value → AC-10

## Acceptance-criteria coverage

- AC-1 → the typecheck, the store test commands, the purity search and the `windowLayout` read
- AC-2 → the two window steps, the repeated open step and the spawn position row
- AC-3 → the click through step, the dark mode step and the `z` read
- AC-4 → the drag steps, the edge clamp, the interruption steps and the transform row
- AC-5 → the arrow key step and the Escape step
- AC-6 → the minimise, restore and tab order steps, plus the fill then minimise step
- AC-7 → the green light steps and the restore a filled window step
- AC-8 → the close, handoff and mid animation steps
- AC-9 → the browser resize step and the compact step
- AC-10 → the reduce motion steps and the build command

## Two rows to read rather than trust

- [ ] read the reducer for a path that changes `position` without the clamp. The edge drag steps only exercise the paths they call, and a future action could write a position directly → AC-4, AC-9
- [ ] read the frame's effects for a timeline that is not reverted on unmount, since `StrictMode`'s double invoke passes as long as the cleanup exists, not because it was exercised → AC-10
