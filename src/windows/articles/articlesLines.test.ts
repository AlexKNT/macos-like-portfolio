import { describe, expect, it } from 'vitest'

import { emptyLine, headingLine } from '#windows/articles/articlesLines'

/**
 * The window's words: the heading over the list, and the line an empty content layer shows. Both
 * are the window's own, written by hand rather than read from the content layer.
 * Spec 0011, AC-3, AC-8.
 */
describe('the articles words', () => {
  // covers: AC-3
  it('names the heading the list sits under', () => {
    expect(headingLine()).toBe('My Developer Blog')
  })

  // covers: AC-8
  it('has a word for a content layer carrying no post at all, which is not the heading', () => {
    expect(emptyLine()).not.toBe('')
    expect(emptyLine()).not.toBe(headingLine())
  })
})
