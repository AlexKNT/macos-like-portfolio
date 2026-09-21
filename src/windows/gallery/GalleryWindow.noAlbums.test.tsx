import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { WINDOWS } from '#content/windows'
import { GalleryWindow } from '#windows/gallery/GalleryWindow'
import { noAlbumsLine } from '#windows/gallery/galleryLines'

/*
 * The one state the shipped content cannot produce: a content layer carrying no album at all. The
 * window reads a list, and a list can be empty, so the list is stood in for here and the window is
 * driven into that state: it must degrade into its own named stage with a line, never into a blank
 * frame and never into a crash.
 * Spec 0010, AC-8, AC-13.
 */

vi.mock('#content/gallery', () => ({ ALBUMS: [] }))

it('shows its own line in a named stage when the content carries no album at all', () => {
  const { container } = render(
    <GalleryWindow
      windowId="gallery"
      windowKey="gallery"
      target={{ kind: 'window', windowId: 'gallery' }}
    />,
  )

  // Still a body of the shared standard: one stage and one named content area.
  expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
  expect(screen.getByRole('group', { name: WINDOWS.gallery.title })).toBeInTheDocument()

  // Nothing to show is a line rather than an empty surface, and no album is invented for it.
  expect(screen.getByText(noAlbumsLine())).toBeInTheDocument()
  expect(screen.queryByRole('navigation')).toBeNull()
  expect(screen.queryByRole('list')).toBeNull()
  expect(screen.queryByRole('heading')).toBeNull()
})
