# 0007. Adopt the browser's own PDF viewer for the Resume window

**Date**: 2026-09-21
**Status**: Accepted

## Summary

The Resume window shows the resume itself, drawn by the PDF viewer the browser already carries, with one download control beside the file's name. There is no new library and no second copy of the resume in the content layer: the window reads the file entry the content layer already holds. A small check at the edge decides whether the file is served, so a missing file becomes a clearly worded line instead of a broken window, and a browser that cannot draw the document is handed the download instead. The window also settles the page's ink in dark mode, the item spec 0002 left open for it.

## Requirements

**User stories**:

- As a recruiter, I want to read the resume inside the desktop and take the file with me, so that I never have to go hunting for it.
- As a visitor on a phone, I want the download offered when the document cannot be drawn, so that the window is never a dead end.
- As a keyboard or screen reader user, I want the document announced and the download reachable and named, so that the readable half is not a pointer only thing.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The Resume window opens from the desktop Resume icon and from the menu bar Resume link and shows the resume inside the window without leaving the page (no new tab, no navigation). The file's name and path come from the content layer, and no path is written anywhere in the window's own modules.
- **AC-2**: Once the check answers that the file is served, the window shows a file row above the document, carrying the file's own name and one download control. The control points at the same path as the entry, saves the file under the entry's own name, is reachable in reading order with the visible focus ring and an accessible name saying what the press does, and keeps at least `--spacing-touch` (44px) of height on a small screen.
- **AC-3**: The window never leaves a hole, and never shows something it does not yet know to be true. While the check is in flight the body holds neither the file row nor a document nor a line, so a download control cannot appear for a file that has not been confirmed. An answer that arrives after the window is gone changes nothing: no state update after unmount, and no console warning.
- **AC-4**: Each failure has its own state and its own words, and none of them throws and none leaves a broken frame. When the check answers that the file is not served, the window shows one shared quiet line naming the file and offers no download. When the request itself fails, it shows its own line for that case. When the content layer holds no resume file at all, so there is no name to use and no path to check, it shows the line for that case, which names no file.
- **AC-5**: A browser that cannot draw the document inline shows the embed's own fallback content, holding a line for that case and the download control, rather than an empty area. That download is the fallback's own anchor, which the browser renders only when it cannot draw the document, and every line comes from the window's one words module.
- **AC-6**: The embed carries the file's own name as its accessible name, through one mechanism alone (`aria-label`, with no `title` attribute repeating it), and the file row stays before the document in reading order.
- **AC-7**: The body follows the window body standard (spec 0006) exactly: one `WindowStage` with one named content area, tokens only, no colour literal or palette utility in the window's own modules, the `#resume` reference block deleted from `src/index.css` in the same change, and the registry baseline test green for every entry of `WINDOW_BODIES`.
- **AC-8**: The page carries its own fixed ink. `--color-surface-paper` stays white in both modes, and three new names, `--color-text-on-paper`, `--color-link-on-paper` and `--color-divider-on-paper`, are declared once in the theme block, never overridden by `[data-theme='dark']`, and never listed in the suite's `MODE_DEPENDENT` set. The ink and action pairs are held in both modes, the ring on the page is drawn from the page ink over the paper (already above the 3:1 a ring needs), the shared quiet line keeps its own surface and ink so a failure still reads on the page, and `design.md`'s open item about the resume's ink is closed.
- **AC-9**: In a narrow window (360px wide) nothing scrolls sideways, the file row wraps or truncates the file's name rather than clipping the download control, the download control keeps at least `--spacing-touch` of height, and the document area keeps the rest of the frame's height rather than a fixed ratio.
- **AC-10**: Nothing else moves. The Finder's `Resume.pdf` still opens the file out of the app exactly as spec 0001 and spec 0005 shipped it, and no window manager action, content rule, frame behaviour or window entry changes.

## Decision

**Chosen option**: Option 1, the browser's own viewer embedded in the window, one download control, and a check at the edge.

