import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { Dock } from '#components/Dock'
import { WindowLayer } from '#components/WindowLayer'
import { DOCK_APPS } from '#content/shell'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import type { DockApp } from '#content/types'

/**
 * The dock: a labelled region holding one button per app in the order the content lists them,
 * each one opening its window through the manager's one open action, and a press on the app of
 * a window that is already put away bringing that window back rather than opening a second.
 * The magnify is wired only once the token layer allows motion. Spec 0003, AC-6, AC-7, AC-9.
 */

/** The dock app a check drives, by its place in the content list. */
function appAt(index: number): DockApp {
  const app = DOCK_APPS[index]

  if (app === undefined) {
    throw new Error(`expected a dock app at ${index}`)
  }

  return app
}

/** Mounts the dock with the layer that shows the windows it opens. */
function setup(): HTMLElement {
  render(
    <WindowManagerProvider>
      <Dock />
      <WindowLayer />
    </WindowManagerProvider>,
  )

  return screen.getByRole('region', { name: 'Dock' })
}

/** The button of one app inside the panel. */
function dockButtonFor(dock: HTMLElement, app: DockApp): HTMLElement {
  return within(dock).getByRole('button', { name: app.name })
}

/** The panel itself, which is the element the magnify handlers sit on. */
function panelOf(dock: HTMLElement): HTMLElement {
  return within(dock).getByRole('list')
}

/** The icon images of the panel, in the order the dock renders them. */
function iconsOf(dock: HTMLElement): readonly HTMLImageElement[] {
  return [...dock.querySelectorAll('img')]
}

/** Declares a token the way the stylesheet does, since jsdom applies no stylesheet of its own. */
function declare(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value)
}

afterEach(() => {
  document.documentElement.removeAttribute('style')
})

describe('the dock', () => {
  // covers: AC-6
  it('is a labelled region holding one button per app, in the content order', () => {
    const dock = setup()
    const buttons = within(dock).getAllByRole('button')

    expect(buttons).toHaveLength(DOCK_APPS.length)

    buttons.forEach((button, index) => {
      const app = DOCK_APPS[index]

      expect(button).toHaveAccessibleName(app?.name ?? '')
    })
  })

  // covers: AC-6, AC-8
  it('opens the window its app names, and does it through the one open action', async () => {
    const user = userEvent.setup()
    const app = appAt(0)
    const dock = setup()

    await user.click(dockButtonFor(dock, app))

    // The dock says Portfolio while the window it opened titles itself Projects: the two names
    // come from their own content, and the dock's is the one a visitor reads on the panel.
    expect(screen.getByRole('region', { name: WINDOWS[app.windowId].title })).toBeInTheDocument()
    expect(dockButtonFor(dock, app)).toHaveAccessibleName(app.name)
  })

  // covers: AC-6
  it('brings a window back from the dock instead of focusing it or opening a second', async () => {
    const user = userEvent.setup()
    const app = appAt(3)
    const title = WINDOWS[app.windowId].title
    const dock = setup()

    await user.click(dockButtonFor(dock, app))
    await user.click(
      within(screen.getByRole('region', { name: title })).getByRole('button', {
        name: `Minimise ${title}`,
      }),
    )

    // A window waiting in the dock is still in the tree, hidden, which is what leaves an
    // element for the movement back to play on.
    expect(screen.getByRole('region', { name: title })).toHaveClass('hidden')

    await user.click(dockButtonFor(dock, app))

    expect(screen.getByRole('region', { name: title })).not.toHaveClass('hidden')
    expect(screen.getAllByRole('region', { name: title })).toHaveLength(1)
  })

  // covers: AC-9
  it('opens an app from the keyboard, in the order the panel renders its buttons', async () => {
    const user = userEvent.setup()
    const app = appAt(1)
    const dock = setup()

    const buttons = within(dock).getAllByRole('button')

    for (let step = 0; step < buttons.length; step += 1) {
      await user.tab()

      if (document.activeElement === dockButtonFor(dock, app)) {
        break
      }
    }

    expect(dockButtonFor(dock, app)).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('region', { name: WINDOWS[app.windowId].title })).toBeInTheDocument()
  })

  /*
   * The magnify reads its timing and its largest scale from the token layer, and jsdom applies
   * no stylesheet, so the two tokens are declared here the way `src/index.css` declares them.
   * Both checks watch the icons' own inline style, which is all a layout engine can be asked
   * for here: the scale it paints is measured in a real browser by `e2e/desktop.spec.ts`.
   */

  // covers: AC-7
  it('wires the magnify onto the icons once the tokens allow motion', () => {
    declare('--duration-fast', '200')
    declare('--dock-magnify-scale', '1.5')

    const dock = setup()
    const icons = iconsOf(dock)

    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      expect(icon.getAttribute('style')).not.toBeNull()
    }
  })

  // covers: AC-7
  it('does not touch the icons when every duration reads zero, which is reduced motion', () => {
    const dock = setup()

    fireEvent.pointerEnter(panelOf(dock))
    fireEvent.pointerMove(panelOf(dock), { clientX: 120 })

    for (const icon of iconsOf(dock)) {
      expect(icon.getAttribute('style')).toBeNull()
    }
  })

  // covers: AC-7
  it('does not magnify when the token layer names no scale either', async () => {
    declare('--duration-fast', '200')

    const user = userEvent.setup()
    const app = appAt(0)
    const dock = setup()

    fireEvent.pointerEnter(panelOf(dock))
    fireEvent.pointerMove(panelOf(dock), { clientX: 120 })

    for (const icon of iconsOf(dock)) {
      expect(icon.getAttribute('style')).toBeNull()
    }

    // The actions are untouched by the missing movement: the panel still opens its window.
    await user.click(dockButtonFor(dock, app))
    expect(screen.getByRole('region', { name: WINDOWS[app.windowId].title })).toBeInTheDocument()
  })
})
