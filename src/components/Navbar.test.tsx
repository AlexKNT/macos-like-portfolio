import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Navbar } from '#components/Navbar'
import { NAV_ICONS, NAV_LINKS } from '#content/shell'

/** A fixed moment, so the clock assertion never depends on when the suite runs. */
const NOW = new Date('2026-09-20T09:41:00.000Z')

describe('Navbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('names the menu bar and shows one link per menu bar entry', () => {
    render(<Navbar />)

    const bar = screen.getByRole('navigation', { name: 'Desktop menu bar' })
    const labels = within(bar)
      .getAllByRole('button')
      .map((button) => button.textContent)

    expect(labels).toEqual(NAV_LINKS.map((link) => link.label))
  })

  it('shows the clock as a time element carrying the current moment', () => {
    render(<Navbar />)

    const clock = screen.getByRole('navigation', { name: 'Desktop menu bar' }).querySelector('time')

    expect(clock).not.toBeNull()
    expect(clock?.getAttribute('datetime')).toBe(NOW.toISOString())
    expect(clock?.textContent?.trim()).not.toBe('')
  })

  it('keeps every decorative icon out of the accessible tree', () => {
    render(<Navbar />)

    const icons = NAV_ICONS.map(({ icon }) => icon)
    const images = screen.queryAllByRole('img')

    expect(icons).toHaveLength(NAV_ICONS.length)
    expect(images).toHaveLength(0)
  })
})
