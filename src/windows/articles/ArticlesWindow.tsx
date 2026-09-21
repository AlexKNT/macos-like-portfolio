import { useRef } from 'react'

import { ARTICLES } from '#content/articles'
import { WINDOWS } from '#content/windows'
import { QuietLine } from '#windows/QuietLine'
import { WindowStage } from '#windows/WindowStage'
import { ArticleRow } from '#windows/articles/ArticleRow'
import { emptyLine, headingLine } from '#windows/articles/articlesLines'
import { newestFirst } from '#windows/articles/articleOrder'
import { useLineReveal } from '#windows/useLineReveal'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * The Articles window: one heading over the posts the portfolio links out to, newest first, each
 * post opening in a new browser tab.
 *
 * The window holds nothing of its own. It reads `ARTICLES` from the content layer, orders it with
 * one pure function, and paints it on the stage every other body shares. There is no state in it,
 * so it registers no scope and no title bar control, and it never asks the manager for anything.
 * The list is a real `ul` of `li` rows, so what a screen reader announces is a list of links with a
 * count rather than a run of paragraphs.
 *
 * A content layer carrying no post at all shows the shared quiet line instead of the list, so an
 * empty window reads as a state rather than as a broken one. A cover whose file is not there is the
 * browser's own business: the image stays in the row carrying its description, which is why this
 * window has no error state and no phrase of its own for one.
 *
 * The rows are uncovered one after another when the window opens, through the shared reveal. It runs
 * on mount, so a close followed by a second open prints them again: the body unmounts with the
 * window and mounts again with it. Every row is in the page from the first paint and the reveal only
 * changes what is painted, so a screen reader, a text selection and a test all read the finished
 * list, and under reduced motion the durations read 0 and no mask is ever drawn.
 * Spec 0011, AC-1, AC-2, AC-3, AC-7, AC-8, AC-10.
 */
export function ArticlesWindow({ windowId }: WindowBodyProps) {
  const posts = newestFirst(ARTICLES)
  const list = useRef<HTMLUListElement>(null)

  useLineReveal(list)

  return (
    <WindowStage name={WINDOWS[windowId].title} heading={headingLine()}>
      {posts.length === 0 ? (
        <QuietLine>{emptyLine()}</QuietLine>
      ) : (
        <ul ref={list} className="flex flex-col">
          {posts.map((post) => (
            <ArticleRow key={post.id} article={post} />
          ))}
        </ul>
      )}
    </WindowStage>
  )
}
