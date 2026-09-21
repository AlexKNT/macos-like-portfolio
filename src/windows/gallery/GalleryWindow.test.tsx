import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ALBUMS } from '#content/gallery'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { GalleryWindow } from '#windows/gallery/GalleryWindow'
import {
  albumNavLabel,
  closePhotoLabel,
  emptyAlbumLine,
  missingPhotoLine,
  photoAnnouncement,
} from '#windows/gallery/galleryLines'
import type { OpenTarget } from '#content/types'

/**
 * The Gallery window driven the way the desktop drives it: the stage it is built in, the album
 * sidebar, the grid of the album showing, the viewer a photo opens into, the three moments the
 * keyboard moves, and the states where there is nothing to draw.
 *
 * The albums come from the shipped content, so the cases read as the window a visitor meets: the
 * first album holds four photos and the second holds none, which is the whole range between a grid
 * and the quiet line.
 * Spec 0010, AC-1 to AC-11, AC-13.
 */

/** The window as the manager opens it: a bare `window` target for its own id. */
const TARGET: OpenTarget = { kind: 'window', windowId: 'gallery' }

const LIBRARY = ALBUMS[0]
const MEMORIES = ALBUMS[1]

function setup(onKeyDown?: () => void) {
  return render(
    <WindowManagerProvider>
      <div onKeyDown={onKeyDown}>
        <GalleryWindow windowId="gallery" windowKey="gallery" target={TARGET} />
      </div>
    </WindowManagerProvider>,
  )
}

/** The stage's live region, which is the one way this window says anything out loud. */
function liveRegion(container: HTMLElement): HTMLElement {
  const found = container.querySelector<HTMLElement>('[aria-live="polite"]')

  if (found === null) {
    throw new Error('the stage renders no live region')
  }

  return found
}

/** The content area the stage names after the album showing. */
function content(albumTitle: string): HTMLElement {
  return screen.getByRole('group', { name: albumTitle })
}

/** The album sidebar. */
function sidebar(): HTMLElement {
  return screen.getByRole('navigation', { name: albumNavLabel() })
}

/** One album row of the sidebar. */
function albumRow(albumTitle: string): HTMLElement {
  return within(sidebar()).getByRole('button', { name: albumTitle })
}

/** The tile of one photo, found by the description that names it. */
function tile(alt: string): HTMLElement {
  return within(content(LIBRARY.title)).getByRole('button', { name: alt })
}

/** The viewer's panel, which is a figure named by the photo it shows. */
function panel(alt: string): HTMLElement {
  return screen.getByRole('figure', { name: alt })
}

/** Opens the first photo, which is where every viewer case starts. */
async function openFirstPhoto(): Promise<void> {
  const user = userEvent.setup()

  await user.click(tile(LIBRARY.photos[0].alt))
}

