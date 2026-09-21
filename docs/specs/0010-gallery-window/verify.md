# Verify: Gallery window · spec 0010 · created 2026-09-21

_Steps derived from spec 0010. `/check verify` runs these; `/test` locks the durable ones._

The window is proved three ways: by the unit suites (the state machine, the words, the body and the registry baseline), by driving the real desktop in Chromium from the dock and from the phone tile, and by the three facts a headless run cannot show: what the browser paints for an image that never loads, what the accessibility tree is named, and what a screen reader reads as the viewer opens. No fixture is needed beyond the content already in `ALBUMS`; the photographs themselves are still to be added (follow up in the spec).

## Commands

- [x] `npx tsc -b` → clean, with no `any`, `WINDOW_BODIES` still covers every window id, and `GalleryWindow` typechecks against the body props → AC-1, AC-13, AC-14
- [x] `npm run lint` → clean → AC-13
- [x] `npm test` → `firstAlbum` answers the head of a list and `null` for an empty list; `albumAt` answers the album an id names and `null` for an id it does not → AC-15
- [x] `npm test` → `stepPhoto` wraps at both ends and answers a valid index for every step, for an album of one photo and for an album of several → AC-6, AC-15
- [x] `npm test` → `useGalleryState` seeds with the first album and no photo open, a press on an album row sets the album and closes the viewer in the same transition even when the album does not change, and a step from the last photo lands on the first → AC-2, AC-6, AC-7
- [x] `npm test` → the body renders one `WindowStage`, one named content area named for the album, the sidebar with every album, and one list item per photo of the album showing → AC-2, AC-3, AC-4
- [x] `npm test` → a press on a tile renders the viewer, the panel carries the photo's alt text as its accessible name, the caption is present and hidden from assistive tech, and the image inside carries no alt of its own → AC-5
- [x] `npm test` → closing the viewer removes the panel and leaves the tile for that photo focused → AC-6
- [x] `npm test` → the panel answers Escape and the two arrows itself, so a key press on the panel closes the viewer without reaching the frame, and the frame still closes the window while no viewer is open → AC-6
- [x] `npm test` → the two arrows step the open photo inside the album and wrap at both ends, and no previous or next control is rendered → AC-6
- [x] `npm test` → the panel is focusable, sits out of the tab order, and traps nothing: a Tab from the panel reaches the close control → AC-5, AC-6
- [x] `npm test` → the announcement is set on every change of the open photo, on a step as well as on an open → AC-5
- [x] `npm test` → the frame keeps `WINDOWS.gallery.title` while the content region is named by the album, so the two read differently on purpose → AC-3
- [x] `npm test` → an album change moves focus to the content region, a press on the album already showing moves nothing, and the first render moves nothing → AC-2
- [x] `npm test` → two tiles of one album hold their own failed state, so one asset raising `error` leaves the other tile drawing → AC-9
- [x] `npm test` → an album with no photos renders the quiet line naming the album and no list; a tile whose image raises `error` renders the quiet line and stays in the list → AC-8, AC-9
- [x] `npm test` → the viewer for a photo whose image raises `error` shows the alt text and the quiet line, with no broken image → AC-9
- [x] `npm test` → the registry baseline passes for every entry of `WINDOW_BODIES`, including `gallery`, and no module under `src/windows/gallery/` carries a hex colour or a palette utility → AC-13
- [x] `npm run build` → succeeds, and `dist/assets/*.css` carries the surface and state utilities the window uses → AC-13
- [x] `npm run test:e2e` → `e2e/gallery.spec.ts` passes in Chromium → AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, AC-8, AC-11
- [x] read `src/windows/gallery/` → no request, no `fetch`, no storage call, no clipboard call and no manager action: the photos come from `#content` and nothing leaves the page → AC-14
- [x] search `src/windows/**` for `navigator.` and `localStorage` → no hit → AC-14
- [x] search `src/index.css` for `#photos` → no hit, and `design.md`'s reference only paragraph records that it retired → AC-13
- [x] read `src/content/`, `src/store/` and `src/components/Window.tsx` against the last commit → no schema, entry, content rule, manager action, target kind or frame behaviour changed by this feature → AC-14
- [x] read `src/windows/WindowBody.tsx` → `gallery` carries a `Body` and neither a `Lead` nor a `Scope` → AC-1
- [x] read `src/windows/gallery/galleryLines.ts` → every literal the window shows is there, and no component holds one → AC-8, AC-9

