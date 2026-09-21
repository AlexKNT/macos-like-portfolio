import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { WINDOWS } from '#content/windows'
import { ArticlesWindow } from '#windows/articles/ArticlesWindow'
import { emptyLine, headingLine } from '#windows/articles/articlesLines'

/*
 * The one state the shipped content cannot produce: a content layer carrying no post at all. The
 * window reads a list, and a list can be empty, so the list is stood in for here and the window is
 * driven into that state: it must show the shared quiet line in place of the list, in its own named
 * stage, never a blank frame, an empty list or a crash.
 * Spec 0011, AC-8.
 */

vi.mock('#content/articles', () => ({ ARTICLES: [] }))

it('shows the shared quiet line instead of the list when the content carries no post', () => {
  const { container } = render(
    <ArticlesWindow
      windowId="articles"
      windowKey="articles"
      target={{ kind: 'window', windowId: 'articles' }}
    />,
  )

  // Still a body of the shared standard: one stage and one named content area.
  expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
  expect(screen.getByRole('group', { name: WINDOWS.articles.title })).toBeInTheDocument()

  expect(screen.getByText(emptyLine())).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: headingLine() })).toBeInTheDocument()

  // No list and no row is drawn for a content layer that holds nothing.
  expect(screen.queryByRole('list')).toBeNull()
  expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  expect(screen.queryAllByRole('link')).toHaveLength(0)
})
