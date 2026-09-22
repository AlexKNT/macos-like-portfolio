import { describe, expect, it } from 'vitest'

import { SOUNDS } from '#content/sounds'
import { soundIdSchema, soundsSchema } from '#content/types'
import { assertCollectionIsValid } from '#content/validate'

/*
 * The sound table: one row per id, every row short enough that WCAG's rule about audio playing
 * on its own never binds, and levels ordered so the two events a visitor causes deliberately are
 * the loud ones. A row authored louder by accident fails here rather than by ear.
 * Spec 0013, AC-1, AC-12.
 */

describe('the sound table', () => {
  // covers: AC-1
  it('parses against the shape the content layer declares for it', () => {
    expect(() => assertCollectionIsValid('sounds', soundsSchema, SOUNDS)).not.toThrow()
  })

  // covers: AC-1
  it('refuses a row the development check is there to catch, naming the failing path', () => {
    // Content that does not match its schema is a programmer error rather than an expected
    // failure, so this is the one place the app throws on purpose. Spec 0001, AC-7.
    const tooLow = { ...SOUNDS, open: { ...SOUNDS.open, fromHz: 0 } }
    const tooLong = { ...SOUNDS, close: { ...SOUNDS.close, durationMs: 4000 } }

    expect(() => assertCollectionIsValid('sounds', soundsSchema, tooLow)).toThrow(
      /Invalid content in sounds: open\.fromHz/,
    )
    expect(() => assertCollectionIsValid('sounds', soundsSchema, tooLong)).toThrow(
      /Invalid content in sounds: close\.durationMs/,
    )
  })

  // covers: AC-1
  it('gives every id in the union exactly one row', () => {
    expect(Object.keys(SOUNDS).sort()).toEqual([...soundIdSchema.options].sort())
  })

  // covers: AC-1
  it('keys every row by its own id, so a lookup can never answer another sound', () => {
    for (const [key, row] of Object.entries(SOUNDS)) {
      expect(row.id, key).toBe(key)
    }
  })

  // covers: AC-12
  it('keeps every sound well under the three seconds the automatic audio rule binds to', () => {
    for (const row of Object.values(SOUNDS)) {
      expect(row.durationMs, row.id).toBeLessThan(3000)
    }
  })

  // covers: AC-12
  it('keeps the hover tick the quietest row and the open the loudest of the four', () => {
    const gains = Object.values(SOUNDS).map((row) => row.gain)

    expect(SOUNDS.hover.gain).toBe(Math.min(...gains))
    expect(SOUNDS.open.gain).toBe(Math.max(...gains))
    expect(SOUNDS.hover.gain).toBeLessThan(SOUNDS.open.gain)
  })
})
