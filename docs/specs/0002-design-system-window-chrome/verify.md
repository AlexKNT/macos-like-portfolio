# Verify: design system and window chrome · spec 0002 · created 2026-09-20

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

The token layer and the mode resolution are checkable today. The frame needs a window to sit in, and no window exists yet, so two steps below render one on purpose and revert. The appearance control is row 16's, so the write side of the preference waits on it.

## Commands

- [ ] `npx tsc -b` → clean, with no `any` in `src/lib` or `src/components` → AC-1, AC-5
- [ ] `npm run lint` → clean → AC-1
- [ ] `npm test` → the content suite and the contrast suite both pass → AC-3
- [ ] `npm run build` → succeeds → AC-1
- [ ] search `dist/assets/*.css` for `[data-theme="dark"]` and `--color-surface` → both present → AC-1
- [ ] search `dist/assets/*.css` for `--color-background` and `--color-focus-inner` → both present. These two are read only through `var()` in author CSS, so this row is the `@theme static` proof and the one that catches a pruned token before it reaches production → AC-1, AC-8
- [ ] search `dist/assets/*.css` for `fonts.googleapis.com` and `dist/assets/*.js` for the same → absent from both → AC-13
- [ ] list `dist/assets/*.woff2` → Georama, Roboto Mono and Great Vibes are all there → AC-13
- [ ] list `public/images/wallpaper*.png` → three files: `wallpaper.png`, `wallpaper-dark.png`, `wallpaper-compact.png` → AC-8
- [ ] search `src/index.css` for `bg-gray-`, `bg-white`, `text-gray-` and `border-gray-` → every remaining hit sits inside a token definition or inside a rule for a window that does not exist yet → AC-1, AC-7

## UI / manual

- [ ] set the OS appearance to dark with nothing stored, then `npm run dev` → the desktop paints dark, with no light frame first → AC-2
- [ ] in the console, read `document.documentElement.dataset.theme` → `dark`, and never absent → AC-2
- [ ] set `localStorage['portfolio.appearance'] = 'light'` and reload with the system still dark → the desktop stays light → AC-2
- [ ] tab from the top of the page → the first menu bar control shows the ring, and the ring is visible against the translucent bar over the wallpaper → AC-4
- [ ] weaken a token on purpose (set `--color-text-muted` to a mid grey) → `npm test` fails and names the pair, then `git checkout -- src/index.css` → AC-3
- [ ] set the OS to reduce motion, reload, and read `getComputedStyle(document.documentElement).getPropertyValue('--duration-base')` → `0ms` → AC-9
- [ ] in the console, `(await import('/src/lib/motion.ts')).readMotionToken('base')` with motion reduced → `0`, and `readEaseToken('out')` still returns a string → AC-9
- [ ] in light mode, look at a desktop label with nothing hovered → it sits on the label wash and reads clearly against the wallpaper → AC-7
- [ ] turn on forced colours (Windows high contrast) → the frame edge and the focus ring stay visible → AC-12
- [ ] narrow the window to 360px wide → nothing scrolls sideways and the bar paints a solid surface rather than a blur → AC-11
- [ ] rename `/images/wallpaper.png` on purpose → the desktop paints `--color-background` and the labels stay readable, then rename it back → AC-8
- [ ] temporarily render a `Window` in `App.tsx` with no handlers and tab to it → the three lights are skipped in the tab order and announced as unavailable, then revert → AC-5
- [ ] with that same temporary `Window`, inspect the three lights → each accessible name reads from the title, as `Close <title>`, `Minimise <title>` and `Zoom <title>` → AC-5
- [ ] leave the page open across a minute boundary → the clock still updates with no reload → AC-7
- [ ] compare the dev server against `designs/lightHomePage.png` and `designs/darkHomePage.png` side by side → the bar's translucency, the label treatment and the wallpaper all match the images → AC-7, AC-8

## Value sourcing

One step per row of the spec's table.

- [ ] the saved preference → the `localStorage` step above → AC-2
- [ ] the system setting → the dark system step above → AC-2
- [ ] the `data-theme` value → the devtools attribute step above → AC-2
- [ ] the wallpaper image → in the console, `(await import('/src/content/theme.ts')).WALLPAPER` matches `getComputedStyle(document.documentElement).getPropertyValue('--wallpaper-image')` → AC-8
- [ ] the compact wallpaper → the 360px step above, then confirm `--wallpaper-image-compact` is the one painting → AC-8, AC-11
- [ ] the clock time → the minute boundary step above → AC-7
- [ ] the link labels and icons → the menu bar steps above → AC-7
- [ ] the icon `alt` text → the labels already sit in `#content/shell` as data; wiring them into the markup is row 6's, so this row covers the data only → AC-7
- [ ] every colour the menu bar paints → the token search command plus the dark mode step → AC-1, AC-7
- [ ] a window's title → the temporary `Window` step above; the real source arrives with the window manager, row 7 → AC-5
- [ ] the three accessible names → the accessible name step above → AC-5
- [ ] the frame colours, radius and shadow → the temporary `Window` step above; a real window arrives with row 7 → AC-5
- [ ] the light colours → the temporary `Window` step above → AC-5
- [ ] the token values → the `npm test` command above → AC-3
- [ ] the pairs to check → the weakened token step above → AC-3
- [ ] the preference on write → waits on the appearance menu, row 16. The read side is covered by the `localStorage` step → AC-2
- [ ] a duration or an easing for GSAP → the reduce motion steps above, including `readEaseToken` → AC-9
- [ ] the colour under a translucent pair → open the contrast suite and confirm the two glass pairs are composited over a wallpaper fixture rather than checked against white → AC-3
- [ ] the two new wallpaper files → the `public/images` file list step above → AC-8
- [ ] the three families and their fallback stacks → the woff2 command and the built CSS search above → AC-13
- [ ] the three appearance states (absent, `light`, `dark`) → the two mode steps above → AC-2

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

- [ ] open `design.md` and check the four areas the scope asks for are actually covered, and that the window rules which are not yet migrated are called out as reference
- [ ] open the contrast suite and confirm the pair list covers every surface the menu bar paints, not only the obvious text pairs
