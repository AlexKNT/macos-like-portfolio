import { describe, expect, it } from 'vitest'

import { ALBUMS } from '#content/gallery'
import {
  albumAt,
  albumChosen,
  firstAlbum,
  photoClosed,
  photoOpened,
  photoStepped,
  seededGallery,
  stepPhoto,
} from '#windows/gallery/galleryState'
import type { Album, AlbumId } from '#content/types'
import type { GalleryState } from '#windows/gallery/galleryState'

/**
 * The window's state machine, driven with no DOM at all: the album lookup, the step, and every
 * transition that moves the album showing and the photo open together.
 *
 * The two lists below are written here rather than read from the content layer, so a change to
 * `ALBUMS` cannot quietly change what these cases mean: one album of several photos and one holding
 * none is the whole range the machine has to cover.
 * Spec 0010, AC-15, AC-2, AC-6, AC-7.
 */

const ONE: Album = {
  id: 'library',
  title: 'Library',
  icon: '/icons/gicon1.svg',
  photos: [
    { id: 'library-1', imageUrl: '/images/gal1.png', alt: 'one' },
    { id: 'library-2', imageUrl: '/images/gal2.png', alt: 'two' },
    { id: 'library-3', imageUrl: '/images/gal3.png', alt: 'three' },
  ],
}

const NONE: Album = { id: 'memories', title: 'Memories', icon: '/icons/gicon2.svg', photos: [] }

const LIST: readonly Album[] = [ONE, NONE]

/** The grid showing the first album, which is what a window opens on. */
const FRESH: GalleryState = { albumId: 'library', openPhoto: null }

describe('the album lookup', () => {
  // covers: AC-15
  it('answers the head of a list in content order, and null for a list holding none', () => {
    expect(firstAlbum(LIST)).toBe(ONE)
    expect(firstAlbum([])).toBeNull()
  })

  // covers: AC-15
  it('answers the album an id names, and null for an id that names nothing', () => {
    expect(albumAt(LIST, 'memories')).toBe(NONE)
    expect(albumAt(LIST, 'nope' as AlbumId)).toBeNull()
  })
})

describe('the photo step', () => {
  // covers: AC-6, AC-15
  it('wraps at both ends of an album of several photos', () => {
    expect(stepPhoto(3, 2, 1)).toBe(0)
    expect(stepPhoto(3, 0, -1)).toBe(2)
    expect(stepPhoto(3, 0, 1)).toBe(1)
  })

  // covers: AC-6, AC-15
  it('answers the only index there is for an album of one photo', () => {
    expect(stepPhoto(1, 0, 1)).toBe(0)
    expect(stepPhoto(1, 0, -1)).toBe(0)
  })

  // covers: AC-15
  it('answers a valid index however far the step reaches, and nothing at all for an empty album', () => {
    expect(stepPhoto(4, 1, 11)).toBe(0)
    expect(stepPhoto(4, 1, -11)).toBe(2)
    expect(stepPhoto(0, 0, 1)).toBe(0)
  })
})

describe('the gallery machine', () => {
  // covers: AC-1, AC-15
  it('seeds on the first album of the list with no photo open, and nothing for a list of none', () => {
    expect(seededGallery(LIST)).toEqual({ albumId: 'library', openPhoto: null })
    expect(seededGallery([])).toBeNull()
  })

  // covers: AC-2, AC-7, AC-15
  it('sets the album and closes the viewer in one transition, whichever album was pressed', () => {
    const open: GalleryState = { albumId: 'library', openPhoto: 2 }

    expect(albumChosen(open, 'memories')).toEqual({ albumId: 'memories', openPhoto: null })
    expect(albumChosen(open, 'library')).toEqual({ albumId: 'library', openPhoto: null })
  })

  // covers: AC-2, AC-15
  it('hands the state straight back when the album pressed already shows its grid', () => {
    expect(albumChosen(FRESH, 'library')).toBe(FRESH)
  })

  // covers: AC-5, AC-15
  it('opens a photo inside the album showing, and closes it without changing that album', () => {
    expect(photoOpened(FRESH, 2)).toEqual({ albumId: 'library', openPhoto: 2 })
    expect(photoClosed({ albumId: 'library', openPhoto: 2 })).toEqual(FRESH)
  })

  // covers: AC-6, AC-15
  it('steps inside the album showing, wraps, and never opens a viewer from a closed one', () => {
    expect(photoStepped({ albumId: 'library', openPhoto: 2 }, 3, 1)).toEqual({
      albumId: 'library',
      openPhoto: 0,
    })
    expect(photoStepped({ albumId: 'library', openPhoto: 0 }, 3, -1)).toEqual({
      albumId: 'library',
      openPhoto: 2,
    })
    expect(photoStepped(FRESH, 3, 1)).toBe(FRESH)
  })

  // covers: AC-1, AC-2, AC-15
  it('seeds from the shipped content on its own first album', () => {
    expect(seededGallery(ALBUMS)).toEqual({ albumId: ALBUMS[0].id, openPhoto: null })
  })
})
