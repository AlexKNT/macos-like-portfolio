# 0011. Adopt a Safari style articles window

**Date**: 2026-09-21
**Status**: In Progress

## Summary

The Articles window is the desktop's window for writing that is published somewhere else. It shows one heading and a list of posts, each row carrying the post's cover picture, the date it was written and its title, and the title is itself the link that opens the post in a new browser tab. The window reads the content the portfolio already carries, so it adds no schema, no dependency and no new colour name. Everything it needs already exists in the design system, which makes this window mostly words and one row rather than a new set of rules.

## Requirements

**User stories**:

- As a hiring manager, I want to see what you have written, with the date and the subject of each piece, so that I can judge your writing and read further only where something interests me.
- As a visitor on a phone, I want the same list in a window that fits the screen, so that I can read it without dragging the page sideways.
- As a keyboard or screen reader user, I want each post to be one link that names itself, so that I can pick a piece from a list of links rather than from a row of identical words.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the dock, the menu bar and the desktop items. Row 7 (spec 0004) owns the frame: its geometry, its own focus, dragging, minimising, zooming and closing. This feature adds no manager action and no frame behaviour.
- Row 9 (spec 0006) owns the shared stage, the quiet line, the staggered reveal and the rules every body follows. This window composes them and changes none of them.
- Row 13 (spec 0010) owns the gallery. The two windows share the stage and nothing else.
- This feature owns the `articles` body only.
- The content layer gains no schema, no entry, no reader and no rule. This window reads `ARTICLES` as it stands, the way the gallery window reads `ALBUMS`.
- No shell list changes: the articles window already has an entry in `WINDOWS`, an app in `DOCK_APPS` and a tile in `HOME_APPS`. The menu bar's links are left alone, so the window is reached from the dock and from a phone's home surface.
- The window has no search field, no filter, no sort control, no paging, no excerpt, no tags, no share control and no reading in place: every post opens elsewhere.
- Row 15 (archive) is not designed here.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The Articles window opens from its button in the dock and from its tile on a phone's home surface, showing one heading and the list of posts. It opens one instance, focused, never a second, and a press on the dock button or the tile while the window is already open focuses that same window.
- **AC-2**: Every post in the content appears exactly once, ordered newest first by the date each post carries, so the order comes from the dates rather than from the order the content file lists them in. Two posts sharing a date keep the order the content file lists them in, so the order is stable rather than left to the sort.
- **AC-3**: Each row shows the post's cover picture, the date it was written and the post's title, and the title is itself the link that opens the post. The row carries nothing else.
- **AC-4**: The date is printed from the stored date in one fixed English shape, `Sep 2, 2025`, by one formatter built as `Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })`, and the day printed is the day that is stored whichever timezone the visitor is in, so the date never moves by a day.
- **AC-5**: A press on a row's link opens the post outside the page, in a new tab where the browser allows it, and the portfolio page itself stays exactly where it was. Nothing else in the window leaves the page.
- **AC-6**: Each link's accessible name is the post's own title, so a screen reader's list of links names every post instead of repeating one word, and the visible words and the announced words are the same.
- **AC-7**: A cover whose image file is not there keeps its row, its place in the list and its own fixed box, and the image element stays where it is carrying the alternative text, with no error state replacing it, so the description is never lost and the row never changes height.
- **AC-8**: With no posts in the content at all, the window shows the shared quiet line in place of the list and renders no empty list.
- **AC-9**: The row keeps one shape at every window width, with the cover beside the text and the title wrapping onto as many lines as it needs, and nothing in the window scrolls sideways. The window's own floor is 380 pixels wide, so 360 is reached on a phone, where the compact fill rule gives the window the whole work area.
- **AC-10**: The rows are uncovered one after another when the window opens, and on every open, because the body unmounts when the window closes and mounts again on the next open. Under reduced motion (a system setting that asks for less movement) the reveal does not run and the finished list is there at once.
- **AC-11**: Every row's link is reachable by keyboard in reading order with the visible focus ring, and the link's own box keeps at least the touch target's height so a title short enough to fit one line is still an easy press. The cover is decoration rather than a second target, and the words on a row meet the WCAG AA contrast bar in both light and dark mode.

## Decision

**Chosen option**: Option 1, the articles window as a plain body of the shared stage, with the title as the link and the order taken from the post's own date.

