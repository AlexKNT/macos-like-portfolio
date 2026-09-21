# Verify: mobile app switcher shell · spec 0009 · created 2026-09-21

_Steps derived from spec 0009. `/check verify` runs these; `/test` locks the durable ones._

The phone shell is proved three ways: by the unit suites (the content list and its schema, the reducer's one window on screen rule with no DOM, the tile and surface components through React Testing Library with the compact flag set), by driving the real app in Chromium at a phone viewport (the tiles, the fill, Close, Minimise, a file over the Finder, the back press, reduced motion, forced colours), and by reading what the shell prints against what the content layer holds, so no word or icon is invented at build time. Every step at a phone width runs at 360px, the width every earlier feature already uses, and every regression step runs at 1280px.

## Commands

- [ ] `npx tsc -b` → clean, with no `any`, `HOME_APPS` typed against its schema, and `homeAppIdSchema` covering exactly the seven members the list carries → AC-2
- [ ] `npm run lint` → clean → AC-15
- [ ] `npm test` → `HOME_APPS` parses against the strict schema, carries exactly seven entries, and each entry's `windowId` is one of the seven the phone shell may open, so neither `textFile` nor `imageFile` appears → AC-2
- [ ] `npm test` → the development check still passes with the new list registered, and a deliberately broken entry (an empty `name`, an unknown `id`) fails the check naming the field → AC-2
- [ ] `npm test` → the reducer, with `compact` true, closes every instance that is neither parked nor the new instance's opener when an open lands, in one transition → AC-5
- [ ] `npm test` → the reducer, with `compact` true, keeps a parked instance alive and out of the way when another window opens, and a press on its tile brings it back to `normal` at the stored geometry while closing the window that was on screen, in one transition → AC-3, AC-5, AC-6
- [ ] `npm test` → the reducer, with `compact` true, applies the close rule in both of the open's branches: a brand new key closes what was on screen, and a key that already exists (the parked revive) closes it too → AC-5
- [ ] `npm test` → the reducer, with `compact` true, keeps the opener alive and hidden under the window that opened over it, and closing the top window leaves the opener as the focused instance → AC-4, AC-10
- [ ] `npm test` → `windowGeometry`, `filledSize` and `shrinkToFit` return the work area's own box on a phone with no `minSize` floor, and `setWorkArea` through `fitInto` never rewrites a window's stored size or spot while the compact layout holds → AC-9
- [ ] `npm test` → `focusHopAfter` never returns a dock hop when `compact` is true, and ends at the container hop the home surface lives in → AC-8
- [ ] `npm test` → `hasHomeTile` answers yes for the seven `HOME_APPS` windows including `resume`, and no for `textFile` and `imageFile` → AC-7
- [ ] `npm test` and a read of `src/` → the JavaScript breakpoint comes from the one constant in `#store/useWorkArea`, resolved from `(width < 40rem)`, and no other module under `src/` compares a width against a literal of its own → AC-1
- [ ] `npm test` → the manager resolves `compact` before its first render: a manager created with a matching media query reports the phone layout on its very first state → AC-1
- [ ] `npm test` → with no window open, the shell renders the home surface: one heading and one named list of seven tiles, each a button whose accessible name is its own content name → AC-1, AC-2
- [ ] `npm test` → a press on a tile dispatches one open carrying `{ kind: 'home' }` and that tile's `windowId`, and a second press on a tile whose window is on screen focuses rather than opening twice → AC-3
- [ ] `npm test` → while an instance is on screen, no element of the home surface is in the document, so a tile cannot be reached by the keyboard behind a window → AC-3
- [ ] `npm test` → a tile whose window is on screen carries the filled mark, a parked window's tile carries the quieter one, and a tile with no instance carries none, with the mark hidden from assistive tech and painted in `--color-desktop-text` rather than the text ink that flips with the mode → AC-6
- [ ] `npm test` → the frame's Zoom light is absent when `compact` is true and present above it, and Minimise is offered for every window `hasHomeTile` accepts, Resume included, where `hasDockButton` alone would not reach it → AC-7
- [ ] `npm test` → `exitTargetFor` returns a window's own tile when it has one, and its opener's tile when it does not, so a file window resolves to the Finder's tile → AC-12
- [ ] `npm test` → no module under `src/components/` added by this feature writes a sentence, a heading or a control label: every visible string resolves to `homeLines` or to a content value → AC-14
- [ ] `npm run build` → succeeds, works offline, and `dist/assets/*.css` carries the utilities the phone surface uses (`min-h-touch`, the surface and ink classes) → AC-13, AC-15
- [ ] `npm run test:e2e` → the rewritten 360px shell check passes in Chromium (the home surface renders, the bar keeps the mark and the clock, and nothing scrolls sideways), and the window manager's rewritten compact fill check opens its window without the desktop item list → AC-1, AC-2, AC-13, AC-15
- [ ] `npm run test:e2e` → a new phone spec passes: a tile opens its window at the viewport's width, Close returns home, and the window is never wider than the viewport → AC-3, AC-4, AC-7, AC-9
- [ ] read `src/components/` and `src/store/` → no hex colour, no palette utility, no `fetch`, no storage call and no `window.open` in any module this feature adds → AC-15
- [ ] read `src/content/shell.ts` → `HOME_APPS` carries no icon path and no colour, since the icon comes from `WINDOWS` → AC-2, AC-14
- [ ] read `src/index.css` and `index.html` → no new token, no new asset path and no change to the pre paint script → AC-13, AC-15
- [ ] check `package.json` and `package-lock.json` → no dependency added → AC-11, AC-15

## UI / manual

- [ ] `npm run dev`, set the viewport to 360x740, reload → the phone shell paints on the first frame: a slim bar with the mark, the clock and the appearance control, a heading, and a list of seven named tiles with their window icons. The dock, the menu bar links, the greeting and the three project folders are all absent, not merely covered → AC-1, AC-2, AC-13
- [ ] read the accessibility tree at 360px → one region named from the shell's own word, containing one heading and one list with seven buttons, each named for its window, in the content's order → AC-2, AC-14
- [ ] press the Projects tile → the Finder opens filling the viewport, the keyboard lands inside the window, and every tile has left the page → AC-3
- [ ] press Close on that window → the home surface is back, the keyboard is on the page's home surface rather than the body, and the Projects tile carries a mark only while a window exists → AC-6, AC-7, AC-8
- [ ] open Projects, then Skills → the Finder closes, Skills fills the screen, and only one window is painted → AC-4, AC-5
- [ ] open Skills, press Minimise, then open Gallery → Skills' tile keeps the quieter mark while Gallery is on screen, and pressing the Skills tile brings it back at the work area's box → AC-5, AC-6, AC-7
- [ ] with a window open, press the Zoom light → it is disabled and cannot be pressed, and it is announced as unavailable → AC-7
- [ ] open the Finder, open a text file from the grid, then close the file → the file opened over the Finder, the Finder was not reachable by Tab while it was covered, and closing the file reveals the Finder showing the same place → AC-4, AC-10
- [ ] open a window, press the browser's back → that window closes and the home surface returns. Press back again with nothing open → the browser leaves the site, as it did before → AC-11
- [ ] open a window and check the address bar → the URL has not changed and the shell owns one history entry, whose state carries no window data → AC-11
- [ ] from home, open a window, open another from a tile, then press back → the second closes and home returns with no stale entry left behind, so the next back press leaves the site as it did before → AC-11
- [ ] open a window, press Close, then press back → the site is left, because the shell reconciled its entry away when the window left the screen rather than on a pop → AC-11
- [ ] above the breakpoint, open a window from the bar link and from a dock button, then press back → the browser leaves the site, since the hook is compact gated and the desktop writes no history → AC-11, AC-15
- [ ] watch a tile press and a Close with motion on, then with the OS set to reduce motion → the window grows from its tile and shrinks back into it, and under reduced motion it is simply there with no movement and no wait → AC-12
- [ ] open a file from the Finder and watch the movement → the file grows from the Finder's tile, since it has none of its own → AC-12
- [ ] Tab through the home surface with the keyboard alone → the seven tiles are reached in reading order, each carries the visible focus ring, and each is at least 44px tall → AC-2
- [ ] read the tiles at 360px in light mode and again in dark mode → each tile's name is legible on its wash, and the mark is visible against the wash in both modes rather than near black on near black → AC-6, AC-14
- [ ] turn the phone to a short viewport (360x260) with a window open, then resize a desktop browser across the breakpoint with two windows open and widen it again → the window still fits the work area exactly with nothing scrolling sideways, and both windows come back at the size and spot they had → AC-4, AC-9
- [ ] resize a desktop browser from 1280px down past 40rem with two windows open → the phone surface takes over with the focused window filling it, the other is hidden and unreachable, and widening again restores both at their stored geometry and status → AC-4, AC-9
- [ ] at 1280px, walk the menu bar, the dock, the desktop items and a drag → every one behaves exactly as spec 0003 and spec 0004 verified, with no change → AC-15
- [ ] at 1280px, press a dock button and a bar link, then widen and narrow again → the openers recorded are still `dock` and `bar`, so the focus handoff above the breakpoint is unchanged → AC-15
- [ ] zoom the page to 200% at 360px, then at 1280px → no clipping, no overlap and no sideways scroll on either surface → AC-9
- [ ] set the OS to forced colours at 360px → the tiles stay legible over the wallpaper, the ring on each control is still drawn, and the marks are still visible → AC-6
- [ ] set the OS to dark mode at 360px, then light → the slim bar, the heading and the tiles follow the mode, the tile names stay legible on the wash, and nothing on the surface is pinned to a light value → AC-14
- [ ] press the appearance control in the slim bar → the mode switches, exactly as the menu bar's own control does → AC-7
- [ ] listen with a screen reader where one is available → the surface name, the heading and the seven tile names read in order, and a window's arrival and departure are announced once → AC-2, AC-3

## Values that could be invented

- [ ] the seven tiles' names → compare each against `HOME_APPS[i].name`, verbatim, and confirm no component writes a display name of its own → AC-2, AC-14
- [ ] the seven tiles' icons → compare each against `WINDOWS[windowId].icon`, and confirm no tile module holds an image path → AC-2, AC-14
- [ ] the seven tiles' order → compare against the content list's own order, and confirm the order is written once, in the content, rather than sorted in a component → AC-2
- [ ] the surface's heading word and the list's own name → compare both against `homeLines`, confirm they are the same word read from one place, and confirm no second copy of that word exists in a component or in `index.html` → AC-14
- [ ] the window each tile opens → compare against `HOME_APPS[i].windowId`, one by one, against the seven the desktop opens by name → AC-2
- [ ] a tile's mark state → confirm it is derived from the instances rather than stored anywhere, and that the mark carries no text a screen reader would read twice → AC-6
- [ ] the breakpoint → compare the one constant in `#store/useWorkArea` against the `@media (width < 40rem)` rule in `src/index.css` and against Tailwind's `sm`, and confirm a phone's first render already agrees with the constant → AC-1
- [ ] the wallpaper a phone paints → compare `--wallpaper-image-compact` against `WALLPAPER.compact.imageUrl` in `#content/theme`, and confirm no module writes the path → AC-13
- [ ] the movement's duration and easing → confirm both come from `readMotionToken` and `readEaseToken` rather than a literal number, and that reduced motion resolves them to zero → AC-12
- [ ] the window's box on a phone → compare the painted position and size against the work area the container reports, and against the corner constant, with `0` as the only floor → AC-9
- [ ] each light's accessible name → compare against the window's own title, so a phone keeps "Close Projects" and never a bare "Close" → AC-7, AC-14
- [ ] the history entry → confirm the pushed state carries no window id, no title and no target, and that the URL string is unchanged across an open and a close → AC-11
- [ ] the opener recorded by a tile press → confirm it is `{ kind: 'home' }` and not a window key, so nothing survives behind a window opened from the home surface → AC-5
- [ ] the opener kept by a file open → confirm it is the Finder's own key, which is what makes the close land back on the Finder rather than home → AC-10
- [ ] the words any announcement or live region carries → confirm they are not a second wording invented in a component, since the frame's names and the content's names already carry it → AC-14
- [ ] every colour, space, radius and duration the phone surface paints → read the markup and confirm each class resolves to a token or to a content value, with no colour literal and no palette utility in any new module → AC-15
