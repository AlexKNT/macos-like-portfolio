# 0010. Adopt a Photos style gallery window

**Date**: 2026-09-21
**Status**: In Progress

## Summary

The Gallery window shows the albums and the photos the content layer already carries. A sidebar lists the albums, the content area shows the chosen album's photos in a grid, and a press on a photo opens it larger inside the same window. The decision settles how a photo gallery works in this desktop, so the window is its content and its own words rather than a new set of rules. The content layer, the window manager and the frame are not touched.

## Requirements

**User stories**:

- As a recruiter, I want to see the images at a glance and step through them, so that I read the visual side of the portfolio in a few seconds.
- As a visitor, I want to move between albums and through photographs without a pointer, so that the gallery is fully usable from the keyboard.
- As a keyboard or screen reader user, I want the photo I open announced and a way out that leaves me where I was, so that opening a picture never loses my place in the album.
- As the engineer building the windows still to come, I want the gallery to compose what spec 0006 settled, so that the last two windows stay small changes.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the dock, the menu bar and the desktop icons. Row 7 (spec 0004) owns the frame, the geometry, the window's own focus, dragging, minimising, zooming and closing. This feature adds no manager action and no frame behaviour.
- Row 9 (spec 0006) owns the shared stage, the quiet line and the rules every body follows. This window composes them and changes none of them.
- This feature owns the `gallery` body only.
- The content layer is not touched: no schema, no entry, no rule and no new reader.
- No shell list changes: the gallery already has a window entry, a dock app and a phone tile.
- The window has no search, no filter field, no sort, no upload, no editing, no download, no share, no slideshow and no sound (row 18).
- Rows 14 (articles) and 15 (archive) are not designed here.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The window opens from the dock button and from the phone's own tile on the first album in content order. It opens one instance, focused, never a second, and a press on the dock button or the tile while the window is already open focuses that same window and leaves the album it shows alone.
- **AC-2**: The sidebar lists every album in the order the content declares them, each row showing that album's own `icon` and `title`, and exactly one row is marked at a time: the album showing, marked with the quiet accent pair. A press on a row shows that album's photos in the same window. A press on a row other than the album showing moves focus to the content region, so the next Tab walks the new album; a press on the album already showing changes nothing at all.
- **AC-3**: The content area's heading is the album's own `title`, and the content region carries that same title as its accessible name, so the region is announced as the album it shows. The frame itself stays announced by the window's own title, `WINDOWS.gallery.title`, which no album changes.
- **AC-4**: The grid is a named list, one item per photo, each item a button whose accessible name is the photo's own `alt` text, reached in reading order with Tab and carrying the visible focus ring from the state utilities.
- **AC-5**: A press on a photo opens the viewer: the panel takes focus, shows the photo whole, and repeats the photo's `alt` text as a visible caption marked so a screen reader hears it once. The stage's one live region announces the photo showing, naming its position in the album, on the open and on every step, so a step is announced exactly as an open is.
- **AC-6**: While the viewer is open the left and right arrows step through the album's photos and wrap at the ends, Escape closes the viewer and leaves the window open, and a Close control does the same. The panel answers those keys itself, so Escape reaches the viewer before the frame sees it, and no previous or next control is drawn: stepping belongs to the keyboard alone. Either way focus returns to the tile of the photo showing, so the next Tab carries on from there. With the viewer closed, Escape closes the window exactly as spec 0004 gives it.
- **AC-7**: Choosing another album while the viewer is open closes the viewer and shows that album's grid, so the photo on screen is always a photo of the album beside it.
- **AC-8**: An album holding no photos shows the shared quiet line, naming the album, in place of the grid, and the window is otherwise unchanged.
- **AC-9**: A photo whose asset never loads keeps its place in the grid and shows the shared quiet line inside its tile, and a photo whose asset never loads in the viewer shows the photo's `alt` text and the quiet line instead of a broken frame, so the description is never lost.
- **AC-10**: Thumbnails below the fold load lazily, the photo the viewer shows loads eagerly, and every image keeps its `alt` text whatever the load does.
- **AC-11**: Below the compact breakpoint the sidebar becomes one row of icons across the top, the grid keeps the window's full width, every control stays at least the touch target, and nothing in the window scrolls sideways at 360px.
- **AC-12**: Nothing in the window animates beyond the token based hover and focus states every control already has, so reduced motion shows no second path.
- **AC-13**: Every colour, space and radius comes from the token layer, the registry baseline test spec 0006 added still passes for every entry of `WINDOW_BODIES` and no module under `src/windows/gallery/` carries a hex colour or a palette utility, and the `#photos` reference block leaves `src/index.css` in this change.
- **AC-14**: The content layer, the window manager, the frame and the open target model are unchanged: no schema, no entry, no content rule, no manager action and no new target kind.
- **AC-15**: The window's state is one small machine over the album showing and the photo open, every transition is a pure function tested with no DOM, and the album lookup sits beside that state rather than in the content layer.

