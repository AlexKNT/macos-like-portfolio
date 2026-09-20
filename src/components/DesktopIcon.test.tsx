import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DesktopIcon } from '#components/DesktopIcon'
import { WindowLayer } from '#components/WindowLayer'
import { DESKTOP_ITEMS } from '#content/desktop'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import type { DesktopItem } from '#content/types'

/**
 * One item on the wallpaper: a button named by its whole label, with the icon itself kept out
 * of that name, opening the target its entry carries through the manager's one open action,
 * from the pointer and from the keyboard. Spec 0003, AC-3, AC-8, AC-9.
 */

/** The desktop item a check drives, by its place in the content list. */
function itemAt(index: number): DesktopItem {
  const item = DESKTOP_ITEMS[index]

  if (item === undefined) {
    throw new Error(`expected a desktop item at ${index}`)
  }

  return item
}

/** The item whose target names a window rather than a project, which is the resume. */
function windowItem(): DesktopItem {
  const item = DESKTOP_ITEMS.find((entry) => entry.target.kind === 'window')

  if (item === undefined) {
    throw new Error('expected a desktop item whose target is a window')
  }

  return item
}

/** Renders the items the way the desktop does, beside the layer that shows what they open. */
function setup(items: readonly DesktopItem[] = DESKTOP_ITEMS): HTMLElement {
  render(
    <WindowManagerProvider>
      <ul aria-label="Desktop items">
        {items.map((item) => (
          <li key={item.id}>
            <DesktopIcon item={item} />
          </li>
        ))}
      </ul>
      <WindowLayer />
    </WindowManagerProvider>,
  )

  return screen.getByRole('list', { name: 'Desktop items' })
}

describe('a desktop item', () => {
  // covers: AC-3
  it('is a button named by the whole label, however long that label is', () => {
    const items = setup()

    for (const item of DESKTOP_ITEMS) {
      expect(within(items).getByRole('button', { name: item.label }), item.id).toHaveAccessibleName(
        item.label,
      )
    }
  })

  // covers: AC-3
  it('keeps the icon out of the accessible name, so the name is the label alone', () => {
    const item = itemAt(0)
    const items = setup([item])
    const button = within(items).getByRole('button', { name: item.label })

    expect(button).toHaveAccessibleName(item.label)
    expect(within(button).queryByRole('img')).toBeNull()
  })

  // covers: AC-3, AC-8
  it('opens the target its entry carries, so a project folder reaches the Projects window', async () => {
    const user = userEvent.setup()
    const folder = itemAt(0)
    const items = setup([folder])

    await user.click(within(items).getByRole('button', { name: folder.label }))

    expect(screen.getByRole('region', { name: folder.label })).toBeInTheDocument()
  })

  // covers: AC-3, AC-8
  it('opens a window of its own for the item that names a window rather than a file', async () => {
    const user = userEvent.setup()
    const item = windowItem()
    const target = item.target
    const items = setup([item])

    await user.click(within(items).getByRole('button', { name: item.label }))

    const title = target.kind === 'window' ? WINDOWS[target.windowId].title : ''

    expect(screen.getByRole('region', { name: title })).toBeInTheDocument()
  })

  // covers: AC-9
  it('opens from the keyboard alone', async () => {
    const user = userEvent.setup()
    const item = itemAt(0)
    const items = setup()

    await user.tab()
    expect(within(items).getByRole('button', { name: item.label })).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(screen.getByRole('region', { name: item.label })).toBeInTheDocument()
  })
})