The Resume window is a document window. Its body reads the resume file's name and path from `#content`, draws the file in the browser's own PDF viewer inside its own named content area, and offers one download control beside the file's name. One check at the edge decides whether the file is served, and its answer is a value: the window shows the document once the file is confirmed, or one quiet line for the state it is in, whether the file is not served, the request failed, or the content layer holds no resume file to read at all. A browser that cannot draw the document lands on the embed's own fallback content, which carries the same words and its own download. Nothing animates inside the window.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `illegal-states` (`.copilot/skills/illegal-states/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

No new entity, no new field, no new schema, no new id, and no migration. The window reads one entry that already exists (spec 0001): the `pdf` file in `LOCATIONS.resume`.

| Field it reads | Type | Where it comes from | What it is used for |
|---|---|---|---|
| `name` | string, required | the existing `pdf` entry, `Resume.pdf` | the file row's label, the embed's accessible name, and the name the download saves as |
| `href` | string, required, a same origin `/files/` path | the same entry | the path the document is drawn from, and the download's target |
| `kind` | `'pdf'` | the same entry | the check that the reader resolved the file rather than another entry |

One new named reader (`findResumeFile`) reaches the entry, so no body walks the tree. Its failure is a state rather than a throw: a tree that holds no resume file puts the window in the `absent` state below, which is why the window names no file in that one case.

**State transitions**:

Five states, and no way back out of four of them. A second attempt on the same window is not offered (see Consequences). The body renders the page, its row and the document in `ready` alone; `checking` renders nothing at all, and each failure state renders the quiet line on the page, with no row and no download.

```text
no resume file in the content layer  → absent
checking → ready        the check answers that the file is served
checking → missing      the answer is not ok: the file is not in the site
checking → unreachable  the request itself threw, or there is no fetch to call
```

**Interface surface**:

| Surface | Kind | Key inputs | Key outputs | Failure |
|---|---|---|---|---|
| `findResumeFile` | content read, `#content/reads.ts` | none | `Result<PdfFile, LookupFailure>` | `{ kind: 'notFound', collection: 'files', id: 'resume-pdf' }` when the tree holds no resume file, or holds one that is not a pdf |
| `checkFileIsServed` | edge function, `src/lib/files.ts` | `href: string` | `Promise<Result<string, FileCheckFailure>>`, carrying the href that answered | `{ kind: 'missing' }` when the answer is not ok, `{ kind: 'unreachable' }` when there is no `fetch` to call or the request threw. The whole call sits inside one guard, so it always answers a `Result`, never throws, and always answers through a promise, which is what the registry baseline test (jsdom, no stub, a synchronous render and unmount) relies on |
| `useResumeFile` | window hook, `src/windows/resume/useResumeFile.ts` | the reader's `Result<PdfFile, LookupFailure>` | the five state union (`checking`, `ready`, `missing`, `unreachable`, `absent`) | never throws, and drops an answer that arrives after unmount |
| `ResumeWindow` | window body, `src/windows/resume/ResumeWindow.tsx` | the body props (`windowId`, `windowKey`, `target`) | the stage, the file row and the document area | none |
| `resumeLines` | words, `src/windows/resume/resumeLines.ts` | the file's name, where there is one | the four state lines, the download's visible word and its accessible name | none. The line for `absent` names no file, because the window has no name to use |
| `WINDOW_BODIES.resume` | registry line, `src/windows/WindowBody.tsx` | none | `{ Body: ResumeWindow }`, no `Lead` and no `Scope` | a window id with no entry fails the typecheck |

The body ignores the `target` it is handed: the resume is only ever opened bare (`{ kind: 'window', windowId: 'resume' }`), so the target carries nothing to read.

The embed is an `object` element rather than an `iframe`, because `object` is the one of the two that renders its own children when it cannot draw the file, which is where the fallback content lives. It is named by `aria-label` with the file's own name, one mechanism rather than two, so no `title` attribute repeats it. The fallback holds its own download anchor, since the row's anchor cannot live in two places: in a browser that draws the document the fallback is not rendered, and where it is, it carries the download and the same words. Its children stay in the DOM either way, so in `ready` the DOM holds two anchors and a test has to query the row's own.

**Value sourcing** (every value the window displays or produces, and where it comes from):

| Value displayed or produced | Source |
|---|---|
| The window's region name, `Resume` | `WINDOWS.resume.title` in `#content/windows` |
| The file's name on the row | the entry's `name`, through `findResumeFile` |
| The path the document is drawn from | the same entry's `href` |
| The name the download saves as | the same entry's `name`, verbatim, through the anchor's `download` |
| The document's accessible name | the same entry's `name` |
| The download's visible word and its accessible name | `resumeLines`, the window's own words module |
| Which of the five states the window is in | `findResumeFile`'s `Result` first, then `checkFileIsServed(href)` at the edge; the two `Result`s decide |
| The words a failure shows | `resumeLines`, keyed by the state |
| The words the one live region announces | the same line the window is showing, passed to the stage's `status` |
| The page's own colours | `--color-text-on-paper`, `--color-link-on-paper` and `--color-divider-on-paper` for the row, over `--color-surface-paper` |
| Every colour, space, radius and duration inside the window | the token layer in `src/index.css`, and for anything painted on the page the page set held by AC-8 |
| The resume's name and icon in the Finder | untouched: spec 0001 and spec 0005 keep both as they are |

**Key invariants**:

- The window paints nothing of its own on the page from a token that flips: the three page names are declared once in the theme block, are never overridden in `[data-theme='dark']`, and are never added to the suite's `MODE_DEPENDENT` set. The shared quiet line is the one exception, and it carries its own surface and ink, so no label of the window's own is painted on the paper with a flipping value.
- The two layer focus ring keeps its shape on the page, with the page ink as its outer layer and the paper as its inner, written once in a page ring utility, so no body writes a ring rule of its own. That utility joins the forced colours rule that already covers `.interactive-focus` and `:focus-visible`, or the ring would disappear where the system draws the outline.
- One window id, one body, one stage: `WINDOW_BODIES` stays a `Record` over the window id union, the body renders exactly one `WindowStage` with one named content area, and the registry baseline test stays green.
- A failure is a value: the check never throws on any path, including an environment with no `fetch`, and no state is set once the window is gone. The hook's effect cleans up by aborting its own request, so development's double invoked effect makes two requests where production makes one.
- No path is written in a component: the href comes from the content layer.
- The window adds no manager action, no frame behaviour, no `Lead`, no `Scope` and no content rule.
- Nothing animates inside this window, so no duration or easing is read; if one arrives later it goes through `readMotionToken` and `readEaseToken`.
- The body stays inside the stage's own padding; it adds no second padding of its own (spec 0006, and the stage already carries `p-5`, `@min-[40rem]:p-6` and `gap-4`).

**Security model**:

There are no accounts, no sessions, no server and no personal data beyond the portfolio's own public content, and nothing a visitor types. The one thing this window asks the browser to do is fetch a file the site already serves, from the site's own origin, and hand it to the browser's own viewer: a same origin document, with no third party frame and no cross origin request. The download is a plain anchor carrying `download` on a same origin path, so it runs no script and needs no permission. The check reads no cookie, no storage, and no query a visitor controls, and its failure is shown rather than retried in a loop.

**Configuration required**: none. No new environment variable, no credential and no third party account, so the window is added by code alone. Nothing in this decision reaches for the network beyond the site's own files.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: the desktop Resume icon opens the window, the row shows the file's name, the download anchor carries the entry's href with `download` set to the entry's name, and the document element is drawn with the file's name as its accessible name, verifies **AC-1**, **AC-2**, **AC-6**
- Nothing before the answer: with the check unresolved, the body holds no row, no document and no line, verifies **AC-3**
- The file is absent: the check answers not ok, so the window shows one shared quiet line naming the file, offers no download, and throws nothing, verifies **AC-4**
- The request fails: the fetch rejects, so the window shows its other line and still throws nothing, verifies **AC-4**
- There is no `fetch` to call, which is the environment the registry baseline test renders this body in: the check answers `unreachable` rather than throwing, verifies **AC-4**, **AC-7**
- The content layer holds no resume file: the reader answers `notFound`, the window shows the line that names no file, and throws nothing, verifies **AC-4**
- The window goes while the check is in flight: closing it leaves no state update and no console warning, verifies **AC-3**
- The browser cannot draw the document: the fallback content holds its line and its own download, asserted on the content rather than on what the browser painted, since a headless run cannot draw the plugin, verifies **AC-5**
- The registry baseline: the body renders one stage with one non empty region name and carries no colour of its own, verifies **AC-7**
- The page pairs: the page's ink and action pairs hold in both modes, the dark block overrides none of the page names, and the suite's `MODE_DEPENDENT` set lists none of them, verifies **AC-8**
- Narrow: at 360px nothing scrolls sideways and the download control is at least `--spacing-touch` tall, verifies **AC-9**
- Nothing else moved: the Finder still sends the resume file out of the app, verifies **AC-10**

## Build plan

The project builds by Tracer Bullet, so the plan stands one thin thread through every layer first (the reader, the check, the body, the registry, proved from the desktop) and then thickens it: the failure states, the embed's second net, the page's tokens, and the narrow case. There is no schema work, so no migration lands.

1. The reader and the check: `findResumeFile` in `#content/reads.ts`, with the content suite pinning it to the tree's pdf entry, and `checkFileIsServed` in `src/lib/files.ts`, unit tested against a stubbed fetch, a rejected request, a not ok answer, and an environment with no `fetch` at all. Both failures are values and no path throws, satisfies **AC-1**, **AC-4**
2. The thin thread end to end: the body, the hook, the registry line, the stage, the file row and the download anchor, drawing the document from the entry's href, proved by opening the window from the desktop icon and the menu bar link. satisfies **AC-1**, **AC-2**, **AC-6**, **AC-7**
3. The states: the five state union, the words module with one line per state, the shared quiet line for a file that is not served, a request that failed and a content layer with no resume file, nothing at all drawn while the check runs, the failure line passed to the stage's live region, and the abort that drops an answer once the window is gone. satisfies **AC-3**, **AC-4**
4. The second net: the embed's own fallback content carrying the line for a browser that cannot draw the document, plus the download, from the same words module. satisfies **AC-5**
5. The page: `--color-text-on-paper`, `--color-link-on-paper` and `--color-divider-on-paper` in the theme block, the page ring utility with its forced colours rule, the ink and action pairs held in both modes with the page names kept out of `MODE_DEPENDENT`, `design.md`'s open item closed, and `#resume` deleted from `src/index.css` in the same change. satisfies **AC-7**, **AC-8**
6. Narrow widths and the suite: the row and the document area at 360px, and `e2e/resume.spec.ts` covering the open, the download's shape, the absent file and the narrow case, with the Finder's shipped behaviour rechecked. satisfies **AC-9**, **AC-10**

## Consequences

**Positive**:

- A recruiter gets the resume readable and downloadable in one place, and the page the design system already reserved a surface for finally has its window.
- The resume stays one file. Nobody retypes a career into the content layer to keep it in step with the PDF a recruiter downloads.
- No new dependency, and the missing file becomes a state the suite can drive rather than something only a bad deploy reveals.
- The page's ink in dark mode stops being an open question, and the exclusion is held by the contrast suite rather than by memory.

**Negative / tradeoffs**:

- The readable half is a document outside the token layer and outside the registry baseline test. Its text, its contrast and what a screen reader reads inside it are only as good as the file the engineer exports, and nothing in this repo can hold a PDF to the accessibility bar.
- The window is the first place where the desktop depends on a browser feature rather than on its own code, so "it works here" is a property of the browser and the file together, and a change to either can move it. Android Chrome cannot draw a PDF inline at all.
- An embedded document cannot be themed, so part of the point of the page set is to keep the frame around it coherent. That is a small addition to the token layer for one window.
- The fallback line is shown by the browser rather than by React, so what a visitor sees in that case cannot be asserted in a headless run. Only its content can.
- The check adds one request each time the window opens, and two in development, where React invokes the effect twice.
- A visitor who lands on a failure state has no control to try again: the window is reopened instead. Deliberate, since the file ships with the site and a retry button would mostly be a button that fails.

**Neutral**:

- No content rule, no schema, no manager action and no frame behaviour changes. The Finder's resume file keeps opening out of the app, which is what spec 0001 and spec 0005 shipped.
- The window's geometry entry in `WINDOW_LAYOUT` (640 by 560, floor 340 by 300) is unchanged: geometry belongs to spec 0004, and the viewer scrolls inside whatever size the window has.
- The page set adds three names to the token layer (`--color-surface-paper` already existed) plus one utility for the ring on the page, which also has to join the forced colours rule every other ring is in.
- This is the first body with an async read. The hook stays local to `src/windows/resume` until a second window needs one.
- The window registry line needs no new part: no `Lead` and no `Scope`, so `WINDOW_BODIES` keeps its shape.

## Follow-up

- [ ] The exported PDF is the one surface this repo cannot hold to the accessibility bar. Keep it tagged, so a screen reader reads the document inside the file, and recheck that export whenever the file is replaced. A text version of the resume is the route if that ever stops being true.
- [ ] The check at the edge is the first async read in a window body. If a second window needs one, promote the hook into `src/windows` as a shared piece (spec 0006's set grows from four to five) rather than writing a second one.
- [ ] The shared quiet line paints its own surface and ink, and both flip, so a failure on the white page reads as a dark chip in dark mode rather than as page text. That is coherent, and it is worth an eye on the real screen: a page variant would be a new child spec under 0006, since rule 4 names `QuietLine` as the only mechanism for a missing thing.
- [ ] Spec 0002's verify row about the paper pairs being checked in light mode only becomes tickable once this window lands, and its `src/lib/tokens.test.ts` comment about "a window that paints on the paper brings its own ink" is now this window's page set.
- [x] `docs/specs/0001-content-data-model.md`, the flat duplicate of the umbrella, deleted on 2026-09-21. The directory spec is the only spec 0001 now, and its `Accepted` status is the one that counts. Spec 0005 and spec 0002 had both asked for this.

## Rationale

Reasoning, the options weighed, and the evidence behind them: see [rationale.md](rationale.md).
