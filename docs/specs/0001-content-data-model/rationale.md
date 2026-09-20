# 0001. Model the portfolio content as typed TypeScript modules · rationale

_Decision record for [index.md](./index.md). Split out of a single spec file on 2026-09-20._

## Context

> ⚠️ Premise note: two things worth naming before you build this. First, the content in the repo is placeholder (Nike, JSMastery, a developer called Adrian), so the shapes here are being designed around material that will be replaced. They describe kinds and relationships rather than specific entries, and the content swap is a Follow up item, so the risk is contained rather than removed. Second, Zod means every shape is written twice, once as a schema and once as data, and a validation library joins the dependency list; the design keeps it out of the visitor's bundle, and the cost you accept is a dependency plus a schema to keep current.

`src/constants/index.js` holds every piece of content the desktop will eventually show: the menu bar links and icons, the six dock apps, the Finder tree of locations, projects and their files, the articles, the tech stack groups, the socials, the two gallery lists, and the window config. It is one JavaScript file, exported as plain arrays and objects, and its fields overlap: `href`, `imageUrl`, `subtitle` and `description` are all optional on one file shape, and `kind` plus `fileType` say the same thing twice. Comments record the renames from the reference build (`was "Finder"`), and ids restart at 1 inside every project.

Exactly one surface reads any of it today: `src/components/Navbar.tsx` imports `navIcons` and `navLinks`. Nothing else imports the file, which means the shape can still change cheaply. That window closes as the desktop lands.

Rows 6 to 15 each read this content, so the shape has to settle before they are built, otherwise every window gets a second edit. The types also decide the failure mode for the two mistakes this content invites: an item that names a window nothing renders, and a visual entry with no text for a screen reader. With types they are caught before the content ships; without them they are a dead control and an unlabelled image that a recruiter meets first.

The forces at play: a browser only app with no server and no database, so content is authored in the repo and ships in the bundle; TypeScript 6 in strict mode with no `any`; and the rules in `AGENTS.md` (immutable data, named exports only, one error handling pattern that returns a value instead of throwing, and an accessibility baseline on every control). Accessibility is only meetable here if the content carries the text a screen reader announces, because no window should have to invent it. Without this decision, each window invents its own shape, your name and email get repeated wherever they are shown, and every reader of a file entry keeps checking optional fields that its kind does not use.

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
