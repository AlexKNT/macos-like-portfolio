# 0001. Model the portfolio content as typed TypeScript modules

**Date**: 2026-09-20
**Status**: In Progress

## Summary

All the content a visitor reads (the menu bar, the dock, the project folders, the articles, the skills, the gallery, and your profile) moves into typed TypeScript modules under `src/content/`. Each shape is described once by a Zod schema, and the TypeScript type comes from that schema, so a wrong field fails at build time instead of showing up as an empty window. One registry says which window an item opens, and every id is a literal union, so a reference to a window that does not exist cannot compile. The old JavaScript seed file goes away with its dead fields and its repeated ids.

## Context

> ⚠️ Premise note: two things worth naming before you build this. First, the content in the repo is placeholder (Nike, JSMastery, a developer called Adrian), so the shapes here are being designed around material that will be replaced. They describe kinds and relationships rather than specific entries, and the content swap is a Follow up item, so the risk is contained rather than removed. Second, Zod means every shape is written twice, once as a schema and once as data, and a validation library joins the dependency list; the design keeps it out of the visitor's bundle, and the cost you accept is a dependency plus a schema to keep current.

`src/constants/index.js` holds every piece of content the desktop will eventually show: the menu bar links and icons, the six dock apps, the Finder tree of locations, projects and their files, the articles, the tech stack groups, the socials, the two gallery lists, and the window config. It is one JavaScript file, exported as plain arrays and objects, and its fields overlap: `href`, `imageUrl`, `subtitle` and `description` are all optional on one file shape, and `kind` plus `fileType` say the same thing twice. Comments record the renames from the reference build (`was "Finder"`), and ids restart at 1 inside every project.

Exactly one surface reads any of it today: `src/components/Navbar.tsx` imports `navIcons` and `navLinks`. Nothing else imports the file, which means the shape can still change cheaply. That window closes as the desktop lands.

Rows 6 to 15 each read this content, so the shape has to settle before they are built, otherwise every window gets a second edit. The types also decide the failure mode for the two mistakes this content invites: an item that names a window nothing renders, and a visual entry with no text for a screen reader. With types they are caught before the content ships; without them they are a dead control and an unlabelled image that a recruiter meets first.

The forces at play: a browser only app with no server and no database, so content is authored in the repo and ships in the bundle; TypeScript 6 in strict mode with no `any`; and the rules in `AGENTS.md` (immutable data, named exports only, one error handling pattern that returns a value instead of throwing, and an accessibility baseline on every control). Accessibility is only meetable here if the content carries the text a screen reader announces, because no window should have to invent it. Without this decision, each window invents its own shape, your name and email get repeated wherever they are shown, and every reader of a file entry keeps checking optional fields that its kind does not use.

## Requirements

