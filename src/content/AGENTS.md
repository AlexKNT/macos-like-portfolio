# src/content

The typed content model. Everything the desktop will show is authored here: the menu bar, the dock, the Finder tree, the articles, the stack, the gallery, the profile, and the wallpaper each mode paints. Each shape is described once by a zod schema, and its TypeScript type is read back out of that schema. Nothing in this folder renders anything. It is data, plus the check that keeps it honest.

Governing spec: [`docs/specs/0001-content-data-model/index.md`](../../docs/specs/0001-content-data-model/index.md)

## Files

- `types.ts`: every schema, every id union, every inferred type, and the `LookupFailure` and `OpenTarget` shapes. Read it first.
- `windows.ts`: `WINDOWS`, the nine windows the desktop can open, keyed by `WindowId`.
- `shell.ts`: `NAV_LINKS`, `NAV_ICONS`, `DOCK_APPS`, and `HOME_APPS`, the tiles a phone's home surface stands on.
- `theme.ts`: `WALLPAPER`, the image each mode paints plus the compact crop a narrow screen prefers. `#lib/appearance` writes the two paths onto the document element, so no image path is hardcoded in the stylesheet.
- `desktop.ts`: `DESKTOP_ITEMS`, the four items on the wallpaper, each with the spot it sits in and the target it opens.
- `locations.ts`: `LOCATIONS`, the Finder sidebar, the projects, and their files.
- `profile.ts`: `PROFILE`, `SOCIALS`.
- `articles.ts`, `techStack.ts`, `gallery.ts`: the remaining collections.
- `reads.ts`: `findById`, `openTargetFor`, the place helpers (`PROJECT_FOLDERS`, `TREE_FILES`, `findFile`, `findPlace`, `placeOfTarget`, `placeName`, `targetForPlace`) and the resume reader (`findResumeFile`, `resumeFileAmong`), which are how a window reads this content.
- `validate.ts`: `assertContentIsValid`, run once in development before the desktop renders.
- `content.test.ts`, `theme.test.ts`: the suites behind `npm test`.

## Conventions

- One module per family of content. A new collection gets its own file, and its schema plus its id union go in `types.ts`.
- A list that stands in for windows (`DOCK_APPS`, `HOME_APPS`) takes each entry's name from `WINDOWS`, so a window's word is written down once and a surface cannot drift from the window it opens.
- The type comes from the schema (`z.infer<typeof thingSchema>`). Never write a type and a schema for the same shape by hand, because they drift.
- Every entry carries an `id` taken from a literal union in `types.ts`. That union is what makes a reference to something that does not exist fail to compile.
- `WINDOWS`, `LOCATIONS` and `WALLPAPER` carry a `Record<Key, Value>` annotation, so a missing entry is a typecheck failure. A zod record cannot enforce that, the annotation is what does.
- Every schema object is strict, so a field a shape does not use is rejected by the parse rather than dropped. A `text` file cannot carry `href`, an `image` file cannot omit `alt`.
- Import these modules with `import type` when you only need a type. `verbatimModuleSyntax` is on, so a plain value import keeps the module and its zod schema in the visitor's bundle.
- Zod never reaches the visitor. `main.tsx` reaches `validate.ts` through a dynamic import guarded by `import.meta.env.DEV`, so the schemas and the check drop out of the production build. Keep it that way.
- A lookup returns a `Result` from `#lib/result`, never a throw, and `findById` carries `{ kind: 'notFound', collection, id }` on failure. The one thing that throws on purpose is `assertCollectionIsValid`, because content that does not match its schema is a programmer error rather than an expected failure.
- Outbound links are absolute and start with `https://`. The resume `href` is a same origin `/files/` path instead.
- The text a screen reader needs lives here: `alt` on every image, `label` on every icon that acts. An icon that only decorates carries no label.

_Drafted by /sync from the introducing change, worth a quick human pass._
