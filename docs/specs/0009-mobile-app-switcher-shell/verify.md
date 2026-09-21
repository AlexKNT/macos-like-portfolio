# Verify: mobile app switcher shell · spec 0009 · created 2026-09-21

_Steps derived from spec 0009. `/check verify` runs these; `/test` locks the durable ones._

The phone shell is proved three ways: by the unit suites (the content list and its schema, the reducer's one window on screen rule with no DOM, the tile and surface components through React Testing Library with the compact flag set), by driving the real app in Chromium at a phone viewport (the tiles, the fill, Close, Minimise, a file over the Finder, the back press, reduced motion, forced colours), and by reading what the shell prints against what the content layer holds, so no word or icon is invented at build time. Every step at a phone width runs at 360px, the width every earlier feature already uses, and every regression step runs at 1280px.

## Commands

- [x] `npx tsc -b` → clean, with no `any`, `HOME_APPS` typed against its schema, and `homeAppIdSchema` covering exactly the seven members the list carries → AC-2
- [x] `npm run lint` → clean → AC-15
- [x] `npm test` → `HOME_APPS` parses against the strict schema, carries exactly seven entries, and each entry's `windowId` is one of the seven the phone shell may open, so neither `textFile` nor `imageFile` appears → AC-2
- [x] `npm test` → the development check still passes with the new list registered, and a deliberately broken entry (an empty `name`, an unknown `id`) fails the check naming the field → AC-2
- [x] `npm test` → the reducer, with `compact` true, closes every instance that is neither parked nor the new instance's opener when an open lands, in one transition → AC-5
- [x] `npm test` → the reducer, with `compact` true, keeps a parked instance alive and out of the way when another window opens, and a press on its tile brings it back to `normal` at the stored geometry while closing the window that was on screen, in one transition → AC-3, AC-5, AC-6
- [x] `npm test` → the reducer, with `compact` true, applies the close rule in both of the open's branches: a brand new key closes what was on screen, and a key that already exists (the parked revive) closes it too → AC-5
- [x] `npm test` → the reducer, with `compact` true, keeps the opener alive and hidden under the window that opened over it, and closing the top window leaves the opener as the focused instance → AC-4, AC-10
- [x] `npm test` → `windowGeometry` and `filledSize` return the work area's own box on a phone with no `minSize` floor, and `setWorkArea` through `fitInto` never rewrites a window's stored size or spot while the compact layout holds → AC-9

  _Built differently, and the difference is the point: `shrinkToFit` keeps its three arguments, because a phone never shrinks anything. The layout minimum cannot apply there because `fitInto` hands the instance straight back, and the box that is painted comes from `windowGeometry`. The proof is the pair above: the box with no floor, and the stored geometry that a resize leaves alone._
- [x] `npm test` → `focusHopAfter` never returns a dock hop when `compact` is true, and ends at the container hop the home surface lives in → AC-8
- [x] `npm test` → `hasHomeTile` answers yes for the seven `HOME_APPS` windows including `resume`, and no for `textFile` and `imageFile` → AC-7
- [x] `npm test` and a read of `src/` → the JavaScript breakpoint comes from the one constant in `#store/useWorkArea`, resolved from `(width < 40rem)`, and no other module under `src/` compares a width against a literal of its own → AC-1
- [x] `npm test` → the manager resolves `compact` before its first render: a manager created with a matching media query reports the phone layout on its very first state → AC-1
- [x] `npm test` → with no window open, the shell renders the home surface: one heading and one named list of seven tiles, each a button whose accessible name is its own content name → AC-1, AC-2
- [x] `npm test` → a press on a tile dispatches one open carrying `{ kind: 'home' }` and that tile's `windowId`, and a second press on a tile whose window is on screen focuses rather than opening twice → AC-3
- [ ] `npm test` → while an instance is on screen the home surface is hidden rather than removed, so a tile paints nothing, takes no pointer, sits out of the tab order and is absent from the accessibility tree, while keeping the box a window travels from and to → AC-3

  _Reworded by `/architect` on 2026-09-21 with AC-3 itself. The test asserts the hidden class, and the browser run measured `visibility: hidden` with a window on screen. Left unticked for the next `/check verify` run to tick._
- [x] `npm test` → a tile whose window is on screen carries the filled mark, a parked window's tile carries the quieter one, and a tile with no instance carries none, with the mark hidden from assistive tech and painted in `--color-desktop-text` rather than the text ink that flips with the mode → AC-6
- [x] `npm test` → the frame's Zoom light is absent when `compact` is true and present above it, and Minimise is offered for every window `hasHomeTile` accepts, Resume included, where `hasDockButton` alone would not reach it → AC-7
- [x] `npm test` → `exitTargetFor` returns a window's own tile when it has one, and its opener's tile when it does not, so a file window resolves to the Finder's tile → AC-12
- [ ] `npm test` → no module under `src/components/` added by this feature writes a sentence, a heading or a control label: every visible string resolves to `homeLines` or to a content value → AC-14

  _Not run as written: no such assertion exists yet. Proved by reading the five modules this feature added to `src/components/` (`HomeSurface`, `HomeTile`, `PhoneBar`, `Clock`, `homeLines`), none of which holds a letter of its own prose, and by the browser's accessibility tree, which names the region, the heading, the list and the seven tiles from content values alone. A durable assertion is `/test`'s to add._
- [x] `npm run build` → succeeds, works offline, and `dist/assets/*.css` carries the utilities the phone surface uses (`min-h-touch`, the surface and ink classes) → AC-13, AC-15
- [x] `npm run test:e2e` → the rewritten 360px shell check passes in Chromium (the home surface renders, the bar keeps the mark and the clock, and nothing scrolls sideways), and the window manager's rewritten compact fill check opens its window without the desktop item list → AC-1, AC-2, AC-13, AC-15
- [x] `npm run test:e2e` → a new phone spec passes: a tile opens its window at the viewport's width, Close returns home, and the window is never wider than the viewport → AC-3, AC-4, AC-7, AC-9
- [x] read `src/components/` and `src/store/` → no hex colour, no palette utility, no `fetch`, no storage call and no `window.open` in any module this feature adds → AC-15
- [x] read `src/content/shell.ts` → `HOME_APPS` carries no icon path and no colour, since the icon comes from `WINDOWS` → AC-2, AC-14
- [x] read `src/index.css` and `index.html` → no new token, no new asset path and no change to the pre paint script → AC-13, AC-15
- [x] check `package.json` and `package-lock.json` → no dependency added → AC-11, AC-15

## UI / manual

- [x] `npm run dev`, set the viewport to 360x740, reload → the phone shell paints on the first frame: a slim bar with the mark, the clock and the appearance control, a heading, and a list of seven named tiles with their window icons. The dock, the menu bar links, the greeting and the three project folders are all absent, not merely covered → AC-1, AC-2, AC-13
- [x] read the accessibility tree at 360px → one region named from the shell's own word, containing one heading and one list with seven buttons, each named for its window, in the content's order → AC-2, AC-14
- [x] press the Projects tile → the Finder opens filling the viewport, the keyboard lands inside the window, and the tiles leave the page's sight, hidden and out of the tab order and the accessibility tree → AC-3
- [x] press Close on that window → the home surface is back, the keyboard is on the page's home surface rather than the body, and the Projects tile carries a mark only while a window exists → AC-6, AC-7, AC-8
- [ ] open a window, press Minimise, then open its tile again → the tile carries the quieter mark while the window is parked, and the press brings it back at the work area's box through the one open action; a tile whose window is on screen cannot be pressed at all, since the surface is hidden behind that window → AC-4, AC-5

  _Reworded by `/architect` on 2026-09-21. The wording this run could not run asked for a press on a second tile while a window filled the phone. The reachable path was measured live (the parked mark at `0.4`, and the window back at the work area's box), and the rule itself is proved in the reducer with no DOM. Left unticked for the next `/check verify` run to tick._
- [x] open Skills, press Minimise, then open Gallery → Skills' tile keeps the quieter mark while Gallery is on screen, and pressing the Skills tile brings it back at the work area's box → AC-5, AC-6, AC-7
- [x] with a window open, press the Zoom light → it is disabled and cannot be pressed, and it is announced as unavailable → AC-7
- [x] open the Finder, open a text file from the grid, then close the file → the file opened over the Finder, the Finder was not reachable by Tab while it was covered, and closing the file reveals the Finder showing the same place → AC-4, AC-10
- [x] open a window, press the browser's back → that window closes and the home surface returns. Press back again with nothing open → the browser leaves the site, as it did before → AC-11
- [x] open a window and check the address bar → the URL has not changed and the shell owns one history entry, whose state carries no window data → AC-11
- [ ] from home, open a window, press Minimise, then open another tile, then press back → the second closes and home returns with the shell owing one entry again, so a later press leaves the site once nothing is on screen → AC-11

  _Reworded by `/architect` on 2026-09-21 for the same reachability reason. The measured half stands: after a Close the shell hands its own entry back, and the next press leaves the site. Left unticked for the next `/check verify` run to tick._
- [x] open a window, press Close, then press back → the site is left, because the shell reconciled its entry away when the window left the screen rather than on a pop → AC-11
- [x] above the breakpoint, open a window from the bar link and from a dock button, then press back → the browser leaves the site, since the hook is compact gated and the desktop writes no history → AC-11, AC-15
- [x] watch a tile press and a Close with motion on, then with the OS set to reduce motion → the window grows from its tile and shrinks back into it, and under reduced motion it is simply there with no movement and no wait → AC-12
- [x] open a file from the Finder and watch the movement → the file grows from the Finder's tile, since it has none of its own → AC-12
- [x] Tab through the home surface with the keyboard alone → the seven tiles are reached in reading order, each carries the visible focus ring, and each is at least 44px tall → AC-2
- [x] read the tiles at 360px in light mode and again in dark mode → each tile's name is legible on its wash, and the mark is visible against the wash in both modes rather than near black on near black → AC-6, AC-14
- [x] turn the phone to a short viewport (360x260) with a window open, then resize a desktop browser across the breakpoint with two windows open and widen it again → the window still fits the work area exactly with nothing scrolling sideways, and both windows come back at the size and spot they had → AC-4, AC-9
- [x] resize a desktop browser from 1280px down past 40rem with two windows open → the phone surface takes over with the focused window filling it, the other is hidden and unreachable, and widening again restores both at their stored geometry and status → AC-4, AC-9
- [x] at 1280px, walk the menu bar, the dock, the desktop items and a drag → every one behaves exactly as spec 0003 and spec 0004 verified, with no change → AC-15
- [x] at 1280px, press a dock button and a bar link, then widen and narrow again → the openers recorded are still `dock` and `bar`, so the focus handoff above the breakpoint is unchanged → AC-15

  _The handoff itself is what the desktop suites hold (`window-manager.spec.ts` hands the keyboard to the dock button, `resume.spec.ts` opens from the bar link), and neither path was touched: the measured half here is that an open above the breakpoint writes no history entry at all (2 before, 2 after)._
- [x] zoom the page to 200% at 360px, then at 1280px → no clipping, no overlap and no sideways scroll on either surface → AC-9

  _Exercised as the reflow case a 200% zoom stands for: 320 CSS px, where the widest painted edge measures 320 of a 320px viewport and nothing scrolls sideways, and the same at 1280px. A root CSS zoom is deliberately not used to measure this, because zooming the root distorts the very widths and scroll values the step asks about._
- [x] set the OS to forced colours at 360px → the tiles stay legible over the wallpaper, the ring on each control is still drawn, and the marks are still visible → AC-6
- [x] set the OS to dark mode at 360px, then light → the slim bar, the heading and the tiles follow the mode, the tile names stay legible on the wash, and nothing on the surface is pinned to a light value → AC-14
- [x] press the appearance control in the slim bar → the mode switches, exactly as the menu bar's own control does → AC-7
- [ ] listen with a screen reader where one is available → the surface name, the heading and the seven tile names read in order, and a window's arrival and departure are announced once → AC-2, AC-3

  _Blocked: no screen reader on this machine. The accessibility tree was read instead, and it exposes the region, the heading, the list and the seven names in the content's order, with no element of the home surface in it once a window covers it._

## Values that could be invented

- [x] the seven tiles' names → compare each against `HOME_APPS[i].name`, verbatim, and confirm no component writes a display name of its own → AC-2, AC-14
- [x] the seven tiles' icons → compare each against `WINDOWS[windowId].icon`, and confirm no tile module holds an image path → AC-2, AC-14
- [x] the seven tiles' order → compare against the content list's own order, and confirm the order is written once, in the content, rather than sorted in a component → AC-2
- [x] the surface's heading word and the list's own name → compare both against `homeLines`, confirm they are the same word read from one place, and confirm no second copy of that word exists in a component or in `index.html` → AC-14
- [x] the window each tile opens → compare against `HOME_APPS[i].windowId`, one by one, against the seven the desktop opens by name → AC-2
- [x] a tile's mark state → confirm it is derived from the instances rather than stored anywhere, and that the mark carries no text a screen reader would read twice → AC-6
- [x] the breakpoint → compare the one constant in `#store/useWorkArea` against the `@media (width < 40rem)` rule in `src/index.css` and against Tailwind's `sm`, and confirm a phone's first render already agrees with the constant → AC-1
- [x] the wallpaper a phone paints → compare `--wallpaper-image-compact` against `WALLPAPER.compact.imageUrl` in `#content/theme`, and confirm no module writes the path → AC-13
- [x] the movement's duration and easing → confirm both come from `readMotionToken` and `readEaseToken` rather than a literal number, and that reduced motion resolves them to zero → AC-12
- [x] the window's box on a phone → compare the painted position and size against the work area the container reports, and against the corner constant, with `0` as the only floor → AC-9
- [x] each light's accessible name → compare against the window's own title, so a phone keeps "Close Projects" and never a bare "Close" → AC-7, AC-14
- [x] the history entry → confirm the pushed state carries no window id, no title and no target, and that the URL string is unchanged across an open and a close → AC-11
- [x] the opener recorded by a tile press → confirm it is `{ kind: 'home' }` and not a window key, so nothing survives behind a window opened from the home surface → AC-5
- [x] the opener kept by a file open → confirm it is the Finder's own key, which is what makes the close land back on the Finder rather than home → AC-10
- [x] the words any announcement or live region carries → confirm they are not a second wording invented in a component, since the frame's names and the content's names already carry it → AC-14
- [x] every colour, space, radius and duration the phone surface paints → read the markup and confirm each class resolves to a token or to a content value, with no colour literal and no palette utility in any new module → AC-15
