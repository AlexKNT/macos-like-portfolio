import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DockButton } from '#components/DockButton'
import { DOCK_APPS } from '#content/shell'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import type { DockApp } from '#content/types'

/**
 * One dock app: the name it announces, the image the window registry holds for it, the tooltip
 * that repeats that name without joining it, and the press that runs the action the dock handed
 * it, from the pointer and from the keyboard. Spec 0003, AC-6, AC-9.
 */

/** The dock app a check drives, by its place in the content list. */
function appAt(index: number): DockApp {
  const app = DOCK_APPS[index]

  if (app === undefined) {
    throw new Error(`expected a dock app at ${index}`)
  }

  return app
}

/** Renders one dock button inside the manager it registers its own element with. */
function setup(
  app: DockApp,
  state: { readonly isOpen?: boolean; readonly isMinimised?: boolean } = {},
) {
  const onActivate = vi.fn()
  const view = render(
    <WindowManagerProvider>
      <ul>
        <DockButton
          app={app}
          isOpen={state.isOpen ?? false}
          isMinimised={state.isMinimised ?? false}
          onActivate={onActivate}
        />
      </ul>
    </WindowManagerProvider>,
  )

  return { onActivate, unmount: view.unmount }
}

/** The button on screen, found the way a screen reader finds it: by its own name. */
function buttonFor(app: DockApp): HTMLElement {
  return screen.getByRole('button', { name: app.name })
}

describe('a dock button', () => {
  // covers: AC-6
  it('takes its name from the dock app, and shows the same name as a tooltip', () => {
    const app = appAt(0)

    setup(app)

    // The tooltip repeats the name for the eye only: the name is the entry's, and the tooltip
    // is a second rendering of it rather than something the button is called after.
    expect(buttonFor(app)).toHaveAccessibleName(app.name)
    expect(screen.getByText(app.name)).toBeInTheDocument()
  })

  // covers: AC-6
  it('shows the image the window registry holds, so an app names its picture once', () => {
    const app = appAt(1)

    setup(app)

    const image = buttonFor(app).querySelector('img')

    expect(image?.getAttribute('src')).toBe(WINDOWS[app.windowId].icon)
  })

  // covers: AC-6
  it('keeps its name whether its window is closed, open or put away in the dock', () => {
    const app = appAt(2)
    const states = [
      { isOpen: false, isMinimised: false },
      { isOpen: true, isMinimised: false },
      { isOpen: true, isMinimised: true },
    ]

    for (const state of states) {
      const { unmount } = setup(app, state)

      // The dot is a mark for the eye: it never becomes part of what the button is called.
      expect(buttonFor(app), JSON.stringify(state)).toHaveAccessibleName(app.name)
      expect(screen.queryByRole('img')).toBeNull()

      unmount()
    }
  })

  // covers: AC-6, AC-9
  it('runs the action it was handed when a pointer presses it', async () => {
    const user = userEvent.setup()
    const app = appAt(0)
    const { onActivate } = setup(app)

    await user.click(buttonFor(app))

    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  // covers: AC-9
  it('opens from the keyboard alone, with Enter or with Space', async () => {
    const user = userEvent.setup()
    const app = appAt(3)
    const { onActivate } = setup(app)

    await user.tab()
    expect(buttonFor(app)).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onActivate).toHaveBeenCalledTimes(1)

    await user.keyboard('[Space]')
    expect(onActivate).toHaveBeenCalledTimes(2)
  })
})
