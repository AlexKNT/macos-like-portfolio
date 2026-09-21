# src/store

The window manager: the state of every open window, held as immutable data in a pure reducer, plus the React edge that keeps it alive. Nothing here renders a window, and nothing here touches the DOM directly: a component asks for an action, the store decides, and the caller paints the result.

Governing specs: [`0004-window-manager`](../../docs/specs/0004-window-manager/index.md) for the model and its rules, [`0003-desktop-shell`](../../docs/specs/0003-desktop-shell/index.md) for the shell that reads it, [`0009-mobile-app-switcher-shell`](../../docs/specs/0009-mobile-app-switcher-shell/index.md) for the phone's own rule and the history entry it keeps.

## Files

- `windowManager.ts`: the model and every rule, with no React in it. `WindowInstance` (key, windowId, title, target, position, size, status, filled, z, opener), `WINDOW_LAYOUT` (the `defaultSize` and `minSize` of all nine windows), `clampPosition`, `focusedKeyOf`, `windowGeometry`, `focusHopAfter`, `hasDockButton`, `hasHomeTile`, `resolveOpenTarget`, and `reduceWindowManager` with `createWindowManagerState` (the state a layout is handed when it is created), `EMPTY_WINDOW_MANAGER` and the action union. Below the compact breakpoint the same reducer closes every instance a new window does not come from or find parked, so a phone keeps one window on screen.
- `WindowManagerProvider.tsx`: holds the state, dispatches the actions and publishes the manager. It reads the compact breakpoint once, before its first render, so a phone renders the phone shell on its first frame rather than swapping to it. It renders `WindowElementsProvider` inside itself, so a tree with the manager has the element registry too.
- `useWindowManager.ts`: the `WindowManager` type (the state plus open, focus, close, move, minimise, restore, zoom, setWorkArea and setCompact) and the hook. The hook throws when there is no provider above, because that is a wiring mistake rather than a state to paper over.
- `windowElements.ts`, `WindowElementsProvider.tsx`, `useWindowElements.ts`: the elements the reducer cannot own (dock buttons and home tiles by window id, frames by key, the desktop), so a pure model can still say where a window came from, where focus goes back to, and what a window's movement travels to and from.
- `useWorkArea.ts`: a ResizeObserver on the desktop container, reporting the box through `setWorkArea` and the compact breakpoint through `setCompact`, plus `COMPACT_QUERY` (the one width any module compares) and `readCompactLayout`, the pure read the provider takes its first state from.
- `useShellHistory.ts`: the phone's own entry in the browser's history, one while a window is on screen and none at home, reconciled on every transition so the count can never drift from the manager. `historyStepFor` is the pure rule it follows; a back press closes the window on screen through the same action Close calls, and the hook is gated on the compact layout, so the desktop writes no history.

## Conventions

- The reducer is pure: same state and action, same next state. Measuring, moving focus and reading a token all happen at the edge, in a provider or a hook.
- A value the shell knows at creation is passed into the state rather than read inside the reducer: the compact layout arrives as `createWindowManagerState`'s argument, so the model never touches the document.
- A rule that needs a value from outside the state takes it in the action payload. `open` carries its `cascadeStep` and the geometry actions carry pixels, so the reducer reads no CSS token itself.
- Never export the hook from a file that exports the provider. `react-refresh/only-export-components` fails that, which is why the context, the type and the hook each live in a module of their own.
- Give sibling modules names that differ by more than letter case. `WindowManager.tsx` beside `windowManager.ts` breaks the build on Windows (TS1149), so a new module here gets a distinct word rather than a recased one.
- Geometry is pixels in the work area's space, and it is clamped there. The store never sets a CSS position: it hands the numbers to the frame that paints them.
- A measure a script reads is written unitless (`--window-nudge-step: 16`). A custom property keeps the unit it was written with, so `readMeasureToken` would read `2rem` as 2.

_Drafted by /sync from the introducing change, worth a quick human pass._
