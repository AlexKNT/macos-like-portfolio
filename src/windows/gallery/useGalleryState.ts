import { useCallback, useEffect, useRef, useState } from 'react'

import { ALBUMS } from '#content/gallery'
import {
  albumAt,
  albumChosen,
  photoClosed,
  photoOpened,
  photoStepped,
  seededGallery,
} from '#windows/gallery/galleryState'
import type { RefObject } from 'react'
import type { Album, AlbumId } from '#content/types'
import type { GalleryState } from '#windows/gallery/galleryState'

/** What the window reads from its own state, and the actions it can call. */
export type GalleryView = {
  /** The album showing, resolved from the content layer, or null when there is no album at all. */
  readonly album: Album | null
  /** The index of the photo the viewer shows, or null while the grid is showing. */
  readonly openPhoto: number | null
  /** Shows the album a row names, as a grid, in one transition. */
  readonly chooseAlbum: (albumId: AlbumId) => void
  /** Opens the photo a tile stands at. */
  readonly openPhotoAt: (index: number) => void
  /** Closes the viewer and leaves the album showing. */
  readonly closePhoto: () => void
  /** Steps the open photo inside its album, wrapping at both ends. */
  readonly stepPhoto: (step: number) => void
  /** The stage's content area, which takes the keyboard when the album changes. */
  readonly regionRef: RefObject<HTMLDivElement | null>
  /** The viewer's panel, which takes the keyboard when a photo opens. */
  readonly panelRef: (element: HTMLElement | null) => void
  /** The button of one tile, so closing the viewer hands the keyboard back to the right photo. */
  readonly tileRef: (index: number, element: HTMLButtonElement | null) => void
}

/** The pair of values a focus move is decided from: the album showing and the photo open. */
type Showing = { readonly albumId: AlbumId | null; readonly openPhoto: number | null }

/** The two values as one record, so an effect can tell a change from a re-render. */
function showingOf(state: GalleryState | null): Showing {
  return state === null
    ? { albumId: null, openPhoto: null }
    : { albumId: state.albumId, openPhoto: state.openPhoto }
}

/**
 * The Gallery window's own state: the album showing, the photo open, and the three moments the
 * keyboard moves.
 *
 * The window's state is not the manager's. The album is not part of the window's target, so it
 * lives here, and the manager, the frame and the target model stay exactly as they are. Every
 * transition is a pure function of the state and produces a new state, so the machine is tested
 * without a DOM and this hook is only its edge.
 *
 * The keyboard moves on exactly three changes and on no others, because those are the three the
 * window makes: opening a photo puts it on the panel so the arrows land on the viewer, closing the
 * viewer hands it back to the tile of the photo that was showing so the next Tab carries on from
 * there, and choosing another album puts it in the new content region so the next Tab walks the new
 * grid. Nothing moves on the first render, and nothing moves when a press changes no album.
 *
 * The refs are here rather than in the body because the move and the state change are one decision:
 * the body renders what the state says and hands back the elements, and this is the one place that
 * knows where the keyboard should be afterwards. Spec 0010, AC-2, AC-5, AC-6, AC-7, AC-15.
 */
export function useGalleryState(): GalleryView {
  const [state, setState] = useState<GalleryState | null>(() => seededGallery(ALBUMS))
  const region = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const tiles = useRef(new Map<number, HTMLButtonElement>())
  const previous = useRef<Showing>(showingOf(state))

  const album = state === null ? null : albumAt(ALBUMS, state.albumId)
  const albumId = album === null ? null : album.id
  const openPhoto = state === null ? null : state.openPhoto

  useEffect(() => {
    const before = previous.current

    previous.current = { albumId, openPhoto }

    if (before.albumId !== albumId) {
      region.current?.focus()
      return
    }

    if (openPhoto !== null) {
      // A photo opened. A step moves the photo, not the keyboard, so this fires on the open alone.
      if (before.openPhoto === null) {
        panel.current?.focus()
      }

      return
    }

    if (before.openPhoto !== null) {
      tiles.current.get(before.openPhoto)?.focus()
    }
  }, [albumId, openPhoto])

  const chooseAlbum = useCallback((next: AlbumId) => {
    setState((current) => (current === null ? null : albumChosen(current, next)))
  }, [])

  const openPhotoAt = useCallback((index: number) => {
    setState((current) => (current === null ? null : photoOpened(current, index)))
  }, [])

  const closePhoto = useCallback(() => {
    setState((current) => (current === null ? null : photoClosed(current)))
  }, [])

  const stepOpenPhoto = useCallback((step: number) => {
    setState((current) => {
      if (current === null) {
        return null
      }

      const showing = albumAt(ALBUMS, current.albumId)

      return showing === null ? current : photoStepped(current, showing.photos.length, step)
    })
  }, [])

  const panelRef = useCallback((element: HTMLElement | null) => {
    panel.current = element
  }, [])

  const tileRef = useCallback((index: number, element: HTMLButtonElement | null) => {
    if (element === null) {
      tiles.current.delete(index)
      return
    }

    tiles.current.set(index, element)
  }, [])

  return {
    album,
    openPhoto,
    chooseAlbum,
    openPhotoAt,
    closePhoto,
    stepPhoto: stepOpenPhoto,
    regionRef: region,
    panelRef,
    tileRef,
  }
}
