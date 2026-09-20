import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Navbar } from '#components/Navbar'
import { WindowLayer } from '#components/WindowLayer'
import { NAV_ICONS, NAV_LINKS } from '#content/shell'
import { APPEARANCE_STORAGE_KEY } from '#lib/appearance'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { resolveOpenTarget } from '#store/windowManager'

/** A fixed moment, so the clock assertion never depends on when the suite runs. */
const NOW = new Date('2026-09-20T09:41:00.000Z')

/** The bar reads the window manager for its actions, so every render gets the provider it needs. */
function renderBar() {
  return render(
    <WindowManagerProvider>
      <Navbar />
    </WindowManagerProvider>,
  )
}

/** The bar with the window layer beside it, so a press can be watched opening a window. */
function renderBarWithWindows() {
  return render(
    <WindowManagerProvider>
      <Navbar />
      <WindowLayer />
    </WindowManagerProvider>,
  )
}

/** The clock the bar shows, which carries the moment it was rendered with as `datetime`. */
function clock(): Element | null {
  return screen.getByRole('navigation', { name: 'Desktop menu bar' }).querySelector('time')
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('names the menu bar and shows one link per menu bar entry, in order', () => {
    renderBar()

    const bar = screen.getByRole('navigation', { name: 'Desktop menu bar' })
    const labels = within(bar)
      .getAllByRole('button')
      .map((button) => button.textContent)
      .filter((text) => text !== '')

    expect(labels).toEqual(NAV_LINKS.map((link) => link.label))
  })

  it('shows the clock as a time element carrying the current moment', () => {
    renderBar()

    expect(clock()).not.toBeNull()
    expect(clock()?.getAttribute('datetime')).toBe(NOW.toISOString())
    expect(clock()?.textContent?.trim()).not.toBe('')
  })

  it('rolls the clock over on the minute boundary, so the bar keeps the time', () => {
    vi.setSystemTime(new Date('2026-09-20T09:41:30.000Z'))
    renderBar()

    expect(clock()?.getAttribute('datetime')).toBe('2026-09-20T09:41:30.000Z')

    // Half a minute left in the minute it woke on, so the clock is due to move exactly then.
    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(clock()?.getAttribute('datetime')).toBe('2026-09-20T09:42:00.000Z')
  })

  it('opens the window each link names, focusing that one on a second press', async () => {
    // This test drives the pointer, so the clock the file freezes for the two checks above
    // stands down and the interactions run on real timers.
    vi.useRealTimers()

    const user = userEvent.setup()
    renderBarWithWindows()

    const bar = screen.getByRole('navigation', { name: 'Desktop menu bar' })

    for (const { label, windowId } of NAV_LINKS) {
      const link = within(bar).getByRole('button', { name: label })
      const resolved = resolveOpenTarget({ kind: 'window', windowId })
      const title = resolved.ok ? resolved.value.title : ''

      await user.click(link)
      expect(screen.getAllByRole('region', { name: title }), label).toHaveLength(1)

      await user.click(link)
      expect(screen.getAllByRole('region', { name: title }), label).toHaveLength(1)
    }
  })

  it('renders a labelled control for every icon that acts, and none for the ones that decorate', () => {
    renderBar()

    const bar = screen.getByRole('navigation', { name: 'Desktop menu bar' })

    for (const icon of NAV_ICONS) {
      if ('label' in icon) {
        expect(within(bar).getByRole('button', { name: icon.label }), icon.id).toBeInTheDocument()
      }
    }

    // A decorative icon renders a bare image with no control around it, so it stays out of the
    // accessible tree and nothing in the bar is pressable without an effect. Spec 0003, AC-4.
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })

  it('switches the mode for the session, and leaves the stored preference alone', async () => {
    // This test drives the pointer, and the interactions it makes wait on real timers, so the
    // fake clock this file freezes for the clock assertion stands down here.
    vi.useRealTimers()

    document.documentElement.dataset.theme = 'light'
    renderBar()

    const user = userEvent.setup()
    const appearance = screen.getByRole('button', { name: 'Switch appearance' })

    await user.click(appearance)
    expect(document.documentElement.dataset.theme).toBe('dark')

    await user.click(appearance)
    expect(document.documentElement.dataset.theme).toBe('light')

    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull()
  })
})
