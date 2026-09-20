# src/store

The window manager: the state of every open window, held as immutable data in a pure reducer, plus the React edge that keeps it alive. Nothing here renders a window, and nothing here touches the DOM directly: a component asks for an action, the store decides, and the caller paints the result.

Governing specs: [`0004-window-manager`](../../docs/specs/0004-window-manager/index.md) for the model and its rules, [`0003-desktop-shell`](../../docs/specs/0003-desktop-shell/index.md) for the shell that reads it.

## Files

- `windowManager.ts`: the model and every rule, with no React in it. `WindowInstance` (key, windowId, title, target, position, size, status, filled, z, opener), `WINDOW_LAYOUT` (the `defaultSize` and `minSize` of all nine windows), `clampPosition`, `focusedKeyOf`, `windowGeometry`, `focusHopAfter`, `hasDockButton`, `resolveOpenTarget`, and `reduceWindowManager` with `EMPTY_WINDOW_MANAGER` and the action union.
- `WindowManagerProvider.tsx`: holds the state, dispatches the actions and publishes the manager. It renders `WindowElementsProvider` inside itself, so a tree with the manager has the element registry too.
- `useWindowManager.ts`: the `WindowManager` type (the state plus open, focus, close, move, minimise, restore, zoom, setWorkArea and setCompact) and the hook. The hook throws when there is no provider above, because that is a wiring mistake rather than a state to paper over.
- `windowElements.ts`, `WindowElementsProvider.tsx`, `useWindowElements.ts`: the elements the reducer cannot own (dock buttons by window id, frames by key, the desktop), so a pure model can still say where a window came from and where focus goes back to.
- `useWorkArea.ts`: a ResizeObserver on the desktop container, reporting the box through `setWorkArea` and the compact breakpoint through `setCompact`.

## Conventions

- The reducer is pure: same state and action, same next state. Measuring, moving focus and reading a token all happen at the edge, in a provider or a hook.
- A rule that needs a value from outside the state takes it in the action payload. `open` carries its `cascadeStep` and the geometry actions carry pixels, so the reducer reads no CSS token itself.
- Never export the hook from a file that exports the provider. `react-refresh/only-export-components` fails that, which is why the context, the type and the hook each live in a module of their own.
- Give sibling modules names that differ by more than letter case. `WindowManager.tsx` beside `windowManager.ts` breaks the build on Windows (TS1149), so a new module here gets a distinct word rather than a recased one.
- Geometry is pixels in the work area's space, and it is clamped there. The store never sets a CSS position: it hands the numbers to the frame that paints them.
- A measure a script reads is written unitless (`--window-nudge-step: 16`). A custom property keeps the unit it was written with, so `readMeasureToken` would read `2rem` as 2.

_Drafted by /sync from the introducing change, worth a quick human pass._
