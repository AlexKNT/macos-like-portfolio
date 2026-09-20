# Verify: design system and window chrome · spec 0002 · created 2026-09-20

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

The token layer and the mode resolution are checkable today. The frame needs a window to sit in, and no window exists yet, so two steps below render one on purpose and revert. The appearance control is row 16's, so the write side of the preference waits on it.

## Commands

- [x] `npx tsc -b` → clean, with no `any` in `src/lib` or `src/components` → AC-1, AC-5
- [x] `npm run lint` → clean → AC-1
- [x] `npm test` → the content suite and the contrast suite both pass → AC-3
- [x] `npm run build` → succeeds → AC-1
- [x] search `dist/assets/*.css` for `[data-theme="dark"]` and `--color-surface` → both present → AC-1
- [x] search `dist/assets/*.css` for `--color-background` and `--color-focus-inner` → both present. These two are read only through `var()` in author CSS, so this row is the `@theme static` proof and the one that catches a pruned token before it reaches production → AC-1, AC-8
- [x] search `dist/assets/*.css` for `fonts.googleapis.com` and `dist/assets/*.js` for the same → absent from both → AC-13
- [x] list `dist/assets/*.woff2` → Georama, Roboto Mono and Great Vibes are all there → AC-13
- [x] list `public/images/wallpaper*.png` → three files: `wallpaper.png`, `wallpaper-dark.png`, `wallpaper-compact.png` → AC-8
- [x] search `src/index.css` for `bg-gray-`, `bg-white`, `text-gray-` and `border-gray-` → every remaining hit sits inside a token definition or inside a rule for a window that does not exist yet → AC-1, AC-7

## UI / manual

- [x] set the OS appearance to dark with nothing stored, then `npm run dev` → the desktop paints dark, with no light frame first → AC-2
- [x] in the console, read `document.documentElement.dataset.theme` → `dark`, and never absent → AC-2
- [x] set `localStorage['portfolio.appearance'] = 'light'` and reload with the system still dark → the desktop stays light → AC-2
- [x] tab from the top of the page → the first menu bar control shows the ring, and the ring is visible against the translucent bar over the wallpaper → AC-4
- [x] weaken a token on purpose (set `--color-text-muted` to a mid grey) → `npm test` fails and names the pair, then `git checkout -- src/index.css` → AC-3
- [x] set the OS to reduce motion, reload, and read `getComputedStyle(document.documentElement).getPropertyValue('--duration-base')` → `0ms` → AC-9
- [x] in the console, `(await import('/src/lib/motion.ts')).readMotionToken('base')` with motion reduced → `0`, and `readEaseToken('out')` still returns a string → AC-9
- [x] in light mode, look at a desktop label with nothing hovered → it sits on the label wash and reads clearly against the wallpaper → AC-7
- [x] turn on forced colours (Windows high contrast) → the frame edge and the focus ring stay visible → AC-12
- [x] narrow the window to 360px wide → nothing scrolls sideways and the bar paints a solid surface rather than a blur → AC-11
- [x] rename `/images/wallpaper.png` on purpose → the desktop paints `--color-background` and the labels stay readable, then rename it back → AC-8
- [x] temporarily render a `Window` in `App.tsx` with no handlers and tab to it → the three lights are skipped in the tab order and announced as unavailable, then revert → AC-5
- [x] with that same temporary `Window`, inspect the three lights → each accessible name reads from the title, as `Close <title>`, `Minimise <title>` and `Zoom <title>` → AC-5
- [x] leave the page open across a minute boundary → the clock still updates with no reload → AC-7
- [x] compare the dev server against `designs/lightHomePage.png` and `designs/darkHomePage.png` side by side → the bar's translucency, the label treatment and the wallpaper all match the images → AC-7, AC-8

## Value sourcing

One step per row of the spec's table.

- [x] the saved preference → the `localStorage` step above → AC-2
- [x] the system setting → the dark system step above → AC-2
- [x] the `data-theme` value → the devtools attribute step above → AC-2
- [x] the wallpaper image → in the console, `(await import('/src/content/theme.ts')).WALLPAPER` matches `getComputedStyle(document.documentElement).getPropertyValue('--wallpaper-image')` → AC-8
- [x] the compact wallpaper → the 360px step above, then confirm `--wallpaper-image-compact` is the one painting → AC-8, AC-11
- [x] the clock time → the minute boundary step above → AC-7
- [x] the link labels and icons → the menu bar steps above → AC-7
- [x] the icon `alt` text → the labels already sit in `#content/shell` as data; wiring them into the markup is row 6's, so this row covers the data only → AC-7
- [x] every colour the menu bar paints → the token search command plus the dark mode step → AC-1, AC-7
- [x] a window's title → the temporary `Window` step above; the real source arrives with the window manager, row 7 → AC-5
- [x] the three accessible names → the accessible name step above → AC-5
- [x] the frame colours, radius and shadow → the temporary `Window` step above; a real window arrives with row 7 → AC-5
- [x] the light colours → the temporary `Window` step above → AC-5
- [x] the token values → the `npm test` command above → AC-3
- [x] the pairs to check → the weakened token step above → AC-3
- [ ] the preference on write → waits on the appearance menu, row 16. The read side is covered by the `localStorage` step → AC-2
- [x] a duration or an easing for GSAP → the reduce motion steps above, including `readEaseToken` → AC-9
- [x] the colour under a translucent pair → open the contrast suite and confirm the two glass pairs are composited over a wallpaper fixture rather than checked against white → AC-3
- [x] the two new wallpaper files → the `public/images` file list step above → AC-8
- [x] the three families and their fallback stacks → the woff2 command and the built CSS search above → AC-13
- [x] the three appearance states (absent, `light`, `dark`) → the two mode steps above → AC-2