## UI / manual

- [x] `npm run dev`, then press the dock's Gallery button → the window opens on the first album, the sidebar lists all five albums, and the content area is headed with that album's title → AC-1, AC-3
- [x] press each album row in turn → the row pressed takes the mark, the mark leaves the previous row, the heading changes with it, and the four empty albums show the quiet line naming them → AC-2, AC-8
- [x] press a photo → the viewer opens inside the window, the picture draws whole, and the caption under it reads the photo's own alt text → AC-5
- [x] press the left and right arrows in the viewer → the photo changes, and stepping past the last photo lands on the first and the other way round → AC-6
- [x] press Escape with the viewer open → the viewer closes and the window stays; press Escape again → the window closes, exactly as spec 0004 gives it → AC-6
- [x] press Close in the viewer → the viewer closes, and the next Tab moves to the tile of the photo that was on screen → AC-6
- [x] with the viewer open, press another album row → the viewer closes and the new album's grid shows → AC-7
- [x] with the keyboard alone, Tab from the frame → every album row and every tile is reachable in reading order, and each carries the visible focus ring → AC-4
- [x] with the viewer open, Tab → the close control is reachable and announced with its own name, and the panel itself is not in the tab order → AC-5, AC-6
- [x] with the viewer open, Tab through the whole window → focus leaves the panel, reaches the close control, and carries on through the window's own controls back to the sidebar rows: nothing is trapped → AC-6
- [x] press each album row with the keyboard → the chosen album shows and focus lands in the content region, so the next Tab walks the first tile; press the album already showing → nothing moves → AC-2
- [x] read the frame's accessible name while an album other than the first shows → it reads Gallery, and the content region inside it reads that album's own title → AC-3
- [x] read the accessibility tree with the viewer open → the panel is named by the photo's alt text, the image inside it is not named a second time, and the caption is not exposed → AC-5
- [ ] listen with a screen reader where one is available → opening a photo is announced once, through the stage's one live region, naming the position in the album → AC-5
- [x] open the window and close it at once, several times → no console warning about a state update on an unmounted component → AC-2
- [x] rename one of the photo files under `public/images` by hand, reload, open its album → that tile keeps its place and shows the quiet line, the other tiles are unaffected, and pressing it shows the alt text and the quiet line rather than a broken frame; then restore the file → AC-9
- [x] open an album of four photos at a tall window height, then at a short one → the grid flows in as many columns as fit, every tile is square, and the content area alone scrolls → AC-11
- [x] narrow the window below 40rem, then to 360px wide → the sidebar becomes one row of icons across the top, the grid keeps the full width, every control stays at least 44px, and nothing scrolls sideways → AC-11
- [x] open the window in light mode, then in dark mode → the sidebar, the grid and the viewer read in both, and the marked row and the focus rings are legible in both → AC-13
- [x] set the OS to forced colours and open the window → the marked row, the tiles and the ring on the close control stay legible → AC-13
- [x] set the OS to reduce motion and open the window, then open and close the viewer → nothing inside the window moves, in either setting → AC-12
- [x] open the Gallery from a phone sized viewport's home tile → the window fills the work area, the sidebar is one row of icons, the grid fits the width, and Close on the window returns home → AC-1, AC-11
- [x] open the Projects, Skills, Resume, Contact, text file and image windows after this change → each behaves exactly as spec 0005, 0006, 0007 and 0008 verified → AC-13, AC-14

## Values that could be invented

- [x] the album the window opens on → compare against the first entry of `ALBUMS` in `src/content/gallery.ts` → AC-1
- [x] each sidebar row's icon and title → compare against that album's own `icon` and `title`, with no transformation → AC-2
- [x] the content area's name and heading → compare both against the album showing its own `title` → AC-3
- [x] each tile's accessible name → compare against that photo's own `alt` in the content layer → AC-4
- [x] the viewer panel's accessible name and the visible caption → compare both against the same photo's `alt`, verbatim → AC-5
- [x] the announcement when a photo opens → compare against the position, the album's photo count and the same `alt` → AC-5
- [x] the empty album line → compare against the album's own `title`, with the album naming itself → AC-8
- [x] each tile's image path → compare against that photo's own `imageUrl`, with no rebasing and no prefix → AC-10
