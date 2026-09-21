# Verify: Resume window · spec 0007 · created 2026-09-21

_Steps derived from spec 0007. `/check verify` runs these; `/test` locks the durable ones._

The window is proved three ways: by the unit suites (the reader, the check, the states, the page pairs), by driving it in the real desktop in Chromium, and by the two facts a headless run cannot show: what the browser paints inside the embed, and what a screen reader reads there. No fixture is needed: the resume file is already in `public/files/` and its entry is already in the content layer.

## Commands

- [x] `npx tsc -b` → clean, with no `any`, `WINDOW_BODIES` still covers every window id, and `ResumeWindow` typechecks against the body props → AC-1, AC-7
- [x] `npm run lint` → clean → AC-7
- [x] `npm test` → `findResumeFile` returns the tree's pdf entry, and a `notFound` failure when the resume location holds nothing or holds an entry that is not a pdf → AC-1, AC-4
- [x] `npm test` → `checkFileIsServed` returns the href when the answer is ok, `{ kind: 'missing' }` when the answer is not ok, `{ kind: 'unreachable' }` when the request throws or when there is no `fetch` in the environment, and never throws itself (fetch stubbed, then removed) → AC-4
- [x] `npm test` → `useResumeFile` moves `checking` → `ready` on an ok answer and `checking` → `missing` or `unreachable` on the two check failures, and straight to `absent` when the reader answers `notFound` → AC-3, AC-4
- [x] `npm test` → unmounting the hook while the check is in flight sets no state and logs no warning → AC-3
- [x] `npm test` → the body renders one `WindowStage`, one named content area, the file's own name and one download anchor carrying the entry's href and `download` → AC-1, AC-2, AC-6
- [x] `npm test` → with the check unresolved the body holds no row, no document and no line, so the row's download anchor does not exist yet; in each failure state the body holds exactly one paragraph, the quiet line, and no row anchor → AC-3, AC-4
- [x] `npm test` → with the reader answering `notFound`, the window shows the `absent` line, which names no file, and throws nothing → AC-4
- [x] `npm test` → the embed's fallback content holds its own line and its own download anchor, read from the same words module as the failure lines, and the row's anchor is a separate element from it → AC-5
- [x] `npm test` → the registry baseline passes for every entry of `WINDOW_BODIES`, including `resume`, and no module under `src/windows/` carries a hex colour or a palette utility → AC-7
- [x] `npm test` → `src/lib/tokens.test.ts` holds the page's ink and action pairs in both modes, asserts the dark block overrides none of the three page names, and lists none of them in `MODE_DEPENDENT` → AC-8
- [x] `npm run build` → succeeds, and `dist/assets/*.css` carries the page utilities the window uses → AC-7, AC-8
- [x] `npm run test:e2e` → `e2e/resume.spec.ts` passes in Chromium → AC-1, AC-2, AC-4, AC-9
- [x] read `src/windows/resume/` → no `/files/` string, no path literal, no `fetch`, and no clipboard or storage call: the href comes from `#content` and the fetch lives in `src/lib/files.ts` → AC-1
- [x] search `src/windows/**` for `navigator.` → no hit → AC-1
- [x] search `src/index.css` for `#resume` → no hit, and `design.md`'s reference only paragraph records that it retired → AC-7
- [x] read `src/index.css` → the three page names appear in the `@theme static` block, appear nowhere in the `[data-theme='dark']` block, and the page ring utility is named in the forced colours rule beside `.interactive-focus` and `:focus-visible` → AC-8
- [x] read `design.md` → the open item about the resume's ink is closed, and the page set is named there with its pairs → AC-8
- [x] read `src/windows/WindowBody.tsx` → `resume` carries a `Body` and neither a `Lead` nor a `Scope` → AC-1, AC-10
- [x] read `src/store/windowManager.ts` and `src/content/` → no manager action, no layout entry, no schema and no content rule changed by this feature → AC-10

## UI / manual

