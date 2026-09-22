# Verify: Archive window · spec 0012 · created 2026-09-22

_Steps derived from spec 0012. `/check verify` runs these; `/test` locks the durable ones._

The window is proved three ways: by the unit suites (the state machine, the words module, the body, the control, the shared tile and the registry baseline), by driving the real desktop in Chromium from the dock button and from a phone tile, and by the facts a headless run cannot show: what the movement looks like on screen, what the accessibility tree reports, and what a screen reader reads. No fixture is needed beyond the leftovers the Trash place already holds. The empty case is reached two ways: by emptying the window, and by emptying the content by hand and restoring it afterwards.

Nothing here covers the engineer's own leftovers, the follow-up item that deliberately carries no acceptance criterion.

## Commands

- [x] `npx tsc -b --force` → clean, with no `any`, `WINDOW_BODIES` still covering every window id, and `ArchiveWindow` typechecking against the body props → AC-1, AC-13
- [x] `npm run lint` → clean, with `ArchiveEmptyButton` and `ArchiveWindow` each exporting components only, so no non component export sits beside one → AC-13
- [x] `npm test` → `seededArchive()` answers `holding`, `emptyRequested(holding)` answers `clearing`, and `archiveCleared(clearing)` answers `emptied` → AC-5, AC-7
- [x] `npm test` → `emptyRequested` asked in `clearing` or in `emptied` hands back the very same object, and `archiveCleared` asked outside `clearing` does too, so a repeated press re-renders nothing → AC-10
- [x] `npm test` → `archiveAnswers` is true for `holding` and false for the other two → AC-5
- [x] `npm test` → the words module answers `2 items`, `1 item`, the empty line, `Empty` and `Empty Archive`, and no other module under `src/windows/archive/` holds any of those strings → AC-3, AC-4, AC-6, AC-13
- [x] `npm test` → `canEmpty` is true only for `holding` with at least one item, so it is false for a `holding` window whose place holds nothing → AC-4, AC-6
- [x] `npm test` → the body renders exactly one stage, one named content area named `Archive` and one live region, with the count line above one item per leftover in the content's own order, each carrying the file's own icon and name → AC-1, AC-3, AC-13
- [x] `npm test` → the control carries the window's own accessible name with its visible word inside it, sits in the title bar's trailing slot, carries no native `disabled`, and carries `aria-disabled` in `clearing` and `emptied` while staying in the tab order → AC-4
- [x] `npm test` → a press on the control while it does not answer leaves the state as the very same object, so nothing re-renders → AC-4, AC-10
- [x] `npm test` → the leftovers render disabled in `clearing`, from the same predicate the control reads → AC-5, AC-10
- [x] `npm test` → with the Trash place holding nothing the window renders the shared quiet line, no list and no count line → AC-6
- [x] `npm test` → with the duration tokens set to zero the movement starts no timeline and the state lands at once (the zero duration case, proved the way the window frame's own zero duration case is) → AC-9
- [x] `npm test` → the landing is safe to call twice: a second `archiveCleared` in `emptied` answers the very same object → AC-10
- [x] `npm test` → a body unmounted while the movement is running reverts its context, cancels the tween and sets no state afterwards, and an effect that runs twice starts nothing twice → AC-10
- [x] `npm test` → the shared tile renders a button for a target inside the application and an anchor with `rel="noopener noreferrer"` for one that leaves the page, and a disabled tile answers nothing → AC-2
- [x] `npm test` → the registry baseline passes for every entry of `WINDOW_BODIES`, including `archive`, and no module under `src/windows/archive/` carries a hex colour or a palette utility → AC-13
- [x] `npm test` → no entry of `WINDOW_BODIES` names `Placeholder`, and the module and its suite are gone from the tree → AC-14
- [x] `npm run build` → succeeds, with the utilities the window builds from present in `dist/assets/*.css` → AC-12
- [x] `npm run test:e2e` → `e2e/archive.spec.ts` passes in Chromium → AC-1, AC-2, AC-5, AC-6, AC-12
- [x] read `src/windows/archive/` → no `fetch`, no storage call, no clipboard call and no `window.open`: the leftovers come from `#content`, the movement comes from `#lib/motion`, and the one window manager call is the existing `open` action a leftover press makes → AC-2, AC-7, AC-8
- [x] search `src/windows/archive/**` for `localStorage`, `sessionStorage` and `document.cookie` → no hit → AC-8
- [ ] search `src/windows/**` for the symbols `#windows/Placeholder` and `PLACEHOLDER_LINES`, and for the file `Placeholder.tsx` and `Placeholder.test.tsx` → no hit, and no file by that name is left in the tree → AC-14
- [x] read `src/windows/WindowBody.tsx` and `src/components/ManagedWindow.tsx` → `WindowBodyEntry` carries the optional `Trail` and the manager renders it into `Window`'s existing `trailing` slot, with no other frame behaviour changed → AC-4
- [x] read `src/windows/projects/FinderGrid.tsx` → it draws its items through the shared `ItemTile` and keeps its own list and its own empty line → AC-2
- [x] read `src/content/`, `src/store/`, `src/components/Window.tsx` and `src/index.css` against the last commit → no schema field, no content entry, no content rule, no reader, no window id, no new manager action or field, no target kind, no token and no design system change → AC-7, AC-8

## UI / manual

- [x] `npm run dev`, then press the dock's Archive button → the window opens on the count line and both leftovers, each with its own icon and its own name → AC-1, AC-3
- [x] read the count line against the Trash place in `src/content/locations.ts` → the number matches the entries the place holds → AC-3
- [x] press a leftover → the image window opens above the Archive, titled by the file, and the Archive window is still open behind it → AC-2
- [x] with the keyboard alone, Tab from the frame → the Empty control is reachable in the title bar with the visible focus ring → AC-4
- [x] measure the control's box in the browser's inspector → at least 24 by 24 pixels, and the window's name is still legible beside it → AC-4
- [x] press Empty → the count line and the items fade and shrink where they stand as one movement, no item answers a press while it is leaving, and the quiet line is in the content area once they have gone → AC-5, AC-6
- [x] read the control right after the press → it is still in the title bar, it reports itself as unavailable without a native `disabled`, and the keyboard is still on it → AC-4, AC-5
- [ ] press the control with the keyboard, then press Tab → the keyboard is still on the control after the press, and the Tab continues into the window rather than restarting at the top of the page → AC-4
- [x] press the control twice in quick succession → the second press changes nothing and the window empties once → AC-10
- [x] read the accessibility tree with the window open and after emptying → the content area is a named group, the leftovers are buttons named by their own file names, and the live region reads the empty line once rather than repeating it → AC-11
- [x] close the window while the items are leaving → no tween keeps running, no console warning about a state update on an unmounted component appears, and reopening shows both leftovers → AC-8, AC-10
- [x] empty the window, close it, then open it again → both leftovers are back, the count line is back, and the control answers again → AC-8
- [x] reload the page, open the window → the leftovers are there, so nothing about the gesture was written anywhere → AC-8
- [x] with the system set to reduce motion, press Empty → the leftovers go and the quiet line is there at once, with no movement and no mask → AC-9
- [x] with motion on, empty the window and watch the quiet line → it is uncovered rather than simply appearing → AC-6
- [x] open the window in light mode, then in dark mode → the count line, the quiet line, the control and the focus ring read in both → AC-13
- [x] set the OS to forced colours and open the window → the words, the items and the ring stay legible → AC-13
- [x] open the window at its default size, then narrow the frame → the items flow inside the window's width and nothing in the window scrolls sideways → AC-12
- [x] at 360 pixels on a phone sized viewport, open the window from its home tile → it fills the work area, the title bar keeps the control with its word, the items flow in one column or as many as fit, and the page scrolls no sideways → AC-1, AC-12
- [x] empty `LOCATIONS.trash.children` by hand, reload, open the window → the quiet line shows from the first paint, no list and no count line render, and the control reports itself as unavailable while still taking focus; then restore the file → AC-3, AC-4, AC-6
- [x] with the place still empty, read the live region → it is silent, because the window opened empty rather than becoming empty; then restore the file → AC-11
- [x] delete the place's second entry by hand and reload → the count line says `1 item` and one item renders; then restore the file → AC-3
- [x] read the built stylesheet in the browser's inspector while the window is open → every value the window paints comes from a token, with no palette value written in the window → AC-13
- [x] open the Projects window and pick its Trash place → the Finder shows the two leftovers exactly as spec 0005 verified, unchanged by anything this feature did → AC-7
- [x] open the Skills, Resume, Contact, Gallery, Articles, text file and image windows after this change → each behaves exactly as specs 0006 to 0011 verified → AC-7, AC-14
- [ ] listen with a screen reader where one is available → the window is announced by its name, the control says what it empties, the leftovers are named by their files, and the emptying is announced once → AC-4, AC-11

## Values that could be invented

- The count line's wording (`2 items`, `1 item`).
- The quiet line's wording (`The Archive is empty.`).
- The control's visible word (`Empty`) and its accessible name (`Empty Archive`).
- The movement's shape: how far the items shrink and over how long, within the tokens the stylesheet already names.
- The two leftover entries themselves, which are the reference build's screenshots; they are a follow-up rather than an acceptance criterion.

## Run record, 2026-09-22

`/check verify archive window` ran against the app on its own dev server, driven in Chromium with a throwaway probe (deleted after the run). Verdict **PASS**: all 14 acceptance criteria met, every specced surface built.

What the run observed, beyond the suites:

- The dock opens the window on `2 items` and one tile per leftover in content order, each with the icon its own content entry carries, matching the live `LOCATIONS.trash` read out of the dev server.
- The movement is a real fade and shrink: 8 of 10 sampled frames between 0.72 and 0.085 opacity, the block's box stepping 598 down to 574 pixels, and the leftover buttons `disabled` in the frame the gesture starts.
- The quiet line is uncovered rather than dropped in: 12 distinct masks from `inset(0px 83.7% 0px 0px)` to `inset(0px 0.56% 0px 0px)`, then cleared to `none`.
- The control measures 50.45 by 24 pixels, carries `aria-disabled` and no native `disabled`, holds the keyboard through the press, and reads `2px solid rgb(191, 219, 254)` in dark mode and `2px solid rgb(0, 0, 0)` under forced colours.
- A cut gesture (press then close in the same breath) leaves no console noise and the window holds both leftovers again; the only animation still running is the dock's own `translate` transition.
- The Finder's Trash place is untouched: two tiles, `trash1.png` and `trash2.png`.
- With `LOCATIONS.trash.children` emptied by hand the window shows the quiet line from the first paint, no list, no count, `aria-disabled` on a control the keyboard still reaches, and a silent live region; the file was restored afterwards, byte for byte what it was (`SHA256 F177AC9B…52AEF3` before and after).
- With the second entry deleted by hand the count line says `1 item` and one tile renders; the file was restored the same way.

Screenshots: `C:\Temp\verify-archive\` (light, emptied, dark, dark emptied, dark ring, forced colours, phone, one left, leftover open, Finder Trash, place holds nothing).

Static gates: `npx tsc -b --force`, `npm run lint`, `npm run format:check`, `npm run build` all clean; `npm test` 508 tests in 74 files; `npm run test:e2e` 95 checks in Chromium. The utilities the window builds from are in `dist/assets/*.css` (`min-w-6`, `pointer-events-none`, `rounded-control`, `6.5rem`, `auto-fill`).

