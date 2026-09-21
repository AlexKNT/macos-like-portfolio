# Rationale: the Resume window

_Part of spec [0007](index.md). This file is the decision record: the forces, the options weighed, the reasoning, and the evidence. `/develop` does not need it._

## Context

> ⚠️ Premise note: the readable half of this window is a document this repo does not control. A PDF is opaque to the token layer, to the registry baseline test and to the contrast suite, so the one surface a recruiter most wants is the one surface nothing here can hold to the accessibility bar. The wording below accepts that deliberately, and the Follow-up carries the two things that keep it honest: a tagged export, and a text version of the resume if that ever stops being true.

The resume is the first thing a recruiter looks for and the scope says so directly: it is the item recruiters want, next to the projects and a way to get in touch. It is also the only item on this desktop that is a file rather than a place: everything else the desktop shows is content the site authors (trees, text, images, links), and a resume is a document someone else reads, prints and forwards. That mismatch is the whole problem in this spec.

The content layer already knows the file: `LOCATIONS.resume` holds one `pdf` entry (`resume-pdf`, named `Resume.pdf`, served from `/files/resume.pdf`), the desktop carries an icon that opens the `resume` window, the menu bar carries a `Resume` link that opens the same window, and `openTargetFor` sends a pdf file out of the app rather than into a window. So the window exists in the manager's registry as a placeholder, and the file exists in `public/files/`, and nothing connects them yet.

Three forces shape what the connection can be. The project is front end only, with no server and no database, so whatever shows the document has to work in the visitor's browser. The project prefers no new dependency: GSAP, Tailwind, zod and the three fonts are the whole dependency list, and each earns its place. And the design system has one deliberate exception waiting for exactly this window: `--color-surface-paper` is white in both modes because a document window is a page, and spec 0002 left the decision about what ink a page uses in dark mode to this feature, because `--color-text` flips and a page does not.

The consequence of not deciding is a window that either hands the file to another tab (which the Finder's own file link already does, and which leaves the scope's "readable" half undone), or draws something the design system has no values for, which would start a second standard for surfaces rather than close the exception the first one reserved.

## Options considered

### Option 1: the browser's own PDF viewer embedded in the window (chosen)

The window draws the file with the viewer Chrome, Safari, Firefox and Edge already carry, through an `object` element pointed at the content entry's href, plus one download control and a check at the edge that decides whether the file is served.

**Pros**:

- No new dependency, and the PDF stays the single source of truth: what a recruiter reads is the file they download.
- Every page, the page count and zoom come for free from the browser, and all four major engines honour a print quality layout without any code here.
- `object` renders its own children when it cannot draw the file, so the fallback for a browser without an inline viewer is markup rather than a capability guess.

**Cons**:

- The document sits outside the token layer and outside what the suite can judge: its text, its contrast and its accessibility are properties of the exported file.
- Android Chrome does not draw PDFs inline, so a real share of phone traffic lands on the fallback rather than the document.
- The window now depends on a browser feature, so a change in a browser can move behaviour nothing in this repo controls.

### Option 2: a page rendered from structured resume content in the content layer

The resume's facts (identity, contact, experience, education, skills) become a new content family with its own schemas, and the window paints an accessible, token themed page from it. The PDF becomes the download only.

**Pros**:

- Fully accessible, themed from the token layer, testable in jsdom and in Playwright, and it works on every browser including Android Chrome.
- The page could grow a print stylesheet later, or a light and dark presentation, because it is ordinary markup.

**Cons**:

- The resume then lives twice, in the content layer and in the PDF, and the two drift the moment either is edited. For a document whose whole job is to be accurate, that is a maintenance trap.
- It is far more build work: new entities, new id unions, new reads, new tests, and an authoring burden each time the resume changes.
- The page a visitor reads would no longer be the document a recruiter downloads, which is exactly the mismatch the reference design avoids.

### Option 3: a PDF rendering library in the window

`pdf.js` (or an equivalent) draws the pages into the window, with the window's own page and zoom controls, closest to the reference screenshot's chrome.

