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

`playwright.config.ts` at the repo root holds the settings: Chromium only, its own dev server on port 4174 with `--strictPort`, so a run never fights the dev server you have open on 5173. CI gets two retries and the `github` reporter; a local run reuses a server already on that port.

## Conventions

- Import app modules with a relative path (`../src/content/theme`). Playwright compiles the specs itself and does not read the aliases in `vite.config.ts`, so `#content` and friends do not resolve here.
- Query the way a visitor navigates: a role, an accessible name, or visible text (`getByRole`, `toHaveText`), never a class or a test id that only the markup knows about.
- Assert the computed value when the point is what the browser actually paints (a focus ring's outline, a custom property read off the document element), because that is the half a unit test cannot judge.
- A spec that drives the keyboard waits for the surface to be visible first. The desktop renders after the content check resolves, and a tab into an empty document focuses nothing.

## Notes for this machine

On Windows the Playwright CLI can linger after the checks finish. The results print, so read them and kill the terminal rather than waiting for it to exit.

## Governance

The suite belongs to scope row 3 (coding standards and tooling), which owns both runners. `design-system.spec.ts` follows spec 0002; later windows add their own spec as they land.

_Drafted by /sync from the introducing change, worth a quick human pass._
