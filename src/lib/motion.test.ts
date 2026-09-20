import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { readEaseToken, readMotionToken } from '#lib/motion'

/**
 * The stylesheet read straight off disk, so the check below sees what the author wrote rather
 * than the compiled stylesheet a raw import would return. Spec 0006, AC-5.
 */
const STYLESHEET = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

/** Stops one test's token from deciding the next one's answer. */
afterEach(() => {
  document.documentElement.removeAttribute('style')
})

/*
 * jsdom does not resolve custom properties out of a stylesheet, so these checks cover
 * the reading itself and the safe answers when a token is missing. The values the app
 * actually ships, including the zero the reduced motion block leaves behind, are read
 * off a real browser in the end to end suite.
 */
describe('readMotionToken', () => {
  it('reads a duration in milliseconds', () => {
    document.documentElement.style.setProperty('--duration-base', '200ms')

    expect(readMotionToken('base')).toBe(200)
  })

  it('reads the zero a reduced motion block leaves behind', () => {
    document.documentElement.style.setProperty('--duration-slow', '0ms')

    expect(readMotionToken('slow')).toBe(0)
  })

  it('answers 0 rather than guessing when the token is missing', () => {
    expect(readMotionToken('fast')).toBe(0)
  })
})

describe('readEaseToken', () => {
  it('reads an easing string', () => {
    document.documentElement.style.setProperty('--ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)')

    expect(readEaseToken('out')).toBe('cubic-bezier(0.22, 1, 0.36, 1)')
  })

  it('answers with the standard ease out when the token is missing', () => {
    expect(readEaseToken('in-out')).toContain('cubic-bezier')
  })
})

describe('the stagger token', () => {
  // covers: AC-5
  it('is declared once for the print and once at zero, so reduced motion needs no second path', () => {
    const values = [...STYLESHEET.matchAll(/--duration-stagger:\s*([^;]+);/g)].map((match) =>
      (match[1] ?? '').trim(),
    )

    // Two declarations: the duration the print runs at, and the zero reduced motion leaves.
    expect(values).toHaveLength(2)
    expect(values).toContain('0ms')
    expect(
      values.some((value) => value !== '0ms'),
      'a duration the print runs at',
    ).toBe(true)
  })

  // covers: AC-5
  it('reads as the gap between one printed line and the next', () => {
    document.documentElement.style.setProperty('--duration-stagger', '60ms')

    expect(readMotionToken('stagger')).toBe(60)
  })

  // covers: AC-5
  it('reads zero under reduced motion, so a reveal does nothing at all', () => {
    document.documentElement.style.setProperty('--duration-stagger', '0ms')

    expect(readMotionToken('stagger')).toBe(0)
  })
})