One body registered by one line in `WINDOW_BODIES` (`articles: { Body: ArticlesWindow }`), composed on `WindowStage`: the heading through the stage's own heading slot, the list in the stage's one named content area, and the shared quiet line for the empty case. The window holds no state of its own, so it registers no `Scope` and no title bar `Lead`: it is a read of the content, not a machine.

The row is one shape at every width, taken from the reference build's own blog list. The cover sits in a fixed square at the left, 64 pixels (`size-16`), the value measured from the reference screenshots, painted with the surface and radius utilities the design system already carries, so no new token is needed. Beside it the text column holds the date on its own line and the title on the next, the title carrying the link colour and a hover treatment, because a title that is itself the link has to look like one. The title's link keeps at least the touch target's height so a one line title is still an easy press, and the cover is decoration rather than a second target.

The date is printed by one formatter, built once at module load as `Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })`. The fixed locale is what makes `Sep 2, 2025` the words on every machine, and the pinned UTC timezone is what keeps the printed day the stored day wherever the visitor is.

A cover whose file is not there is left to the browser. The image element stays where it is with its own alternative text, no error state replaces it, and its box is fixed so a long description cannot stretch the row. The runner up was an error state that swaps the picture for a shared quiet mark, the way the gallery's tiles do, and it was left out because it costs a state, a phrase and a second thing to test for no gain a visitor would notice.

Four small modules carry the window's own work, two more than the three the design conversation named, because the ordering and the date's words are pure functions worth testing on their own:

