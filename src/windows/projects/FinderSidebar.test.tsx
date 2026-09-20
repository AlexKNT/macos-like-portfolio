import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LOCATIONS } from '#content/locations'
import { PROJECT_FOLDERS } from '#content/reads'
import { FinderSidebar } from '#windows/projects/FinderSidebar'
import type { Place } from '#content/types'

/**
 * The Finder's sidebar on its own: the places it lists and the order it lists them in, the name
 * and icon each row reads out of the content layer, the one mark it paints, and what a press
 * asks for. The rows it nests under `Work` come from the tree rather than from a second list.
 * Spec 0005, AC-1, AC-3, AC-10, AC-12.
 */

const WORK: Place = { kind: 'location', locationId: 'work' }
const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }

/** The sidebar with a place showing, and a stand in for what a press does. */
function setup(place: Place = WORK) {
  const onOpen = vi.fn()

  render(<FinderSidebar place={place} onOpen={onOpen} />)

  return onOpen
}

/** The rows in the order they are laid out in, which is the order the keyboard walks them. */
function rows(): HTMLElement[] {
  return within(screen.getByRole('navigation', { name: 'Favourites' })).getAllByRole('button')
}

/** The row of a place, found by the name assistive tech announces, which is the place's own. */
function rowOf(name: string): HTMLElement {
  return screen.getByRole('button', { name })
}

/** The picture a row paints. It is decorative, so the element carries no role of its own. */
function iconOf(row: HTMLElement): string {
  return row.querySelector('img')?.getAttribute('src') ?? ''
}

describe('the Finder sidebar', () => {
  // covers: AC-1
  it('lists the four locations in the content order, with the projects nested under work', () => {
    setup()

    expect(rows().map((row) => row.textContent?.trim())).toEqual([
      LOCATIONS.work.name,
      ...Object.values(PROJECT_FOLDERS).map((project) => project.name),
      LOCATIONS.about.name,
      LOCATIONS.resume.name,
      LOCATIONS.trash.name,
    ])
  })

  // covers: AC-1
  it('names and pictures every row from the content layer', () => {
    setup()

    for (const location of Object.values(LOCATIONS)) {
      expect(iconOf(rowOf(location.name)), location.id).toBe(location.icon)
    }

    for (const project of Object.values(PROJECT_FOLDERS)) {
      expect(iconOf(rowOf(project.name)), project.id).toBe(project.icon)
    }
  })

  // covers: AC-3, AC-12
  it('gives every row a name of its own, so it is announced at any width', () => {
    setup()

    // The name sits in a span the compact layout hides visually, so it is still the row's
    // accessible name once the label is gone.
    expect(rows()).toHaveLength(
      Object.values(LOCATIONS).length + Object.values(PROJECT_FOLDERS).length,
    )

    for (const row of rows()) {
      expect(row).toHaveAccessibleName()
    }
  })

  // covers: AC-10
  it('marks the location showing, and marks no other row', () => {
    setup(WORK)

    const marked = rows().filter((row) => row.getAttribute('aria-current') === 'true')

    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent(LOCATIONS.work.name)
  })

  // covers: AC-10
  it('marks the project showing while a project is the place on screen', () => {
    setup(NIKE)

    const marked = rows().filter((row) => row.getAttribute('aria-current') === 'true')

    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent(PROJECT_FOLDERS['nike-ecommerce'].name)
    expect(rowOf(LOCATIONS.work.name)).not.toHaveAttribute('aria-current')
  })

  // covers: AC-1
  it('asks for the place a row stands for, which is what the manager is told to show', async () => {
    const user = userEvent.setup()
    const onOpen = setup()

    await user.click(rowOf(LOCATIONS.about.name))
    await user.click(rowOf(PROJECT_FOLDERS['nike-ecommerce'].name))

    expect(onOpen).toHaveBeenNthCalledWith(1, { kind: 'location', locationId: 'about' })
    expect(onOpen).toHaveBeenNthCalledWith(2, { kind: 'project', projectId: 'nike-ecommerce' })
  })
})