describe('the Gallery window', () => {
  // covers: AC-1, AC-3, AC-13
  it('is one stage whose content area is named by the album, while the frame keeps its own name', () => {
    const { container } = setup()

    expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
    expect(content(LIBRARY.title)).toBeInTheDocument()

    // Two names on purpose: the album names the content, and never the window.
    expect(
      within(content(LIBRARY.title)).getByRole('heading', { name: LIBRARY.title }),
    ).toBeInTheDocument()
    expect(WINDOWS.gallery.title).not.toBe(LIBRARY.title)
  })

  // covers: AC-2
  it('lists every album in content order, each with its own icon and title, and marks exactly one', () => {
    setup()

    const rows = within(sidebar()).getAllByRole('button')

    expect(rows.map((row) => row.textContent)).toEqual(ALBUMS.map((album) => album.title))

    for (const [index, album] of ALBUMS.entries()) {
      expect(rows[index].querySelector('img')?.getAttribute('src')).toBe(album.icon)
    }

    const marked = rows.filter((row) => row.getAttribute('aria-current') === 'true')

    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent(LIBRARY.title)
  })

  // covers: AC-4, AC-10
  it('shows the album as a named list, one lazily loaded button per photo, named by its own alt', () => {
    setup()

    const list = screen.getByRole('list', { name: LIBRARY.title })

    expect(within(list).getAllByRole('listitem')).toHaveLength(LIBRARY.photos.length)

    for (const photo of LIBRARY.photos) {
      const button = within(list).getByRole('button', { name: photo.alt })
      const image = button.querySelector('img')

      expect(image?.getAttribute('src')).toBe(photo.imageUrl)
      expect(image?.getAttribute('alt')).toBe(photo.alt)
      expect(image?.getAttribute('loading')).toBe('lazy')
    }
  })

  // covers: AC-5, AC-10
  it('opens a photo into a panel that takes the keyboard, is named by the alt and shows the photo whole', async () => {
    const photo = LIBRARY.photos[0]

    setup()
    await openFirstPhoto()

    const shown = panel(photo.alt)

    expect(document.activeElement).toBe(shown)
    expect(shown).toHaveAttribute('tabindex', '-1')
    expect(within(shown).queryByRole('list')).toBeNull()
    expect(screen.queryByRole('list', { name: LIBRARY.title })).toBeNull()

    // The caption is written for the eye: the panel's own name already carries the description.
    expect(within(shown).getByText(photo.alt)).toHaveAttribute('aria-hidden', 'true')

    // The image describes nothing a second time, and it is the one that loads without waiting.
    const image = shown.querySelector('img')

    expect(within(shown).queryByRole('img')).toBeNull()
    expect(image?.getAttribute('src')).toBe(photo.imageUrl)
    expect(image?.getAttribute('loading')).toBe('eager')
  })

  // covers: AC-5
  it('announces the photo through the stage on the open and on every step', async () => {
    const user = userEvent.setup()
    const { container } = setup()
    const [first, second] = LIBRARY.photos

    expect(liveRegion(container)).toHaveTextContent('')

    await user.click(tile(first.alt))
    expect(liveRegion(container)).toHaveTextContent(
      photoAnnouncement(1, LIBRARY.photos.length, first.alt),
    )

    await user.keyboard('{ArrowRight}')
    expect(liveRegion(container)).toHaveTextContent(
      photoAnnouncement(2, LIBRARY.photos.length, second.alt),
    )
  })

  // covers: AC-6
  it('steps with the arrows, wraps at both ends, and draws no previous or next control', async () => {
    const user = userEvent.setup()
    const { container } = setup()

    await openFirstPhoto()

    for (let step = 0; step < LIBRARY.photos.length - 1; step += 1) {
      await user.keyboard('{ArrowRight}')
    }

    expect(panel(LIBRARY.photos[LIBRARY.photos.length - 1].alt)).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(panel(LIBRARY.photos[0].alt)).toBeInTheDocument()

    await user.keyboard('{ArrowLeft}')
    expect(panel(LIBRARY.photos[LIBRARY.photos.length - 1].alt)).toBeInTheDocument()

    // Stepping belongs to the keyboard alone: the panel holds its caption and its one way out.
    const controls = within(panel(LIBRARY.photos[LIBRARY.photos.length - 1].alt)).getAllByRole(
      'button',
    )

    expect(controls).toHaveLength(1)
    expect(controls[0]).toHaveAccessibleName(closePhotoLabel())
    expect(
      within(panel(LIBRARY.photos[LIBRARY.photos.length - 1].alt)).queryByText(/previous|next/i),
    ).toBeNull()

    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1)
  })

  // covers: AC-6
  it('answers Escape and the arrows itself, and lets every other key carry on up the tree', async () => {
    const onKeyDown = vi.fn()

    setup(onKeyDown)
    await openFirstPhoto()

    const photo = LIBRARY.photos[0]

    fireEvent.keyDown(panel(photo.alt), { key: 'ArrowRight' })
    expect(onKeyDown).not.toHaveBeenCalled()

    fireEvent.keyDown(panel(LIBRARY.photos[1].alt), { key: 'Escape' })

    // Escape closed the nearest thing first, which is the viewer and not the window.
    expect(onKeyDown).not.toHaveBeenCalled()
    expect(screen.queryByRole('figure')).toBeNull()
    expect(content(LIBRARY.title)).toBeInTheDocument()

    // With no viewer open nothing is stopped, so the frame's own Escape is untouched.
    fireEvent.keyDown(content(LIBRARY.title), { key: 'Escape' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  // covers: AC-6
  it('closes with Escape and with the Close control, and hands the keyboard back to that tile', async () => {
    const user = userEvent.setup()
    const [first, second] = LIBRARY.photos

    setup()
    await user.click(tile(second.alt))

    fireEvent.keyDown(panel(second.alt), { key: 'Escape' })
    expect(screen.queryByRole('figure')).toBeNull()
    expect(document.activeElement).toBe(tile(second.alt))

    await user.click(tile(first.alt))
    await user.click(within(panel(first.alt)).getByRole('button', { name: closePhotoLabel() }))

    expect(screen.queryByRole('figure')).toBeNull()
    expect(document.activeElement).toBe(tile(first.alt))
  })

  // covers: AC-5, AC-6
  it('keeps the panel out of the tab order and traps nothing, so Tab reaches the Close control', async () => {
    const user = userEvent.setup()

    setup()
    await openFirstPhoto()

    await user.tab()

    expect(document.activeElement).toHaveAccessibleName(closePhotoLabel())
  })

  // covers: AC-2, AC-7
  it('shows another album, closes any viewer, and moves the keyboard into the new content', async () => {
    const { container } = setup()

    await openFirstPhoto()
    fireEvent.click(albumRow(MEMORIES.title))

    // The viewer closed in the same transition as the album change, so no photo of one album is
    // ever left beside another album's grid.
    expect(screen.queryByRole('figure')).toBeNull()
    expect(content(MEMORIES.title)).toBeInTheDocument()
    expect(within(sidebar()).getByRole('button', { name: MEMORIES.title })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(liveRegion(container)).toHaveTextContent('')
    expect(document.activeElement).toBe(content(MEMORIES.title))
  })

  // covers: AC-2
  it('moves nothing on the first render, and nothing when the album pressed already shows', () => {
    setup()

    expect(document.activeElement).toBe(document.body)

    fireEvent.click(albumRow(MEMORIES.title))
    expect(document.activeElement).toBe(content(MEMORIES.title))

    // The repeat press hands the state straight back, so no move, no announcement and no re-render.
    fireEvent.click(albumRow(MEMORIES.title))
    expect(document.activeElement).toBe(content(MEMORIES.title))
    expect(content(MEMORIES.title)).toBeInTheDocument()
  })

  // covers: AC-8
  it('shows the quiet line naming an album that holds no photos, in place of the grid', () => {
    setup()

    fireEvent.click(albumRow(MEMORIES.title))

    expect(
      within(content(MEMORIES.title)).getByText(emptyAlbumLine(MEMORIES.title)),
    ).toBeInTheDocument()
    expect(within(content(MEMORIES.title)).queryByRole('list')).toBeNull()
  })

  // covers: AC-9
  it('holds a failed asset as one tile own state, so the tile beside it keeps drawing', () => {
    setup()

    const [first, second] = LIBRARY.photos
    const broken = tile(first.alt)

    fireEvent.error(broken.querySelector('img') as HTMLImageElement)

    expect(within(broken).getByText(missingPhotoLine())).toBeInTheDocument()
    expect(broken.querySelector('img')).toBeNull()

    // The tile keeps its place, its name and its neighbour.
    expect(
      within(screen.getByRole('list', { name: LIBRARY.title })).getAllByRole('listitem'),
    ).toHaveLength(LIBRARY.photos.length)
    expect(tile(first.alt)).toBeInTheDocument()
    expect(tile(second.alt).querySelector('img')).not.toBeNull()
  })

  // covers: AC-9
  it('shows the quiet line instead of a broken frame when the viewer own asset never loads', async () => {
    const photo = LIBRARY.photos[0]

    setup()
    await openFirstPhoto()

    fireEvent.error(panel(photo.alt).querySelector('img') as HTMLImageElement)

    const shown = panel(photo.alt)

    expect(within(shown).getByText(missingPhotoLine())).toBeInTheDocument()
    expect(shown.querySelector('img')).toBeNull()
    // The description is never lost: the panel keeps its name and its caption.
    expect(shown).toHaveAccessibleName(photo.alt)
    expect(within(shown).getByText(photo.alt)).toBeInTheDocument()
  })
})

/* Every literal a visitor reads is written in the window's own words module and nowhere else. */
describe('the gallery words module', () => {
  // covers: AC-8, AC-9
  it('is the only place in the window that holds a word a visitor can read', () => {
    const folder = resolve(process.cwd(), 'src/windows/gallery')
    const printed = [
      `'${albumNavLabel()}'`,
      `"${albumNavLabel()}"`,
      closePhotoLabel(),
      'Nothing in ',
      missingPhotoLine(),
      'No albums have been added yet.',
    ]
    const offenders: string[] = []

    for (const name of readdirSync(folder)) {
      if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name) || name === 'galleryLines.ts') {
        continue
      }

      const source = readFileSync(join(folder, name), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^[ \t]*\/\/.*$/gm, '')

      for (const literal of printed) {
        if (source.includes(literal)) {
          offenders.push(`${name} holds ${JSON.stringify(literal)}`)
        }
      }
    }

    expect(offenders, 'window modules holding their own words').toEqual([])
  })
})