**User stories**:
- As the engineer, I want one typed place per kind of content, so that adding a project, a photo, or an article never means editing several files.
- As a developer building a window, I want literal ids and a typed tree, so that the compiler tells me when I ask for content that does not exist instead of the window rendering nothing.
- As a visitor, I want every label, link, and image to be correct and readable by a screen reader, so that nothing on the desktop is a dead end.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Every content collection lives in a TypeScript module under `src/content/`, its type comes from a Zod schema for its shape, and `npx tsc -b` and `npm run build` both pass with no `any` in the content layer. The recursive tree schema is the one exception to a schema being the only description, since it needs `z.lazy` and a hand written annotation.
- **AC-2**: Every entry carries an `id` from its collection's literal id union, unique within that collection, and a lookup by that id returns the entry. Every member of every id union has a matching entry.
- **AC-3**: `WINDOWS` is typed `Record<WindowId, WindowEntry>`, every dock app, menu bar link and location names a window from that union, and a name outside the union fails to typecheck. Completeness of the two records comes from their annotation rather than the schema, since a Zod record cannot enforce it.
- **AC-4**: A lookup for an id that is not in the collection returns a failed `Result` carrying `{ kind: "notFound", collection, id }`, never throws, and the caller can switch on `kind` exhaustively.
- **AC-5**: An empty array collection is valid content: it typechecks, it builds, and nothing in the model throws, fabricates an entry, or logs for it. The two records cannot be empty by construction.
- **AC-6**: A file entry carries only the fields its kind uses: a `text` entry cannot carry `href`, an `image` entry cannot omit `alt`, a `pdf` entry cannot omit `href`, and a project folder holds files only, never another folder.
- **AC-7**: In development an invalid entry fails with the collection name and the failing path before the desktop renders, and the production build contains no validation code: the built assets contain no `ZodError`, and the validation and types modules are absent from the production module graph.
- **AC-8**: Every image entry carries the text a screen reader announces (`alt`), every icon that acts carries a `label`, every other icon sits beside a visible name and is announced as decorative, every outbound link in `LinkFile`, `Article` and `Social` is absolute and starts with `https://`, and the resume path is a same origin `/files/` path, exempt from that rule.
- **AC-9**: `src/constants/index.js`, its `#constants` alias, and its dead fields (`canOpen`, the location `type`, the duplicated `image` on the About text file, `INITIAL_Z_INDEX`, `WINDOW_CONFIG`) are gone, the About text entry's paragraphs come from `PROFILE.bio` rather than a second copy, and `Navbar.tsx` renders the same menu bar as before (three links, four icons, the live clock) reading `#content/shell.ts`.
- **AC-10**: The content test suite proves that ids are unique within each collection, every union member has an entry, every window reference exists in the registry, and every outbound link is absolute https, and all of it passes on the current content.

## Options considered

### Option 1: Keep the seed in JavaScript and add types beside it

Write `.d.ts` types, or a typed module that passes the existing arrays through, so the data is described without being converted.

**Pros**:
- Smallest possible change, and the data keeps working while windows are built.

**Cons**:
- The types describe a shape the data is never checked against, so a wrong entry still compiles and ships.
- No literal ids, so a bad window reference stays invisible until a visitor clicks it.
- `allowJs` and JavaScript imports stay in the build, and the scope's "TypeScript with no `any`" is not met.

### Option 2: Convert in place into `src/constants/index.ts`

Keep one file and one alias, and convert it to TypeScript with named exports and hand written types.

**Pros**:
- One file to read top to bottom, and nothing new to learn or configure.
- The existing `#constants` import in `Navbar.tsx` keeps working untouched.

**Cons**:
- The file is already around 500 lines and grows with every later window, so every consumer imports the whole set.
- Content and non content constants would share a folder that already mixes jobs, against the one job per folder rule in `AGENTS.md`.
- Hand written types drift from the data unless a test checks them, and there is no test suite yet.

### Option 3: Typed modules under `src/content/`, schema first types, literal ids, one registry (chosen)

One module per content family, each shape described by a Zod schema whose inferred type checks the data, ids as literal unions, a discriminated union for the file kinds, and `WINDOWS` as the single catalog of windows.

**Pros**:
- One place per family, and every window imports only what it renders.
- The schema is the only description of a shape, so the type and the runtime check cannot drift apart.
- A wrong window reference fails to compile, and a file cannot carry a field its kind does not use.
- The trim and the dead field removal happen during the conversion, when the file is being read anyway.

**Cons**:
- Adds a dependency and a schema layer to a project with no server and a small static dataset.
- Every id is written twice, in the id list and in the entry, so adding content touches two places.
- The types module grows with the content and becomes a file every family depends on.

### Option 4: A JSON content file parsed by the schemas at startup

Keep the content out of the code as one JSON document, and parse it into typed content when the app starts.

**Pros**:
- The content is visibly separate from the code, and a future editor could be a form over the JSON.

**Cons**:
- JSON cannot carry comments, which this content needs (the placeholder marking, and a note on why a field exists).
- Every id becomes a plain string, so the literal unions and the compile time window check are lost.
- The parse runs on every load unless it is moved to build time, and Vite would need extra configuration for a file it can already type as a module.
- The engineer authors the content, so the separation between code and data buys nothing here.

## Decision

**Chosen option**: Option 3: typed modules under `src/content/`, schema first types, literal ids, one registry.

