import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CopyConfirmation } from '#windows/CopyConfirmation'
import { copiedLine, copyAnnouncement, copyFailedLine } from '#windows/copyLines'

/**
 * The shared confirmation and the words behind it: what a row shows for each outcome, what a
 * row that was not pressed shows (nothing), and what the window's live region says, which is the
 * same wording a sighted visitor reads. Spec 0006, umbrella AC-2.
 */

describe('the copy confirmation', () => {
  // covers: umbrella AC-2
  it('shows the confirmation on the row of the name that was taken', () => {
    render(<CopyConfirmation outcome={{ kind: 'copied', name: 'React.js' }} />)

    expect(screen.getByText(copiedLine('React.js'))).toBeInTheDocument()
  })

  // covers: umbrella AC-2
  it('shows the shared quiet line, naming the item, when the copy was refused', () => {
    render(<CopyConfirmation outcome={{ kind: 'failed', name: 'React.js' }} />)

    expect(screen.getByText(copyFailedLine('React.js'))).toBeInTheDocument()
  })

  // covers: umbrella AC-2
  it('shows nothing at all on a row that was not the one pressed', () => {
    const { container } = render(<CopyConfirmation outcome={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('the copy announcement', () => {
  // covers: umbrella AC-2
  it('says nothing while nothing has been copied', () => {
    expect(copyAnnouncement({ kind: 'idle' })).toBe('')
  })

  // covers: umbrella AC-2
  it('carries the same words the row shows, for a copy and for a refusal', () => {
    expect(copyAnnouncement({ kind: 'copied', key: { row: 'frontend', name: 'React.js' } })).toBe(
      copiedLine('React.js'),
    )
    expect(
      copyAnnouncement({
        kind: 'failed',
        key: { row: 'frontend', name: 'React.js' },
        reason: { kind: 'refused' },
      }),
    ).toBe(copyFailedLine('React.js'))
  })
})
