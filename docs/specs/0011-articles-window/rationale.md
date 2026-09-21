# Rationale: Articles window · spec 0011

The decision record behind [index.md](index.md). `/develop` skips this file.

## Context

The desktop already carries an Articles app in the dock and an Articles tile on a phone's home surface, and both open the same placeholder body today. The content layer has modelled a post since spec 0001: a title, a date stored as an ISO date, a cover picture with its alternative text, and a link that must be absolute and `https://`. The three entries it holds are the tutorial author's own blog posts, which is what makes the window a shell waiting for content rather than a shell waiting for a design.

The writing itself is not going to be authored here. The scope keeps "Writing here" in its deferred list, so this window's job is to point at writing published elsewhere. That shapes everything: there is nothing to read in place, nothing to paginate and nothing to fetch. A recruiter scanning the desktop is the reader, and the writing is evidence of communication, so the window's whole job is to make the list findable and each piece one press away, without pulling the visitor off the desktop for good.

> ⚠️ Premise note: the scope labels this window Safari style, and the reference build carries a search field plus share, add and copy controls in the title bar, with a second search field at the bottom on the phone. None of that is built here, on purpose. Three posts do not need a search, and the scope's own done line asks for the list, the date, the title, the opens in a new tab rule and links that read well. Building that chrome first would ship a control with no user in it, which is exactly what a desktop looking portfolio cannot afford: every window has to be a real window. If the writing ever grows past a screenful, a search belongs in its own feature, with its own empty state, its own clear control and its own words.

The design system has almost everything the window needs already. `WindowStage` gives it the container query, the one named content area, the heading slot and the single polite live region. `QuietLine` is the one way a window shows a thing that is missing. `useLineReveal` uncovers marked lines in document order and does nothing at all under reduced motion. The colour pairs the row needs are already held in `src/lib/tokens.test.ts`: the body ink on `--color-surface`, the quiet ink for the date, and `--color-link` on `--color-surface` for the link. `#safari` still sits in `src/index.css` as a reference block from the reference build, palette based and light only, kept for whichever window migrates it.

## Options considered

### Option 1: A list body on the shared stage, the title as the link

One body of the shared stage, holding a heading and a list of rows. Each row is a cover picture, the printed date and the post's title, and the title element is itself the anchor that leaves the page, so the link's visible words and its announced name are the same words by construction. The order comes from the posts' own dates. The window keeps no state, so it registers no scope and no title bar control.

**Pros**:

- Composes what spec 0006 already settled, so it adds no mechanism, no dependency and no new colour name.
- The link names its own post, so the window works from a screen reader's list of links, which is where a repeated read label fails.
- One line of words per row, so the list stays scannable at every width, and a long title simply wraps.
- Nothing is fetched and nothing is stored, so the window cannot fail at runtime.

**Cons**:

- A title that is a link does not look like a button, so it depends on the link colour and a hover treatment to read as clickable.
- No search, no paging and no excerpt, so a long list is harder to scan than it could be.

### Option 2: A list of rows with a separate read link under the title

The same list, with the title as plain text and a second line under it carrying the link. This is the reference build's own shape, where that second line reads "Check out the full post" on every row.

**Pros**:

- Keeps the reference's look exactly, including a read line that reads as an instruction.
- The title stays plain text, so it can be styled as a heading without the link's colour leaking into it.

**Cons**:

- If the link's visible words carry the post's title, as the accessibility answer wants, the title's words are printed twice in every row. That is a long, repetitive row for a long title.
- The alternative, one shared read phrase plus a hidden accessible name, makes the visible and announced words differ, which is the failure a screen reader user notices first.

### Option 3: A grid of cover cards, the shape the gallery window uses

A grid of cards, each one a cover picture with the date and the title beneath it, closer to the Photos window's layout.

**Pros**:

- The pictures carry the window, which suits a portfolio built on visuals.
- It reuses a layout the gallery window has already proved at narrow widths.

**Cons**:

- A post is a piece of writing, and a title is the thing a reader scans, so a grid of pictures is a worse index than a list.
- Covers become load bearing: three of the posts would be judged on the pictures rather than the words.
- It duplicates the gallery window's job in a desktop where every window is supposed to be its own app.

### Option 4: Author the posts in the site and read them in place

Write the posts inside this portfolio and render each one in the window rather than pointing at another site.

**Pros**:

- The writing lives with the portfolio, so nothing depends on another site staying up or keeping its links alive.
- The window could show a real reading experience, and the site would gain the search engine value of the words themselves.

**Cons**:

- It needs a place to write, a way to render long text and a content pipeline, which is a much larger feature than a window.
- The scope has already deferred it as "Writing here", which means this option is the next decision, not this one.
- Today's posts genuinely live elsewhere, so building the reader first would leave the window empty.

## Rationale

Option 1 wins because this window has almost nothing of its own to decide, and the value is in not adding anything. The content model already carries every value a row shows, the design system already carries every surface and pair a row paints with, and spec 0006 already carries the stage, the quiet line and the reveal. A window whose whole body is a heading and a list should be a small diff, and the shape that keeps it small is the shape the other windows already use.

