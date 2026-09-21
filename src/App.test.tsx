import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { App } from './App'
import { DESKTOP_ITEMS } from '#content/desktop'
import { PROFILE } from '#content/profile'
import { DOCK_APPS } from '#content/shell'
import { phoneLayout, restoreLayout } from './test/layout'

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

    // The Portfolio button asks for the Projects window, which opens on the work location, so
    // the frame is named for the place it shows and a second press focuses that one window.
    await user.click(portfolio)
    expect(windowsNamed('Work')).toHaveLength(1)

    await user.click(portfolio)
    expect(windowsNamed('Work')).toHaveLength(1)
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
    expect(windowsNamed('About me')).toHaveLength(1)
  })

  it('opens the Projects window from both project folders and the Resume window from the resume', async () => {
    const user = userEvent.setup()
    render(<App />)

    const items = screen.getByRole('list', { name: 'Desktop items' })
    const [nike, aiResume, foodDelivery, resume] = DESKTOP_ITEMS

    // A project folder opens the Projects window on that project, so the frame reads the
    // project's own name, and the next folder re-targets the one window rather than adding one.
    for (const folder of [nike, aiResume, foodDelivery]) {
      const label = folder?.label ?? ''

      await user.click(within(items).getByRole('button', { name: label }))
      expect(windowsNamed(label), label).toHaveLength(1)
    }

    await user.click(within(items).getByRole('button', { name: resume?.label ?? '' }))
    expect(windowsNamed('Resume')).toHaveLength(1)
  })
})

/**
 * The phone shell as a visitor on a phone meets it: the slim bar and the home surface stand in for
 * the menu bar, the greeting, the desktop items and the dock, and none of those four is mounted.
 * Spec 0009, AC-1, AC-2, AC-3, AC-13.
 */
describe('the phone shell', () => {
  beforeEach(() => {
    phoneLayout()
  })

  afterEach(() => {
    restoreLayout()
  })

  it('stands the home surface and the slim bar in for the wide chrome, which is absent', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch appearance' })).toBeInTheDocument()

    // Absent from the page rather than hidden by CSS.
    expect(screen.queryByRole('navigation', { name: 'Desktop menu bar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Dock' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Desktop items' })).not.toBeInTheDocument()
    expect(screen.queryByText(PROFILE.greeting.lead)).not.toBeInTheDocument()
  })

  it('opens the window a tile names, focuses it, and leaves the home surface out of reach', async () => {
    const user = userEvent.setup()
    render(<App />)

    const tiles = screen.getByRole('list', { name: 'Home' })

    await user.click(within(tiles).getByRole('button', { name: 'Projects' }))

    // A bare Projects open lands on the work location (spec 0005, AC-2), so the frame is named for
    // the place it shows, and the surface the visitor came from is out of the tab order.
    expect(windowsNamed('Work')).toHaveLength(1)
    expect(tiles.parentElement?.className).toContain('invisible')
  })

  it('returns to the home surface when the window closes, with the keyboard on it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      within(screen.getByRole('list', { name: 'Home' })).getByRole('button', { name: 'Projects' }),
    )
    await user.click(
      within(windowsNamed('Work')[0] as HTMLElement).getByRole('button', { name: 'Close Work' }),
    )

    expect(windowsNamed('Work')).toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Home' }).className).not.toContain('invisible')
  })
})
