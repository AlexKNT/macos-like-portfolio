import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ARTICLES } from '#content/articles'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { ArticlesWindow } from '#windows/articles/ArticlesWindow'
import { headingLine } from '#windows/articles/articlesLines'
import { newestFirst } from '#windows/articles/articleOrder'
import { printArticleDate } from '#windows/articles/articleDate'
import type { OpenTarget } from '#content/types'

/**
 * The Articles window driven the way the desktop drives it: one heading over the posts the content
 * layer carries, in the order the dates give, each post one link that leaves the page.
 * Spec 0011, AC-1, AC-2, AC-3, AC-4, AC-6, AC-10.
 */

/** The window as the manager opens it: a bare `window` target for its own id. */
const TARGET: OpenTarget = { kind: 'window', windowId: 'articles' }

function setup() {
  return render(
    <WindowManagerProvider>
      <ArticlesWindow windowId="articles" windowKey="articles" target={TARGET} />
    </WindowManagerProvider>,
  )
}

describe('the articles window', () => {
  // covers: AC-1, AC-3
  it('is one stage with one named content area and one heading', () => {
    const { container } = setup()

    expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
    expect(screen.getByRole('group', { name: WINDOWS.articles.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: headingLine() })).toBeInTheDocument()
  })

  // covers: AC-2, AC-3
  it('shows every post exactly once, newest first', () => {
    setup()

    const rows = screen.getAllByRole('listitem')

    expect(rows).toHaveLength(ARTICLES.length)
    expect(rows.map((row) => row.textContent)).toEqual(
      newestFirst(ARTICLES).map((post) => `${printArticleDate(post.date)}${post.title}`),
    )
  })

  // covers: AC-3, AC-6
  it('makes every post one link named by that post’s own title', () => {
    setup()

    const names = screen.getAllByRole('link').map((link) => link.textContent)

    expect(names).toEqual(newestFirst(ARTICLES).map((post) => post.title))
  })

  // covers: AC-5
  it('sends every link off the page, so nothing but the post itself leaves the window', () => {
    setup()

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  // covers: AC-10
  it('holds every row in the page, so a reader and a test read the finished list', () => {
    setup()

    for (const post of ARTICLES) {
      expect(screen.getByText(post.title)).toBeVisible()
    }
  })

  // covers: AC-1
  it('shows the same list whatever the window was pointed at, because it reads the content', () => {
    // A body is handed whatever target opened it. This one shows the portfolio's posts, so a place
    // target has to make no difference to what it paints.
    render(
      <WindowManagerProvider>
        <ArticlesWindow
          windowId="articles"
          windowKey="articles"
          target={{ kind: 'location', locationId: 'work' }}
        />
      </WindowManagerProvider>,
    )

    expect(screen.getByRole('heading', { name: headingLine() })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(ARTICLES.length)
  })

  // covers: AC-10
  it('opts every row into the shared reveal, which is what uncovers them on each open', () => {
    const { container } = setup()

    expect(container.querySelectorAll('li[data-line]')).toHaveLength(ARTICLES.length)
  })
})
