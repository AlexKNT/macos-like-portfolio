import { afterEach, describe, expect, it } from 'vitest'

import { readEaseToken, readMotionToken } from '#lib/motion'

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