**Pros**:

- The closest match to the reference viewer, with page navigation and zoom the window controls itself.

**Cons**:

- A new dependency of roughly a megabyte for one window, against a project whose rule is no new library unless the old tools genuinely cannot do the job. The browser's own viewer is the tool that can.
- Canvas text carries no semantics, so a text layer has to be built and kept in step for a screen reader to read anything, and the result is still weaker than the browser's own viewer.
- The most code and the most failure modes for the least new capability.

### The smaller decisions

- **Where the file row sits.** Chosen: on the page, with the page's own ink, so the whole body reads as one document. Runner up: the row on the window's own chrome surface (`--color-surface-sunken`, as a title bar is), which needs no new colour token at all and is what the reference toolbar does, at the cost of the body reading as a window with a page in it rather than as a page.
- **How absence is known.** Chosen: one check at the edge whose answer is a value, driving the state, with the embed's own children as a second net for a browser that cannot draw the file. Runner up: the embed's fallback content alone, which is less code but leaves the missing state out of React, so the window cannot name the file, hide the download, or be tested for it.
- **Whether the two failures read apart.** Chosen: two kinds, two lines, matching the clipboard's own pattern of a failure carrying its kind. Runner up: one line for both, which is less wording to keep and tells a recruiter nothing they can act on.
- **The saved name.** Chosen: the entry's own name, verbatim, so the name on screen and the name in the downloads folder are one truth. Runner up: a name built from `PROFILE` (for example `Adrian-Resume.pdf`), which needs no new content and reads better in a busy downloads folder, at the cost of the saved name and the shown name differing.
- **Why nothing animates.** Chosen: nothing. The manager's own open timeline already brings the frame in, and a document is read the moment it appears. Runner up: the masked reveal the Skills window uses, over the file row, which adds motion to a surface whose job is to be still and legible.
- **The state a missing file leaves the window in.** Chosen: a fourth failure state (`absent`), for a content layer that holds no resume file at all, worded so it names no file, because there is none to name. Runner up: reusing the words for a file that is not served, which would have meant inventing a name for a file that does not exist.
- **How the embed is named.** Chosen: `aria-label` alone, with the file's own name. Runner up: the same words on the `title` attribute as well, which is a second mechanism for one name and repeats what the `object` element's own fallback content already says.

## Rationale

The deciding force is that the resume is a document, not content. Options 2 and 3 treat it as content, which means either keeping the same facts in two places or rebuilding a document renderer inside the app. Every later edit to the resume would then have two homes, and the file a recruiter downloads would stop being the thing a visitor read. Option 1 keeps one truth and asks the browser to do the one job it already does well.

The cost of Option 1 is concentrated in the accessibility question, and it is paid honestly rather than hidden. Nothing in this repo can make an exported PDF accessible; the browser's viewer is nevertheless a better route than a canvas library, because a tagged PDF keeps its structure and a screen reader reads the document as text through the viewer, where `pdf.js` would need a text layer built here to reach the same place. The residual risk is named in Follow-up rather than papered over: the file is this repo's responsibility to export well.

The front end only constraint and the no new dependency rule both point the same way, and so does the design system: spec 0002 already reserved a surface for a document window and asked this feature to decide the page's ink, which means the coherent answer is to paint the page with values that do not flip, rather than to quietly let the window follow the mode and leave the reserved surface unused.

The check at the edge is the one piece of machinery that could be called optional. It is kept because the alternative puts the missing state in the browser's hands: a 404 inside an embed is a broken frame with no words, the window cannot hide a download that would fail, and nothing can be tested. One `Result` returning function turns that into a state the suite can drive, in the same shape the clipboard already uses.

## Evidence

### The content layer already holds the file

