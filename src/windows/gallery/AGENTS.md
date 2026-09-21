# src/windows/gallery

The Gallery window: the albums down one side, the photos of the album showing in the content area, and a photo opening into a viewer inside the same window. The window is its content and its own words on the stage every body shares, and it holds no target of its own: the album showing lives in the window's state, so the manager, the frame and the target model are untouched.

Governing spec: [`0010-gallery-window`](../../../docs/specs/0010-gallery-window/index.md) for the album sidebar, the grid, the viewer and the state behind them. It composes the standard [`0006-content-window-bodies`](../../../docs/specs/0006-content-window-bodies/index.md) settled and changes none of it.

## Files

- `GalleryWindow.tsx`: the body. One `WindowStage`: the album sidebar in `side`, the grid or the viewer in the content region, and the photo announcement in `status`.
- `AlbumSidebar.tsx`: the album rows, one button per album, in the order the content declares them, with `aria-current` on the album showing and its own icon and title on each row.
- `PhotoGrid.tsx`: the album's photos as a named list, one `PhotoTile` per photo, and the shared quiet line (naming the album) when it holds none.
- `PhotoTile.tsx`: one square tile button, named by the photo's `alt`, holding its own failed asset state.
- `PhotoViewer.tsx`: the panel, its own key handler, its caption and its one Close control.
- `galleryState.ts`: the window's own machine, pure and DOM free. `GalleryState` is `GalleryGrid | GalleryViewer`, and the transitions are `seededGallery`, `albumChosen`, `photoOpened`, `photoClosed` and `photoStepped`, over the helpers `firstAlbum`, `albumAt` and `stepPhoto`.
- `useGalleryState.ts`: the hook that holds the machine, resolves the album through `#content`, and owns the three keyboard moves with the refs they need.
- `galleryLines.ts`: every literal the window shows.

## Conventions

- The album showing and the photo open travel as one value rather than two pieces of state, and each of the two states is its own type. Only the transitions build a state, and each moves both values together, so the two can never describe different albums.
- An album press always lands on that album's grid in one transition. Pressing the album already showing while its grid is up hands the state straight back, so React bails out and the repeat press is a genuine no op; pressing it while the viewer is open closes the viewer and hands the keyboard to the tile.
- The panel is a `figure`, named by the photo's `alt`, with the caption hidden from assistive tech and the image inside carrying no `alt` of its own: the description is heard once, from the panel. It is not a second named `group` or a nested landmark, which the registry baseline counts and would fail.
- The panel answers Escape and the two arrows for as long as it is open and stops those keys where it answers them, so Escape closes the nearest thing first and the arrows step the album instead of moving the window.
- A failed asset belongs to one tile or to the viewer, never to the window's state, so a photo that never loads cannot change how another photo draws.
- The album lookup lives here rather than in `#content/reads`: nothing outside this window needs to name an album, and the window is handed the albums it lists.
- The frame stays named by `WINDOWS.gallery.title` while the content region is named by the album showing, so the album names the content and never the window.

_Drafted by /sync from the introducing change, worth a quick human pass._