## Decision

**Chosen option**: Option 1, the gallery as a window on the shared stage, on its own state, with the viewer inside the window.

One body registered by one line in `WINDOW_BODIES`, composing what spec 0006 already settled: the `WindowStage` carries the album sidebar in its `side` slot and the grid or the viewer in its one content region along with the window's single polite live region. The album showing and the photo open live in the window's own state, seeded with the first album, so the manager, the frame and the target model stay exactly as they are. The viewer is a panel inside the same window rather than an overlay over the desktop, so the frame, the region rule and the focus rules all hold.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `illegal-states` (`.copilot/skills/illegal-states/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

The content model does not change. This is the shape the window reads, plus the view state it adds on top.

| Entity | Key | Fields | Notes |
|---|---|---|---|
| `Album` | `AlbumId` (`library`, `memories`, `places`, `people`, `favorites`) | `id`, `title`, `icon`, `photos` | Strict and readonly. An empty `photos` array stays valid, which is what lets four albums stand empty. |
| `Photo` | `PhotoId` (`library-1` to `library-4`) | `id`, `imageUrl`, `alt` | Strict and readonly. The id union is global, so a photo is addressed on its own and appears in exactly one album. |
| `GalleryState` (new, view only, never stored) | the `gallery` window instance | `albumId`, `openPhoto` | `albumId` names the album showing. `openPhoto` is the index of the open photo in that album, or `null` while the grid shows. |

`Album` 1:N `Photo`, unchanged. The album id union already covers every album and the photo id union every photo, so a reference to an album or a photo that does not exist cannot compile.

**State transitions**:

```
window opens (dock button, phone tile)
        |
        v
 album = head of ALBUMS, openPhoto = null
        |
        |--- press an album row ---> album = that album, openPhoto = null
        |
        |--- press a tile ---------> openPhoto = that photo's index
        |                                   |
        |                                   |--- left / right arrow ---> openPhoto = step(index, +-1), wrapping
        |                                   |--- Escape, or Close -----> openPhoto = null, focus returns to that tile
        |
        |--- Escape with openPhoto = null --> the window closes (spec 0004, unchanged)
```

| State | `albumId` | `openPhoto` | What shows |
|---|---|---|---|
| Fresh | the first album | `null` | the grid of the first album |
| Another album read | that album | `null` | that album's grid |
| A photo open | the album showing | that photo's index | the viewer, and the album's row stays marked |
| Stepped | unchanged | the next index, wrapped | the viewer on the neighbouring photo |
| Closed | unchanged | `null` | the same album's grid, focus back on that photo's tile |
| Album changed while open | the new album | `null` | the new album's grid, the viewer closed |

A failed asset is not a state of this machine. It belongs to the one tile, or to the viewer, exactly as the image file window already holds it, so the machine stays two values wide.

**Window surface**:

| Surface | Kind | Key inputs | Key outputs | Failure |
|---|---|---|---|---|
| `WINDOW_BODIES.gallery` | the one registry line | – | `{ Body: GalleryWindow }`, with no `Lead` and no `Scope` | a window id with no body fails the typecheck |
| `GalleryWindow` | body, `src/windows/gallery/GalleryWindow.tsx` | `WindowBodyProps` | one `WindowStage`: the album sidebar in `side`, the grid or the viewer in the content area, the announcement in `status` | – |
| `AlbumSidebar` | component, `src/windows/gallery/AlbumSidebar.tsx` | the album showing, and what to do with an album a visitor picks | a `nav` named for albums, one button per album, `aria-current` on the album showing | – |
| `PhotoGrid` | component, `src/windows/gallery/PhotoGrid.tsx` | an album, and what to do with a photo a visitor picks | the named list, one `PhotoTile` per photo, and the tile refs a close hands focus back to | – |
| `PhotoTile` | component, `src/windows/gallery/PhotoTile.tsx` | one photo, and what to do with a press | the tile button, its image, and its own failed asset state | an asset that never loads shows the quiet line inside the tile, and the tile keeps its place |
| `PhotoViewer` | component, `src/windows/gallery/PhotoViewer.tsx` | the album, the open index, and what to do with the close, the step and the hand back | the panel, its key handler (Escape answered before the frame, and the two arrows), the close control, the caption, and its own failed asset state | an asset that never loads shows the alt text and the quiet line rather than a broken image |
| `firstAlbum`, `albumAt`, `stepPhoto` | pure functions, `src/windows/gallery/galleryState.ts` | `ALBUMS`, an album id, an index and a step | the first album or `null`; the album an id names or `null`; the next index wrapped inside the album | an id that names nothing answers `null` rather than throwing |
| `useGalleryState` | hook, `src/windows/gallery/useGalleryState.ts` | `ALBUMS` | `{ album, openPhoto, chooseAlbum, openPhotoAt, closePhoto, stepPhoto }`, plus the panel and tile refs the focus moves need | – |
| `galleryLines` | words module, `src/windows/gallery/galleryLines.ts` | an album title, a position, a total, a photo's alt | `emptyAlbumLine`, `missingPhotoLine`, `albumNavLabel`, `closePhotoLabel`, `photoAnnouncement` | – |

No function here reaches outside the page: the window makes no request, writes no storage, touches no clipboard and calls no manager action.

Note on the two lookups: `firstAlbum` and `albumAt` live beside the window's own state rather than in `#content/reads`. Nothing outside the gallery needs to name an album, and the window is handed the albums it lists, so the content layer stays untouched. Runner up: an album reader beside `findResumeFile`, following the resume precedent, which buys nothing until a second caller exists.

**Value sourcing** (every value this window produces, computes or displays names where it comes from):

| Action | Value produced or displayed | Source |
|---|---|---|
| The window opens | the album showing | `firstAlbum(ALBUMS)`, the head of the content list |
| The sidebar lists its rows | every album, its order, its icon and its title | `ALBUMS` in declaration order, and each album's own `icon` and `title` |
| A sidebar row is marked | whether it is the album showing | the window state's `albumId`, compared with the row's `album.id` |
| The content area is named and headed | the album's title | `album.title`, from the same lookup as the sidebar row |
| The frame is announced | the window's own title | `WINDOWS.gallery.title`, which no album changes: the album names the content region, never the frame |
| The grid lists its tiles | each photo of the album | `album.photos`, in the order written |
| A tile is named, and its image described | the photo's alt text | `photo.alt` |
| A tile draws its image | the image path | `photo.imageUrl` |
| The viewer shows a photo | the photo, and its position in the album | derived: `album.photos[openPhoto]`, and `openPhoto + 1` of `album.photos.length` |
| The viewer's caption | the photo's alt text | `photo.alt`, the one string assistive tech also reads from the panel's name |
| A photo opening is announced | the line the live region reads | `galleryLines.photoAnnouncement`, built from the position, the total and the alt text |
| Focus returns to a tile | which tile | derived: the tile rendered for `openPhoto`, so the tile of the photo showing is the one that takes focus |
| An empty album says | the line, naming the album | `galleryLines.emptyAlbumLine`, given `album.title` |
| A photo whose asset failed says | the line, inside its tile or the viewer | `galleryLines.missingPhotoLine` |
| Every colour, space and radius | the token layer | `src/index.css`, read as the existing state and surface utilities |

**Key invariants**:

- One instance per key: a `window` target for `gallery` resolves to the `gallery` key, so a second open from the dock or a phone tile focuses the same window and starts no second one.
- A body renders exactly one `WindowStage`, holding one named region with `tabIndex={-1}` and the one polite live region. The sidebar sits in the stage's `side` slot; the grid or the viewer is the content.
- The album showing is always an album in `ALBUMS`, and the photo open is always one of that album's photos or `null`. An album change sets `openPhoto` to `null` in the same transition, so the two can never describe different albums.
- A step stays inside the album: `stepPhoto` wraps, so an index is always a valid index of the album showing and the viewer never opens on nothing.
- The viewer answers Escape before the frame does, so the key closes the nearest thing first. The panel holds that handler for as long as it is open, and the window's own Escape behaviour is unchanged and never exercised twice.
- Focus moves on exactly three changes and no others: opening a photo moves it into the panel, closing the viewer moves it back to the tile of the photo showing, and changing the album moves it to the content region. It never moves on the first render, and never when the album pressed is already the one showing. The panel is focusable but sits out of the tab order, and focus is not trapped in it: Tab carries on to the close control and then through the window's own controls.
- A failed asset is one tile's own state, and the viewer holds its own, so one photo that never loads cannot change how another photo draws.
- The body reads content through `#content` only. It holds no geometry, reads no token into state, writes no storage and calls no manager action.
- Every literal a visitor reads lives in `galleryLines.ts`, and each function is named for the state it describes rather than for where it appears on screen.
- No module under `src/windows/gallery/` carries a hex colour or a palette utility, which the spec 0006 baseline holds.

**Security model**:

There are no accounts, no sessions, no server, no storage and nothing a visitor types. The window's only outbound values are same origin image paths under `public/images`, and every image already carries its `alt` text, held by the content schema and the content suite. Nothing in this window navigates, fetches or writes.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: the dock opens the window on the first album, the grid lists its photos, a press opens the viewer, the arrows step, Close hands focus back to that tile, verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-6**.
- The album change: with the viewer open, press another album, and the viewer closes and the new grid shows, verifies **AC-7**.
- The empty album: press an album holding no photos, and the quiet line naming it shows in place of the grid, verifies **AC-8**.
- The missing asset: a tile whose image never loads keeps its place and shows the quiet line, and the viewer shows the alt text and the quiet line rather than a broken frame, verifies **AC-9**.
- The keyboard path: an album row, a tile, the close control and the frame's own controls are all reachable with a visible ring, and Escape closes the viewer while a second Escape closes the window, verifies **AC-4**, **AC-6**.
- The compact layout: at 360px the sidebar is one row of icons, the grid keeps the full width, and nothing scrolls sideways, verifies **AC-11**.
- The baseline: the registry test holds one stage and a token only palette for every entry of `WINDOW_BODIES`, verifies **AC-13**.

## Build plan

The project builds by Tracer Bullet, so the thinnest real thread lands first (the window on the stage, opened from the dock, showing a real album) and each strand after it thickens the same window. No migration is needed: the content model is unchanged, so the data work here is the window's own view state.

1. The thin thread: the `gallery` line in `WINDOW_BODIES`, the body on the shared stage, the album sidebar and a real grid of the first album, proved from the dock button and the phone tile, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-14**
2. The state and the album change: `firstAlbum`, `albumAt` and `stepPhoto`, the hook that holds them, the marked row, and the rule that an album change closes the viewer, satisfies **AC-2**, **AC-7**, **AC-15**
3. The viewer: the panel and the key handler it owns (Escape answered ahead of the frame, and the two arrows with their wrap), its focus move and the hand back to the tile, the close control, and the live region announcement on every change of the open photo, satisfies **AC-5**, **AC-6**
4. The quiet states: the empty album line, and the missing asset held as the tile's own state and the viewer's own state, satisfies **AC-8**, **AC-9**
5. The loading, the layout and the suites: lazy loading on the thumbnails and the eager viewer photo, the token pass, `#photos` deleted from `src/index.css`, the stacked sidebar and grid at 360px, the unit suites and `e2e/gallery.spec.ts`, satisfies **AC-10**, **AC-11**, **AC-12**, **AC-13**

## Consequences

**Positive**:

- The gallery arrives as content and its own words on the stage the other windows already share, so the codebase gains no new pattern for it.
- The album stays the window's own state, so the manager, the frame and the target model are untouched and this window cannot affect any other.
- The viewer is proved inside a window rather than over the desktop, which keeps the frame, the one region rule and the focus rules honest.
- The empty and missing states reuse the shared quiet line, so the four albums without photos read as states rather than as faults.
- The `#photos` reference block retires, so one more piece of palette based reference CSS leaves the stylesheet.

**Negative / tradeoffs**:

- The album is not part of the window's target, so nothing can open the gallery on a named album (a desktop icon, a menu item, a link). Adding that later means a new target kind and a manager change.
- The window holds two pieces of state rather than one, which makes it the most stateful body in the app.
- Escape now means two things inside one window, so the panel has to answer the key before the frame does, and that ordering is held by a test rather than by the type system.
- The photos point at files that are not in the repo, so the window shows its missing asset state until real photographs land at those paths.
- Four of the five albums hold no photos, so most of the sidebar leads to the quiet line until the authoring layer catches up.
- The empty album line repeats the wording the Finder's empty place line uses, in a second words module.

**Neutral**:

- The content layer is unchanged: no field, no entry and no rule moves.
- No new token, no new duration and no animation, so the window uses the surface, ink and state utilities that already exist.
- No shell list changes: the gallery already has a window entry, a dock app and a phone tile.
- The window paints in `--font-georama` throughout; the mono face is not used here.

## Follow-up

- [ ] Add real photographs under `public/images` at the paths the content names (`gal1.png` to `gal4.png`), or repoint `ALBUMS` at the files you add. Until then every tile shows the missing asset state.
- [ ] Four of the five albums hold no photos. Author the photographs you want there, or take the albums down, before the gallery is shown to a recruiter.
- [ ] `src/windows/AGENTS.md` names a folder per window and does not list `gallery/` yet; `/sync` owns that file.
- [ ] `design.md`'s reference only paragraph should record that `#photos` retired, beside the notes for the windows that already landed.
- [ ] The empty album line repeats the Finder's empty place wording in a second module. If a third window needs the same sentence, promote it to one shared line rather than adding a third copy.
- [ ] Opening a photo in the existing Preview window was considered and left out: that body reads a file id from the Finder tree, and a gallery photo is not in the tree.
- [ ] Row 9 (spec 0006) flagged that the stage's sidebar slot might need a second look when the gallery landed. It does not: the gallery uses the Finder's sidebar shape as it stands.

## Rationale

Reasoning, options and context: see [rationale.md](rationale.md).
