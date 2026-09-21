# Verify: Articles window · spec 0011 · created 2026-09-21

_Steps derived from spec 0011. `/check verify` runs these; `/test` locks the durable ones._

The window is proved three ways: by the unit suites (the ordering, the date's words, the row, the words module and the registry baseline), by driving the real desktop in Chromium from the dock button and from a phone tile, and by the facts a headless run cannot show: what the browser paints for a picture that never loads, what the accessibility tree is named, and what a screen reader reads. No fixture is needed beyond the posts already in `ARTICLES`: the three covers really exist in `public/images`, and the empty case is reached by emptying the content by hand and restoring it afterwards.

Nothing here covers step 7 of the build plan, the engineer's own writing. That step deliberately carries no acceptance criterion, so it is not verified on this list; it is tracked in the spec's Follow-up.

## Commands

- [ ] `npx tsc -b` → clean, with no `any`, `WINDOW_BODIES` still covers every window id, and `ArticlesWindow` typechecks against the body props → AC-1, AC-3
- [ ] `npm run lint` → clean, with no component under `src/windows/articles/` holding a literal a visitor reads → AC-3
- [ ] `npm test` → `newestFirst` answers the posts newest first for a list authored oldest first, answers the input untouched, answers an empty list for an empty list, and answers one post for one post → AC-2
- [ ] `npm test` → `newestFirst` places a post inserted mid file by its own date rather than by its position in the file → AC-2
- [ ] `npm test` → `newestFirst` keeps the content file's own order for two posts sharing a date, and a second call answers that same order rather than reshuffling it → AC-2
- [ ] `npm test` → `printArticleDate('2025-09-02')` answers `Sep 2, 2025`, and a date at a year boundary (for example `2025-01-01`) answers the day it stores → AC-4
- [ ] run the date suite with the timezone set before the process starts (`$env:TZ='America/New_York'; npx vitest run src/windows/articles/articleDate.test.ts`) → the same words come back, so the printed day does not follow the machine → AC-4
- [ ] `npm test` → the body renders one `WindowStage`, one named content area, the heading, and one list item per post in the newest first order → AC-1, AC-2, AC-3
- [ ] `npm test` → each item's anchor carries the post's own `title` as its accessible name and as its visible words, the post's own `href` as its destination, `target="_blank"`, and `rel="noopener noreferrer"` → AC-3, AC-5, AC-6
- [ ] `npm test` → the three links carry three distinct accessible names, so no phrase is repeated → AC-6
- [ ] `npm test` → a cover whose image raises `error` keeps its row, keeps its place in the list, and still carries the post's `alt` text → AC-7
- [ ] `npm test` → with no articles the window renders the shared quiet line and no list → AC-8
- [ ] `npm test` → the words module answers the heading and the empty line, and no other module holds either string → AC-3, AC-8
- [ ] `npm test` → the registry baseline passes for every entry of `WINDOW_BODIES`, including `articles`, and no module under `src/windows/articles/` carries a hex colour or a palette utility → AC-11
- [ ] `npm run build` → succeeds, and `dist/assets/*.css` carries the utilities the row builds from → AC-11
- [ ] `npm run test:e2e` → `e2e/articles.spec.ts` passes in Chromium → AC-1, AC-2, AC-5, AC-9, AC-10
- [ ] read `src/windows/articles/` → no request, no `fetch`, no storage call, no clipboard call, no `window.open` and no manager action: the posts come from `#content` and the only thing that leaves the page is a press on a link → AC-5
- [ ] search `src/windows/articles/**` for `navigator.`, `localStorage` and `window.open` → no hit → AC-5
- [ ] read `src/windows/WindowBody.tsx` → `articles` carries a `Body` and neither a `Lead` nor a `Scope` → AC-1
- [ ] read `src/content/`, `src/store/` and `src/components/Window.tsx` against the last commit → no schema field, no content rule, no new window id, no manager action, no target kind and no frame behaviour changed; the one entry change is the `articles` line in the registry moving off `Placeholder` → AC-1
- [ ] search `src/index.css` for `#safari` → no hit, and `design.md`'s reference only list records that it retired → AC-11

## UI / manual

- [ ] `npm run dev`, then press the dock's Articles button → the window opens on the heading and the posts, newest first, each row carrying a cover, a date and a title → AC-1, AC-2, AC-3
- [ ] read the printed date on each row against the stored `date` in `src/content/articles.ts` → the day printed is the day stored, with no day gained or lost → AC-4
- [ ] press a row's title → the post opens in a new tab, and the desktop page is still there, unchanged, with the window still open → AC-5
- [ ] with the keyboard alone, Tab from the frame → each row's link is reachable in reading order, the link is the title itself, and each carries the visible focus ring → AC-3, AC-6, AC-11
- [ ] read the accessibility tree with the window open → the content area is a named group, the list reports its own item count, and each link is named by its post's own title → AC-6
- [ ] check each anchor's attributes in the browser → `target="_blank"` and `rel="noopener noreferrer"` are both present → AC-5
- [ ] read the three links' accessible names → all three differ, so a list of links is usable on its own → AC-6
- [ ] rename one of `blog1.png`, `blog2.png` or `blog3.png` under `public/images` by hand, reload, open the window → that row keeps its place and its own height, the image element stays where it is carrying the post's alternative text, and no error state or quiet line replaces it; then restore the file → AC-7
- [ ] empty `ARTICLES` by hand, reload, open the window → one quiet line shows in place of the list and no empty list is rendered; then restore the file → AC-8
- [ ] open the window at its default size, then narrow it to the window's own 380 pixel floor → the cover stays beside the text, the title wraps rather than clipping, and nothing in the window scrolls sideways; then open the window from a phone sized viewport's home tile and read the same at 360 pixels, where the compact fill rule has given the window the whole work area → AC-9
- [ ] with the system set to reduce motion, open the window, then close and open it again → the finished list is there at once with no reveal; with motion on, the rows are uncovered one after another → AC-10
- [ ] with motion on, open the window, close it, then open it again → the rows are uncovered again on the second open, because the body unmounts when the window closes → AC-10
- [ ] open the window in light mode, then in dark mode → the title, the date and the link read in both, and the link colour and the focus ring are legible in both → AC-11
- [ ] set the OS to forced colours and open the window → the titles, the dates and the ring stay legible → AC-11
- [ ] check the row uses no colour literal → read the built stylesheet in the browser's inspector and confirm every value on the row comes from a token → AC-11
- [ ] walk the focus ring on a row → the ring is visible against the window body in both modes, not only against the desktop → AC-11
- [ ] measure a row's link in the browser's inspector → its box is at least the touch target's height, so a title on one line is still an easy press, and the cover is decoration rather than a second target → AC-11
- [ ] open the Articles window from a phone sized viewport's home tile → the window fills the work area, the row keeps its shape, and Close returns to the home surface → AC-1, AC-9
- [ ] press the dock button twice, and the tile twice → one instance, focused, never a second window → AC-1
- [ ] open the Projects, Skills, Resume, Contact, Gallery, text file and image windows after this change → each behaves exactly as spec 0005, 0006, 0007, 0008 and 0010 verified, and none of them is affected → AC-1
- [ ] open the window and close it at once, several times → no console warning about a state update on an unmounted component, and no mask left on a row → AC-10
- [ ] listen with a screen reader where one is available → the list is announced with its item count, and each link says its own post's title → AC-6

## Values that could be invented

- [ ] the heading's words → compare against `headingLine()` in `src/windows/articles/articlesLines.ts`, and confirm it is written down once → AC-1, AC-3
- [ ] the empty line's words → compare against `emptyLine()` in the same module, and confirm it is written down once → AC-8
- [ ] each row's order → compare against the posts sorted by their own `date`, newest first → AC-2
- [ ] each row's printed date → compare against that post's own `date`, with the formatter as the only step between them → AC-4
- [ ] each row's title, and its link's visible and announced words → compare all three against that post's own `title`, verbatim and identical to each other → AC-3, AC-6
- [ ] each link's destination → compare against that post's own `href`, verbatim, with no rewriting → AC-5
- [ ] each cover's picture and its description → compare against that post's own `image.imageUrl` and `image.alt` → AC-3, AC-7
