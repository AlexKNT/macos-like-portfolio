import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TECH_GROUPS } from '#content/techStack'
import { copiedLine } from '#windows/copyLines'
import { TechStack } from '#windows/skills/TechStack'
import { emptyGroupLine } from '#windows/skills/skillsLines'
import type { CopyKey } from '#windows/copyState'
import type { TechGroup } from '#content/types'

/**
 * The stack itself: the order it prints, where the outcome lands, and the one state a row cannot
 * show by printing its names, an area with nothing in it. Spec 0006, AC-1, AC-3, AC-9.
 */

/** A press that records nothing: the wiring below is about where an outcome appears. */
const ignore: (key: CopyKey, text: string) => void = () => {}

/** A group with nothing in it, which the content layer is allowed to hold. */
const EMPTY_TOOLS: TechGroup = { id: 'tools', category: 'Dev Tools', items: [] }

describe('the tech stack', () => {
  // covers: AC-1
  it('prints one row per group, in the order it was handed them', () => {
    render(<TechStack groups={TECH_GROUPS} state={{ kind: 'idle' }} onCopy={ignore} />)

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(TECH_GROUPS.length)
    expect(
      screen.getAllByRole('listitem').filter((item) => item.querySelector('h2') !== null),
    ).toHaveLength(TECH_GROUPS.length)
  })

  // covers: AC-3
  it('shows the confirmation on the row the copy names and nowhere else', () => {
    render(
      <TechStack
        groups={TECH_GROUPS}
        state={{ kind: 'copied', key: { row: 'database', name: 'PostgreSQL' } }}
        onCopy={ignore}
      />,
    )

    const database = screen.getByRole('heading', { level: 2, name: 'Database' }).closest('li')
    const frontend = screen.getByRole('heading', { level: 2, name: 'Frontend' }).closest('li')

    expect(within(database as HTMLElement).getByText(copiedLine('PostgreSQL'))).toBeInTheDocument()
    expect(within(frontend as HTMLElement).queryByText(/^Copied /)).toBeNull()
  })

  // covers: AC-9
  it('still prints a category that lists nothing, with the quiet line under it', () => {
    render(<TechStack groups={[EMPTY_TOOLS]} state={{ kind: 'idle' }} onCopy={ignore} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Dev Tools' })).toBeInTheDocument()
    expect(screen.getByText(emptyGroupLine())).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toEqual([])
  })
})