The title as the link is the one place where the accessibility answer and the reference build disagreed, and accessibility wins. The reference's read line repeats the same phrase on every row, and a screen reader user who asks the page for its links then hears one phrase three times. Making the title the anchor fixes that at the source rather than patching it with an accessible name: there is only one set of words, so the visible and announced names can never drift apart. The cost is real and is recorded in the spec's Consequences: a title has to look like a link, so the link colour and a hover treatment are load bearing rather than decoration.

The order comes from the dates rather than the file's order, because a blog reads newest first and a date is a fact while a position in a file is an accident. The comparison runs on the stored ISO date, which sorts correctly as text because the shape is fixed width, so no date parsing is needed to order the list and no timezone can affect the order.

The date's words are the one place a real bug hides. `new Date('2025-09-02')` is read as midnight UTC, so a visitor in the Americas formatting it in their own zone would see September 1. Reading the day at UTC instead means the day printed is the day stored, everywhere. The locale is fixed to English rather than left to the visitor's browser, because the whole site is written in English and a fixed locale is the one that lets the suite check the exact printed words rather than only their shape. `Intl.DateTimeFormat` is built into every browser this project already targets, so a date library would add a dependency to a portfolio that has deliberately kept this kind of work at zero; the runner up was a date library such as date-fns, and the loser on the shelf was printing the raw ISO string, which is accurate and reads like a database rather than a blog.

Three smaller calls, each with its runner up:

- **The ordering helper** is `newestFirst` in the window's folder, sorting a copy with `[...articles].sort(...)` so `ARTICLES` itself is never touched. The runner up was `Array.prototype.toSorted()`, which reads better and returns a copy on its own, and it was left alone only because it needs the `ES2023` library in the TypeScript config, which is a change this feature has no reason to make.
- **The cover** is one fixed square at every width, so the row has one shape and the window needs no second breakpoint. The runner up was growing the cover once the window is wide, which reads better on a desktop and costs a second rule plus another container threshold.
- **The covers load eagerly** rather than lazily. The window only exists while it is open and there are three pictures, all near the viewport. The runner up was `loading="lazy"` for consistency with the gallery's tiles, where the grid genuinely is long.

The window keeps no state, which is why it registers no `Scope` and no `Lead`. There is nothing to remember: the place showing, the open photo and the history a window sometimes needs do not exist here. That leaves the reveal as the only effect, and it is the shared hook rather than anything new, so reduced motion needs no second path.

## Evidence

**The reference build's own screenshots**, read from `designs/`:

- `lightBlogs.png`: a heading in the accent colour reading "My Developer Blog", then three posts. Each post is a square cover thumbnail on the left with the date above the title on the right, the title in bold, and one read link under it. The title bar carries a search field reading "Search or enter website name" plus share, add and copy controls.
- `darkBlogs.png`: the same window in dark mode.
- `mobileBlog.png`: at a phone size the same row holds, the medium thumbnail stays beside the text, and the third title is cut to two lines with an ellipsis. The bottom of the screen carries a second search field and a browser toolbar.

The row shape, the ordering and the heading all come from these. The two search fields, the three title bar controls and the phone toolbar do not, for the reason in the premise note.

**What the reference leaves in the code**, from `src/index.css` around the `#safari` block: a palette based, light only window block carrying `.search`, `.blog`, `.blog-post`, `.content` and its heading in `text-pink-600`. It is the last piece of this window still written against raw palette colours, and `design.md` keeps it on a list headed "Reference only, not yet migrated". This feature retires it rather than copying it, which is the same step `#finder`, `#terminal`, `#resume`, `#contact` and `#photos` each took.

**What already exists, so nothing is invented**:

- `ARTICLES` in `src/content/articles.ts`, three posts, each with a validated ISO date, a cover with its own alternative text and an absolute `https://` link.
- `blog1.png`, `blog2.png` and `blog3.png` are really in `public/images`, unlike the gallery's photographs, so the covers draw today.
- `WINDOW_BODIES.articles` is `{ Body: Placeholder }`, one line to change.
- The dock carries an Articles app and `HOME_APPS` carries an Articles tile, so the window has its two ways in without touching a shell list.
- `WINDOW_LAYOUT.articles` opens the window at 760 by 480 with a floor of 380 by 260, so both the reference's desktop shape and its phone shape are reachable inside one window.

**The colour pairs the row needs are already held** in `src/lib/tokens.test.ts`, so this feature adds no pair and no token: `text on surface` for the title, `muted text on surface` for the date, and `link on surface` for the anchor, each held at 4.5:1. `--color-link` also already sits in the suite's `MODE_DEPENDENT` list, so the mode swap is checked for it. The frame paints the body on `--color-surface` and the title bar on `--color-surface-sunken`, which is what makes those pairs the right ones to lean on.

**What the window therefore does not need**: no manager action, no target kind, no frame behaviour, no schema, no reader in the content layer, no new token, no new dependency and no live region of its own. The one thing it must not do is become a second `Placeholder`: the registry line change is what makes the window real, and it is the first step of the build plan.
