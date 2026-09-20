# Verify: window manager · spec 0004 · created 2026-09-20

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

The manager's rules run in the store and are checkable by unit test before any window body exists. Where a step needs a real window body it uses the placeholder spec 0003 ships, and says so.

## Commands

- [x] `npx tsc -b` → clean, with no `any` in `src/store` → AC-1
- [x] `npm run lint` → clean → AC-1
- [x] `npm test` → the store's unit tests pass, covering the cascade, the clamp, the shrink to fit, the focus handoff and the zoom toggle → AC-1, AC-2, AC-7, AC-8, AC-9
- [x] `npm run build` → succeeds, and the built bundle contains GSAP → AC-10
- [x] open the store's tests and confirm they import nothing from `react` and render nothing → AC-1
- [x] search `src/store/**` for `window.`, `document.`, `setTimeout` and `localStorage` → no hit inside the reducer → AC-1
- [x] open `windowLayout` → an entry for each of the nine window ids, each with a `defaultSize` and a `minSize`, and deleting one fails the typecheck → AC-1

## UI / manual

- [x] `npm run dev`, open two windows from the dock → both are visible, the second is focused, and the first stays exactly where it was → AC-2, AC-3
- [x] click inside the lower window → it comes to the top and takes the full frame, while the other goes quiet (softer shadow, muted title, dimmed lights) → AC-3
- [x] click a desktop project icon while the Projects window is already open → the same window is focused and re-targeted to that project, not a second window → AC-2
- [x] click the same dock button twice more → still two windows, and focus moves between the existing ones → AC-2
- [ ] open a text file window and look at its yellow light → it renders disabled, while its red light and its title bar drag still work → AC-6
- [ ] open a link file from a project (an `external` target) → a new tab opens, no window is added, and the focused window is unchanged → AC-1
- [x] drag a window by its title bar → it follows the pointer smoothly, the page does not scroll, and no text is selected → AC-4
- [x] release the drag → the window stays exactly where it was released, and a second drag from there starts from that spot → AC-4
- [x] drag a window hard against each edge and each corner → it stops at the work area, with the whole window still inside it → AC-4
- [x] start a drag and press Escape or switch windows mid drag → the window keeps its last valid position and nothing is left listening → AC-4
- [x] release a drag outside the browser window → the window keeps its last valid position → AC-4
- [x] with a window focused, press each arrow key, then Shift and each arrow → the window steps by the token distance, the page never scrolls, and the larger step is visibly larger → AC-5
- [ ] focus a scrollable part of a window body (the placeholder has none, so use a body with overflow once one lands) and press an arrow key → the body scrolls and the window does not move → AC-5
- [x] press Escape with a window focused → it animates out, leaves, and focus lands on the dock button that opened it → AC-5, AC-8
- [x] click the red light → the same exit movement and the same focus handoff → AC-8
- [x] open two windows, close the top one, then close the last one → focus goes to the window below, then to the dock button, and never to nothing → AC-8
- [x] click the yellow light → the window shrinks toward its own dock button, that button's indicator goes quiet, and focus moves to the window below → AC-6
- [x] click that dock button → the window comes back at the same spot and size, focused and on top → AC-6
- [x] Tab from the top of the page with one window minimised → the minimised window is not in the tab order → AC-6
- [x] click the green light → the window fills the work area and sits flush at its top left corner; click it again → the window returns to its default size from that corner → AC-7
- [x] fill a window, minimise it, then restore it from the dock → it comes back filled → AC-6, AC-7
- [x] drag a window near the bottom right, then resize the browser window smaller → every window comes back inside the work area, and one that no longer fits shrinks without going under its `minSize` → AC-9
- [x] shrink the browser window until the work area is narrower than a window's `minSize` → the window keeps its smallest legal size and overflows from the work area's top left corner, with its title bar still reachable → AC-9
- [x] start a drag, then resize the browser window mid drag → the window re-clamps from the live work area on the next move → AC-4, AC-9
- [x] narrow the window below the compact breakpoint → the focused window fills the work area and its title bar starts no drag → AC-9
- [x] minimise every window → the dock shows the quiet indicator on each, and the desktop is reachable again → AC-6
- [x] set the OS to reduce motion and repeat the open, minimise, close and zoom steps → each reaches its end state with no movement, and no window is left half animated → AC-10
- [x] set the OS to reduce motion, then drag a window → the drag still works, since a drag is not an animation → AC-4, AC-10
- [x] open the document in dark mode and repeat the focus and quiet treatment steps → the quiet window is still distinguishable from the focused one → AC-3

## Values that could be invented

