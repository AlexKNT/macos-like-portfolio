import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MenuBarIcon } from '#components/MenuBarIcon'
import { NAV_ICONS } from '#content/shell'
import { APPEARANCE_STORAGE_KEY } from '#lib/appearance'
import { SOUND_STORAGE_KEY } from '#lib/sound'
import { ShellProviders } from '../test/shell'
import type { NavIcon, NavIconId, OpenTarget } from '#content/types'
import type { WindowOpener } from '#store/windowManager'

/**
 * One control in the menu bar: a button named by its content entry for the icons that act, no
 * control at all for the two that only decorate, the About icon opening its location through
 * the manager's one open action, the appearance icon switching the mode for the session
 * without storing a preference, and the sound control reporting its own state as a switch.
 * Spec 0003, AC-4, AC-5; spec 0013, AC-8.
 */

/** The menu bar icon a check drives, by its id. */
function iconNamed(id: NavIconId): NavIcon {
  const icon = NAV_ICONS.find((entry) => entry.id === id)

  if (icon === undefined) {
    throw new Error(`expected a menu bar icon named ${id}`)
  }

  return icon
}

/** Renders one icon inside the providers a control reading the desk's state needs. */
function renderIcon(icon: NavIcon, onOpen: OpenRecorder = vi.fn()) {
  return render(
    <ShellProviders>
      <MenuBarIcon icon={icon} onOpen={onOpen} />
    </ShellProviders>,
  )
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
      // The sound control reports a state of its own, so it renders as a switch rather than as
      // a button and is checked where a switch is checked.
      if (!('label' in icon) || icon.action.kind === 'sound') {
        continue
      }

      const { unmount } = renderIcon(icon)

      expect(screen.getByRole('button'), icon.id).toHaveAccessibleName(icon.label)

      unmount()
    }
  })

  // covers: AC-4
  it('asks for the location its entry names, recording the menu bar as the opener', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn<OpenRecorder>()

    renderIcon(iconNamed('profile'), onOpen)

    await user.click(screen.getByRole('button', { name: 'About me' }))

    expect(onOpen).toHaveBeenCalledWith({ kind: 'location', locationId: 'about' }, { kind: 'bar' })
  })
})

describe('a menu bar icon that only decorates', () => {
  // covers: AC-4
  it('renders no control at all, so nothing in the bar is pressable without an effect', () => {
    for (const icon of DECORATIONS) {
      const { unmount } = renderIcon(icon)

      expect(screen.queryByRole('button'), icon.id).toBeNull()
      expect(screen.queryByRole('img'), icon.id).toBeNull()

      unmount()
    }
  })

  // covers: AC-4
  it('keeps its image decorative, with an empty alternative text', () => {
    const { container } = renderIcon(iconNamed('wifi'))

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })
})

describe('the appearance icon', () => {
  // covers: AC-5
  it('applies the inverse of the mode on screen, and asks for no window', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn<OpenRecorder>()

    document.documentElement.dataset.theme = 'dark'
    renderIcon(iconNamed('appearance'), onOpen)

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

describe('the sound switch', () => {
  // covers: AC-8, AC-14
  it('is a switch whose one name never changes, with the state on its checked attribute', () => {
    renderIcon(iconNamed('sound'))

    const control = screen.getByRole('switch', { name: 'Sound' })

    // The name is the entry's and the state is separate, so a screen reader announces both
    // rather than reading a name that changes under it.
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(control.querySelector('img')?.getAttribute('src')).toBe('/icons/sound.svg')
  })

  // covers: AC-8, AC-9
  it('silences the desk on a press, shows it, and remembers it', async () => {
    const user = userEvent.setup()

    renderIcon(iconNamed('sound'))

    await user.click(screen.getByRole('switch', { name: 'Sound' }))

    const control = screen.getByRole('switch', { name: 'Sound' })

    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(control.querySelector('img')?.getAttribute('src')).toBe('/icons/sound-muted.svg')
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('muted')
  })

  // covers: AC-10
  it('comes back on when it is pressed again, and stores that too', async () => {
    const user = userEvent.setup()

    localStorage.setItem(SOUND_STORAGE_KEY, 'muted')
    renderIcon(iconNamed('sound'))

    const control = screen.getByRole('switch', { name: 'Sound' })

    expect(control).toHaveAttribute('aria-checked', 'false')

    await user.click(control)

    expect(screen.getByRole('switch', { name: 'Sound' })).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on')
  })
})
