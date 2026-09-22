# src/components

The shell: everything around and between the window bodies. The desktop surface, the layer every open window sits on, the menu bar and the dock, the phone's slim bar and home surface, and the one frame every window is drawn in. Nothing here decides what a window holds (that is `#windows`) or where it sits (that is `#store`): a component asks the manager for an action and paints the answer it is handed.

Governing specs: [`0002-design-system-window-chrome`](../../docs/specs/0002-design-system-window-chrome/index.md) for the frame and the tokens it paints with, [`0003-desktop-shell`](../../docs/specs/0003-desktop-shell/index.md) for the bar, the desktop and the dock, [`0004-window-manager`](../../docs/specs/0004-window-manager/index.md) for the movement, the focus handoff and the quiet treatment, [`0009-mobile-app-switcher-shell`](../../docs/specs/0009-mobile-app-switcher-shell/index.md) for the slim bar, the home surface and the tile a phone window travels to, and [`0013-sound-effects`](../../docs/specs/0013-sound-effects/index.md) for the switch in both bars and the dock's hover.

## Files

- `Window.tsx`: the frame every window is built in. The rounded shell, the window shadow, the title bar with the three lights and the `leading` and `trailing` slots, and the `aria-labelledby` that names the region. It sets neither `position` nor `z-index`.
- `WindowControls.tsx`: the three lights, each a button whose accessible name is built from the window title (`Close Projects`). A light with no handler renders `disabled`, so the desktop never presents a control that does nothing.
- `ManagedWindow.tsx`: one instance bound to the manager. It writes the geometry in pixels, picks the body and the window's own title bar controls and scope from the `#windows` registry, renders those controls into the frame's `leading` and `trailing` slots, and hides a window that is minimised or covered.
- `useWindowFrame.ts`: a window's behaviour. The exit, the shrink toward the dock or a tile, the movement back from it, Escape to close, and the entrance of a window that was created on a phone.
- `useWindowMove.ts`: the drag on the title bar and the arrow keys, both ending in the manager's one `move` action.
- `windowFocus.ts`: the DOM end of the focus handoff. `windowExit.ts`: the tile a phone window grows from and shrinks back into. Both are pure, and both take the element registry as an argument.
- `WindowLayer.tsx`: one `ManagedWindow` per instance, on a layer that takes no pointer events.
- `Desktop.tsx`: the one container between the bar and the dock band. It measures the work area and hands it to the manager, registers itself as the desktop for the focus handoff, and holds the home surface or the greeting with the desktop items.
- `Dock.tsx`, `DockButton.tsx`: the dock band, the magnify written straight onto the icons, one app button with its dot, its tooltip and the hover that plays the desk's tick, and the registration a window minimises toward.
- `Navbar.tsx`, `MenuBarIcon.tsx`, `PhoneBar.tsx`, `Clock.tsx`: the menu bar, one icon control in it (which is also where the desk's sound switch lives, read from `#sound` and rendered as a `switch` so the state is spoken rather than written into the name), the phone's slim bar, and the one live clock both bars read.
- `HomeSurface.tsx`, `HomeTile.tsx`, `homeLines.ts`: the phone's home surface, one tile on it, and the one word the phone shell invents.
- `Greeting.tsx`, `DesktopIcon.tsx`: the greeting, which is the page's one heading, and one item on the wallpaper.
- `phoneShell.test.tsx`: the baseline the phone shell's own modules are held to, read off the files rather than one case at a time. It is the shape a new shell module is checked with.

## Conventions

- Every way into a window calls the manager's one `open` action and records where the request came from (`{ kind: 'bar' }`, `{ kind: 'dock' }`, `{ kind: 'desktop' }`, `{ kind: 'home' }`). That is what opens a window once rather than twice, and what lets focus be handed back to the control that asked.
- The words and the targets come from the content layer (`#content/shell`, `#content/desktop`, `#content/windows`). No control here carries a list or a label of its own.
- A component that owns an element a movement needs registers it in the store's registry (`registerDockButton`, `registerHomeTile`, `registerDesktop`, `registerFrame`) through a `useCallback` ref. Nothing here queries the document, which is what keeps the frame free of the DOM.
- Colour comes from tokens only: no colour literal and no palette utility, anywhere. `phoneShell.test.tsx` reads the shell's modules off the disk and fails the suite on either.
- A window that is closed is unmounted. A window that is minimised, or covered on a phone, stays in the tree and is hidden with `hidden` (`display: none`), which keeps it out of the tab and stacking orders while leaving an element for the movement back to play on.
- The chrome swaps by not being mounted rather than by being hidden. `Shell` in `src/App.tsx` renders `PhoneBar` or `Navbar`, and `Dock` or nothing, so a phone carries no desk controls to reach by accident.
- Movement is written straight to the element with GSAP and told to the manager when it lands, so the store is briefly behind the screen and every path ends in a dispatch rather than starting with one.
- An effect of the whole desk rather than of one control reads the manager's state and asks the provider for the answer, which is why the sound switch and the dock's hover ask `#sound` for the choice and no control keeps a copy of it. `ShellProviders` in `src/test/shell.tsx` mounts that pair in the order `App` does, so a suite that renders one of these controls names it once.
- Timing comes from the tokens (`readMotionToken`, `readEaseToken`, `readMeasureToken`), never from a literal in a component, so reduced motion needs no second code path.
- A file that exports a component never exports a hook as well, which is why `useWindowFrame.ts` and `useWindowMove.ts` are modules of their own.

## Gotchas

- A drag is a transform written to the element, so a pointer event costs no React render and only the release commits a position. Do not move it into state.
- The magnify cannot use a GSAP quick setter on `scale`: `scale` is a shorthand and a quick setter cannot drive one, so `Dock.tsx` drives the two axes and wraps them back into one call.
- Tailwind writes a lift to the `translate` property rather than to `transform`, so a check that reads `transform` sees nothing happen.
- A window the desktop already had does not animate in when the viewport narrows into the phone layout. `useWindowFrame` gates the entrance on the layout the frame was created into, so the movement is not played over a window that was already on screen.
- A phone paints one window: the focused instance takes the work area's own box and every other live one is hidden, so the desktop's own windows survive a resize into the compact layout and come back at their stored geometry when it widens.
- The home surface is hidden while a window is on screen, not unmounted, because a tile has to keep the box a window grows from and shrinks back into. Pressing a second tile is therefore not possible on a phone, and the one window rule is checked in the reducer instead.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
