import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HomeTile } from '#components/HomeTile'
import { HOME_APPS } from '#content/shell'
import { WINDOWS } from '#content/windows'
import { WindowElementsContext } from '#store/windowElements'
import { stubRegistry } from '../test/registry'
import type { HomeApp } from '#content/types'
import type { StubRegistry } from '../test/registry'

/**
 * One tile of the phone's home surface: the window's own icon and name rather than the dock's
 * wording, the dock's own mark saying what the window is doing, and the registration that gives a
 * window somewhere to come from and go back to. Spec 0009, AC-2, AC-3, AC-6, AC-12.
 */

/** The entry for a window, which is what a case hands the tile. */
function appFor(windowId: string): HomeApp {
  const app = HOME_APPS.find((candidate) => candidate.windowId === windowId)

  if (app === undefined) {
    throw new Error(`expected a tile for ${windowId}`)
  }

  return app
}

/**
 * Renders one tile and hands back its button. The cleanup runs first, so a check may render the
 * same tile more than once to compare two of its states without the earlier one still matching.
 */
function setup(
  { isOpen = false, isMinimised = false }: { isOpen?: boolean; isMinimised?: boolean } = {},
  held: StubRegistry = {},
) {
  cleanup()

  const onActivate = vi.fn()
  const elements = stubRegistry(held)
  const view = render(
    <WindowElementsContext value={elements}>
      <ul>
        <HomeTile
          app={appFor('resume')}
          isOpen={isOpen}
          isMinimised={isMinimised}
          onActivate={onActivate}
        />
      </ul>
    </WindowElementsContext>,
  )

  return {
    button: screen.getByRole('button', { name: 'Resume' }),
    onActivate,
    elements,
    unmount: view.unmount,
  }
}

/** The mark a tile is painting, which is decorative and so has no name of its own. */
function markOf(button: HTMLElement): HTMLElement {
  const mark = button.querySelector<HTMLElement>('span[aria-hidden="true"]')

  if (mark === null) {
    throw new Error('expected a mark on the tile')
  }

  return mark
}

describe('a tile on the phone home surface', () => {
  // covers: AC-2, AC-14
  it('carries its window own name and icon, not the name the dock would give it', () => {
    const { button } = setup()

    expect(button).toHaveTextContent('Resume')
    expect(button.querySelector('img')?.getAttribute('src')).toBe(WINDOWS.resume.icon)
  })

  // covers: AC-2, AC-3
  it('opens its window from a press, and is tall enough for a thumb with a visible ring', async () => {
    const user = userEvent.setup()
    const { button, onActivate } = setup()

    await user.click(button)

    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(button.className).toContain('min-h-touch')
    expect(button.className).toContain('focus-visible:interactive-focus')
  })

  // covers: AC-6
  it('says what its window is doing with the dock own mark, hidden from assistive tech', () => {
    const onScreen = setup({ isOpen: true })
    const parked = setup({ isOpen: true, isMinimised: true })
    const away = setup()

    // The mark is painted in the wallpaper's own ink rather than the ink that flips with the mode,
    // because it sits on the same wash the name does.
    expect(markOf(onScreen.button).className).toContain('bg-desktop-text')
    expect(markOf(onScreen.button).className).toContain('opacity-100')
    expect(markOf(parked.button).className).toContain('opacity-40')
    expect(markOf(away.button).className).toContain('opacity-0')

    // It is decorative, so the tile is announced by its window's name alone.
    expect(onScreen.button.textContent).toBe('Resume')
  })

  // covers: AC-12
  it('registers itself as its window tile, and lets go when it leaves the page', () => {
    const { button, elements, unmount } = setup()

    expect(elements.homeTileFor('resume')).toBe(button)

    unmount()

    expect(elements.homeTileFor('resume')).toBeNull()
  })
})
