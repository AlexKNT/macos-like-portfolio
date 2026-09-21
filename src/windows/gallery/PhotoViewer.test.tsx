import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PhotoViewer } from '#windows/gallery/PhotoViewer'
import { closePhotoLabel, missingPhotoLine } from '#windows/gallery/galleryLines'
import type { Photo } from '#content/types'

/**
 * The viewer's panel driven on its own, away from the window: what it is named by, which keys it
 * answers and which it leaves alone, and what it holds when its asset never loads.
 *
 * The panel is the one control in this window that answers the keyboard itself, so the cases here
 * are about the boundary it draws: it owns Escape and the two arrows for as long as it is open, and
 * it stays out of the way of everything else, so the window's own keys are never swallowed by a
 * photo being on screen.
 * Spec 0010, AC-5, AC-6, AC-9, AC-10.
 */

const PHOTO: Photo = { id: 'library-1', imageUrl: '/images/gal1.png', alt: 'A jetty at dusk' }

function setup(onKeyDown?: () => void) {
  const onClose = vi.fn()
  const onStep = vi.fn()

  const view = render(
    <div onKeyDown={onKeyDown}>
      <PhotoViewer photo={PHOTO} onClose={onClose} onStep={onStep} panelRef={() => undefined} />
    </div>,
  )

  return { ...view, onClose, onStep }
}

/** The panel itself, which is a figure named by the photo it shows. */
function panel(): HTMLElement {
  return screen.getByRole('figure', { name: PHOTO.alt })
}

describe('the photo panel', () => {
  // covers: AC-5, AC-10
  it('is named by the photo, draws it whole and eagerly, and repeats it for the eye alone', () => {
    setup()

    const shown = panel()

    expect(shown).toHaveAttribute('tabindex', '-1')
    expect(shown.querySelector('img')?.getAttribute('src')).toBe(PHOTO.imageUrl)
    expect(shown.querySelector('img')?.getAttribute('loading')).toBe('eager')

    // The description is heard once, from the panel: the caption and the image add nothing.
    expect(screen.getByText(PHOTO.alt)).toHaveAttribute('aria-hidden', 'true')
    expect(shown.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  // covers: AC-6
  it('answers Escape and the two arrows itself, and stops the arrows from scrolling the area', () => {
    const { onClose, onStep } = setup()
    const shown = panel()

    // A handled key stops where it is answered, so the window's own Escape is not seen first.
    expect(fireEvent.keyDown(shown, { key: 'Escape' })).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)

    // An arrow both steps the album and keeps the key to itself, which is what stops the content
    // area scrolling behind the viewer.
    expect(fireEvent.keyDown(shown, { key: 'ArrowLeft' })).toBe(false)
    expect(fireEvent.keyDown(shown, { key: 'ArrowRight' })).toBe(false)
    expect(onStep.mock.calls).toEqual([[-1], [1]])
  })

  // covers: AC-6
  it('leaves every other key alone, so the window keeps the keys that are not a photo step', () => {
    const onKeyDown = vi.fn()
    const { onClose, onStep } = setup(onKeyDown)

    // `true` means the browser's default was left in place, and the ancestor heard the key.
    expect(fireEvent.keyDown(panel(), { key: 'Tab' })).toBe(true)
    expect(fireEvent.keyDown(panel(), { key: 'a' })).toBe(true)
    expect(onKeyDown).toHaveBeenCalledTimes(2)
    expect(onClose).not.toHaveBeenCalled()
    expect(onStep).not.toHaveBeenCalled()
  })

  // covers: AC-9
  it('holds its own failed asset state: the line takes the picture place and the caption still reads', () => {
    setup()

    fireEvent.error(panel().querySelector('img') as HTMLImageElement)

    const shown = panel()

    expect(shown.querySelector('img')).toBeNull()
    expect(screen.getByText(missingPhotoLine())).toBeInTheDocument()
    expect(shown).toHaveAccessibleName(PHOTO.alt)
    expect(screen.getByText(PHOTO.alt)).toBeInTheDocument()
  })

  // covers: AC-6
  it('closes from its one control, which is the only button it draws', () => {
    const { onClose } = setup()

    const controls = screen.getAllByRole('button')

    expect(controls).toHaveLength(1)
    expect(controls[0]).toHaveAccessibleName(closePhotoLabel())

    fireEvent.click(controls[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