## Acceptance-criteria coverage

- AC-1 → the typecheck, build and CSS search commands, plus the token search over the stylesheet
- AC-2 → the two mode steps, the attribute read and the `localStorage` step
- AC-3 → the `npm test` command, the weakened token step and the pair list read below
- AC-4 → the tab step
- AC-5 → the two temporary `Window` steps and the accessible name step
- AC-6 → the tab step, plus the comparison against the design images for hover and selected states
- AC-7 → the menu bar steps, the token search and the image comparison
- AC-8 → the wallpaper variable step, the compact step and the renamed wallpaper step
- AC-9 → the two reduce motion steps
- AC-10 → opening `design.md` and confirming it covers colour, type, spacing and window chrome
- AC-11 → the 360px step
- AC-12 → the forced colours step
- AC-13 → the woff2 and `fonts.googleapis.com` commands

## Two rows to read rather than trust

Both pass trivially when nothing renders the thing being checked, so read them as documentation until a window exists.

- [x] open `design.md` and check the four areas the scope asks for are actually covered, and that the window rules which are not yet migrated are called out as reference
- [x] open the contrast suite and confirm the pair list covers every surface the menu bar paints, not only the obvious text pairs

## Added by /develop, 2026-09-20

The build landed the whole plan, so these steps cover what the plan above could only describe. The
first five are the ones the suite now proves by itself, which is why they say what a failure looks
like rather than what to read.

- [x] `npm test` → 46 tests pass, the contrast suite among them, and it names every pair it checks → AC-3
- [x] set `--color-text-muted` to `#9aa0aa` in `src/index.css` and run `npm test` → it fails with "light: muted text on surface is 2.63:1, below 4.5:1" and the same for `surface-sunken`, then `git checkout -- src/index.css` → AC-3
- [x] `npm run test:e2e` → 10 tests pass in Chromium: the mode before paint, the wallpaper the mode names, the wallpaper files served, the bar following the mode, the two layer ring, the duration and easing readers, and the compact fallback → AC-2, AC-4, AC-7, AC-8, AC-9, AC-11
- [x] `npm run format:check` → clean, so the formatter and the linter agree about every file → the tooling feature
- [x] open `src/lib/contrast.ts` and `src/lib/tokens.ts` → the ratios are computed from the values the suite reads out of `src/index.css`, so nothing is retyped and a weakened token cannot pass → AC-3
- [x] first visit in dark mode with nothing stored → the bar is dark with light text, the logo is light rather than black, and the wallpaper is `/images/wallpaper-dark.png` → AC-2, AC-7, AC-8
- [x] hover a menu bar link in either mode → the wash comes from `--color-surface-raised`, so it is a step up in dark and a step in light, never a palette class → AC-6, AC-7
- [x] tab to a menu bar link → the outline is 2px `--color-focus-outer` with a 2px offset and a 2px `--color-focus-inner` shadow → AC-4
- [x] render a `Window` with no handlers in `App.tsx`, then compare against `designs/lightSpecific-Project.png` and `designs/darkSpecific-Project.png` → the title bar reads as one step from the body, the three lights keep their colours, and the lights are skipped in the tab order, then revert → AC-5
- [x] narrow to 360px → the bar is solid `--color-surface` with no blur and nothing scrolls sideways → AC-11
- [x] turn on forced colours → the window edge and the focus ring stay visible and the inner shadow is replaced rather than left invisible → AC-4, AC-12

### Pairs the build added to check

- [x] open `src/lib/tokens.test.ts` → the pair list covers the menu bar, the control boundary, the ring on the ground colour and on the bar, and the three quiet accents, in both modes → AC-3, AC-6, AC-7
- [x] open `design.md` and read the Exceptions section → the three traffic lights are the one graphic not held at 3:1, with the reason stated, and the hairlines are named as decorative → AC-3, AC-10

### Left open on purpose

- [ ] the resume window decides what ink a page uses in dark mode; until then the paper pairs run in light mode only, and both `design.md` and the stylesheet say so → AC-3, AC-10
- [x] the dock adds its own ring pair when the desktop shell builds it; the ring on the translucent panel is the one pair the suite cannot judge without a control on it → AC-3, AC-6
