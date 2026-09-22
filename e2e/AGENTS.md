# e2e

The end to end suite: the desktop driven in a real browser, so what a visitor sees and reaches is checked rather than what a component says about itself. One spec per surface. Nothing here renders anything, and nothing here is imported by the app.

## Commands

```bash
npm run test:e2e                          # the whole suite
npm run test:e2e -- e2e/desktop.spec.ts   # one spec
npx playwright install chromium           # once per machine, before the first run
```

## Files

- `desktop.spec.ts`: the menu bar, what it shows and whether the keyboard reaches it.
- `design-system.spec.ts`: the mode resolved before the first paint, the wallpaper the mode names, the two layer focus ring, the glass following the mode, and the compact fallback.
- `window-manager.spec.ts`: the drag and the arrow keys, the clamp to the work area, the quiet treatment, minimise and restore with the focus handoff, zoom, Escape close, reduced motion and the compact fill.
- `projects.spec.ts`: the Finder opening on the Work location, reading a project and walking back, following a link file in a new tab, the two file windows, the missing image state and the layout at 360px.
- `skills.spec.ts`: the stack printed area by area, a name copied and confirmed on its own row, the second copy moving the confirmation, the reveal under reduced motion, and the layout at 360px.
- `resume.spec.ts`: the window from the desktop item and from the menu bar link, the file row over the document and what the download control carries, the file that is not served and the request that fails, the ring on the page, the layout at 360px, and the Finder's own resume file still leaving the app.
- `contact.spec.ts`: the window from the dock and from the menu bar link, the address as a mail link beside the copy pair, the four social tiles and their ink, and the window at 360px.
- `gallery.spec.ts`: the window from the dock and from the phone's own tile, the album sidebar and its one mark, the grid, the viewer a photo opens into with its arrow steps and its Escape, the album change closing the viewer, the keyboard walk, and the window at 360px.
- `phone.spec.ts`: the phone shell at 360px: the home surface and its seven tiles, one window filling the work area with Close returning home, a parked window's mark and the tile that brings it back, a file opening over the Finder, the back press and its one history entry, the movement from a tile, and the reflow at 320px.
- `archive.spec.ts`: the bin from the dock and from a phone's tile, the count and the leftovers it holds, a press on one opening above it, the one press that empties it and what is left on screen afterwards, the keyboard on the Empty control and the box it offers a finger, the window that holds again once it has been closed, and the width a phone gives it.
- `sound.spec.ts`: the silence before the visitor's first gesture, the open and close sounds a window asks for, the dock hover's own tick, the switch silencing the desk and remembering the choice across a reload, and the same switch on a phone where the dock is not on screen.

`playwright.config.ts` at the repo root holds the settings: Chromium only, its own dev server on port 4174 with `--strictPort`, so a run never fights the dev server you have open on 5173. CI gets two retries and the `github` reporter; a local run reuses a server already on that port.

## Conventions

- Import app modules with a relative path (`../src/content/theme`). Playwright compiles the specs itself and does not read the aliases in `vite.config.ts`, so `#content` and friends do not resolve here.
- Query the way a visitor navigates: a role, an accessible name, or visible text (`getByRole`, `toHaveText`), never a class or a test id that only the markup knows about.
- A name query matches on a substring, so pass `{ exact: true }` whenever another control shares a prefix. In this app `Resume` also matches `AI Resume Analyzer`, `me.png` also matches `casual-me.png`, and a row's `Download` also matches the embed's `Download Resume.pdf`.
- Assert the computed value when the point is what the browser actually paints (a focus ring's outline, a custom property read off the document element), because that is the half a unit test cannot judge.
- A spec that drives the keyboard waits for the surface to be visible first. The desktop renders after the content check resolves, and a tab into an empty document focuses nothing.
- Below the compact breakpoint a check opens its window from the home surface's own tile (`getByRole('list', { name: 'Home' })`), because a phone renders no dock, no menu bar links and no desktop items. The surface's container is always on the page, so "home is showing" means its list, not the container it lives in.
- A window that opens on a phone arrives from its tile, so a check that measures a landed box waits for it (`expect.poll`), rather than reading the frame mid movement.
- A state the repo's own assets cannot produce is forced over the network with `page.route`: the suite stands a real file in for an asset the content names but the repo does not carry, or answers 404 to prove a missing asset state. Never by renaming files under `public/`, which makes Vite reload the page and starves the specs running beside it.
- A control the app reports as unavailable through `aria-disabled` cannot be clicked: Playwright reads it as disabled and `locator.click` waits until the check times out. Dispatch that press with `evaluate((element) => element.click())`, and assert the native `disabled` attribute rather than `toBeEnabled`, so the check proves the window's own guard instead of the harness refusing to press.
- A mode the app resolves before its first paint has to be emulated before `page.goto`, because nothing listens for a change afterwards: calling `page.emulateMedia({ colorScheme: 'dark' })` after the load leaves the window painted light and the check silently measures the wrong theme.
- A capability the runner cannot hear is stood in for and recorded rather than played: `sound.spec.ts` installs an audio engine of its own with `page.addInitScript`, built from the content's own `SOUNDS` table by a relative import, and reads the ids played back off the log that stub writes.

## Notes for this machine

On Windows the Playwright CLI can linger after the checks finish. The results print, so read them and kill the terminal rather than waiting for it to exit. The `json` reporter never gets as far as writing its file for the same reason, so read a run with `--reporter=list`, which prints each check as it lands.

A whole suite at the default worker count starves on this box: checks that take a second alone run for 15 to 25 seconds, and the first one can exceed the 20 second timeout with `page.goto: net::ERR_ABORTED`. `--workers=3` is green, and the spec that sorts first alphabetically (`archive.spec.ts` today) is the one that pays Vite's cold start.

## Governance

The suite belongs to scope row 3 (coding standards and tooling), which owns both runners. `design-system.spec.ts` follows spec 0002; later windows add their own spec as they land.

_Drafted by /sync from the introducing change, worth a quick human pass._
