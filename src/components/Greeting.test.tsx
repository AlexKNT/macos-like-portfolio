import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Greeting } from '#components/Greeting'
import { PROFILE } from '#content/profile'

/**
 * The greeting the desktop opens with: the page's one heading, carrying both lines of the
 * profile greeting, each in an element of its own because each line is set in a different face.
 * Spec 0003, AC-2.
 */

describe('the greeting', () => {
  // covers: AC-2
  it('is the heading of the page, and carries both lines of the profile greeting', () => {
    render(<Greeting />)

    const heading = screen.getByRole('heading', { level: 1 })

    expect(heading).toHaveTextContent(PROFILE.greeting.lead)
    expect(heading).toHaveTextContent(PROFILE.greeting.display)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  // covers: AC-2
  it('gives each line its own element, since the two are set in different faces', () => {
    render(<Greeting />)

    // `getByText` answers with the element whose own text is that line, so finding each line on
    // its own is what proves the greeting is two elements rather than one run of text.
    expect(screen.getByText(PROFILE.greeting.lead)).toBeInTheDocument()
    expect(screen.getByText(PROFILE.greeting.display)).toBeInTheDocument()
  })
})
