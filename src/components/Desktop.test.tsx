import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Desktop } from '#components/Desktop'
import { DESKTOP_ITEMS } from '#content/desktop'
import { WindowManagerProvider } from '#store/WindowManagerProvider'

/**
 * The desktop surface: the one box a window is placed inside, its own measurement handed to
 * the manager, and the layer the windows sit on. Spec 0003, AC-1, AC-10, AC-11; spec 0004,
 * AC-9.
 */

/** The environment's own observer, put back after each check. */
const REAL_OBSERVER = globalThis.ResizeObserver

/** The cascade distance the stylesheet declares, which decides where a window spawns. */
const STEP = 32

/** An observer that records what it watches and reports a box when a check asks it to. */
class TestResizeObserver implements ResizeObserver {
  static created: TestResizeObserver[] = []

  readonly elements: Element[] = []
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    TestResizeObserver.created.push(this)
  }

  observe(element: Element): void {
    this.elements.push(element)
  }

  unobserve(): void {}

  disconnect(): void {}

  /** Reports a content box the way the browser would. */
  report(size: { readonly width: number; readonly height: number }): void {
    const entry = { target: this.elements[0], contentRect: size } as unknown as ResizeObserverEntry

    this.callback([entry], this)
  }
}

/** Mounts the desktop inside the manager the shell gives it. */
function setup(): HTMLElement {
  render(
    <WindowManagerProvider>
      <Desktop />
    </WindowManagerProvider>,
  )

  return screen.getByRole('region', { name: 'Desktop' })
}

/** The observer the desktop created, which each check drives by hand. */
function observer(): TestResizeObserver {
  const created = TestResizeObserver.created[0]

  if (created === undefined) {
    throw new Error('expected the desktop to watch its own container')
  }

  return created
}

/** Opens the first desktop item, which is a project folder, and hands back its frame. */
function openFirstItem(desktop: HTMLElement): HTMLElement {
  const item = DESKTOP_ITEMS[0]

  if (item === undefined) {
    throw new Error('expected at least one desktop item')
  }

  fireEvent.click(within(desktop).getByRole('button', { name: item.label }))

  return within(desktop).getByRole('region', { name: 'Projects' })
}

beforeEach(() => {
  TestResizeObserver.created = []
  globalThis.ResizeObserver = TestResizeObserver
  document.documentElement.style.setProperty('--window-cascade-step', `${STEP}`)
})

afterEach(() => {
  globalThis.ResizeObserver = REAL_OBSERVER
  document.documentElement.style.removeProperty('--window-cascade-step')
})

describe('the desktop surface', () => {
  // covers: AC-9
  it('watches its own container, so the work area is the desktop box and not the viewport', () => {
    const desktop = setup()

    expect(observer().elements).toEqual([desktop])
  })

  // covers: AC-3, AC-9
  it('places a window opened from an item inside the box it measured', () => {
    const desktop = setup()

    act(() => observer().report({ width: 1600, height: 900 }))

    const frame = openFirstItem(desktop)

    // Half a step in from the desktop's top left corner, measured in the desktop's own pixels.
    expect(frame.style.left).toBe(`${STEP / 2}px`)
    expect(frame.style.top).toBe(`${STEP / 2}px`)
  })

  // covers: AC-9
  it('pins a window to the top left corner when the box it measured is too small for it', () => {
    const desktop = setup()

    // Smaller than the Projects window, so the floor wins and the title bar stays reachable.
    act(() => observer().report({ width: 700, height: 440 }))

    const frame = openFirstItem(desktop)

    expect(frame.style.left).toBe('0px')
    expect(frame.style.top).toBe('0px')
  })

  // covers: AC-3, AC-9
  it('lists the items in the order the content gives, which is the order the keyboard walks them', () => {
    const desktop = setup()
    const buttons = within(desktop).getAllByRole('button')

    expect(buttons).toHaveLength(DESKTOP_ITEMS.length)

    buttons.forEach((button, index) => {
      expect(button, DESKTOP_ITEMS[index]?.id).toHaveAccessibleName(
        DESKTOP_ITEMS[index]?.label ?? '',
      )
    })
  })

  // covers: AC-11
  it('brings the keyboard into the first item rather than onto the surface itself', async () => {
    const user = userEvent.setup()
    const desktop = setup()

    await user.tab()

    // The surface is a focus target without being a tab stop: the keyboard lands on its
    // contents, and the surface is only reached when something asks it to take over.
    expect(desktop).not.toHaveFocus()

    const first = within(desktop).getAllByRole('button')[0]

    expect(first).toHaveFocus()

    act(() => desktop.focus())

    expect(desktop).toHaveFocus()
  })

  // covers: AC-11
  it('renders the greeting, the items and the layer while the manager holds no window', () => {
    const desktop = setup()

    expect(within(desktop).getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(within(desktop).getByRole('list', { name: 'Desktop items' })).toBeInTheDocument()

    // The surface itself is the only region on screen, since nothing has been opened on it.
    expect(screen.getAllByRole('region')).toEqual([desktop])
  })
})
