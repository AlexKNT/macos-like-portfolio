import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MenuBarIcon } from '#components/MenuBarIcon'
import { NAV_ICONS } from '#content/shell'
import { APPEARANCE_STORAGE_KEY } from '#lib/appearance'
import type { NavIcon, NavIconId, OpenTarget } from '#content/types'
import type { WindowOpener } from '#store/windowManager'

/**
 * One control in the menu bar: a button named by its content entry for the icons that act, no
 * control at all for the two that only decorate, the About icon opening its location through
 * the manager's one open action, and the appearance icon switching the mode for the session
 * without storing a preference. Spec 0003, AC-4, AC-5.
 */

/** The menu bar icon a check drives, by its id. */
function iconNamed(id: NavIconId): NavIcon {
  const icon = NAV_ICONS.find((entry) => entry.id === id)

  if (icon === undefined) {
    throw new Error(`expected a menu bar icon named ${id}`)
  }

  return icon
}

/** The icons that only decorate the bar. */
const DECORATIONS = NAV_ICONS.filter((icon) => icon.action.kind === 'decoration')

/** What a bar icon does with the window action it was handed. */
type OpenRecorder = (target: OpenTarget, opener: WindowOpener) => void

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
  localStorage.clear()
})

describe('a menu bar icon that acts', () => {
  // covers: AC-4
  it('is a button named by its content entry', () => {
    for (const icon of NAV_ICONS) {
      if (!('label' in icon)) {
        continue
      }

      const { unmount } = render(<MenuBarIcon icon={icon} onOpen={vi.fn()} />)

      expect(screen.getByRole('button'), icon.id).toHaveAccessibleName(icon.label)

      unmount()
    }
  })

  // covers: AC-4
  it('asks for the location its entry names, recording the menu bar as the opener', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn<OpenRecorder>()

    render(<MenuBarIcon icon={iconNamed('profile')} onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'About me' }))

    expect(onOpen).toHaveBeenCalledWith({ kind: 'location', locationId: 'about' }, { kind: 'bar' })
  })
})

describe('a menu bar icon that only decorates', () => {
  // covers: AC-4
  it('renders no control at all, so nothing in the bar is pressable without an effect', () => {
    for (const icon of DECORATIONS) {
      const { unmount } = render(<MenuBarIcon icon={icon} onOpen={vi.fn()} />)

      expect(screen.queryByRole('button'), icon.id).toBeNull()
      expect(screen.queryByRole('img'), icon.id).toBeNull()

      unmount()
    }
  })

  // covers: AC-4
  it('keeps its image decorative, with an empty alternative text', () => {
    const { container } = render(<MenuBarIcon icon={iconNamed('wifi')} onOpen={vi.fn()} />)

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })
})

describe('the appearance icon', () => {
  // covers: AC-5
  it('applies the inverse of the mode on screen, and asks for no window', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn<OpenRecorder>()

    document.documentElement.dataset.theme = 'dark'
    render(<MenuBarIcon icon={iconNamed('appearance')} onOpen={onOpen} />)

    const appearance = screen.getByRole('button', { name: 'Switch appearance' })

    await user.click(appearance)
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(appearance)
    expect(document.documentElement.dataset.theme).toBe('dark')

    // The press is for this session: the menu that owns the stored preference joins in a later
    // feature, so nothing at all is written here.
    expect(onOpen).not.toHaveBeenCalled()
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull()
  })
})
