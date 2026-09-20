import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LOCATIONS } from '#content/locations'
import { findPlace, openTargetFor } from '#content/reads'
import { FinderGrid } from '#windows/projects/FinderGrid'
import { emptyPlaceLine } from '#windows/projects/quietLines'
import type { FileEntry, Place } from '#content/types'

/**
 * The items of a place: one control per item in the content order, a button for what opens
 * inside the app and an anchor for what leaves the page, and a quiet line for a place with
 * nothing in it. Spec 0005, AC-1, AC-3, AC-7, AC-8.
 */

const WORK: Place = { kind: 'location', locationId: 'work' }
const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }

describe('the Finder grid', () => {
  // covers: AC-1, AC-3
  it('gives every item of a place a control named by the item, in the content order', () => {
    const items = findPlace(WORK).items

    render(<FinderGrid items={items} placeName="Work" onOpen={vi.fn()} />)

    expect(screen.getAllByRole('button').map((item) => item.textContent?.trim())).toEqual(
      items.map((item) => item.name),
    )
  })

  // covers: AC-3, AC-7
  it('makes a folder and a file a button that opens in the app, and a link file an anchor', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const files = findPlace(NIKE).items.filter((item): item is FileEntry => item.kind !== 'folder')

    render(<FinderGrid items={files} placeName="Nike" onOpen={onOpen} />)

    for (const file of files) {
      if (file.kind === 'link') {
        const anchor = screen.getByRole('link', { name: file.name })

        expect(anchor, file.id).toHaveAttribute('href', file.href)
        expect(anchor, file.id).toHaveAttribute('target', '_blank')
        expect(anchor, file.id).toHaveAttribute('rel', 'noopener noreferrer')
        expect(screen.queryByRole('button', { name: file.name }), file.id).toBeNull()
        continue
      }

      await user.click(screen.getByRole('button', { name: file.name }))

      expect(onOpen, file.id).toHaveBeenCalledWith(openTargetFor(file))
    }
  })

  // covers: AC-3
  it('opens a folder as the place it stands for rather than as a file', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()

    render(<FinderGrid items={findPlace(WORK).items} placeName="Work" onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: LOCATIONS.work.children[0]?.name ?? '' }))

    expect(onOpen).toHaveBeenCalledWith({ kind: 'project', projectId: 'nike-ecommerce' })
  })

  // covers: AC-8
  it('says so, naming the place, when the place holds nothing', () => {
    render(<FinderGrid items={[]} placeName={LOCATIONS.trash.name} onOpen={vi.fn()} />)

    expect(screen.getByText(emptyPlaceLine(LOCATIONS.trash.name))).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