- [x] `npm run dev`, then press the desktop Resume icon → the window opens, the file row shows `Resume.pdf`, and the document draws inside the frame with no navigation and no new tab → AC-1
- [x] press the menu bar `Resume` link → the same window, focused, never a second one → AC-1
- [ ] scroll inside the document → the browser's own viewer scrolls its pages, and the window frame itself does not scroll → AC-6, AC-9
- [x] press the download control → the file saves under the name `Resume.pdf`, and the address bar does not change → AC-2
- [x] with the keyboard alone, Tab from the frame → the download control is reachable, carries the visible focus ring, and is announced as `Download Resume.pdf` → AC-2
- [x] read the accessibility tree for the embed → its accessible name is `Resume.pdf`, and the file row comes before it in reading order → AC-6
- [ ] listen with a screen reader where one is available → the document is readable inside the viewer, and a failure line is announced once, through the stage's one live region → AC-4, AC-6
- [ ] rename `public/files/resume.pdf` by hand, reload, open the window → the quiet line for the absent file shows, no download is offered, and the frame is intact, then restore the file → AC-4
- [x] block the request for `/files/resume.pdf` in the browser's network panel (or stop the dev server's file) and open the window → the line for a request that failed shows, distinct from the absent file's line → AC-4
- [x] open the window and close it at once, several times → no console warning about a state update on an unmounted component → AC-3
- [x] drive the app in a browser without an inline PDF viewer (Android Chrome, or the viewer disabled) → the fallback content shows its line and the download control, and the download works → AC-5
- [x] empty `LOCATIONS.resume.children` by hand, reload, open the window → the `absent` line shows, naming no file, with no download and no broken frame, then restore the file → AC-4
- [ ] open the window in a browser that draws PDFs, then read the accessibility tree → exactly one download control is exposed, the row's, since the fallback's own anchor is not rendered where the document draws → AC-5, AC-6
- [x] open the window in light mode, then in dark mode → the page stays white in both, its ink, its action colour and its hairline read, and the ring on the download control is visible in both → AC-8
- [x] measure the download control's computed colours in both modes → each resolves to a page token, and the ink and action pairs clear 4.5:1 on the paper → AC-8
- [x] set the OS to forced colours and open the window → the file row, the embed and the ring on the download control stay legible, because the page ring joins the rule that redraws the ring from system colours → AC-8
- [x] set the OS to reduce motion and open the window → nothing inside it moves, in either setting → AC-7
- [x] narrow the window below 40rem, then to 360px wide → the file row wraps or truncates the name, the download control keeps a 44px target, nothing scrolls sideways, and the document area keeps the rest of the frame → AC-9
- [x] with the Resume window open, press the dock, the desktop icon and the menu bar link in turn → one window, focused and on top each time → AC-1
- [x] open the Finder, choose the `Resume` location, press `Resume.pdf` → the file still opens out of the app in a new tab, exactly as spec 0005 verified, with no window opening → AC-10
- [x] open the Projects, Skills, text file and image windows after this change → each behaves exactly as spec 0005 and spec 0006 verified → AC-7, AC-10

## Values that could be invented

- [x] the region name in the resume window → compare against `WINDOWS.resume.title` → AC-1, AC-7
- [x] the file's name on the row → compare against the entry's `name` in `LOCATIONS.resume`, with no transformation → AC-2
- [x] the embed's `data` path and its accessible name → compare both against the same entry's `href` and `name` → AC-1, AC-6
- [x] the download's `href` and its `download` value → compare against the same entry's `href` and `name`, verbatim → AC-2
- [x] the download's visible word and its accessible name → compare against `resumeLines`, and confirm the visible word is inside the accessible name → AC-2
- [x] the four state lines → compare against `resumeLines`, confirm each is named for its state and that no component writes its own words, and confirm the `absent` line names no file → AC-4, AC-5
- [x] the announcement the live region carries → compare against the line the window is showing, not a second wording → AC-4
- [x] the three page token names → confirm each is declared once in the theme block, absent from the dark block, and used by the row rather than a palette value → AC-8
- [x] which state the window shows → force each of the three answers (ok, not ok, request failed) and confirm the state follows the answer rather than a fallback → AC-3, AC-4
- [x] the file's icon and name in the Finder → confirm both are unchanged from the content layer → AC-10
- [x] every colour, space, radius and duration the window paints → read the markup and confirm each class resolves to a token in `src/index.css`, and that anything on the page uses a page name → AC-7, AC-8
- [x] the page ring → read the ring rule and confirm both layers come from page values and that no body writes a ring of its own → AC-8
- [x] the download control's height at 360px → read the computed height against `--spacing-touch` → AC-9