Every row of the spec's Value sourcing table, checked rather than assumed.

- [ ] the window id, key and title from a target → open `textFile:nike-about`, then check the instance's key carries the item and the title bar reads the file name → AC-2
- [x] `defaultSize` → read the rendered window's size and compare against the `windowLayout` entry for that id → AC-2
- [x] the spawn position → open three windows and confirm each steps by the cascade token from the one before, wrapping inside the work area → AC-2
- [x] the stacking number → open three windows and read the store's counter through the React devtools, or the `z` on each frame → AC-1, AC-3
- [x] the focused key → the focused window is the one with the largest `z` among the visible ones, checked after a click and after a minimise → AC-3
- [x] the position during a drag → watch the element's `transform` while the pointer moves, then the committed state on release → AC-4
- [x] the clamp bounds → the edge drag steps above → AC-4, AC-9
- [x] the arrow step distance → open the token layer, confirm `--window-nudge-step` and its larger pair exist and are what the component reads → AC-5
- [x] the minimised window's dock target → minimise a window with two open and confirm it shrinks toward its own button, not the first one → AC-6
- [x] the restored geometry → the restore step above → AC-6
- [x] the filled size and spot → the green light steps above → AC-7
- [ ] where focus goes on close → the handoff steps above, including the case where the opener was another window that has since closed → AC-8
- [x] the shrink to fit size → the resize step above, then read the size against the work area and the layout `minSize` → AC-9
- [x] the durations and easings → in the console, `(await import('/src/lib/motion.ts')).readMotionToken('base')` under reduced motion returns 0, and no component holds its own millisecond value → AC-10

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

## Added by /develop, 2026-09-20

The strands these steps cover were missing when `/check verify` ran earlier that day, which is why
it ticked nothing above. Every step here is one the build now passes.

### Commands

- [x] `npm test` → 166 tests pass, with `src/store/windowManager.test.ts` covering the dock, the
      green light, the handoff chain, the shrink to fit and the compact fill; `ManagedWindow.test.tsx`
      covering the quiet treatment, the three lights and Escape; and `tokens.test.ts` holding both
      window shadows → AC-3, AC-6, AC-7, AC-8, AC-9
- [x] `npx playwright test e2e/window-manager.spec.ts` → 12 checks pass in Chromium, including the
      quiet treatment, minimise and restore, the handoff to the dock button, the green light, Escape,
      reduced motion and the compact fill → AC-3, AC-6, AC-7, AC-8, AC-9, AC-10
- [x] `npm run build` → succeeds, and `dist/assets/*.css` holds `--shadow-window-quiet`,
      `--window-dock-shrink` and `window-quiet`, so the quiet treatment is in the shipped stylesheet
      and not only in the dev server → AC-3, AC-6

### UI / manual

- [x] open two windows and compare their title bars → the lower one has a softer shadow and a muted
      title, its three lights are dimmed rather than recoloured, and a press on it swaps the two over → AC-3
- [x] Tab into the controls of the quiet window → that window takes the keyboard and the treatment
      swaps → AC-3
- [x] press the yellow light of a window with a dock button → it shrinks toward its own dock button,
      and the keyboard lands on the window underneath, or on that dock button when nothing is left → AC-6
- [x] press that dock button → the window grows back from the button, at the geometry it left with,
      holding the keyboard and on top → AC-6
- [x] press the yellow light of a text file, the resume or an image window → its yellow light is
      disabled, because there is no dock button to come back from → AC-6
- [x] start a drag, then press Escape without releasing → the window keeps the spot the pointer had
      reached and then leaves → AC-4, AC-8
- [x] press Escape, then press Escape on a key that is already leaving → one window is removed and
      the keyboard lands somewhere reachable, never on nothing → AC-8
- [x] narrow the browser below 40rem, open a window, then drag its title bar → the focused window
      fills the work area and the drag moves nothing → AC-9
- [x] resize the browser until the work area is narrower than a window's `minSize` → the window keeps
      its smallest legal size, overflowing from the work area's top left corner → AC-9
- [x] set the OS to reduce motion and repeat open, fill, minimise, restore and close → each reaches
      its end state at once, with no window left half animated → AC-10

### Acceptance-criteria coverage

- AC-3 → the quiet treatment steps and both window shadows in `tokens.test.ts` · AC-4 → the mid drag
  close step, on top of the drag steps above · AC-6 → the minimise, restore and disabled yellow light
  steps · AC-7 → the green light steps above · AC-8 → the Escape and handoff steps · AC-9 → the
  compact and `minSize` steps, plus the resize clamp e2e check · AC-10 → the reduce motion steps and
  the built stylesheet command

