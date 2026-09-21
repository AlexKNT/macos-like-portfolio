# 0005. Adopt one Finder style window for the project tree

**Date**: 2026-09-20
**Status**: Accepted

## Summary

One window browses the content tree: a sidebar of the four locations with the three projects nested under `Work`, and a content area of icons. Opening a project shows its name, its own words and its files in the same window, with a Back control in the title bar that walks the places a visitor has read. A text or image file opens a window of its own inside the same shared frame. Everything the window shows comes from the typed content layer, and the window adds no new window manager behaviour, so the remaining content windows reuse what this one proves.

## Requirements

**User stories**:

- As a recruiter, I want to open a project and read what it is, what it does and where to find it, so that I can judge the work in a few seconds without hunting.
- As a visitor, I want the resume, the about pages and the leftover files reached the same way as the projects, so that the desktop feels like one place instead of four.
- As a keyboard user, I want to walk the icons, open a project and step back without a pointer, so that the window is fully usable from the keyboard.
- As the engineer building the later content windows, I want one place model, one window body registry and one rule for where a place lives, so that the windows after this one compose what this one settles.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the desktop container, the menu bar, the desktop icons and the dock. Row 7 (spec 0004) owns the frame, the geometry, focus, minimising, zooming and closing. This feature adds no new manager action and no frame behaviour.
- This feature owns the `projects`, `textFile` and `imageFile` bodies. Rows 9 to 15 own their own windows and reuse the frame and the registry as they are.
- No search or filter field in the title bar, no forward arrow, no download or share control, no animation of its own, and no sound (row 18).
- The `position` classes leave the tree entries. The desktop keeps its own spots in `DESKTOP_ITEMS`, whose rules and tests do not change.
- The resume stays a window (spec 0003, AC-3) and the resume file leaves the page as a `/files/` path. This feature renders the link that does it and nothing else about the resume.
- Visitor window resizing stays out (deferred in the scope). The window opens at the size spec 0004 gives it, and this feature decides only what happens inside that box at a narrow width.
- Row 12 owns the compact switcher. This feature decides only how the Finder itself behaves below the compact breakpoint.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The window opens from the dock button, from the `Projects` menu bar link and from a desktop project icon, and shows the Finder: a sidebar listing the four locations with the three project folders nested under `Work`, and a content area holding the items of the place showing. The dock button and the menu bar link both land on `Work`, because the resolver turns a bare `projects` open into the `work` location. One press on a sidebar row shows that place.
- **AC-2**: A press on a project folder re-targets the same `projects` window (one instance, never a second window) and the title bar then reads that project's own name; a press on a location titles it with the location's own name. The title comes from `resolveOpenTarget`, which names a `location` or `project` target from the entry's own `name` in the content layer, and that title is the region name assistive tech announces. The same resolver turns a bare `window` target for `projects` into the `work` location, so the instance's target is a place for as long as the window is open and a re-open never resets the title to `Projects`.
- **AC-3**: Every item in the content area is reached in reading order with Tab and announced with its own name, and carries the visible focus ring from the state utilities: a button when it opens something inside the app, an anchor when it leaves the page (AC-7). The sidebar rows are buttons in the same way.
- **AC-4**: The project detail view shows the project's `name` as a heading, then the paragraphs of the project's own text file (its `subtitle` above them when it has one), then the project's files as icons, in that order.
- **AC-5**: The Back control sits in the title bar's leading slot, carries the accessible name of the place it returns to (`Back to Work`), and is present only when there is a place to return to. Pressing it returns to the previous place and pops one step. The window holds its own history: every place change pushes one step, whether it came from inside the window or from a desktop icon, a dock button or a menu bar link, and a change naming the place already showing pushes nothing.
- **AC-6**: A `text` file opens the text file window showing its `subtitle` (when it has one) and its paragraphs set for reading; an `image` file opens the image file window showing the image and its `alt` text as a visible caption. Each title bar reads the file's own `name`, and both are ordinary bodies of the shared frame with no geometry of their own.
- **AC-7**: A `link` file renders as a real anchor: the absolute `https` href from the content layer, `target="_blank"` with `rel="noopener noreferrer"`, a proper link name, pressable with Enter, and opening a tab without adding a window or changing which window has the keyboard.
- **AC-8**: A place with nothing in it shows a quiet line naming the place instead of an empty area. A target that names something absent opens no window and changes nothing, which is the manager's existing rule and stays that way.
- **AC-9**: When an image file's asset is missing from the build, the grid item keeps its place and the image window shows the file's `name`, its `alt` text and a quiet line saying the image did not load, so a missing asset reads as a quiet failure rather than a broken frame.
- **AC-10**: The sidebar marks exactly the row of the place showing, one mark at a time: a location row while that location shows, and a project row while that project shows, the way Finder selects one item. The mark uses the quiet accent pair and is legible in light and dark mode.
- **AC-11**: A place change moves DOM focus to the content region, which is focusable but not in the tab order and is named by the place, so the next Tab walks the new content and assistive tech announces the place that just arrived. The move fires on a change of place only and never on the first render, so the focus spec 0004 puts on the frame when a window opens is left alone.
- **AC-12**: Below the compact breakpoint the sidebar becomes a row of icons across the top of the body and the grid keeps the window's full width. Nothing in the window scrolls sideways at 360px, and a long item name wraps instead of clipping.
- **AC-13**: The body is a pure function of what the manager holds: `WindowBodyProps` carries the window key and the target, and the registry entry for a window supplies its own optional state scope (which receives those same props plus its children), its own optional title bar control and its body, so `ManagedWindow` learns nothing about any single window.
- **AC-14**: Every colour, space, radius, shadow and duration comes from the token layer, and both modes render. The window reuses the pairs `src/lib/tokens.test.ts` already holds (the quiet accent pair, and the surface ladder the sidebar and the title bar sit on), so it adds a pair only where it introduces a colour the suite does not cover, and any pair it adds holds at least 4.5:1 for text and 3:1 for a mark that carries meaning.
- **AC-15**: The tree in `src/content/locations.ts` carries no `position` field, each project holds exactly one `text` file, one `image`, one live `link` and one source `link`, the source one being the file whose id ends with `-source`, and the content suite fails naming the project when one of the four is missing.

