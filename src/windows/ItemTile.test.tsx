import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { findPlace } from '#content/reads'
import { ItemTile } from '#windows/ItemTile'
import { itemTarget } from '#windows/itemTarget'
import type { FileEntry, Place } from '#content/types'

/**
 * The one face the desktop gives an entry of its file tree, wherever it is drawn: the file's own
 * icon above its own name, a button when the press opens something inside the application, a real
 * anchor when it leaves the page, and a tile that stops answering when it is disabled.
 * Spec 0012, AC-2, AC-5.
 */

const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }

/** One file of the project, by id, as the shipped content holds it. */
function file(id: string): FileEntry {
  const found = findPlace(NIKE).items.find((item) => item.id === id)

  if (found === undefined || found.kind === 'folder') {
    throw new Error(`the shipped content carries no file ${id}`)
  }

  return found
}

describe('an entry of the file tree', () => {
  // covers: AC-2
  it('is a button named by its own file, opening where that file goes', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const text = file('nike-about')

    render(<ItemTile entry={text} onOpen={onOpen} />)

    const tile = screen.getByRole('button', { name: text.name })

    expect(tile.querySelector('img')?.getAttribute('src')).toBe(text.icon)

    await user.click(tile)

    expect(onOpen).toHaveBeenCalledWith(itemTarget(text))
  })

  // covers: AC-2
  it('is a real anchor for a file that leaves the page, and opens nothing in the app', () => {
    const onOpen = vi.fn()
    const link = file('nike-live')

    render(<ItemTile entry={link} onOpen={onOpen} />)

    const tile = screen.getByRole('link', { name: link.name })

    expect(tile).toHaveAttribute('href', link.kind === 'link' ? link.href : '')
    expect(tile).toHaveAttribute('target', '_blank')
    expect(tile).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('button', { name: link.name })).toBeNull()
    expect(onOpen).not.toHaveBeenCalled()
  })

  // covers: AC-5
  it('stops answering a press while it is disabled, as a button', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()

    render(<ItemTile entry={file('nike-about')} onOpen={onOpen} disabled />)

    const tile = screen.getByRole('button')

    expect(tile).toBeDisabled()

    await user.click(tile)

    expect(onOpen).not.toHaveBeenCalled()
  })

  // covers: AC-5
  it('carries aria-disabled, takes itself out of the tab order and refuses the pointer as an anchor', () => {
    render(<ItemTile entry={file('nike-live')} onOpen={vi.fn()} disabled />)

    const tile = screen.getByRole('link')

    // An anchor has no `disabled` of its own, so the same state is said the three other ways.
    expect(tile).toHaveAttribute('aria-disabled', 'true')
    expect(tile).toHaveAttribute('tabindex', '-1')
    expect(tile).toHaveClass('pointer-events-none')
    expect(tile).not.toHaveAttribute('disabled')
  })

  // covers: AC-2
  it('leaves an anchor that is still answering in the tab order and in the pointer path', () => {
    render(<ItemTile entry={file('nike-live')} onOpen={vi.fn()} />)

    const tile = screen.getByRole('link')

    expect(tile).not.toHaveAttribute('aria-disabled')
    expect(tile).not.toHaveAttribute('tabindex')
    expect(tile).not.toHaveClass('pointer-events-none')
  })
})