## Two rows to read rather than trust

- [x] read the reducer for a path that changes `position` without the clamp. The edge drag steps only exercise the paths they call, and a future action could write a position directly → AC-4, AC-9
- [ ] read the frame's effects for a timeline that is not reverted on unmount, since `StrictMode`'s double invoke passes as long as the cleanup exists, not because it was exercised → AC-10

## The moving thread, added by /develop on 2026-09-20

The rows above were written when the spec was captured, and they describe the whole feature. The
drag and the arrow keys landed on 2026-09-20, so the rows that exercise moving are now live: the
title bar drag, the drag past each edge, the drag released outside, the arrow keys with Shift, the
page not scrolling, the arrow inside a scrollable body, and the drag that meets a work area change.
The rows waiting on a later strand (Escape, the exit timeline, the focus handoff, the quiet
treatment, the lights beyond the red one, the dock link, the zoom, the shrink to fit, the compact
fill and reduced motion) stay unticked until that strand lands.

What the moving thread built, in the order a check can reach it:

### Commands

- [x] `npx tsc -b` → clean, with no `any` in `src/store` → AC-1
- [x] `npm run lint` → clean → AC-1
- [x] `npm test` → 87 tests pass, including the clamp, the clamped spawn, the work area change, the drag gesture and the arrow rules → AC-1, AC-4, AC-5, AC-9
- [x] `npm run test:e2e` → 22 pass, five of them the moving thread, in a real browser → AC-4, AC-5, AC-9
- [x] search `src/store/windowManager.ts` for `document.`, `getComputedStyle`, `setTimeout`, `requestAnimationFrame` and `localStorage` → no hit, so the reducer reads no DOM, sets no timer and writes no storage. A search for `window.` does hit, on the full stop at the end of a comment that says "window", which is why this row names the calls instead → AC-1
- [x] read `src/index.css`, `src/lib/measure.ts`, `src/components/useWindowMove.ts` and `src/store/WindowManagerProvider.tsx` → the three window measures are declared as tokens, named by `MeasureToken`, and read at the edge (the provider reads the cascade distance, the move reads the two steps), so no geometry value is a literal in the reducer, and the values carry no unit because a custom property keeps the unit it was written with → AC-2, AC-5

### UI / manual

- [x] `npm run dev`, open two windows from the dock, then drag the top one by its title bar → it follows the pointer smoothly, the page does not scroll and no text is selected → AC-4
- [x] release the drag → the window stays exactly where it was released, and a second drag from there starts from that spot → AC-4
- [x] drag a window hard against each edge and each corner → it stops at the work area with the whole window still inside it → AC-4, AC-9
- [x] drag from the window body, and from one of the three lights → nothing moves, and a press on the body still focuses that window → AC-3, AC-4
- [x] click a window body, then press each arrow key, then Shift with each arrow → it steps by the token distance, the larger step is visibly larger, and the page never scrolls → AC-5
- [x] watch the element while the pointer moves → the transform changes per event and the committed `left` and `top` only move once, on release → AC-4
- [x] start a drag and take the pointer away with the window still in reach of the edge → the window keeps the last valid spot → AC-4
- [x] park a window near the bottom right, then shrink the browser window → it comes back inside the work area → AC-9
- [x] shrink the browser window until the work area is narrower than the window → the window keeps its size and sits at the work area's top left corner, with its title bar still reachable (the shrink to fit floor and the compact fill are a later strand) → AC-9
- [ ] open a window whose body scrolls once a window with real scrolling content lands, focus the body, press an arrow → the body scrolls and the window does not move → AC-5

### One row that cannot be reached yet

- [x] press Escape with a window focused → nothing happens today, because the exit timeline and the focus handoff are the next strand on this row → AC-5, AC-8

### What this thread covers

- AC-4 … the drag rows and the gesture tests in `src/components/useWindowMove.test.tsx`, plus the title bar and clamp rows in `e2e/window-manager.spec.ts`
- AC-5 … the arrow key rows, the scrollable body row, and the keyboard tests in both unit files. Escape is AC-8's and is still open
- AC-9 … the work area rows, the clamped spawn, and the shrink row in `e2e/window-manager.spec.ts`
- AC-1, AC-2 … the model rows, the cascade token row, and the store tests, which run with no DOM and no render
- AC-3 … only the part a move needs (a press focuses the window, and a Tab into its controls focuses it). The quiet treatment and its contrast pairs are still open
- AC-6, AC-7, AC-8, AC-10 … not exercised by this thread, and unticked above
