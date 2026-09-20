import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Dock } from '#components/Dock'
import { WindowLayer } from '#components/WindowLayer'
import { WINDOW_LAYOUT } from '#store/windowManager'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import type { FileId, WindowId } from '#content/types'

/**
 * One window bound to the manager: it takes the spot and the size the manager holds, it wears
 * the quiet treatment while it does not have the keyboard, and both the pointer and the
 * keyboard write back through the manager's own action.
 * Spec 0004, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8.
 *
 * The shell below stands in for the desktop: it hands the manager a work area, which the real
 * container measures, then opens a window, and it renders the dock so the buttons a window
 * minimises toward are really there.
 */

const AREA = { width: 1600, height: 900 }
const STEP = 32

type ShellProps = {
  readonly windowId?: WindowId
  readonly fileId?: FileId
  /** A second window, opened after the first, so the first becomes the quiet one. */
  readonly also?: WindowId
}

/** A stand in desktop: a work area, then one or two open windows, with the dock beside them. */
function Shell({ windowId = 'projects', fileId, also }: ShellProps) {
  const { open, setWorkArea } = useWindowManager()

  useEffect(() => {
    setWorkArea(AREA)
    open(fileId === undefined ? { kind: 'window', windowId } : { kind: 'file', fileId }, {
      kind: 'dock',
    })

    if (also !== undefined) {
      open({ kind: 'window', windowId: also }, { kind: 'dock' })
    }
  }, [open, setWorkArea, windowId, fileId, also])

  return (
    <>
      <WindowLayer />
      <Dock />
    </>
  )
}

/** Renders the shell and returns the frame of the window it opened. */
function setup(windowId: WindowId = 'projects', fileId?: FileId, also?: WindowId) {
  render(
    <WindowManagerProvider>
      <Shell windowId={windowId} fileId={fileId} also={also} />
    </WindowManagerProvider>,
  )

  const frame = screen.getByRole('region', { name: 'Projects' })

  return {
    frame,
    handle: frame.querySelector('header') as HTMLElement,
  }
}

/** Renders the shell with one file window open, and hands back the frame it renders. */
function setupFile(fileId: FileId): HTMLElement {
  render(
    <WindowManagerProvider>
      <Shell fileId={fileId} />
    </WindowManagerProvider>,
  )

  return screen.getAllByRole('region')[0] as HTMLElement
}

/** The title element a frame is labelled by, which is where the quiet tone shows. */
function titleOf(frame: HTMLElement): HTMLElement {
  const id = frame.getAttribute('aria-labelledby') ?? ''
  const title = document.getElementById(id)

  if (title === null) {
    throw new Error('expected the frame to be labelled by its title')
  }

  return title
}

beforeEach(() => {
  document.documentElement.style.setProperty('--window-nudge-step', '16')
  document.documentElement.style.setProperty('--window-nudge-step-large', '64')
  document.documentElement.style.setProperty('--window-cascade-step', `${STEP}`)
})

afterEach(() => {
  document.documentElement.style.removeProperty('--window-nudge-step')
  document.documentElement.style.removeProperty('--window-nudge-step-large')
  document.documentElement.style.removeProperty('--window-cascade-step')
})

describe('a window the manager holds', () => {
  it('sits at the spot, size and stacking number the manager gives it', () => {
    const { frame } = setup()

    expect(frame.style.left).toBe(`${STEP / 2}px`)
    expect(frame.style.top).toBe(`${STEP / 2}px`)
    expect(frame.style.width).toBe(`${WINDOW_LAYOUT.projects.defaultSize.width}px`)
    expect(frame.style.height).toBe(`${WINDOW_LAYOUT.projects.defaultSize.height}px`)
    expect(frame.style.zIndex).toBe('1')
  })

  it('takes a drag of its title bar, and stays where it was released', () => {
    const { frame, handle } = setup()

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 200, clientY: 160 })

    expect(frame.style.transform).toBe('translate(100px, 60px)')

    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 200, clientY: 160 })

    expect(frame.style.left).toBe(`${STEP / 2 + 100}px`)
    expect(frame.style.top).toBe(`${STEP / 2 + 60}px`)
    expect(frame.style.transform).toBe('')
  })

  it('steps along the arrows from a control inside it', () => {
    const { frame } = setup()

    screen.getByRole('button', { name: 'Close Projects' }).focus()
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' })

    expect(frame.style.left).toBe(`${STEP / 2 + 16}px`)

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight', shiftKey: true })

    expect(frame.style.left).toBe(`${STEP / 2 + 16 + 64}px`)
  })

  // covers: AC-2
  it('names its frame after the item the manager opened, not after the app', () => {
    const frame = setupFile('nike-about')

    // The key carries the item and the title bar carries the file's own name, so two notes
    // from two places sit side by side without the frame knowing about either.
    expect(frame).toHaveAccessibleName('Nike Project.txt')
    expect(frame.style.width).toBe(`${WINDOW_LAYOUT.textFile.defaultSize.width}px`)
  })

  // covers: AC-8
  it('closes through the manager when its red light is pressed', async () => {
    const user = userEvent.setup()

    setup()
    await user.click(screen.getByRole('button', { name: 'Close Projects' }))

    expect(screen.queryByRole('region', { name: 'Projects' })).toBeNull()
  })

  // covers: AC-5
  it('closes on Escape while it holds the keyboard', async () => {
    const user = userEvent.setup()

    setup()
    screen.getByRole('button', { name: 'Close Projects' }).focus()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: 'Projects' })).toBeNull()
  })
})

