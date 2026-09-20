# Verify: projects window · spec 0005 · created 2026-09-20

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

The window reads the tree that spec 0001 authored and sits inside the frame and the manager that specs 0002 to 0004 built, so every step below drives the real desktop with the real content. Nothing here needs a fixture: three projects, four locations and sixteen files are already in the content layer.

## Commands

- [x] `npx tsc -b` → clean, with no `any`, and the widened `WindowBodyProps` reaches every entry of `WINDOW_BODIES` without a cast → AC-13
- [x] `npm run lint` → clean → AC-3, AC-13
- [x] `npm test` → the content suite holds the project contents rule and fails naming a project when one of the four kinds is removed by hand, and the place helpers, the history rules and the three components' suites pass → AC-1, AC-2, AC-4, AC-5, AC-15
- [x] `npm run build` → succeeds, and `dist/assets/*.css` holds the utilities the window uses, so a class written only in a `.ts` content file is still emitted → AC-14
- [x] `npm run test:e2e` → `e2e/projects.spec.ts` passes in Chromium → AC-1, AC-3, AC-5, AC-6, AC-7, AC-12
- [x] read `src/content/types.ts` → the folder schema and all four file schemas carry no `position`, and `placeSchema` is a union of exactly two kinds → AC-2, AC-15
- [x] read `src/windows/projects/projectHistory.ts` → the push rule, the pop rule and the default place are pure functions that import no React, and a push of the place already on top returns the same array → AC-5
- [x] read `WINDOW_BODIES` → all nine window ids still have a body, and the `projects` entry declares its scope, its title bar control and its body → AC-13
- [x] search `src/windows/**` for `window.open` → no hit, because a link file renders as an anchor → AC-7
- [x] search `src/windows/**` for `localStorage`, `sessionStorage` and `document.querySelector` → no hit, so the body reads the content layer and nothing else → AC-13

## UI / manual

- [x] `npm run dev`, press the dock button for Projects → the window opens showing `Work`, with the four locations in the sidebar and the three project folders in the content area → AC-1
- [x] press the `Projects` menu bar link with that window already open → the same window is focused, not a second one, and it still shows `Work` → AC-1
- [x] open a project, then press the dock button → the window comes back to the `Work` folder list and the title bar reads `Work`, because the resolver turns a bare open into the `work` location → AC-1, AC-2
- [x] press a desktop project icon → the same Projects window is focused and re-targeted, and its title bar now reads that project's own name → AC-2
- [x] press a sidebar location → the title bar reads that location's own name and the content area swaps to its items → AC-1, AC-2
- [x] press each of the four locations in turn → Work shows three folders, About me shows four files, Resume shows the resume file, Trash shows the two leftover images → AC-1
- [x] press each row and icon with the keyboard alone → every one is reachable with Tab, carries a visible focus ring, and is announced with its own name, and the link files and the resume are anchors rather than buttons → AC-3, AC-7
- [x] press the `Nike Ecommerce Website Application` folder → the detail view shows the project's name, then its paragraphs, then its files as icons → AC-4
- [x] open the About me location's `about-me.txt` → the text window shows its subtitle above the paragraphs, and its title bar reads the file's own name → AC-6
- [x] open a project's screenshot file → the image window shows the image whole with its `alt` text as a visible caption → AC-6
- [x] press a project's live link and its source link → each opens in a new tab, no window is added, and the focused window does not change → AC-7
- [x] press the resume file from the Resume location → the same new tab behaviour, pointing at the `/files/` path → AC-7
- [x] with the keyboard, focus a link and press Enter → the tab opens, so the anchor is a real link and not a button wearing a link's clothes → AC-7
- [x] press a folder, then press Back → the previous place comes back, and the Back control's accessible name named the place it would return to before it was pressed → AC-5
- [x] press Back until it disappears → it is absent once there is nowhere to go back to, and the first place is showing again → AC-5
- [x] open a project from a desktop icon while another project is showing, then press Back → the place that was showing before the desktop press comes back → AC-5
- [x] press the same sidebar row twice → nothing is pushed, the window does not change, and one Back press still leaves the window → AC-5
- [x] press a folder with the keyboard and watch focus → it lands on the content region, the next Tab walks the new content, and a screen reader announces the new place → AC-11
- [ ] open the window and watch focus without pressing anything → focus stays where spec 0004 put it, on the frame, since the move fires on a place change only → AC-11
- [x] check the selected mark → exactly one sidebar row is marked, the location showing or the project showing, and the mark is visible in light and dark mode → AC-10
- [x] empty a location by hand in `src/content/locations.ts`, reload → the body shows the quiet line naming the place rather than an empty area, then restore the file → AC-8
- [x] blank an image file's `imageUrl` by hand, reload → the grid item keeps its place, and the image window shows the file's name, the `alt` text and the quiet line, then restore the file → AC-9
- [x] `npm test` → a store case dispatches `open` with a file id that is not in the tree and the state comes back unchanged → AC-8
- [x] narrow the browser below the compact breakpoint with the Projects window open → the sidebar becomes a row of icons across the top and the grid keeps the window's full width → AC-12
- [x] check the same window at 360px → nothing scrolls sideways and a long project name wraps to a second line instead of clipping → AC-12
- [x] open the document in dark mode and repeat the sidebar, detail view and file window steps → every surface reads, the marks stay legible, and no colour is hardcoded → AC-14
- [x] minimise the Projects window while a project is showing, then restore it from the dock → it comes back showing that project, since the place lives in the manager's target → AC-5, AC-13
- [x] set the OS to reduce motion and repeat the open, browse and file window steps → each reaches its end state with no movement, and no window is left half animated → AC-14

