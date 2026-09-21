/*
 * The one place a stored date becomes words. Two things are pinned here and nowhere else: the
 * locale, so every machine prints the same English shape, and the timezone the day is read at.
 */

/**
 * The formatter every row prints its date with, built once at module load rather than per row.
 *
 * The locale is fixed, so the words are `Sep 2, 2025` on a machine set to any language. The
 * timezone is pinned to UTC, which is what keeps the printed day the stored day: a date with no
 * time in it is read as midnight UTC, and formatting it in the visitor's own zone would print the
 * day before for everyone west of Greenwich.
 * Spec 0011, AC-4.
 */
const ARTICLE_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/**
 * The stored date in words: an ISO date such as `2025-09-02` becomes `Sep 2, 2025`.
 *
 * The date is parsed as the ISO date it is (a date with no time is read at UTC midnight, which is
 * what the pinned zone then formats back), so the day printed is the day stored at every offset a
 * visitor could be in. A value the content layer let through its schema is always a valid ISO date,
 * so this never has to answer for a date that cannot be read.
 * Spec 0011, AC-4.
 */
export function printArticleDate(isoDate: string): string {
  return ARTICLE_DATE.format(new Date(isoDate))
}