Content lives in `src/content/` as one module per family. Each shape is described once by a Zod schema, its TypeScript type comes from that schema, and ids are literal unions. `WINDOWS` is the single place that says which window exists and what it is called, and opening an item is expressed as an `OpenTarget` naming the item rather than a configured window, so no window state enters this model.

**Implementation skills**: `illegal-states` (`.copilot/skills/illegal-states/`, user level) · `vite` (`antfu/skills`, `.agents/skills/vite/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

The only consumer of this content today is `Navbar.tsx`, so converting now costs one small edit and converting later costs an edit per window. That timing, not the elegance of the type layer, is the strongest force here: rows 6 to 15 are all still ahead.

The schema owns the type rather than sitting beside it because a hand written type plus a schema is two descriptions that drift, and this project's test suite does not exist yet (row 3 owns it). Until tests run, the type layer is the only guard, so it should be the guard that cannot be wrong.

Literal ids are what make the registry requirement mean anything. The scope asks for one registry saying which window opens for each item; that is only worth writing down if a reference to a window that does not exist is caught, and with a literal union the compiler catches it. The same reasoning drives the file union: the seed's single file shape with four optional fields lets a text file carry an href and an image omit its alt text, and both of those are real mistakes rather than hypothetical ones.

Zod was chosen over types alone, and the honest reading is that a type alone already stops you authoring a bad entry in a module. What only Zod can check is the set of rules a type cannot express: text a screen reader can really use (a not empty `alt`), links that really start with `https://`, dates that really are ISO, ids that really are unique, and records that really are complete. Its cost stays out of the visitor's bundle by using the schemas in two places only: the test suite, and a development only startup check reached by a dynamic import inside an `import.meta.env.DEV` branch. That last part depends on one discipline the builder must follow: every data module imports its entity types with `import type`, because under `verbatimModuleSyntax` a value import of a module that builds schemas as it loads stays in the production graph and takes Zod with it. The runner up was hand written types checked by `satisfies`, which is cheaper and loses every rule above.

Decisions made while writing this, each with its runner up:

- **A failed lookup carries `{ kind: "notFound", collection, id }`, not a message string.** A window can switch on `kind` exhaustively and owns its own wording, which keeps copy out of the data, and the collection name lets two missing ids tell themselves apart in a log. Runner up: a `message` string, simpler to log and impossible to exhaust.
- **`openTargetFor` returns an `OpenTarget`, not a window id.** The `location`, `project` and `file` members carry the typed id the receiving window needs to show something, and `external` covers the link file and the resume, which never open inside the app. Naming the item keeps window state in row 7. Runner up: return a window id, which leaves the window with no payload and forces the window manager to guess which file was clicked.
- **`WINDOWS` is a `Record<WindowId, WindowEntry>`.** A missing entry then fails to typecheck instead of needing a test. Runner up: an ordered array of entries plus a completeness test.
- **`DockApp` and `NavLink` carry no icon, and read it from `WINDOWS`.** One image per window, defined once. Runner up: an icon per dock app, which duplicates the same file path in two places.
- **File ids are global (`nike-live`), not per project numbers.** The seed restarts ids at 1 in every project, which makes a lookup by id ambiguous and a literal union impossible. Runner up: keep the numbers and give up the union.
- **The folder tree discriminates on one `kind` field** (`folder`, `text`, `image`, `link`, `pdf`) instead of the seed's `kind: "file"` plus `fileType`. Two fields saying one thing is one field too many. Runner up: keep both fields as the seed has them.
- **The About text file loses its duplicated `image` field**, since the three image files beside it already carry those paths, and the profile entity carries the avatar. Runner up: keep the field and accept the same path in two places.
- **Frozen array fields are declared with Zod's readonly wrapper** (`z.array(z.string()).readonly()`), so the inferred type matches the `readonly` fields in the table. A plain `z.array` infers a mutable array, which would make the table above a lie. Runner up: drop `readonly` from those fields and let the `as const` annotation on each constant carry it.
- **`INITIAL_Z_INDEX` and `WINDOW_CONFIG` are not part of this model.** Live window state belongs to the window manager in row 7.

## Feature design

### Data model sketch

Shared: `image` is `{ imageUrl, alt }`, reused by a profile avatar, an article image, and a photo. Every entry carries an `id` from a literal union declared in `src/content/types.ts`, and `WINDOWS` and `LOCATIONS` are keyed by that union, so their entries take the key as their `id` and a missing entry fails to typecheck.

| Entity | Type | Id union (initial members) | Fields, `id` included |
|---|---|---|---|
| Window | `WindowEntry` | `WindowId`: `projects`, `articles`, `gallery`, `skills`, `resume`, `contact`, `archive`, `textFile`, `imageFile` | `id` (the record key), `title`, `icon` |
| Menu bar link | `NavLink` | `NavLinkId`: `projects`, `contact`, `resume` | `id`, `label`, `windowId` |
| Menu bar icon | `NavIcon` | `NavIconId`: `wifi`, `search`, `profile`, `appearance` | `id`, `icon`, and then either `action: { kind: "decoration" }` alone, or a `label` with `action` of `{ kind: "openLocation", locationId }` or `{ kind: "appearance" }` |
| Dock app | `DockApp` | `DockAppId`: `portfolio`, `articles`, `gallery`, `contact`, `skills`, `archive` | `id`, `name`, `windowId` |
| Location | `Location` | `LocationId`: `work`, `about`, `resume`, `trash` | `id` (the record key), `name`, `icon`, `children` |
| Project folder | `ProjectFolder` | `ProjectId`: `nike-ecommerce`, `ai-resume-analyzer`, `food-delivery-app` | `id`, `kind: "folder"`, `name`, `icon`, `position`, `windowPosition?`, `children` (files only) |
| Text file | `TextFile` | `FileId` (unique across the whole tree) | `id`, `kind: "text"`, `name`, `icon`, `position?`, `subtitle?`, `description: readonly string[]` |
| Image file | `ImageFile` | `FileId` | `id`, `kind: "image"`, `name`, `icon`, `position?`, `imageUrl`, `alt` |
| Link file | `LinkFile` | `FileId` | `id`, `kind: "link"`, `name`, `icon`, `position?`, `href` |
| PDF file | `PdfFile` | `FileId` | `id`, `kind: "pdf"`, `name`, `icon`, `position?`, `href` (a same origin `/files/` path) |
| Profile | `Profile` | one entry, id `profile` | `id`, `name`, `role`, `tagline?`, `bio: readonly string[]`, `email`, `avatar` (an `image`) |
| Social | `Social` | `SocialId`: `github`, `platform`, `twitter`, `linkedin` | `id`, `label`, `icon`, `color`, `href` |
| Article | `Article` | `ArticleId`: `typescript-explained`, `three-js-guide`, `gsap-animations` | `id`, `title`, `date` (ISO `YYYY-MM-DD`), `image`, `href` |
| Tech group | `TechGroup` | `TechGroupId`: `frontend`, `mobile`, `styling`, `backend`, `database`, `tools` | `id`, `category`, `items: readonly string[]` |
| Album | `Album` | `AlbumId`: `library`, `memories`, `places`, `people`, `favorites` | `id`, `title`, `icon`, `photos: readonly Photo[]` |
| Photo | `Photo` | `PhotoId`, album prefixed (`library-1`) | `id`, `imageUrl`, `alt` |

`icon`, `imageUrl`, `avatar` and `href` are public path strings: window, dock and file icons as PNG under `/images/`, menu bar, location and social icons as SVG under `/icons/`. All nine window icons already exist in `public/images/` (`finder.png`, `safari.png`, `photos.png`, `contact.png`, `terminal.png`, `trash.png`, `txt.png`, `image.png`, and `folder.png` for a project).

A dock app's `name` is the accessible name the dock announces and is deliberately not the same word as the window's `title` (the dock says Portfolio, the titlebar says what the registry says). Row 6 owns which surface puts the two together.

The recursive tree is the one shape a schema cannot describe alone: `Location.children` and `ProjectFolder.children` refer to each other, so it uses `z.lazy` with a hand written annotation, which is why AC-1 states that exception.

A location is always shown by the `projects` window, which opens on `work` unless it is asked for another location or a project. That is the only window a location needs, so `Location` carries no `windowId`.

The `NavIcon` shape encodes the label rule in the type rather than in a test: `{ kind: "decoration" }` (the wifi and search icons) cannot carry a `label`, while `{ kind: "openLocation", locationId }` (the profile icon, which opens the About location) and `{ kind: "appearance" }` (the mode control row 16 will wire) must.

The seed's `fileType` values map straight across: `txt` to `text`, `img` to `image`, `url` to `link`, `pdf` to `pdf`. `fig` has no counterpart, and the three `Design.fig` entries are trimmed with the rest of the leftover seed data, since they point at google.com rather than a real design file. Each project is left with one `link` entry, which is the live site link row 8 renders as its call to action.

**Relationships** (either `!` required or `?` optional):

| From | To | Cardinality | Field |
|---|---|---|---|
| `Location` | `ProjectFolder` or a file entry | 1:N | `children` |
| `ProjectFolder` | a file entry | 1:N | `children` |
| `DockApp`, `NavLink` | `WindowEntry` | N:1 | `windowId!` |
| `NavIcon` | `Location`, only when the action is `openLocation` | N:1 | `action.locationId!` |
| `Album` | `Photo` | 1:N | `photos` |
| a file entry | where opening it goes | 1:1 | derived by `openTargetFor`, never stored |

**Modules**:

| Module | Holds |
|---|---|
| `src/content/types.ts` | every id union, every schema, every inferred type |
| `src/content/windows.ts` | `WINDOWS` |
| `src/content/shell.ts` | `NAV_LINKS`, `NAV_ICONS`, `DOCK_APPS` |
| `src/content/locations.ts` | `LOCATIONS` |
| `src/content/profile.ts` | `PROFILE`, `SOCIALS` |
| `src/content/articles.ts` | `ARTICLES` |
| `src/content/techStack.ts` | `TECH_GROUPS` |
| `src/content/gallery.ts` | `ALBUMS` |
| `src/content/reads.ts` | `findById`, `openTargetFor` |
| `src/content/validate.ts` | `assertContentIsValid`, the development only check |
| `src/lib/result.ts` | `Result`, `ok`, `err` |

No barrel file: each consumer imports the module it needs, so a window never pulls in the whole content set.

### Interface surface

| Export | Module | Signature | Returns |
|---|---|---|---|
| `WINDOWS` | `#content/windows` | constant | `Record<WindowId, WindowEntry>` |
| `NAV_LINKS`, `NAV_ICONS`, `DOCK_APPS` | `#content/shell` | constants | `readonly NavLink[]`, `readonly NavIcon[]`, `readonly DockApp[]` |
| `LOCATIONS` | `#content/locations` | constant | `Record<LocationId, Location>` |
| `PROFILE`, `SOCIALS` | `#content/profile` | constants | `Profile`, `readonly Social[]` |
| `ARTICLES`, `TECH_GROUPS`, `ALBUMS` | their modules | constants | `readonly Article[]`, `readonly TechGroup[]`, `readonly Album[]` |
| `findById` | `#content/reads` | `(collection: readonly T[], id: string)` where `T` has an `id` | `Result<T, LookupFailure>` |
| `openTargetFor` | `#content/reads` | `(entry: FileEntry)` | `OpenTarget` |
| `Result`, `ok`, `err` | `#lib/result` | types and constructors | `Result<T, E>` |
| `assertContentIsValid` | `#content/validate` | none | `void`, throws with the collection and the failing path |

The three shapes other rows reuse, written out:

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
type LookupFailure = { kind: "notFound"; collection: string; id: string }
type OpenTarget =
  | { kind: "location"; locationId: LocationId }
  | { kind: "project"; projectId: ProjectId }
  | { kind: "file"; fileId: FileId }
  | { kind: "external"; href: string }
```

A `text` or `image` file becomes a `file` target, a `link` or `pdf` file becomes an `external` one. Rows 6 and 7 turn a target into an open window or a new tab, which is the only place window behaviour lives. `assertContentIsValid` parses every collection and throws on the first failure with the collection name and the Zod path. It throws on purpose: a content file that does not match its schema is a programmer error rather than an expected failure, so it is the documented exception to the return a value rule in `AGENTS.md`. Imports are written without a file extension (`#content/shell`).

### Value sourcing

| Read | Value displayed | Where it comes from |
|---|---|---|
| The menu bar links | the label, and the window each opens | `NAV_LINKS` in `src/content/shell.ts` |
| The menu bar icons | the icon path and its accessible label | `NAV_ICONS` |
| What clicking an icon does | decoration, opening the About location, or the appearance control | `NAV_ICONS[].action` |
| The dock | each app name and the window it opens | `DOCK_APPS`, with the icon read from `WINDOWS[app.windowId].icon` |
| The Finder sidebar | the location names and icons | the keys and entries of `LOCATIONS` |
| The Finder window's first location | which location it shows when it opens | `work`, unless row 7 is asked for another location or project |
| The Finder grid | each entry name, icon and spot | `LOCATIONS[location].children[].position`, plus `windowPosition` for the window's first placement when a project opens |
| Opening a file | where the click goes and which item to show | `openTargetFor(entry)`, derived from `entry.kind` |
| A window's titlebar | the title it shows | the entry name for a file window, otherwise `WINDOWS[windowId].title` |
| One entry by id | the entry, or the reason it is missing | `findById` in `src/content/reads` |
| About and the contact window | name, role, bio, avatar, email | `PROFILE` |
| The About file's paragraphs | the text that file shows | `PROFILE.bio`, composed into the entry rather than authored twice |
| The contact tiles | label, icon, colour, and link | `SOCIALS` |
| The Skills window | each category and its names | `TECH_GROUPS` |
| The articles window | title, a formatted date, the image, the link | `ARTICLES`, with the ISO `date` formatted in the window (row 14 owns the format) |
| The gallery | the album sidebar and the grid | `ALBUMS` |
| The resume window | the file path to show or download | the `pdf` entry in `LOCATIONS.resume.children` |
| The appearance control (row 16) | which control toggles the mode | the `appearance` action on one entry of `NAV_ICONS` |
| The clock | the current time | the browser clock, not content |
| An image on screen | the text a screen reader announces | the `alt` of that image entry |

### Key invariants

- Every id is a member of its collection's literal union, occurs once in that collection, and has an entry, so a stale union member fails the test suite.
- Every `windowId` names an entry in `WINDOWS`, and `WINDOWS` has an entry for every member of `WindowId`, including the two preview windows no dock app opens.
- Every key of `LOCATIONS` has a matching location entry, and every location id in the union has an entry.
- A file entry carries only the fields its kind uses, and a project folder holds files only.
- Every outbound link in `LinkFile`, `Article` and `Social` is absolute and starts with `https://`; the `PdfFile.href` is a same origin path under `/files/` instead.
- Every image entry carries its `alt`, every icon that acts carries a `label`, and every other icon sits beside a visible name and is announced as decorative.
- Content is immutable: `as const` freezes it, and nothing writes to it. Emptying the archive, opening a window, and copying the email address are view state, not content changes.

### Security model

No authentication, no server, no database, no cookies, no analytics, and no visitor data of any kind. Every entry is public by design and is meant to be found. The only personal data is the engineer's own profile (name, role, bio, email), published on purpose. The email sits in plain text in the bundle and is therefore readable by address harvesters; that is accepted because the contact window's copy button and mail link need the real string. No compliance scope applies: no payments, no health data, no third party tracking.

### Critical test scenarios

- Happy path: `findById(DOCK_APPS, "portfolio")` returns the app, `WINDOWS[app.windowId]` exists, and `Navbar` renders three links and four icons, verifies **AC-2**, **AC-3**.
- Failure case: `findById(ARTICLES, "no-such-article")` returns `{ ok: false, error: { kind: "notFound", collection: "articles", id } }` and throws nothing, verifies **AC-4**.
- Failure case: a text entry given an `href`, or an image entry missing `alt`, is rejected by the typecheck and by the schema, verifies **AC-6**, **AC-10**.
- Failure case: a union member with no entry, or two entries sharing an id, fails the content test suite, verifies **AC-2**, **AC-10**.
- Edge case: an album with an empty `photos` array typechecks and builds, verifies **AC-5**.
- Boundary case: calling `assertContentIsValid` directly with an invalid entry throws with the collection and path, and the built assets contain no `ZodError`, verifies **AC-7**.
- Accessibility case: every image entry has a not empty `alt`, the two acting icons have a not empty `label`, the decorative icons carry none, and every outbound link starts with `https://`, verifies **AC-8**.
- Regression case: after the conversion, `Navbar` renders the same three labels, four icons, and live clock as before it, verifies **AC-9**.

## Build plan

Ordered as a thin thread first, then thickened, which is this project's build approach. Steps 1 to 5 prove one content family end to end through a real surface before the rest of the content is converted.

1. Register `#content` and `#lib` in `vite.config.ts`, and update the alias line in `AGENTS.md` in the same commit so the repo does not document a folder that no longer exists, satisfies **AC-1**. The wildcard `#*` mapping already in `tsconfig.app.json` and `jsconfig.json` covers any new folder under `src/`, so those two need no edit; confirm with `npx tsc -b` afterwards.
2. Create `src/lib/result.ts` with `Result<T, E>`, `ok`, and `err`, satisfies **AC-4**.
3. Install `zod`, then create `src/content/types.ts` with the id unions, the shell schemas (`WindowEntry`, `NavLink`, `NavIcon`, `DockApp`) and the inferred types, satisfies **AC-1**, **AC-2**, **AC-3**.
4. Create `src/content/windows.ts` and `src/content/shell.ts` with the nine windows, the three menu bar links, the four icons and the six dock apps, satisfies **AC-3**, **AC-8**.
5. Repoint `Navbar.tsx` at `#content/shell.ts` and rename its field reads (`name` to `label`, `img` to `icon`). This is the thin thread: real content through a real surface. Do not delete the seed yet, since it is still the only copy of the rest of the content, satisfies **AC-9**, **AC-10**.
6. Extend `src/content/types.ts` with the tree schemas (location, project folder, and the four file kinds), typing the recursive children through `z.lazy` with a hand written annotation, satisfies **AC-6**.
7. Create `src/content/profile.ts` and `src/content/locations.ts` with the four locations and the three projects, with the About text entry's description composed from `PROFILE.bio`, the file ids made unique across the tree, and the three `Design.fig` entries dropped, satisfies **AC-2**, **AC-6**, **AC-9**.
8. Create `src/content/reads.ts` with `findById` and `openTargetFor`, satisfies **AC-4**, **AC-6**.
9. Create the remaining families: `articles.ts` (ISO dates), `techStack.ts`, `gallery.ts` (the four photos in `library`), satisfies **AC-1**, **AC-2**, **AC-5**.
10. Author the content the types now require: `alt` for every image entry, a `label` for the two acting icons, absolute https links, and the resume path `/files/resume.pdf`, satisfies **AC-8**, **AC-10**.
11. Delete `src/constants/index.js` and the `#constants` alias once every family is ported, satisfies **AC-9**.
12. Create `src/content/validate.ts` and call it from `main.tsx` through a dynamic import inside an `import.meta.env.DEV` branch, awaited before the app renders so a bad entry fails before the desktop appears, satisfies **AC-5**, **AC-7**.
13. Write `src/content/content.test.ts`: unique ids per collection, every union member present, every window reference in the registry, every outbound link absolute https, and every schema parse passing on the shipped content. Needs `vitest` from feature 3; land this with that tooling if it is not wired yet, satisfies **AC-10**.
14. Verify the whole thing: `npm run lint`, `npx tsc -b`, `npm run build`, then confirm the position utility classes still reach the built CSS, that the built assets carry no `ZodError`, and that the validate and types modules are out of the production graph, satisfies **AC-1**, **AC-7**, **AC-9**.

## Consequences

**Positive**:
- One place per content family, and each window imports only what it renders.
- Two of the mistakes this content invites stop being possible to ship: a reference to a window that does not exist, and a visual entry with no text for a screen reader.
- The file tree loses its optional field soup, so a reader of a text file no longer has to prove that an href is not there.
- Ids become readable, so a lookup in a bug report or a test names what it is looking for.
- The content carries its own accessibility text, so no window invents a label for an image.

**Negative / tradeoffs**:
- A new runtime dependency, even though the visitor's bundle never loads it. Keeping it out depends on one discipline (`import type` in every data module) that no lint rule enforces yet.
- Every id is written twice, in the id union and in the entry, so adding content touches two places, and `types.ts` grows with the content.
- File ids lose the seed's per project numbering, which is a small authoring adjustment for anyone who knows the old file.
- The label rule only covers the icons that act. Every other icon relies on the visible name beside it, so a screen reader gets nothing useful from a window or album icon on its own.
- Zod was never needed to stop a bad entry being authored; what it buys is the rules a type cannot express, listed in the Rationale, and a failure that names the collection and the path.
- The position strings and the per social brand colours keep presentation in the content, so `src/content` is not purely data. Row 5 may move both, which brings the type back here.

**Neutral**:
- `src/constants/index.js` and its alias disappear, and `allowJs` in `tsconfig.app.json` may no longer be needed once no JavaScript is imported.
- The content stays placeholder until you replace it, and replacing it touches no type.
- Live window state (`isOpen`, `zIndex`, the start of the z index range) belongs to the window manager in row 7, not here.
- Rows 8 to 15 read this model, and their own specs may ask for a field that comes back here as a small change.

## Follow-up

- [ ] Replace the placeholder content: the profile (name, role, bio, email), the real socials, the project names, descriptions, links and images, the article links, and the resume file in `public/files/`. The model is built to survive this with no type change.
- [ ] The window id to component mapping (which surface renders `textFile`, `imageFile`, and the rest) belongs to the window manager in row 7. This model only names the windows and the target an item opens.
- [ ] Add a lint guard so a data module cannot import a schema value from `#content/types`, which would quietly put Zod back into the production bundle.
- [ ] The `illegal-states` skill informed this design (the file union, the action union, the failed lookup) and is not listed in `AGENTS.md`. It belongs in the `## Agent skills` section, or in a nested `AGENTS.md` for the content folder.
- [ ] Record the declined tool discovery: no Agent Skill or MCP server search was run for `zod`, so it belongs on the `Declined:` line in `AGENTS.md` to stop a later stage offering it again.
- [ ] Add `zod` to the key dependencies line in `AGENTS.md`.
- [ ] The Zod pick was made from knowledge, and this space moves. Confirm the current major at install time and note the version in `package.json`.
- [ ] Revisit `allowJs: true` in `tsconfig.app.json` once the JavaScript seed is gone, since it existed to import that file.
- [ ] The content tests need `vitest` from feature 3. If that tooling has not landed, land step 11 with it; the development only check covers the gap meanwhile.
- [ ] After the position strings move into `src/content/`, confirm those utility classes still appear in the built CSS (Tailwind 4 detects sources automatically, and a folder it does not scan would silently lose them). If any are missing, tell Tailwind where the content lives with an `@source` entry in `src/index.css`.
- [ ] Consider `src/content/AGENTS.md` holding the content rules (literal id unions, the schema is the source of the type, no view code beyond the position strings), so a future content edit follows them without loading this spec.
- [ ] Row 5 owns the position strings and the brand colours. If either moves out of the content, this spec's types change and the change comes back through `/architect`.

## Migration plan

**Strategy**: direct cut over in one commit, since the only consumer is `Navbar.tsx` and nothing else imports the seed.
**Phases**:
1. Add the aliases, `src/lib/result.ts`, the types, the registry and the shell family, and repoint `Navbar.tsx`. The seed stays, since it is still the only copy of the rest of the content.
2. Add the profile, the tree, the reads and the remaining families, then delete `src/constants/index.js` and its alias, so no content is ever left without a source.
3. Add the development check and the content tests, then run the full check in build step 14.
**Rollback**: revert the commit. The old file returns with the old `Navbar`, no data was transformed anywhere else, and there is no server or stored state to reconcile.
**Risks**: the `Navbar` field renames must land in the same commit as the content change or the build breaks; a stale `#constants` import added by a window landing at the same time must be repointed; the position classes must still reach the stylesheet after they move; and one value import of a schema in a data module is enough to put Zod back in the visitor's bundle.
