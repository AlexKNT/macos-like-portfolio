import { describe, expect, it } from 'vitest'

import { outcomeForRow } from '#windows/skills/outcomeForRow'
import type { CopyState } from '#windows/copyState'

/**
 * Where a confirmation appears: on the row that was pressed and nowhere else, including when a
 * second name is taken and the first confirmation has to clear. Spec 0006, AC-3.
 */

const COPIED_FRONTEND: CopyState = {
  kind: 'copied',
  key: { row: 'frontend', name: 'React.js' },
}

const COPIED_DATABASE: CopyState = {
  kind: 'copied',
  key: { row: 'database', name: 'PostgreSQL' },
}

const REFUSED_FRONTEND: CopyState = {
  kind: 'failed',
  key: { row: 'frontend', name: 'React.js' },
  reason: { kind: 'refused' },
}

describe('outcomeForRow', () => {
  // covers: AC-3
  it('says nothing on any row while nothing has been copied', () => {
    expect(outcomeForRow({ kind: 'idle' }, 'frontend')).toBeNull()
  })

  // covers: AC-3
  it('confirms the row the name was taken from, and only that row', () => {
    expect(outcomeForRow(COPIED_FRONTEND, 'frontend')).toEqual({
      kind: 'copied',
      name: 'React.js',
    })
    expect(outcomeForRow(COPIED_FRONTEND, 'database')).toBeNull()
  })

  // covers: AC-3
  it('moves the outcome to the row of the second copy, clearing the first', () => {
    expect(outcomeForRow(COPIED_DATABASE, 'frontend')).toBeNull()
    expect(outcomeForRow(COPIED_DATABASE, 'database')).toEqual({
      kind: 'copied',
      name: 'PostgreSQL',
    })
  })

  // covers: AC-4
  it('carries a refusal to the row it happened on', () => {
    expect(outcomeForRow(REFUSED_FRONTEND, 'frontend')).toEqual({
      kind: 'failed',
      name: 'React.js',
    })
  })
})