## Values that could be invented

Every row of the spec's Value sourcing table, checked rather than assumed.

- [x] the place a bare open lands on → press the dock button and confirm `Work`, and read `DEFAULT_PLACE` in `projectHistory.ts` → AC-1
- [x] the sidebar's order → compare the four rows against `locationIdSchema.options` and confirm they match the union's order, not an alphabetical sort → AC-1
- [x] a sidebar row's name and icon → compare each against `LOCATIONS[id]` → AC-1
- [x] the project list under Work → confirm the three rows are `LOCATIONS.work.children` filtered to folders, so a file in that location never appears as a project → AC-1
- [x] a grid item's label and icon → compare against the entry in the content layer, and confirm a long name wraps rather than truncating mid word → AC-3, AC-12
- [x] the title bar's text → press a project and a location and read the title bar against the entry's own `name` → AC-2
- [x] the Back control's name → hover or inspect it before pressing, and confirm it names the place it returns to, including when the place below is a project → AC-5
- [x] the project heading → compare against `ProjectFolder.name` → AC-4
- [x] the pitch's subtitle and paragraphs → compare against the project's one text file, and confirm no second copy of the words exists in a component → AC-4, AC-6
- [x] the screenshot's source and caption → compare `imageUrl` and `alt` against the image file entry → AC-6
- [x] the lines for an empty place and a missing asset → read the component and confirm the wording is a literal there and the name comes from the content entry → AC-8, AC-9
- [x] every colour, space, radius and shadow → read the new markup and confirm each class resolves to a token declared in `src/index.css`, and any new pair appears in `src/lib/tokens.test.ts` → AC-14
- [x] the content region's accessible name → compare against the place's `name`, the same lookup the title bar uses → AC-11
- [x] the history's top entry → press two places and confirm the top of the stack is the place showing, then press Back and confirm the stack popped exactly one → AC-5
- [x] the project's four kinds → read `src/content/locations.ts` and confirm each project holds one `text`, one `image`, one live `link` and one source `link`, the source one being the file whose id ends in `-source` → AC-15

## Acceptance-criteria coverage

- AC-1 → the dock, menu bar and location steps, the sidebar order rows, and the e2e open
- AC-2 → the project and location press steps, the title bar row, and the resolver command row
- AC-3 → the keyboard walk, the grid label row and the lint row
- AC-4 → the folder press step and the pitch rows
- AC-5 → the Back steps, the repeated row press, the outside entry step and the history row
- AC-6 → the text and image window steps, and the pitch comparison
- AC-7 → the link and resume steps, the Enter step and the `window.open` search
- AC-8 → the emptied location step and the store case for an absent file id
- AC-9 → the blanked `imageUrl` step
- AC-10 → the single selected mark step, in both modes
- AC-11 → the focus move step and the region name row
- AC-12 → the compact and 360px steps, and the grid label row
- AC-13 → the typecheck, the registry read, the storage search and the restore step
- AC-14 → the build command, the dark mode pass, the reduce motion pass and the token row
- AC-15 → the content suite command, the schema read and the four kinds row
