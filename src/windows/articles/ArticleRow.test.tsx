import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ARTICLES } from '#content/articles'
import { ArticleRow } from '#windows/articles/ArticleRow'
import { printArticleDate } from '#windows/articles/articleDate'
import type { Article } from '#content/types'

/**
 * One row on its own: the cover beside the words, the date in English, and the title, which is
 * itself the one control the row carries.
 * Spec 0011, AC-3, AC-5, AC-6, AC-7, AC-11.
 */

/** The shipped post at one spot, or a loud failure: the content layer always holds three. */
function postAt(index: number): Article {
  const article = ARTICLES[index]

  if (article === undefined) {
    throw new Error(`the content layer holds no post at ${index}`)
  }

  return article
}

/** One row, drawn inside the list it belongs in, the way the window draws it. */
function setup(article: Article) {
  return render(
    <ul>
      <ArticleRow article={article} />
    </ul>,
  )
}

describe('an article row', () => {
  // covers: AC-3, AC-7
  it('draws the cover in its own fixed square, carrying the post’s description', () => {
    const article = postAt(0)

    setup(article)

    const cover = screen.getByRole('img')

    expect(cover).toHaveAttribute('src', article.image.imageUrl)
    expect(cover).toHaveAttribute('alt', article.image.alt)
    // The box is what keeps the row one height whatever the description says and whether or not
    // the file ever arrives: the image stays exactly where it is, with no error state in its place.
    expect(cover).toHaveClass('size-16')
    expect(cover).toHaveClass('shrink-0')
    expect(screen.queryByText(/did not load/i)).toBeNull()
  })

  // covers: AC-3, AC-4
  it('prints the date it was written, in the one English shape the window owns', () => {
    const article = postAt(0)

    setup(article)

    const printed = screen.getByText(printArticleDate(article.date))

    expect(printed.tagName).toBe('TIME')
    expect(printed).toHaveAttribute('datetime', article.date)
  })

  // covers: AC-3, AC-5, AC-6
  it('makes the title itself the link, so the words read and the words announced are one thing', () => {
    const article = postAt(0)

    setup(article)

    const link = screen.getByRole('link')

    expect(link).toHaveAccessibleName(article.title)
    expect(link).toHaveTextContent(article.title)
    expect(link).toHaveAttribute('href', article.href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  // covers: AC-3, AC-11
  it('carries one control and nothing else, with the cover as decoration rather than a second target', () => {
    const article = postAt(1)
    const { container } = setup(article)
    const row = container.querySelector('li') as HTMLElement

    expect(within(row).getAllByRole('link')).toHaveLength(1)
    expect(within(row).queryAllByRole('button')).toHaveLength(0)
    expect(row.textContent).toBe(`${printArticleDate(article.date)}${article.title}`)
  })

  // covers: AC-6
  it('names each row after its own post, so a list of rows is a list of different links', () => {
    render(
      <ul>
        {ARTICLES.map((article) => (
          <ArticleRow key={article.id} article={article} />
        ))}
      </ul>,
    )

    const names = screen.getAllByRole('link').map((link) => link.textContent)

    expect(names).toEqual(ARTICLES.map((article) => article.title))
    expect(new Set(names).size).toBe(ARTICLES.length)
  })

  // covers: AC-11
  it('keeps the touch target’s height on the link, so a one line title is still an easy press', () => {
    setup(postAt(0))

    expect(screen.getByRole('link')).toHaveClass('min-h-touch')
  })
})
