import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { DESKTOP_ITEMS } from '#content/desktop'
import { PROFILE } from '#content/profile'
import { DOCK_APPS } from '#content/shell'

/**
 * The desktop shell as a visitor meets it: the greeting, the desktop items, the menu bar, the
 * dock, and the one open action all three call. Spec 0003, AC-2, AC-3, AC-4, AC-6, AC-8.
 */

/** The open windows whose title bar reads `title`, which is how a window is found here. */
function windowsNamed(title: string) {
  return screen.queryAllByRole('region', { name: title })
}

describe('the desktop shell', () => {
  it('greets the visitor with both lines of the profile greeting', () => {
    render(<App />)

    const greeting = screen.getByRole('heading', { level: 1 })

    expect(greeting).toHaveTextContent(PROFILE.greeting.lead)
    expect(greeting).toHaveTextContent(PROFILE.greeting.display)
  })

  it('shows one button per desktop item and one per dock app, each named by its entry', () => {
    render(<App />)

    const items = screen.getByRole('list', { name: 'Desktop items' })
    const dock = screen.getByRole('region', { name: 'Dock' })

    for (const item of DESKTOP_ITEMS) {
      expect(within(items).getByRole('button', { name: item.label }), item.id).toBeInTheDocument()
    }

    for (const app of DOCK_APPS) {
      expect(within(dock).getByRole('button', { name: app.name }), app.id).toBeInTheDocument()
    }
  })

  it('opens a window from the dock, and focuses it rather than opening a second', async () => {
    const user = userEvent.setup()
    render(<App />)

    const dock = screen.getByRole('region', { name: 'Dock' })
    const portfolio = within(dock).getByRole('button', { name: 'Portfolio' })

    await user.click(portfolio)
    expect(windowsNamed('Projects')).toHaveLength(1)

    await user.click(portfolio)
    expect(windowsNamed('Projects')).toHaveLength(1)
  })

  it('opens from a menu bar link, and from the About icon, through the same open action', async () => {
    const user = userEvent.setup()
    render(<App />)

    const bar = screen.getByRole('navigation', { name: 'Desktop menu bar' })

    await user.click(within(bar).getByRole('button', { name: 'Contact' }))
    expect(windowsNamed('Contact')).toHaveLength(1)

    // The About icon asks for the About location, which arrives at the Projects window, so a
    // second entry point naming the same window focuses it instead of adding one.
    await user.click(within(bar).getByRole('button', { name: 'About me' }))
    expect(windowsNamed('Projects')).toHaveLength(1)
  })

  it('opens the Projects window from both project folders and the Resume window from the resume', async () => {
    const user = userEvent.setup()
    render(<App />)

    const items = screen.getByRole('list', { name: 'Desktop items' })
    const [nike, aiResume, foodDelivery, resume] = DESKTOP_ITEMS

    await user.click(within(items).getByRole('button', { name: nike?.label ?? '' }))
    expect(windowsNamed('Projects')).toHaveLength(1)

    await user.click(within(items).getByRole('button', { name: aiResume?.label ?? '' }))
    expect(windowsNamed('Projects')).toHaveLength(1)

    await user.click(within(items).getByRole('button', { name: foodDelivery?.label ?? '' }))
    expect(windowsNamed('Projects')).toHaveLength(1)

    await user.click(within(items).getByRole('button', { name: resume?.label ?? '' }))
    expect(windowsNamed('Resume')).toHaveLength(1)
  })
})
