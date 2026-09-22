import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { PhoneBar } from '#components/PhoneBar'
import { ShellProviders } from '../test/shell'

/**
 * The phone's slim bar: the mark, the appearance control, the sound switch and the live clock,
 * which is what the desktop's menu bar keeps once its links and other status icons have gone.
 * Spec 0009, AC-1, AC-7, AC-14; spec 0013, AC-8.
 */

/** Renders the bar inside the providers it reads, and hands back nothing. */
function setup(): void {
  render(
    <ShellProviders>
      <PhoneBar />
    </ShellProviders>,
  )
}

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.clear()
})

describe('the phone slim bar', () => {
  // covers: AC-1, AC-14
  it('shows a live clock, the appearance control and the sound switch, with the names the bar already gives them', () => {
    setup()

    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch appearance' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Sound' })).toBeInTheDocument()
  })

  // covers: AC-7
  it('switches the mode when its appearance control is pressed', async () => {
    const user = userEvent.setup()

    setup()
    await user.click(screen.getByRole('button', { name: 'Switch appearance' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