## Decision

**Chosen option**: Option 1, one Finder style window whose place is the manager's target and whose history lives in the window.

The place showing is the manager's `target` on the `projects` instance, so the manager stays the one source of truth for what a window shows, and the window keeps a short history of places so Back is one press. A press on a sidebar row or on a folder dispatches the manager's existing `open` action with that place as the target. Everything the window renders comes from `#content`: the sidebar order from the location id union, the items from the place's own entry, the pitch from the project's text file. The two file windows are built here too, because the Finder opens them and no other row owns them.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `illegal-states` (`.copilot/skills/illegal-states/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

The content model grows by three entries and loses one field. Nothing new is stored: the window's view state is runtime only, held by the manager (the place) and by the window (the history).

| Entity | Primary key | Fields | Required | Notes |
|---|---|---|---|---|
| `Location` | `LocationId` (`work`, `about`, `resume`, `trash`) | `name`, `icon`, `children` | yes | Unchanged. `children` holds project folders and files. |
| `ProjectFolder` | `ProjectId` (`nike-ecommerce`, `ai-resume-analyzer`, `food-delivery-app`) | `kind: 'folder'`, `name`, `icon`, `children` | yes | `position` is removed. `children` holds files only, with no nesting. |
| `FileEntry` of kind `text` | `FileId` | `kind`, `name`, `icon`, `subtitle?`, `description[]` | `subtitle` optional | `position` is removed. |
| `FileEntry` of kind `image` | `FileId` | `kind`, `name`, `icon`, `imageUrl`, `alt` | `alt` required | `position` is removed. |
| `FileEntry` of kind `link` | `FileId` | `kind`, `name`, `icon`, `href` | `href` absolute `https` | `position` is removed. Three new ids join this kind: `nike-source`, `ai-resume-source`, `food-delivery-source`. |
| `FileEntry` of kind `pdf` | `FileId` | `kind`, `name`, `icon`, `href` | `href` is a `/files/` path | `position` is removed (it carried none). |
| `Place` (new, content shaped) | `kind` and the id it holds | `{ kind: 'location'; locationId }` or `{ kind: 'project'; projectId }` | yes | Not stored anywhere: derived from a target. The union is what makes an impossible place unwritable. |

Relationships are unchanged: `Location` 1:N `ProjectFolder` and `FileEntry`, `ProjectFolder` 1:N `FileEntry`, a project folder belongs to exactly one location. The one new rule is about contents rather than keys: each of the three projects holds exactly one `text` file (its pitch), one `image`, one live `link` and one source `link`.

**State transitions**:

The window has one state machine: the place showing, and the history behind it.

```
bare open (dock button, menu bar link)
        │
        ▼
   place = Work  ──press a location or a folder──►  place = that place   (history + 1)
        ▲                                                     │
        └──────────────── Back (history - 1) ◄────────────────┘

any place ──press a project folder──► place = that project   (history + 1)
          ──press the place already showing──► no change, nothing pushed
          ──a target that names nothing──► no change, no window
```

The place showing is derived from the instance's target, and the history is a stack of places whose last entry is the place showing. A place change pushed once per change, never twice for the same place, which is what stops Back from ping ponging with the target it writes.

| State | History | Showing | Back control |
|---|---|---|---|
| Fresh, first render | `[Work]` | `Work` | absent, since the stack holds one entry |
| One place read | `[Work, that place]` | that place | present, named for the place before it |
| Back pressed to the first place | `[Work]` | `Work` | absent again |

**API surface**:

The window is an interface of modules, not an HTTP surface. Every function below is pure unless it is named as a component or a hook.

| Surface | Kind | Key inputs | Key outputs | Failure |
|---|---|---|---|---|
| `WindowBodyProps` (widened) | type | `windowId`, `key`, `target` | – | – |
| `WINDOW_BODIES` (reshaped) | registry | a `WindowId` | `{ Body, Lead?, Scope? }`, where `Body` and `Lead` take `WindowBodyProps` and `Scope` takes those props plus `children` | a window id without a body fails the typecheck |
| `resolveOpenTarget(target)` (changed) | pure | an `OpenTarget` | `ResolvedWindow`, whose `title` for a `location` or `project` target is the entry's own `name`, and which turns a bare `window` target for `projects` into the `work` location | unchanged: `notFound`, `leavesApp` |
| `PROJECT_FOLDERS` | pure, built at module load beside `TREE_FILES` | the tree in `LOCATIONS` | every project folder keyed by `ProjectId`, written as a `Record` so a missing project fails the typecheck | none |
| `placeOfTarget(target)` | pure | an `OpenTarget` | `Place`, or `null` for a target that names no place. The null branch is defensive only: the resolver's bare `projects` rule means no instance of this window ever carries one | none |
| `findPlace(place)` | pure | a `Place` | `PlaceView`: the `name`, the `items` to show, and the `pitch` text file when the place is a project | none: `LOCATIONS` and `PROJECT_FOLDERS` are annotated records, so an id the union allows always resolves |
| `placeName(place)` | pure | a `Place` | the location's or the project's `name` | none, for the same reason |
| `targetForPlace(place)` | pure | a `Place` | the `OpenTarget` that shows it | none |
| `pushPlace` / `popPlace` / `placeOnTop` | pure | a history and a `Place` | the next history, or the place on top | a pop on a stack of one entry returns it unchanged, and there is nothing to go back to |
| `useProjectHistory()` | hook | – | `{ place, name, canGoBack, backLabel, back }` | throws with no provider above, like `useWindowManager` |
| `ProjectsWindow` | body | `WindowBodyProps` | the sidebar, the content region and the detail view | – |
| `FinderSidebar` | component | the place showing, and the press handler | the four locations and the project list | – |
| `FinderGrid` | component | the items to show | one control per item in reading order: a button for a folder or for a file that opens in the app, an anchor for a link file | – |
| `ProjectDetail` | component | a project folder and its pitch | the heading, the pitch and the files | – |
| `PitchContent` | component | a `TextFile` | its `subtitle` when it has one, then its paragraphs, shared by the detail view and the text file window | – |
| `ProjectBackButton` | title bar control | `WindowBodyProps` | the Back control, or nothing when there is nowhere to go back to | – |
| `TextFileBody` / `ImageFileBody` | bodies | `WindowBodyProps`: the file is read from the target through `findFile` | the paragraphs, or the image and its caption | a missing asset shows the quiet line |

**Value sourcing** (every value the window produces, computes or displays names where it comes from):

| Value displayed | Source |
|---|---|
| The place a bare open lands on | `resolveOpenTarget`, which turns a bare `window` target for `projects` into the `work` location; `DEFAULT_PLACE` in `src/windows/projects/projectHistory.ts` is those same two values, used to seed the stack |
| The sidebar's order | `locationIdSchema.options`, the union's own declaration order |
| A sidebar row's name and icon | `LOCATIONS[id].name` and `.icon` |
| The project list under `Work` | `LOCATIONS.work.children` filtered to `kind === 'folder'` |
| A grid item's label and icon | the entry's own `name` and `icon` in the content layer |
| The title bar's text | `resolveOpenTarget`, from the location's or project's `name` |
| The Back control's name | `Back to` plus `placeName` of the place below the top of the history |
| The project heading | `ProjectFolder.name` |
| The pitch's subtitle | `TextFile.subtitle`, when the file carries one |
| The pitch's paragraphs | `TextFile.description`, the project's one `text` file (held by the content rule) |
| The screenshot and its caption | `ImageFile.imageUrl` and `ImageFile.alt` |
| The live and source links | `LinkFile.href` and `LinkFile.name` |
| The empty place line | a literal wording in the component, plus the place's `name` |
| The missing asset line | a literal wording in the component, plus the file's `name` and `alt` |
| Every colour, space, radius, shadow and duration | the token layer in `src/index.css`, read as utilities or through `readMotionToken` |
| The reference name assistive tech announces for the content region | the place's `name`, from the same lookup as the title bar |

**Key invariants**:

- One instance per key: a `location` or `project` target always resolves to the `projects` key, so browsing never opens a second window (spec 0004, AC-2).
- The place showing is the instance's target, derived, never stored a second time. The history's top entry equals the place showing, always: the stack is seeded with `[DEFAULT_PLACE]` on the first render, and Back is absent exactly when it holds one entry.
- A place change pushes once. Pushing a place equal to the one already on top is a no operation, which is what stops Back from writing a target that pushes again.
- A target that names no place leaves the place showing alone and pushes nothing. The resolver's bare `projects` rule means this window never receives one, so the branch is defensive rather than reachable.
- The body reads content through `#content` only. It holds no geometry, reads no token into state, writes no storage and calls no manager action other than `open`.
- A project always holds its pitch, its image, a live link and a source link, held by the content suite rather than by the view.
- Below the compact breakpoint the window's own width decides the layout, and the grid never overflows sideways.

**Security model**:

There are no accounts, no sessions, no server and no personal data beyond the portfolio's own public content. The only outbound values are the absolute `https` links in the content layer, rendered as anchors with `rel="noopener noreferrer"`, and the one same origin path, the resume under `/files/`. Nothing is user authored, so there is no injection surface beyond the content layer's own schemas, which stay strict.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: open from the dock lands on `Work`, press a project, read the pitch and see its files, press Back and land on `Work` again, verifies **AC-1**, **AC-4**, **AC-5**.
- The outside entry: with a project showing, press another desktop project icon, then Back, verifies **AC-5**.
- The bare re-open: with a project showing, press the dock button and land on `Work` again with the title reading `Work`, verifies **AC-1**, **AC-2**.
- File kinds: opening a text file shows its subtitle and paragraphs, opening an image shows the image and its caption, verifies **AC-6**.
- Leaving the page: a link file is an anchor with `target` and `rel`, and adds no window, verifies **AC-7**.
- Failure case: a place with nothing in it shows the empty line, and a target naming an absent id opens no window, verifies **AC-8**.
- Failure case: an image whose asset is missing shows the quiet line and keeps its `alt`, verifies **AC-9**.
- Keyboard: Tab walks every icon, a place change moves focus to the content region, and the Back control is named for its destination, verifies **AC-3**, **AC-5**, **AC-11**.
- Narrow width: at 360px the sidebar becomes an icon row and nothing scrolls sideways, verifies **AC-12**.
- Content rule: the suite fails naming a project that is missing its source link, verifies **AC-15**.

## Build plan

The project builds by Tracer Bullet, so the order is one thin thread through every layer first (the content model change, the place model, the registry, a real body and one item that opens), then a strand that thickens it. The five groups below are the milestones the scope row carries.

### Milestone 1: The content model moves · AC-15

1. Remove `position` from `projectFolderSchema` and from the four file schemas in `src/content/types.ts`, and remove the field from every entry in `src/content/locations.ts`, satisfies **AC-15**
2. Add the three source file ids to `fileIdSchema` and the three `link` entries to the three projects, with placeholder `https://github.com/` paths that match the outbound link rule, satisfies **AC-15**
3. Extend `src/content/content.test.ts` with the project contents rule, failing with the project's own name, and prove `npm test` and `npx tsc -b` are clean with nothing left reading the removed field, satisfies **AC-15**

### Milestone 2: The thin thread · AC-1, AC-2, AC-3, AC-13

1. The place model in the content layer: `placeSchema` and `Place` in `types.ts`, plus `PROJECT_FOLDERS`, `placeOfTarget`, `findPlace`, `placeName` and `targetForPlace` in `reads.ts`, with unit tests, satisfies **AC-2**
2. `resolveOpenTarget` titles a `location` or `project` target with the entry's own `name` and turns a bare `projects` target into the `work` location, with the resolver tests updated, satisfies **AC-2**
3. Widen `WindowBodyProps` to carry the key and the target, turn `WINDOW_BODIES` into entries of `{ Body, Lead?, Scope? }`, and have `ManagedWindow` render the scope around the frame and the control in the frame's leading slot, satisfies **AC-13**
4. `ProjectsWindow` renders the sidebar and a grid of the place's items, with the content region focusable, named by the place, and out of the tab order, satisfies **AC-1**, **AC-3**
5. `FinderSidebar` (the four locations in union order, the projects nested under `Work`, one selected mark) and `FinderGrid` (one control per item in reading order, a button for what opens in the app and an anchor for what leaves it, with the state utilities' focus ring), with RTL tests for the order and the accessible names, satisfies **AC-1**, **AC-3**, **AC-10**

### Milestone 3: Moving between places · AC-4, AC-5, AC-10, AC-11

1. `src/windows/projects/projectHistory.ts`: `DEFAULT_PLACE`, `pushPlace`, `popPlace` and `placeOnTop` as pure functions, with unit tests for the push once rule and the pop rule, satisfies **AC-5**
2. The history provider and its hook, reading the place from the instance's target so a change from outside pushes too, satisfies **AC-5**
3. The Back control in the title bar, rendered only when there is a place to return to and named for its destination, satisfies **AC-5**
4. The focus move to the content region on every place change, satisfies **AC-11**
5. `PitchContent` (a text file's optional subtitle, then its paragraphs, shared with the text file window) and `ProjectDetail`: the project's name as a heading, the pitch, then the files as icons, satisfies **AC-4**

### Milestone 4: The file windows and the quiet states · AC-6, AC-7, AC-8, AC-9

1. `TextFileBody` and `ImageFileBody`, registered for `textFile` and `imageFile`, reading the file through `findFile`, rendering the text through the shared `PitchContent` and the image with its caption, plus the missing asset line, satisfies **AC-6**, **AC-9**
2. Link files as real anchors with `target` and `rel`, and the resume link the same way, so the window never needs the manager's `external` path, satisfies **AC-7**
3. The empty place line, satisfies **AC-8**

### Milestone 5: Narrow widths and the design pass · AC-12, AC-14

1. The sidebar as an icon row below the compact breakpoint, and the proof at 360px that nothing in the window scrolls sideways and a long name wraps, satisfies **AC-12**
2. The token pass: every new colour, space, radius and shadow from the token layer, new pairs added to `src/lib/tokens.test.ts` in both modes, and the reference `#finder`, `#txtfile` and `#imgfile` blocks removed from `src/index.css`, satisfies **AC-14**
3. `e2e/projects.spec.ts` in Chromium: the dock open landing on `Work`, a project opened, the pitch read, Back, a file window opened, a link pressed, and the 360px layout, satisfies **AC-1**, **AC-5**, **AC-6**, **AC-7**, **AC-12**

## Consequences

**Positive**:

- A recruiter reaches every project in one press from the window, reads what it is without opening a second surface, and is never in a dead end because Back is always there.
- The place lives in the manager's target, so a window that was minimised comes back showing what it showed, and nothing has to be rebuilt.
- The window body registry gains the shape every later window needs (a body, plus optional chrome and its own scope), so the remaining windows touch `WindowBodyEntries` and nothing else.
- The pitch is the project's own text file, so the same words serve the detail view and the file window, and there is one place to correct them.

**Negative / tradeoffs**:

- The history lives in the window's own state, so closing the Projects window forgets where a visitor had been, and a re-open starts at `Work`. That is deliberate, and it is the price of keeping the manager's model small.
- One new mechanism lands in the shell: a per window scope and a title bar control slot. It is machinery for one Back control today, and it is what every later window with its own toolbar will reuse.
- `resolveOpenTarget` now reads the content layer for a title, so a place's name changing changes the window title, which is more coupling than a fixed string had.
- The pitch sits in the content layer rather than being authored for the detail view, so a long pitch written for reading in a file window will also be long here.

**Neutral**:

- `position` leaves the tree, which changes spec 0001's declared shapes. The desktop's `DESKTOP_ITEMS` keeps its own field, so nothing on the wallpaper moves.
- Two window bodies that had no scope row of their own (`textFile`, `imageFile`) are delivered by this feature. The scope's feature table does not change, but the Archive row (15) now has two fewer placeholder bodies to replace.
- The window's `external` path in the manager stays unexercised, since a link renders as an anchor instead. Spec 0004's resolver row for a `location` or `project` target, which titles the window `Projects`, is now stale.
- The reference styles for `#finder`, `#txtfile` and `#imgfile` in `src/index.css` are retired by this feature.

## Follow-up

- [ ] Spec 0004's resolver table still says a `location` or `project` target titles the window `Projects`; this spec changes that to the place's own name, so that row needs correcting when spec 0004 is next touched.
- [x] The flat `docs/specs/0001-content-data-model.md` duplicate was deleted on 2026-09-21, so the directory spec beside it is the only spec 0001 and the numbering has one shape per number.
- [ ] The About location points at absent assets (`adrian.jpg`, `adrian-2.jpg`, `adrian-3.jpeg`), so the image windows it opens will show this feature's missing asset line until the real portraits are added.
- [ ] The three source links are placeholder repository paths. They need the real repository URLs before the site is shared with a recruiter.

## Rationale

Reasoning, options and context: see [rationale.md](rationale.md).
