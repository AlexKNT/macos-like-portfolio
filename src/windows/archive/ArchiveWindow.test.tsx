import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import gsap from 'gsap'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WindowLayer } from '#components/WindowLayer'
import { LOCATIONS } from '#content/locations'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import {
  countLine,
  emptyControlLabel,
  emptyControlWord,
  emptyLine,
} from '#windows/archive/archiveLines'

/**
 * The Archive window driven the way the desktop drives it: opened from the dock through the
 * registry's own line, so the stage, the body and the control in the title bar are all the real
 * ones. It covers what a visitor sees on opening it, what a press on a leftover does, and what is
 * left on screen once the gesture has run.
 *
 * The leftovers come from the shipped content, so the cases read as the window a visitor meets.
 * Spec 0012, AC-1, AC-2, AC-3, AC-5, AC-6, AC-8, AC-11, AC-13.
 */

/** The leftovers the Trash place holds, in the order the content layer lists them. */
const LEFTOVERS = LOCATIONS.trash.children

/** A stand in desktop: it opens the Archive from the dock, which is one of the two ways in. */
function Shell() {
  const { open } = useWindowManager()

  useEffect(() => {
    open({ kind: 'window', windowId: 'archive' }, { kind: 'dock' })
  }, [open])

  return <WindowLayer />
}

/** The frame the desktop names after the window. */
function frameOf(): HTMLElement {
  return screen.getByRole('region', { name: WINDOWS.archive.title })
}

/** The content area inside that frame, which the stage names after the same window. */
function contentOf(): HTMLElement {
  return screen.getByRole('group', { name: WINDOWS.archive.title })
}

/** The stage's live region, which is the one way this window says anything out loud. */
function liveRegion(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[aria-live="polite"]')

  if (found === null) {
    throw new Error('the stage renders no live region')
  }

  return found
}

/** The title bar of a frame, which is where a window's chrome lives. */
function headerOf(frame: HTMLElement): HTMLElement {
  const found = frame.querySelector<HTMLElement>('header')

  if (found === null) {
    throw new Error('the frame carries no title bar')
  }

  return found
}

/** The clipping number a frame draws at, which is what decides what sits over what. */
function stackingOf(frame: HTMLElement): number {
  return Number(frame.style.zIndex)
}

/** Opens the Archive through the manager, and hands back the frame and the render it came from. */
function setup() {
  const view = render(
    <WindowManagerProvider>
      <Shell />
    </WindowManagerProvider>,
  )

  return { view, frame: frameOf() }
}

/** The control the window puts in its title bar. */
function controlOf(frame: HTMLElement): HTMLElement {
  return within(frame).getByRole('button', { name: emptyControlLabel() })
}

afterEach(() => {
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})

