import { describe, expect, it } from 'vitest'

import { mailLinkHref } from '#windows/contact/mailLink'

/**
 * The one function that builds the address link's href. It is pure, it carries the recipient
 * verbatim, and it percent encodes the subject and the body, so a word added to either of them later
 * cannot end the query early or smuggle a second header into the message.
 * Spec 0008, AC-2.
 */

describe('mailLinkHref', () => {
  // covers: AC-2
  it('returns the same href for the same three strings', () => {
    const first = mailLinkHref('adrian@example.com', 'Hello', 'Hi there')
    const second = mailLinkHref('adrian@example.com', 'Hello', 'Hi there')

    expect(first).toBe(second)
  })

  // covers: AC-2
  it('carries the address itself and opens as a mail link with the two words beside it', () => {
    const href = mailLinkHref('adrian@example.com', 'Portfolio', 'Hello there')

    expect(href.startsWith('mailto:')).toBe(true)
    // The recipient is the address exactly as the content layer holds it, so a client that decodes
    // the query still finds the address it was given.
    expect(href).toContain('mailto:adrian@example.com?')
    expect(href).toContain('subject=Portfolio')
    expect(href).toContain('body=Hello%20there')
  })

  // covers: AC-2
  it('encodes a space, an ampersand, an equals sign and a newline carried in the words', () => {
    const href = mailLinkHref('adrian@example.com', 'A & B', 'one\ntwo = three')

    expect(href).toContain('subject=A%20%26%20B')
    expect(href).toContain('body=one%0Atwo%20%3D%20three')

    // Nothing in the body can end the query early: everything after `body=` is the body, and the
    // query holds no fourth parameter.
    const [, query = ''] = href.split('?')

    expect(query.split('&')).toHaveLength(2)
  })
})
