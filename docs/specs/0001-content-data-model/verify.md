# Verify: content data model · spec 0001 · updated 2026-09-20

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Most of the surfaces this content feeds do not exist yet, so these steps cover the model itself, the menu bar that reads it today, and the one spec row whose surface is still missing. Every other Value sourcing row names the feature that will make it checkable.

## Commands

- [x] `npx tsc -b` → clean, with no `any` in `src/content` or `src/lib` → AC-1
- [x] `npm run lint` → clean → AC-1
- [x] `npm test` → 16 tests pass → AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-10
- [x] `npm run build` → succeeds, and Vite emits a single JavaScript asset → AC-1
- [x] search `dist/assets/*.js` for `ZodError`, `strictObject` and `Invalid content in` → all three absent → AC-7
- [x] search `dist/assets/*.css` for `top-52` and `5vh` → both present → AC-1
- [x] confirm `src/constants/`, the `#constants` alias and every `#constants` import are gone → AC-9

## UI / manual

- [x] `npm run dev` → the menu bar shows Projects, Contact, Resume, four icons, and a live clock → AC-9
- [x] leave the page open across a minute boundary → the clock updates with no reload → AC-9
- [x] clear an `alt` in `src/content/locations.ts` on purpose → the page fails before the desktop renders, and the message names the collection and the failing path → AC-7, AC-8

## Value sourcing

One step per row of the spec's table.

- [x] menu bar links and icons (`NAV_LINKS`, `NAV_ICONS`) → the two UI steps above show the three labels and four icon paths → AC-9
- [x] what an icon does (`NAV_ICONS[].action`) → waits on the desktop shell, scope row 6. The test "labels the menu bar icons that act, and leaves the decorative ones unlabelled" covers the data until then
- [x] dock names and icons (`DOCK_APPS` with `WINDOWS[app.windowId].icon`) → waits on row 6. The test "names a real window from every dock app and menu bar link" covers the data until then
- [x] Finder sidebar, the first location `work`, and the grid spots (`LOCATIONS`) → waits on the projects window, row 8. The CSS command above proves the position classes survive the move into `src/content`
- [x] opening a file (`openTargetFor`) → the test "sends a text or image file to a file target, and a link or the resume out of the app"
- [ ] a window titlebar (the entry name, else `WINDOWS[windowId].title`) → waits on the window manager, row 7
- [x] one entry by id (`findById`) → the tests "finds an entry by its id, and reports a missing one as a value" and "carries the collection and the id on a failed lookup, and never throws"
- [ ] About and contact content (`PROFILE`) → waits on rows 10 and 11
- [x] the About file paragraphs (`PROFILE.bio`) → waits on row 8. The entry holds `PROFILE.bio` itself rather than a copy, which the test "parses every collection against its schema" would catch if the two drifted
- [ ] contact tiles (`SOCIALS`) → waits on row 11
- [ ] Skills window (`TECH_GROUPS`) → waits on row 9
- [ ] articles, with the ISO date formatted inside the window (`ARTICLES`) → waits on row 14
- [ ] gallery (`ALBUMS`) → waits on row 13
- [x] resume window (the `pdf` entry's `href`) → the test "keeps the resume on a path this origin serves"
- [ ] appearance control (the `appearance` action) → waits on row 16
- [x] clock (the browser clock, not content) → the minute boundary step above
- [x] an image on screen (that entry's `alt`) → the test "carries the text a screen reader announces for every image"

## Acceptance-criteria coverage

- AC-1 → the typecheck, build and CSS commands
- AC-2 → the id union coverage, uniqueness and lookup tests
- AC-3 → the registry tests, plus "names a real window from every dock app and menu bar link"
- AC-4 → the two lookup tests
- AC-5 → "accepts an album with no photos"
- AC-6 → the three schema rejection tests, plus the broken `alt` step
- AC-7 → the bundle search and the broken `alt` step
- AC-8 → the image, label and outbound link tests
- AC-9 → the menu bar steps and the constants command
- AC-10 → the test suite itself
