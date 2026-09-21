import { describe, expect, it } from 'vitest'

import {
  albumNavLabel,
  closePhotoLabel,
  emptyAlbumLine,
  missingPhotoLine,
  noAlbumsLine,
  photoAnnouncement,
} from '#windows/gallery/galleryLines'

/**
 * The window's words: every one of them, with the value it names passed in from outside so none of
 * them holds a copy of the content layer.
 * Spec 0010, AC-8, AC-9.
 */
describe('the gallery words', () => {
  // covers: AC-2
  it('names the album sidebar, and the Close control says what it closes', () => {
    expect(albumNavLabel()).toBe('Albums')
    expect(closePhotoLabel()).toBe('Close photo')
  })

  // covers: AC-8
  it('names the album it is empty of, so the line reads as a state rather than a fault', () => {
    expect(emptyAlbumLine('Memories')).toBe('Nothing in Memories yet.')
  })

  // covers: AC-9
  it('says what happened to a photo whose asset never loaded', () => {
    expect(missingPhotoLine()).toBe('This photo did not load.')
  })

  // covers: AC-8
  it('has a word for a content layer carrying no album at all', () => {
    expect(noAlbumsLine()).not.toBe('')
  })

  // covers: AC-5
  it('announces the place in the album and the photo itself, so a step says as much as an open', () => {
    expect(photoAnnouncement(2, 4, 'A jetty at dusk')).toBe('Photo 2 of 4. A jetty at dusk')
  })
})
