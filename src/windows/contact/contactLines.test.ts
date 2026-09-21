import { describe, expect, it } from 'vitest'

import {
  addressCopyName,
  copyControlLabel,
  headingLine,
  invitationLine,
  mailBody,
  mailSubject,
} from '#windows/contact/contactLines'

/**
 * The words this window says in its own voice. The point of the module is that the address is never
 * one of them: it comes from the profile, so the window cannot drift from it.
 * Spec 0008, AC-3, AC-10.
 */

/** Every line the module holds that takes no argument. */
const STANDALONE_LINES: readonly string[] = [
  headingLine(),
  invitationLine(),
  mailSubject(),
  mailBody(),
  copyControlLabel(),
]

describe('the contact window words', () => {
  // covers: AC-10
  it('says something in every line it holds', () => {
    expect(STANDALONE_LINES.filter((line) => line.trim().length === 0)).toEqual([])
  })

  // covers: AC-10
  it('never writes the address into a line, so the profile stays its one home', () => {
    // An address is the one thing these lines must not carry: if one did, the window would have two
    // sources for the address rather than one.
    expect(STANDALONE_LINES.filter((line) => line.includes('@'))).toEqual([])
  })

  // covers: AC-3
  it('names the address in the Copy control, with the visible word inside the spoken name', () => {
    const address = 'adrian@example.com'

    expect(addressCopyName(address)).toBe(`${copyControlLabel()} ${address}`)
    expect(addressCopyName(address).startsWith(copyControlLabel())).toBe(true)
    expect(addressCopyName(address).endsWith(address)).toBe(true)
  })
})
