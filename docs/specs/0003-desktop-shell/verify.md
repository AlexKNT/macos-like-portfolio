# Verify: desktop shell · spec 0003 · created 2026-09-20

_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Rows 8 to 15 are still to come, so the window bodies behind the dock are placeholders. A step that needs a real window body says so and stops at the placeholder.

## Commands

- [ ] `npx tsc -b` → clean, with no `any` in the shell's modules → AC-1, AC-3, AC-11
- [ ] `npm run lint` → clean → AC-1
- [ ] `npm run format:check` → clean → AC-1
- [ ] `npm test` → the content suite, the contrast suite and the shell's component tests all pass → AC-2, AC-3, AC-6, AC-9
- [ ] `npm run build` → succeeds → AC-1
- [ ] search `src/**` for `windowPosition` → only `DESKTOP_ITEMS` and its schema mention a desktop spot; no hit remains in `locations.ts` or in `projectFolderSchema` → AC-3
- [ ] search `src/components/**` and `src/store/**` for a window list, a `position` or a `z` field outside the store → no hit, the shell reads the manager and writes nothing → AC-11
- [ ] list `src/content/desktop.ts` and open it → four items, each with a label, an icon, a spot and a target, and one of them names the Resume window → AC-3

## UI / manual

- [ ] `npm run dev` and click a dock button → a window opens with its three lights working → AC-8
- [ ] click the same dock button again → focus moves to that window, no second window appears, and the dock shows one indicator for it → AC-6, AC-8
- [ ] move the window so its bottom edge would pass under the dock → it stops short of the dock band, and the dock stays on top → AC-1
- [ ] click a desktop project icon → a window opens for that project through the same action the dock uses → AC-3, AC-8
- [ ] click the Resume desktop icon → the Resume window opens, not a download → AC-3
- [ ] click each of the three menu bar links → each opens its window, and the About icon opens the About location → AC-4
- [ ] click the wifi and search icons → nothing happens and neither is reachable by Tab, because they render no control → AC-4
- [ ] press the appearance icon → the desktop switches mode for the session; reload → the desktop follows the system again, because nothing was stored → AC-5
- [ ] hover a dock button → the tooltip shows the same name the button announces, and the icon lifts → AC-6
- [ ] move the pointer across the dock → the icons nearest the pointer grow and their neighbours grow less, the panel itself does not move, and nothing on the page reflows → AC-7
- [ ] move the pointer off the dock → every icon returns to its resting scale → AC-7
- [ ] Tab from the top of the page → the bar controls, the desktop icons and the dock buttons are all reached in that order, each with the two layer ring → AC-9
- [ ] focus a dock button and press Enter → the window opens, exactly as a click does → AC-6, AC-9
- [ ] with a window open, minimise it from its yellow light → the dock button shows the quieter indicator → AC-6
- [ ] narrow the window to 360px → the dock is gone, the greeting and the desktop icons stay, and nothing scrolls sideways → AC-10
- [ ] narrow to 360px and activate a desktop icon → the window opens and fills the work area → AC-10
- [ ] widen back to desktop width → the dock returns and its indicators match what is actually open → AC-6
- [ ] set the OS to reduce motion, reload and move the pointer across the dock → no magnify at all, and the dock still opens windows → AC-7
- [ ] turn on forced colours → the bar, the desktop icons and the dock buttons stay visible, and the focus ring is still drawn → AC-9
- [ ] compare the dev server against `designs/lightHomePage.png` and `designs/darkHomePage.png` → the greeting, the desktop icons, the dock and the bar all sit where the reference puts them → AC-1, AC-2, AC-3, AC-6
- [ ] switch to dark mode and look at the greeting → the script line stays legible over the dark wallpaper → AC-2

## Values that could be invented

Every row of the spec's Value sourcing table, checked rather than assumed.

- [ ] the greeting copy → in the console, `(await import('/src/content/profile.ts')).PROFILE.greeting` matches the two lines on the desktop → AC-2
- [ ] a desktop icon's label, image and spot → the rendered button matches its `DESKTOP_ITEMS` entry, and the console list has four items → AC-3
- [ ] a dock button's name and image → the accessible name matches `DOCK_APPS[i].name` and the image matches `WINDOWS[windowId].icon` → AC-6
- [ ] a dock indicator's meaning → open a second window and minimise one; the two buttons show the different indicators → AC-6
- [ ] the mode the appearance press applies → read `document.documentElement.dataset.theme` before and after the press, and confirm the press read the attribute rather than resolving a preference → AC-5
- [ ] the clock → the minute boundary step used for spec 0002 still passes → AC-4
- [ ] the wallpaper → the spec 0002 wallpaper steps still pass, at 320px and at 2560px wide → AC-1
- [ ] the work area → drag a window to each edge; it stops exactly at the container's content box, not at the viewport edge → AC-1
- [ ] the magnify settings → open the token layer and confirm `--dock-magnify-scale` and `--dock-hover-lift` exist and are the values in use, not literals in the component, and read the falloff function to confirm it is linear over the two nearest neighbours rather than a number per icon → AC-7
- [ ] the four desktop spots → open `src/content/desktop.ts` and confirm each item's spot is a top and left pair, with nothing anchored to a right edge → AC-3
- [ ] the placeholder copy → each of the nine windows states what will live there, and none of them claims to be finished → AC-8

## Acceptance-criteria coverage

- AC-1 → the container and edge steps, the wallpaper rows and the typecheck
- AC-2 → the greeting steps, the dark mode look and the contrast suite command
- AC-3 → the desktop icon steps, the `windowPosition` search and the console list
- AC-4 → the three link steps, the About icon step and the decoration step
- AC-5 → the appearance press step, including the reload
- AC-6 → the dock steps, the indicators and the tooltip
- AC-7 → the pointer across the dock, the return to rest and the reduce motion step
- AC-8 → the open steps, the second open step and the placeholder copy row
- AC-9 → the Tab step, the forced colours step and the dock ring pair in the suite
- AC-10 → the two 360px steps
- AC-11 → the window state search command and the removal check below

## Two rows to read rather than trust

- [ ] open the shell's modules and confirm no module holds window state; the search command above only finds a field if it is written down, so read for a list that is rebuilt on every render → AC-11
- [ ] open the contrast suite and confirm the dock button pair is composited over the translucent panel rather than checked against the page background, which is the judgement spec 0002 could not make → AC-9
