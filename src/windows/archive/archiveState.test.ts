import { describe, expect, it } from 'vitest'

import {
  archiveAnswers,
  archiveCleared,
  canEmpty,
  emptyRequested,
  seededArchive,
} from '#windows/archive/archiveState'

/**
 * The Archive's own state, proved without a DOM: the three moments the gesture can be in, the two
 * transitions that move between them, and the two questions the body and the control ask.
 * Spec 0012, AC-4, AC-5, AC-6, AC-7, AC-10.
 */

describe('the Archive state', () => {
  // covers: AC-5, AC-7
  it('opens holding, starts clearing when Empty is pressed, and lands emptied', () => {
    expect(seededArchive()).toBe('holding')
    expect(emptyRequested('holding')).toBe('clearing')
    expect(archiveCleared('clearing')).toBe('emptied')
  })

  // covers: AC-10
  it('hands the very same value back from a transition asked at the wrong moment', () => {
    const clearing = emptyRequested(seededArchive())
    const emptied = archiveCleared(clearing)

    // A repeated press while the gesture runs, and a landing called twice, both leave the state
    // identical, which is what makes React bail out and a repeated press a genuine no op.
    expect(emptyRequested(clearing)).toBe(clearing)
    expect(emptyRequested(emptied)).toBe(emptied)
    expect(archiveCleared('holding')).toBe('holding')
    expect(archiveCleared(emptied)).toBe(emptied)
  })

  // covers: AC-5
  it('answers a press on the leftovers only while the window is holding them', () => {
    expect(archiveAnswers('holding')).toBe(true)
    expect(archiveAnswers('clearing')).toBe(false)
    expect(archiveAnswers('emptied')).toBe(false)
  })

  // covers: AC-4, AC-6
  it('offers an empty only while it is holding at least one item', () => {
    expect(canEmpty('holding', 2)).toBe(true)
    expect(canEmpty('holding', 0)).toBe(false)
    expect(canEmpty('clearing', 2)).toBe(false)
    expect(canEmpty('emptied', 2)).toBe(false)
  })
})
