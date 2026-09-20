import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuietLine } from '#windows/QuietLine'

/**
 * The one way a window shows a thing that is missing, empty or refused. It carries the words the
 * window gives it, it is text rather than a hole in the layout, and it is never a control: a
 * state a visitor cannot act on must not look like something to press.
 * Spec 0006, umbrella AC-2.
 */

describe('the quiet line', () => {
  // covers: umbrella AC-2
  it('shows the words it was handed, as a line a screen reader reads', () => {
    render(<QuietLine>Nothing in Work yet.</QuietLine>)

    expect(screen.getByText('Nothing in Work yet.')).toBeInTheDocument()
    expect(screen.getByRole('paragraph')).toHaveTextContent('Nothing in Work yet.')
  })

  // covers: umbrella AC-2
  it('adds nothing of its own around the words', () => {
    const { container } = render(<QuietLine>This file could not be read.</QuietLine>)

    expect(container.textContent).toBe('This file could not be read.')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })

  // covers: umbrella AC-2
  it('holds words rather than markup, so a window cannot put a form inside a missing state', () => {
    render(<QuietLine>{'Nothing listed here yet.'}</QuietLine>)

    expect(screen.getAllByRole('paragraph')).toHaveLength(1)
  })
})
