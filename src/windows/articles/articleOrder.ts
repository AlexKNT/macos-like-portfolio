import type { Article } from '#content/types'

/**
 * Puts a list of posts in the order the window shows them: newest first by the date each post
 * carries, never by the order the content file happens to list them in.
 *
 * The dates are ISO (`YYYY-MM-DD`), so comparing them as text is comparing them as dates and no
 * parse sits between the content and the order. The comparison answers 0 for two posts sharing a
 * date, and the sort the language guarantees is stable, so posts written on the same day keep the
 * order the content file lists them in and the list never reshuffles between renders.
 *
 * The list is copied rather than sorted in place, so the constant the content layer holds is
 * never touched. Spec 0011, AC-2.
 */
export function newestFirst(articles: readonly Article[]): readonly Article[] {
  return [...articles].sort((left, right) => right.date.localeCompare(left.date))
}