describe('the Archive window', () => {
  // covers: AC-1, AC-13
  it('is one stage, one named content area and one live region, in a frame named by the window', () => {
    const { view } = setup()

    expect(view.container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
    expect(contentOf()).toBeInTheDocument()
    expect(view.container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1)
  })

  // covers: AC-3
  it('says how many leftovers it holds, over one tile per leftover in the content order', () => {
    setup()

    const content = contentOf()

    expect(within(content).getByText(countLine(LEFTOVERS.length))).toBeInTheDocument()

    const items = within(content).getAllByRole('listitem')

    expect(items.map((item) => item.textContent?.trim())).toEqual(
      LEFTOVERS.map((entry) => entry.name),
    )

    for (const [index, entry] of LEFTOVERS.entries()) {
      expect(items[index].querySelector('img')?.getAttribute('src'), entry.id).toBe(entry.icon)
      expect(
        within(items[index]).getByRole('button', { name: entry.name }),
        entry.id,
      ).toBeInTheDocument()
    }
  })

  // covers: AC-4
  it('puts the control in the title bar, past the window name, with its visible word inside the name', () => {
    const { frame } = setup()
    const control = controlOf(frame)

    expect(headerOf(frame).lastElementChild).toContainElement(control)
    expect(control).toHaveTextContent(emptyControlWord())
    expect(control).toHaveAttribute('aria-label', emptyControlLabel())

    // The three lights keep their own names, so the title bar reads as a window with one more
    // thing to offer rather than as four lights.
    expect(
      within(frame).getByRole('button', { name: `Close ${WINDOWS.archive.title}` }),
    ).toBeInTheDocument()
  })

  // covers: AC-2
  it('opens a leftover where its kind says, above the Archive, which stays open behind it', async () => {
    const user = userEvent.setup()
    const { frame } = setup()
    const first = LEFTOVERS[0]

    await user.click(within(contentOf()).getByRole('button', { name: first.name }))

    const opened = screen.getByRole('region', { name: first.name })

    expect(stackingOf(opened)).toBeGreaterThan(stackingOf(frame))
    expect(screen.getByRole('region', { name: WINDOWS.archive.title })).toBeInTheDocument()
    expect(within(contentOf()).getAllByRole('listitem')).toHaveLength(LEFTOVERS.length)
  })

  // covers: AC-5, AC-6, AC-11
  it('leaves the leftovers behind in one press, says so, and keeps the keyboard on the control', async () => {
    const user = userEvent.setup()
    const { frame } = setup()
    const control = controlOf(frame)

    expect(liveRegion()).toHaveTextContent('')

    await user.click(control)

    expect(within(contentOf()).getByText(emptyLine())).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
    expect(within(contentOf()).queryByText(countLine(LEFTOVERS.length))).toBeNull()

    // One announcement, in the same words the line shows, and the control reports itself as having
    // nothing left to do without leaving the title bar or the keyboard.
    expect(liveRegion()).toHaveTextContent(emptyLine())
    expect(controlOf(frame)).toHaveAttribute('aria-disabled', 'true')
    expect(document.activeElement).toBe(control)
  })

  // covers: AC-5
  it('stops the leftovers answering the moment the gesture starts, while the block is still there', async () => {
    const user = userEvent.setup()

    // A real duration with the tween stood in for, so the block can be read mid gesture.
    document.documentElement.style.setProperty('--duration-fast', '120ms')
    vi.spyOn(gsap, 'to').mockImplementation((() => ({})) as never)

    const { frame } = setup()

    await user.click(controlOf(frame))

    const items = within(contentOf()).getAllByRole('listitem')

    expect(items).toHaveLength(LEFTOVERS.length)

    for (const item of items) {
      expect(within(item).getByRole('button')).toBeDisabled()
    }

    // Nothing has landed yet, so the line of the empty state is not on screen.
    expect(within(contentOf()).queryByText(emptyLine())).toBeNull()
    expect(controlOf(frame)).toHaveAttribute('aria-disabled', 'true')
  })

  // covers: AC-6
  it('marks the empty line for the shared reveal, so a line that appears later can be uncovered', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    // The line is not in the page when the window mounts, and the shared reveal arms itself once per
    // mount. The component that owns the line mounts with it, which is what gives the reveal
    // something to print: a marked line inside the container the reveal reads.
    expect(contentOf().querySelectorAll('[data-line]')).toHaveLength(0)

    await user.click(controlOf(frame))

    const marked = contentOf().querySelectorAll('[data-line]')

    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent(emptyLine())
  })

  // covers: AC-7, AC-8
  it('holds its leftovers again once its window has closed and opened', async () => {
    const user = userEvent.setup()
    const { view, frame } = setup()

    await user.click(controlOf(frame))
    expect(screen.queryByRole('list')).toBeNull()

    // The state belongs to the window: closing it is what drops the gesture, and a window opened
    // afterwards reads the content layer again, which nothing has written to.
    view.unmount()
    setup()

    expect(within(contentOf()).getAllByRole('listitem')).toHaveLength(LEFTOVERS.length)
  })
})
