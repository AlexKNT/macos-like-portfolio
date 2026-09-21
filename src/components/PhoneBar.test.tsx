import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { PhoneBar } from '#components/PhoneBar'
import { WindowManagerProvider } from '#store/WindowManagerProvider'

/**
 * The phone's slim bar: the mark, the appearance control and the live clock, which is what the
 * desktop's menu bar keeps once its links and status icons have gone.
 * Spec 0009, AC-1, AC-7, AC-14.
 */

/** Renders the bar inside the manager it reads, and hands back nothing. */
function setup(): void {
  render(
    <WindowManagerProvider>
      <PhoneBar />
    </WindowManagerProvider>,
  )
}

afterEach(() => {
  delete document.documentElement.dataset.theme
})

describe('the phone slim bar', () => {
  // covers: AC-1, AC-14
  it('shows a live clock, and the appearance control with the name the bar already gives it', () => {
    setup()

    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch appearance' })).toBeInTheDocument()
  })

  // covers: AC-7
  it('switches the mode when its appearance control is pressed', async () => {
    const user = userEvent.setup()

    setup()
    await user.click(screen.getByRole('button', { name: 'Switch appearance' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