- `src/content/locations.ts` → `LOCATIONS.resume.children` holds one entry: `{ id: 'resume-pdf', kind: 'pdf', name: 'Resume.pdf', icon: '/images/pdf.png', href: '/files/resume.pdf' }`.
- `src/content/reads.ts` → `openTargetFor` sends a `pdf` entry to `{ kind: 'external', href }`, so the Finder's resume file leaves the app (spec 0001, AC-6; spec 0005 verified the anchor live).
- `src/content/desktop.ts` → `DESKTOP_ITEMS` carries the resume as one of four items, its target `{ kind: 'window', windowId: 'resume' }`.
- `src/content/shell.ts` → `NAV_LINKS` carries the `resume` link with `windowId: 'resume'`.
- `src/windows/WindowBody.tsx` → `resume: { Body: Placeholder }` today, so this feature replaces one line.
- `public/files/resume.pdf` exists and is about 99 KB, so the window has something real to draw.

### What the reference design shows

- `designs/lightAll-Projects and Resume Viewer.png`, `designs/darkAll-Projects and Resume Viewer.png` and `designs/mobileAll-Projects and Resume Viewer.png` show the resume as a viewer window: a file bar with the file's name, page and zoom chrome, and the document below.
- The dark reference keeps the document window light while the desktop around it is dark, which is the page exception spec 0002 recorded, and the reason the page set is fixed rather than following the mode.

### What flips in dark mode

Read from `src/index.css` `[data-theme='dark']`: `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-link`, `--color-accent`, `--color-border`, `--color-border-strong`, `--color-divider`, `--color-surface`, `--color-surface-sunken`, `--color-surface-raised`, `--color-focus-inner` and `--color-focus-outer` all change value. None of them can be painted on a surface that stays white in both modes, which is exactly why the page set exists and why the suite's existing paper pairs are light only today.

`src/lib/tokens.test.ts` already carries three pairs against `--color-surface-paper`, each marked `modes: ['light']`, with a comment saying a window that paints on the paper brings its own ink. Its reader in `src/lib/tokens.ts` only parses names matching `--color-…`, which is why the three new page names are written in that shape, and it keeps a `MODE_DEPENDENT` list of tokens that must have a dark override: the page names have to stay out of that list. `darkOverrides` is the mechanical check that they are not overridden either way.

### What the shared pieces already give

- `src/windows/WindowStage.tsx` owns the container, the `@container` context, the named `group`, the padding and the one polite live region, so a body adds content and words only.
- `src/windows/QuietLine.tsx` paints its own surface and ink (`--color-surface-sunken` with `--color-text-muted`), and both flip together. On the white page in dark mode a failure therefore reads as a dark chip with light text rather than as page text. Contrast holds (that pair is already in the suite in both modes) and the page's own ink stays for the window's own labels, which is the honest version of "the line reads on the page". A page variant of the shared line would be a new child of spec 0006, since its rule 4 names `QuietLine` as the only mechanism for a missing thing, so it is a Follow-up rather than a change here.
- `src/index.css` pins the focus ring in one place (`interactive-focus`, a 2px outline plus a 2px inner shadow) and redraws it under `@media (forced-colors: active)` beside `:focus-visible`. A ring utility written for the page therefore has to beat the base `:focus-visible` rule and join that forced colours rule, which is the part of this feature that is easiest to miss.
- `src/windows/windowBodies.test.tsx` renders every entry of `WINDOW_BODIES` and fails a body with no stage, no named area, or a colour of its own, so this window is held to the standard the moment its line lands.

### What the platform does

- An `object` element pointed at a PDF renders the browser's own viewer in Chrome, Edge, Firefox and Safari, and renders its children where the browser has no inline viewer, which is why it is chosen over `iframe`.
- Android Chrome and some desktop configurations have no inline PDF viewer, so the fallback content is a real route rather than a courtesy.
- In headless Chromium the plugin is not available, so a test run sees the fallback content. The durable evidence for a test is therefore the embed element, its `data` path and its accessible name, plus the anchor's resolved href, never which of the two the browser painted.
- An earlier project finding agrees: a local PDF opened in a new tab leaves `popup.url()` empty in headless Chromium, so the anchor's resolved href is the evidence worth asserting.
