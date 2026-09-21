import { describe, expect, it } from 'vitest'

import { ARTICLES } from '#content/articles'
import { newestFirst } from '#windows/articles/articleOrder'
import type { Article } from '#content/types'

/**
 * The order the window shows its posts in. The dates drive it, never the order the content file
 * happens to list them in, and two posts written on one day keep the order the file gives them.
 * Spec 0011, AC-2.
 */

/** The shipped post at one spot with a date of the caller's choosing, so a list can be built by hand. */
function dated(index: number, date: string): Article {
  const article = ARTICLES[index]

  if (article === undefined) {
    throw new Error(`the content layer holds no post at ${index}`)
  }

  return { ...article, date }
}

describe('the order posts are shown in', () => {
  // covers: AC-2
  it('answers newest first by the date, whatever order the list arrived in', () => {
    const oldest = dated(0, '2025-01-05')
    const newest = dated(1, '2025-03-01')
    const middle = dated(2, '2025-02-10')

    expect(newestFirst([oldest, newest, middle]).map((post) => post.id)).toEqual([
      newest.id,
      middle.id,
      oldest.id,
    ])
  })

  // covers: AC-2
  it('keeps the order it was given for two posts sharing a date, so the list never reshuffles', () => {
    const first = dated(0, '2025-05-05')
    const second = dated(1, '2025-05-05')
    const third = dated(2, '2025-05-05')

    expect(newestFirst([first, second, third]).map((post) => post.id)).toEqual([
      first.id,
      second.id,
      third.id,
    ])
    expect(newestFirst([first, second, third]).map((post) => post.id)).toEqual(
      newestFirst([first, second, third]).map((post) => post.id),
    )
  })

  // covers: AC-2
  it('drops no post, invents none, and leaves the list it was handed untouched', () => {
    const given = [dated(0, '2025-01-05'), dated(1, '2025-03-01'), dated(2, '2025-02-10')]
    const before = given.map((post) => post.id)
    const ordered = newestFirst(given)

    expect(ordered).toHaveLength(given.length)
    expect(new Set(ordered.map((post) => post.id)).size).toBe(given.length)
    expect(ordered).not.toBe(given)
    expect(given.map((post) => post.id)).toEqual(before)
  })

  // covers: AC-2
  it('shows the shipped content newest first, every post carrying the date the content gave it', () => {
    const dates = newestFirst(ARTICLES).map((post) => post.date)

    expect(dates).toHaveLength(ARTICLES.length)
    expect(dates).toEqual([...dates].sort((left, right) => right.localeCompare(left)))
  })

  // covers: AC-2
  it('answers an empty list for an empty list, and the one post for one post', () => {
    expect(newestFirst([])).toEqual([])

    const only = dated(0, '2025-04-01')

    expect(newestFirst([only])).toEqual([only])
  })
})
