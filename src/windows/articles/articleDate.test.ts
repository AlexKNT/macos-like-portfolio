import { describe, expect, it } from 'vitest'

import { ARTICLES } from '#content/articles'
import { printArticleDate } from '#windows/articles/articleDate'

/**
 * The words a stored date becomes. The shape is one English shape on every machine, and the day
 * printed is the day stored rather than the day a local zone would have made of it.
 *
 * The locale is what the first half of this suite holds. The timezone pin is held by the command
 * that runs this suite with the process timezone set to an offset, `$env:TZ='America/Los_Angeles';
 * npm test`: a worker cannot change its own timezone once the process has started, so the proof
 * that the printed day does not move lives in the run rather than in a mutation here.
 * Spec 0011, AC-4.
 */
describe('the date words', () => {
  // covers: AC-4
  it('prints a stored date in the one English shape', () => {
    expect(printArticleDate('2025-09-02')).toBe('Sep 2, 2025')
  })

  // covers: AC-4
  it('prints a single digit day without a leading zero, and a two digit day as it stands', () => {
    expect(printArticleDate('2025-01-05')).toBe('Jan 5, 2025')
    expect(printArticleDate('2025-12-31')).toBe('Dec 31, 2025')
  })

  // covers: AC-4
  it('holds the day still at the boundaries a read is most likely to move it over', () => {
    expect(printArticleDate('2026-01-01')).toBe('Jan 1, 2026')
    expect(printArticleDate('2024-02-29')).toBe('Feb 29, 2024')
  })

  // covers: AC-4
  it('prints every date the content carries in that one shape', () => {
    for (const article of ARTICLES) {
      expect(printArticleDate(article.date)).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
    }
  })

  // covers: AC-4
  it('prints a day that has not happened yet, since a post may be prepared ahead of its date', () => {
    expect(printArticleDate('2027-03-09')).toBe('Mar 9, 2027')
  })
})
