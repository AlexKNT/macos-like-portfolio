import { afterEach, describe, expect, it } from 'vitest'

import { readMeasureToken } from '#lib/measure'

/**
 * The measures the script reads off the token layer: the same values CSS applies, so a
 * component that has to compute with one never holds a distance of its own. Spec 0003, AC-7;
 * spec 0004, AC-2, AC-5.
 */

/** Declares a measure token the way the stylesheet does, so the reader can find it. */
function declare(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value)
}

afterEach(() => {
  document.documentElement.removeAttribute('style')
})

describe('reading a measure token', () => {
  // covers: AC-5
  it('reads the number the token layer holds', () => {
    declare('--window-nudge-step', '16')

    expect(readMeasureToken('window-nudge-step')).toBe(16)
  })

  // covers: AC-2
  it('reads a token the stylesheet has not declared as 0, so the caller decides what that means', () => {
    expect(readMeasureToken('window-cascade-step')).toBe(0)
  })

  it('reads a value that is not a number as 0 rather than as NaN', () => {
    declare('--window-cascade-step', 'auto')

    expect(readMeasureToken('window-cascade-step')).toBe(0)
  })

  it('trims the whitespace a computed custom property arrives with', () => {
    declare('--window-nudge-step-large', '  64  ')

    expect(readMeasureToken('window-nudge-step-large')).toBe(64)
  })

  it('reads the number at the front of a value that carries a unit', () => {
    declare('--window-nudge-step', '2rem')

    // 2 rem is what CSS would use, 2 pixels is what a script would move by, which is why the
    // measure tokens are written without a unit.
    expect(readMeasureToken('window-nudge-step')).toBe(2)
  })
})