describe('the quiet treatment', () => {
  // covers: AC-3
  it('leaves the focused frame as it is and softens the one below it', () => {
    setup('projects', undefined, 'contact')

    const focused = screen.getByRole('region', { name: 'Contact' })
    const quiet = screen.getByRole('region', { name: 'Projects' })

    expect(focused.className).toContain('shadow-window')
    expect(focused.className).not.toContain('shadow-window-quiet')
    expect(quiet.className).toContain('shadow-window-quiet')
  })

  // covers: AC-3
  it('mutes the title and dims the lights of the window without the keyboard', () => {
    setup('projects', undefined, 'contact')

    const quiet = screen.getByRole('region', { name: 'Projects' })
    const focused = screen.getByRole('region', { name: 'Contact' })
    const close = within(quiet).getByRole('button', { name: 'Close Projects' })

    expect(titleOf(quiet).className).toContain('text-text-muted')
    expect(close.parentElement?.className).toContain('window-quiet')
    expect(titleOf(focused).className).not.toContain('text-text-muted')
  })

  // covers: AC-3
  it('swaps the treatment when the keyboard moves to the other window', () => {
    setup('projects', undefined, 'contact')

    fireEvent.pointerDown(screen.getByRole('region', { name: 'Projects' }), {
      pointerId: 1,
      button: 0,
    })

    expect(screen.getByRole('region', { name: 'Projects' }).className).not.toContain(
      'shadow-window-quiet',
    )
    expect(screen.getByRole('region', { name: 'Contact' }).className).toContain(
      'shadow-window-quiet',
    )
  })

  // covers: AC-3
  it('takes the keyboard from a Tab into the window controls', () => {
    setup('projects', undefined, 'contact')

    const light = within(screen.getByRole('region', { name: 'Projects' })).getByRole('button', {
      name: 'Close Projects',
    })

    act(() => light.focus())

    expect(screen.getByRole('region', { name: 'Projects' }).className).not.toContain(
      'shadow-window-quiet',
    )
  })
})

describe('the lights', () => {
  // covers: AC-7
  it('fills the window to the work area from the green light, and back to its layout size', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Zoom Projects' }))

    expect(frame.style.width).toBe(`${AREA.width}px`)
    expect(frame.style.height).toBe(`${AREA.height}px`)
    expect(frame.style.left).toBe('0px')
    expect(frame.style.top).toBe('0px')

    await user.click(screen.getByRole('button', { name: 'Zoom Projects' }))

    expect(frame.style.width).toBe(`${WINDOW_LAYOUT.projects.defaultSize.width}px`)
    expect(frame.style.height).toBe(`${WINDOW_LAYOUT.projects.defaultSize.height}px`)
  })

  // covers: AC-6
  it('puts the window away from the yellow light, out of sight and out of the tab order', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Projects' }))

    expect(frame.classList.contains('hidden')).toBe(true)
  })

  // covers: AC-6
  it('hands the keyboard to the dock button when nothing is left on the desk', async () => {
    const user = userEvent.setup()

    setup()
    screen.getByRole('button', { name: 'Close Projects' }).focus()
    await user.click(screen.getByRole('button', { name: 'Minimise Projects' }))

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Portfolio' }))
  })

  // covers: AC-6
  it('brings the window back from its dock button, focused and on the desk again', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Projects' }))
    await user.click(screen.getByRole('button', { name: 'Portfolio' }))

    expect(frame.classList.contains('hidden')).toBe(false)
    expect(screen.getByRole('region', { name: 'Projects' }).className).not.toContain(
      'shadow-window-quiet',
    )
  })

  // covers: AC-6
  it('offers no minimise for a window with no dock button to come back from', () => {
    const frame = setupFile('nike-about')

    expect(within(frame).getByRole('button', { name: 'Minimise Nike Project.txt' })).toBeDisabled()
    expect(within(frame).getByRole('button', { name: 'Close Nike Project.txt' })).toBeEnabled()
  })
})
