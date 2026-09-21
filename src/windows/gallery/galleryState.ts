import type { Album, AlbumId } from '#content/types'

/*
 * The window's own state: which album is showing, and which of its photos is open. The two travel
 * as one value rather than as two pieces of state, so the album showing and the photo open can
 * never describe two different albums.
 *
 * Each state is its own type, so "an album, and no photo open" and "an album, and the index of the
 * photo on screen" are two things a caller can tell apart without a flag, and the index can only
 * exist while a viewer is open.
 *
 * Nothing here is stored and nothing here is read from outside the page: the state is born when the
 * window opens and dies with it, which is why opening the window again starts on the first album.
 * Spec 0010, AC-15.
 */

/** The grid showing: an album, and no photo open. */
export type GalleryGrid = { readonly albumId: AlbumId; readonly openPhoto: null }

/** The viewer open: an album, and the index of the photo showing inside it. */
export type GalleryViewer = { readonly albumId: AlbumId; readonly openPhoto: number }

/**
 * The gallery's whole state. The album showing is always an album of the list it was seeded from
 * and the photo open is always an index inside that album, because the transitions below are the
 * only things that build a state and each of them moves the two values together.
 */
export type GalleryState = GalleryGrid | GalleryViewer

/** The first album of a list in content order, or null when the list holds none. */
export function firstAlbum(albums: readonly Album[]): Album | null {
  return albums.length === 0 ? null : albums[0]
}

/** The album an id names, or null when the list holds no such album. */
export function albumAt(albums: readonly Album[], id: AlbumId): Album | null {
  return albums.find((album) => album.id === id) ?? null
}

/**
 * The index a step lands on inside an album of `count` photos. It wraps at both ends, so a step
 * past the last photo reaches the first and a step back from the first reaches the last, and the
 * answer is always a valid index of that album. A list of none answers zero, which is the index a
 * viewer can never be opened at.
 */
export function stepPhoto(count: number, index: number, step: number): number {
  if (count <= 0) {
    return 0
  }

  return (((index + step) % count) + count) % count
}

/**
 * The state a window opens on: the first album of the content list showing as a grid. Null when
 * the content carries no album at all, which is the one case with nothing to show.
 */
export function seededGallery(albums: readonly Album[]): GalleryState | null {
  const first = firstAlbum(albums)

  return first === null ? null : { albumId: first.id, openPhoto: null }
}

/**
 * The state after an album row is pressed: that album showing as a grid, in one transition. A press
 * always lands on that album's photos in the same window, so choosing another album while the
 * viewer is open closes the viewer rather than leaving a photo of one album beside another's grid.
 *
 * The one press that changes nothing hands the state straight back: pressing the album already
 * showing while its grid is up is a no-op, and the same object going back into the state is what
 * makes React bail out rather than re-render, so nothing moves, nothing re-announces and the repeat
 * press is indistinguishable from not pressing at all.
 */
export function albumChosen(state: GalleryState, albumId: AlbumId): GalleryState {
  if (state.albumId === albumId && state.openPhoto === null) {
    return state
  }

  return { albumId, openPhoto: null }
}

/** The state after a photo is pressed: that photo open, in the album already showing. */
export function photoOpened(state: GalleryState, index: number): GalleryState {
  return { albumId: state.albumId, openPhoto: index }
}

/** The state after the viewer is closed: the album unchanged, and its grid showing again. */
export function photoClosed(state: GalleryState): GalleryState {
  return { albumId: state.albumId, openPhoto: null }
}

/**
 * The state after a step: the neighbouring photo inside the same album, wrapped at both ends. A
 * step with no photo open answers the state it was given, so a key press can never open a viewer.
 */
export function photoStepped(state: GalleryState, count: number, step: number): GalleryState {
  if (state.openPhoto === null) {
    return state
  }

  return { albumId: state.albumId, openPhoto: stepPhoto(count, state.openPhoto, step) }
}