- `ArticlesWindow.tsx`, the body.
- `ArticleRow.tsx`, one row.
- `articlesLines.ts`, every literal a visitor reads (`headingLine`, `emptyLine`).
- `articleOrder.ts`, `newestFirst(articles)`, a copy of the list sorted newest first.
- `articleDate.ts`, `printArticleDate(isoDate)`, the stored date in English words.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `gsap-react` (`greensock/gsap-skills`, `.agents/skills/gsap-react/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

The content model does not change. This is the shape the window reads.

| Field | Type | Required | Rule |
|---|---|---|---|
| `id` | `ArticleId` | yes | the key, from the literal union in `types.ts` |
| `title` | string | yes | at least one character; the row's title and the link's own words |
| `date` | ISO date `YYYY-MM-DD` | yes | already validated by `z.iso.date()` |
| `image.imageUrl` | string | yes | a public path under `/images/` |
| `image.alt` | string | yes | at least one character; the cover's description and its fallback |
| `href` | outbound link | yes | already validated as absolute and `https://` |

Four rules come with it, all settled in the design conversation:

- A post relates to nothing else, so there is no foreign key and no cardinality: `Article` is a leaf collection, like `SOCIALS` or `TECH_STACK`.
- The list may be empty. The quiet line covers it, and nothing in the content check requires a post.
- A date in the future is allowed, so a post can be prepared ahead of the day it goes out.
- A cover file that is absent is not a build failure. The row keeps its place and its fixed box, and the image carries its own alternative text, with no error state of the window's own.

**State transitions**:

None. The window holds no state: the list it shows is a pure function of `ARTICLES`, and the ordering, the date words and the words module are all pure. Opening, focusing, minimising, zooming and closing belong to the window manager (spec 0004). The one effect is the shared reveal, which runs once per mount and does nothing under reduced motion.

**API surface**:

This is a browser only window, so the surface is its modules rather than endpoints. Every function is pure and returns a value, never a throw.

| Module | Shape | Inputs | Outputs | Notes |
|---|---|---|---|---|
| `WINDOW_BODIES.articles` | registry line | | | `articles: { Body: ArticlesWindow }`, replacing the `Placeholder` entry |
| `ArticlesWindow` | React component | `WindowBodyProps` (`windowId`, `windowKey`, `target`) | the staged window | renders exactly one `WindowStage`; the props are accepted for the shared contract and the target is not read |
| `newestFirst` | pure function | `readonly Article[]` | `readonly Article[]` | a new array, never a mutation of `ARTICLES` |
| `printArticleDate` | pure function | an ISO date string | a string such as `Sep 2, 2025` | one formatter built once at module load |
| `articlesLines.headingLine` | pure function | | the heading's words | |
| `articlesLines.emptyLine` | pure function | | the quiet line's words | |
| `ArticleRow` | React component | `readonly article: Article` | one list item | the cover, the date and the title as the link |

**Value sourcing** (every value a row shows, and where it comes from):

| Action | Value produced or displayed | Source |
|---|---|---|
| the list renders | the posts themselves | `ARTICLES` in `src/content/articles.ts`, a bundled constant |
| the list is ordered | each post's position | derived from `Article.date`, a validated ISO date, taken newest first; the file's own order is not used |
| the heading is printed | the heading's words | `headingLine()` in the window's words module (invented copy, flagged in Follow-up) |
| the date is printed | `Sep 2, 2025` | derived from `Article.date` through `printArticleDate`, in the fixed English locale, with the day read at UTC so no timezone shifts it |
| the cover draws | the picture | `Article.image.imageUrl` |
| the cover falls back | the description | `Article.image.alt`, already required by the schema |
| the title is printed | the title's words | `Article.title` |
| the link is followed | where a press goes | `Article.href`, validated as absolute and `https://` by `outboundLinkSchema` |
| the link is announced | the link's accessible name | the same `Article.title`, because the title element is the anchor, so the visible and announced words cannot drift |
| the list is announced | the list and its item count | the `ul` and `li` elements the rows are built from |
| the empty case shows | the quiet line's words | `emptyLine()` in the words module (invented copy, flagged in Follow-up) |

**Key invariants**:

- Every post in `ARTICLES` appears exactly once, and no post is invented.
- The order shown is newest first by `date`, whatever order the content file lists them in.
- Two posts sharing a date keep the content file's own order, so the list never reshuffles between renders.
- The link's accessible name equals the post's title.
- The locale and the timezone are named once, in the one formatter, and both are fixed, so no machine can change the day printed.
- The day printed equals the day stored, at every offset a visitor could be in.
- A row is never dropped from the list because its picture is missing.
- The window renders exactly one `WindowStage`, with one named content area and no second live region.
- No module under `src/windows/articles/` carries a hex colour, a palette utility or a new token, and no request, no storage call and no `window.open` appears there.

**Security model**:

The window is public and read only. It reads a bundled constant, so there is no request, no visitor data, no cookie and no storage, and no compliance scope applies. The one rule that matters is the way a link leaves the page: every anchor carries `rel="noopener noreferrer"`, so the page it opens cannot reach back through `window.opener`, and its destination is already constrained by `outboundLinkSchema` to an absolute `https://` address. Nothing else in the window can leave the page.

**Configuration required**: none. No environment variable, no secret and no third party credential is added.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: the window opens from the dock, the heading shows, and three rows follow newest first, each with a cover, a printed date, a title and a link whose destination is the post's own `href`, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**
- The order moves with the dates: a list authored oldest first still renders newest first, and a post inserted mid file lands in its date's place, verifies **AC-2**
- Equal dates hold their place: two posts sharing a date render in the order the content file lists them, and a second render answers the same order, verifies **AC-2**
- The date does not shift: `Sep 2, 2025` is the words for `2025-09-02` on any machine, and the suite run with the process timezone set to a negative offset (the Americas) prints those same words, where a naive parse would print the day before, verifies **AC-4**
- Accessible names differ: each link's accessible name is its post's title, and the three names are distinct rather than one repeated phrase, verifies **AC-6**
- Failure case: a cover whose file is not there keeps its row in its place and still carries the alternative text, verifies **AC-7**
- Empty case: with no articles at all the window shows the quiet line and renders no list, verifies **AC-8**
- Narrow: at 360 pixels wide the row keeps its shape, the title wraps rather than clips, and the window scrolls no sideways, verifies **AC-9**
- Reduced motion and the next open: with the system set to reduce motion the rows are uncovered at once and no reveal runs, and with motion on a close followed by a second open uncovers them again, verifies **AC-10**
- Keyboard, target size and contrast: Tab walks the links in reading order with the visible focus ring, the link's box measures at least the touch target's height, and the suite holds the three colour pairs the row uses in both modes, verifies **AC-11**
- Auth or permission: not applicable. The window is public and reads only. The one access rule worth a check is that a press on a link leaves the page while nothing else does, verifies **AC-5**

## Build plan

Built as a Tracer Bullet: one thin real thread through the whole window first, proved from the real desktop, then thickened a strand at a time. There is no schema change, so no migration task appears anywhere in this plan.

1. The thin thread: the registry line and a body on the shared stage, reading `ARTICLES` through `newestFirst`, printing the heading and the posts as plain rows, proved from the dock button and the phone tile. satisfies **AC-1**, **AC-2**
2. The row's anatomy: the cover's fixed square, the printed date, the title as the anchor with the new tab target, its `rel`, its touch target height and its hover treatment, and the words module with the heading in it. satisfies **AC-3**, **AC-5**, **AC-6**, **AC-11**
3. The date's words: `printArticleDate` in its own module, built on `Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })`, with the suite's boundary date case run with the process timezone set. satisfies **AC-4**
4. The quiet and the missing: the empty line through the shared `QuietLine`, and a cover that is not there keeping its row, its place, its fixed box and its alternative text with no error state added. satisfies **AC-7**, **AC-8**
5. The movement and the narrow pass: the staggered reveal through the shared `useLineReveal` and the `data-line` marker, the 360 pixel pass, the token pass on the row, and `#safari` retired from `src/index.css` with a note in `design.md`. satisfies **AC-9**, **AC-10**, **AC-11**
6. The suites: the unit tests for `newestFirst` and `printArticleDate`, the window and row tests, the words module check, the registry baseline, and one end to end spec covering the window from the dock and from a phone tile. satisfies **AC-1** through **AC-11**
7. Your own writing: the three placeholder posts, their ids in `articleIdSchema` and their placeholder covers give way to your own posts, dates, covers and links. This step deliberately carries no acceptance criterion: a post you have not written yet must not fail the verification, which is what twice happened to the contact window's own values. It is recorded in `## Follow-up` so it cannot be forgotten.

## Consequences

**Positive**:

- The writing becomes findable from the desktop: the dock button and the phone tile both open it, and the list is readable in a few seconds.
- The window adds no mechanism of its own. It reuses the stage, the quiet line, the reveal and the existing token pairs, so there is no new dependency, no new colour name and nothing new to learn.
- Each link names its own post, so the window is usable straight from a screen reader's list of links, which is where a list of identical read labels fails.
- The date is printed by one pure function in one place, so its shape cannot drift between rows, and the UTC read means no visitor sees the wrong day.

**Negative / tradeoffs**:

- The links carry a visitor off the portfolio and onto another site. That is a deliberate trade: the writing is more useful than the page view, and the new tab leaves the desktop open behind it.
- Making the title itself the link means the row has exactly one control and no separate read affordance to act as an instruction. A visitor who expects a button may not read a title as clickable, so the title needs the link colour and a hover treatment to look like one.
- There is no search and no paging. With three posts that is right, and the honest cost is that a long list scrolls and gets harder to scan. That is a deferral, not an oversight, and the reference build's search field and title bar controls are left out on purpose.
- Nothing checks that a cover file really exists, so a typo in a cover path shows up in the browser as a described placeholder rather than at build time.
- The reveal masks the rows for a moment as the window opens. The rows are in the page from the first paint, so a screen reader, a text selection and a test all read the finished list, but a sighted visitor's press can land while the mask is still opening.

**Neutral**:

- `#safari` retires from `src/index.css`, joining `#finder`, `#terminal`, `#resume`, `#contact` and `#photos`. What remains from the reference build is `#home` and `#dock`.
- The `articles` line leaves `Placeholder`, so `Placeholder` then serves `archive` alone.
- The three placeholder posts stay in the content until step 7 of the build plan, so the window ships with whatever the content holds.
- No schema change and no migration: the post shape was settled by spec 0001, and this feature only reads it.
- The window's own pure helpers (the ordering and the date) live in its folder rather than in the content layer, which is where the gallery put its album helpers too.

## Follow-up

- [ ] Your own posts: replace the three placeholder posts, their ids in `articleIdSchema` and the three placeholder cover files with your own writing, dates, covers and links. The window ships with whatever the content holds until then, and this is the one part of the feature that is deliberately not an acceptance criterion.
- [ ] Invented copy for review: the heading `My Developer Blog` and the empty line are written by hand in `src/windows/articles/articlesLines.ts`, and they are the two lines a visitor reads before any post.
- [ ] Consider a short excerpt under each title. The design conversation kept the post to its five existing fields, so this is a later content decision rather than a gap, and it would need a new field plus a line per post.
- [ ] `src/windows/AGENTS.md` gains a line for the new `articles/` folder. That is a `/sync` job, not this feature's, and it is noted here so it is not lost.

## Rationale

Reasoning, the options weighed and the evidence from the reference build: see [rationale.md](rationale.md).
