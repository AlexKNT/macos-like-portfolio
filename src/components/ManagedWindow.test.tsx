import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import gsap from 'gsap'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Dock } from '#components/Dock'
import { WindowLayer } from '#components/WindowLayer'
import { WINDOW_LAYOUT } from '#store/windowManager'
import { useWindowManager } from '#store/useWindowManager'
import { phoneLayout, restoreLayout } from '../test/layout'
import { ShellProviders } from '../test/shell'
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
  const view = render(
    <ShellProviders>
      <Shell windowId={windowId} fileId={fileId} also={also} />
    </ShellProviders>,
  )

  // A bare Projects open lands on the work location (spec 0005, AC-2), so the frame is named
  // after the place it shows and its lights take their names from the same title.
  const frame = screen.getByRole('region', { name: 'Work' })

  return {
    frame,
    handle: frame.querySelector('header') as HTMLElement,
    view,
  }
}

/** Renders the shell with one file window open, and hands back the frame it renders. */
function setupFile(fileId: FileId): HTMLElement {
  render(
    <ShellProviders>
      <Shell fileId={fileId} />
    </ShellProviders>,
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
  vi.restoreAllMocks()
  document.documentElement.style.removeProperty('--window-nudge-step')
  document.documentElement.style.removeProperty('--window-nudge-step-large')
  document.documentElement.style.removeProperty('--window-cascade-step')
  document.documentElement.style.removeProperty('--duration-base')
  document.documentElement.style.removeProperty('--duration-slow')
  document.documentElement.style.removeProperty('--window-dock-shrink')
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

    screen.getByRole('button', { name: 'Close Work' }).focus()
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
    await user.click(screen.getByRole('button', { name: 'Close Work' }))

    expect(screen.queryByRole('region', { name: 'Work' })).toBeNull()
  })

  // covers: AC-5
  it('closes on Escape while it holds the keyboard', async () => {
    const user = userEvent.setup()

    setup()
    screen.getByRole('button', { name: 'Close Work' }).focus()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: 'Work' })).toBeNull()
  })
})

describe('the quiet treatment', () => {
  // covers: AC-3
  it('leaves the focused frame as it is and softens the one below it', () => {
    setup('projects', undefined, 'contact')

    const focused = screen.getByRole('region', { name: 'Contact' })
    const quiet = screen.getByRole('region', { name: 'Work' })

    expect(focused.className).toContain('shadow-window')
    expect(focused.className).not.toContain('shadow-window-quiet')
    expect(quiet.className).toContain('shadow-window-quiet')
  })

  // covers: AC-3
  it('mutes the title and dims the lights of the window without the keyboard', () => {
    setup('projects', undefined, 'contact')

    const quiet = screen.getByRole('region', { name: 'Work' })
    const focused = screen.getByRole('region', { name: 'Contact' })
    const close = within(quiet).getByRole('button', { name: 'Close Work' })

    expect(titleOf(quiet).className).toContain('text-text-muted')
    expect(close.parentElement?.className).toContain('window-quiet')
    expect(titleOf(focused).className).not.toContain('text-text-muted')
  })

  // covers: AC-3
  it('swaps the treatment when the keyboard moves to the other window', () => {
    setup('projects', undefined, 'contact')

    fireEvent.pointerDown(screen.getByRole('region', { name: 'Work' }), {
      pointerId: 1,
      button: 0,
    })

    expect(screen.getByRole('region', { name: 'Work' }).className).not.toContain(
      'shadow-window-quiet',
    )
    expect(screen.getByRole('region', { name: 'Contact' }).className).toContain(
      'shadow-window-quiet',
    )
  })

  // covers: AC-3
  it('takes the keyboard from a Tab into the window controls', () => {
    setup('projects', undefined, 'contact')

    const light = within(screen.getByRole('region', { name: 'Work' })).getByRole('button', {
      name: 'Close Work',
    })

    act(() => light.focus())

    expect(screen.getByRole('region', { name: 'Work' }).className).not.toContain(
      'shadow-window-quiet',
    )
  })
})

describe('the lights', () => {
  // covers: AC-7
  it('fills the window to the work area from the green light, and back to its layout size', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Zoom Work' }))

    expect(frame.style.width).toBe(`${AREA.width}px`)
    expect(frame.style.height).toBe(`${AREA.height}px`)
    expect(frame.style.left).toBe('0px')
    expect(frame.style.top).toBe('0px')

    await user.click(screen.getByRole('button', { name: 'Zoom Work' }))

    expect(frame.style.width).toBe(`${WINDOW_LAYOUT.projects.defaultSize.width}px`)
    expect(frame.style.height).toBe(`${WINDOW_LAYOUT.projects.defaultSize.height}px`)
  })

  // covers: AC-6
  it('puts the window away from the yellow light, out of sight and out of the tab order', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))

    expect(frame.classList.contains('hidden')).toBe(true)
  })

  // covers: AC-6
  it('hands the keyboard to the dock button when nothing is left on the desk', async () => {
    const user = userEvent.setup()

    setup()
    screen.getByRole('button', { name: 'Close Work' }).focus()
    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Portfolio' }))
  })

  // covers: AC-6
  it('brings the window back from its dock button, focused and on the desk again', async () => {
    const user = userEvent.setup()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))
    await user.click(screen.getByRole('button', { name: 'Portfolio' }))

    expect(frame.classList.contains('hidden')).toBe(false)
    expect(screen.getByRole('region', { name: 'Work' }).className).not.toContain(
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

/**
 * The same frame below the compact breakpoint, where one window takes the screen and the lights
 * follow a different list: Zoom has nothing left to fill, and Minimise is offered for the windows
 * the home surface has a tile for, which is one more than the dock reaches.
 * Spec 0009, AC-4, AC-7.
 */

/** A phone stand in: a work area, one window, and optionally a second opened by the first. */
function PhoneShell({ windowId, also }: { readonly windowId: WindowId; readonly also?: WindowId }) {
  const { open, setWorkArea } = useWindowManager()

  useEffect(() => {
    setWorkArea(AREA)
    open({ kind: 'window', windowId }, { kind: 'home' })

    if (also !== undefined) {
      open({ kind: 'window', windowId: also }, { kind: 'window', key: windowId })
    }
  }, [open, setWorkArea, windowId, also])

  return <WindowLayer />
}

/** A phone, with the media query already answering the compact question before the first render. */
function setupPhone(windowId: WindowId, also?: WindowId): void {
  phoneLayout()

  render(
    <ShellProviders>
      <PhoneShell windowId={windowId} also={also} />
    </ShellProviders>,
  )
}

describe('a window on a phone', () => {
  afterEach(() => {
    restoreLayout()
  })

  // covers: AC-4
  it('paints the focused window alone, hiding the one it covers while keeping it alive', () => {
    setupPhone('projects', 'contact')

    const covered = screen.getByRole('region', { name: 'Work' })
    const focused = screen.getByRole('region', { name: 'Contact' })

    expect(covered.classList.contains('hidden')).toBe(true)
    expect(focused.classList.contains('hidden')).toBe(false)
  })

  // covers: AC-7
  it('offers Zoom disabled, and Minimise for a window the home surface has a tile for', () => {
    setupPhone('resume')

    // Resume has a tile and no dock button, so a phone is the surface that offers it Minimise, and
    // a window that already holds the work area has nothing left for the green light to fill.
    expect(screen.getByRole('button', { name: 'Minimise Resume' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Zoom Resume' })).toBeDisabled()
  })
})

/** A movement the frame started, recorded instead of played, so a case can finish it by hand. */
type Recorded = {
  element: HTMLElement | null
  vars: gsap.TweenVars | null
  readonly kill: ReturnType<typeof vi.fn>
  readonly finish: () => void
}

/**
 * Stands in for gsap's timelines, which are the one boundary a movement crosses. Nothing is
 * played, so a case sees exactly what the frame asked for and decides when it lands.
 */
function recordTimelines(): Recorded[] {
  const created: Recorded[] = []

  vi.spyOn(gsap, 'timeline').mockImplementation(((timelineVars: gsap.TimelineVars = {}) => {
    const recorded: Recorded = {
      element: null,
      vars: null,
      kill: vi.fn(),
      finish: () => timelineVars.onComplete?.(),
    }

    const handle = {
      to: (element: HTMLElement, tweenVars: gsap.TweenVars) => {
        recorded.element = element
        recorded.vars = tweenVars

        return handle
      },
      kill: recorded.kill,
    }

    created.push(recorded)

    return handle
  }) as never)

  return created
}

describe('the movements a frame plays', () => {
  // covers: AC-6, AC-10
  it('reaches the end state at once, and starts no movement, when the durations read zero', async () => {
    const user = userEvent.setup()
    const timelines = recordTimelines()
    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))

    expect(frame.classList.contains('hidden')).toBe(true)
    expect(timelines).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Portfolio' }))
    await user.click(screen.getByRole('button', { name: 'Close Work' }))

    expect(screen.queryByRole('region', { name: 'Work' })).toBeNull()
    expect(timelines).toHaveLength(0)
  })

  // covers: AC-6
  it('shrinks toward the dock with the token scale, and tells the manager once it lands', async () => {
    const user = userEvent.setup()
    const timelines = recordTimelines()

    document.documentElement.style.setProperty('--duration-slow', '400')
    document.documentElement.style.setProperty('--window-dock-shrink', '0.5')

    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))

    // The window is still on the desk: the manager hears about the minimise when it lands.
    expect(frame.classList.contains('hidden')).toBe(false)
    expect(timelines).toHaveLength(1)
    expect(timelines[0]?.element).toBe(frame)
    expect(timelines[0]?.vars?.scale).toBe(0.5)
    expect(timelines[0]?.vars?.opacity).toBe(0)

    act(() => timelines[0]?.finish())

    expect(screen.getByRole('region', { name: 'Work' }).classList.contains('hidden')).toBe(true)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Portfolio' }))
  })

  // covers: AC-8
  it('leaves only once the exit movement has landed', async () => {
    const user = userEvent.setup()
    const timelines = recordTimelines()

    document.documentElement.style.setProperty('--duration-base', '300')

    const { frame } = setup()

    screen.getByRole('button', { name: 'Close Work' }).focus()
    await user.keyboard('{Escape}')

    expect(screen.getByRole('region', { name: 'Work' })).toBe(frame)
    expect(timelines).toHaveLength(1)
    expect(timelines[0]?.element).toBe(frame)
    expect(timelines[0]?.vars?.scale).toBeCloseTo(0.96)
    expect(timelines[0]?.vars?.opacity).toBe(0)

    act(() => timelines[0]?.finish())

    expect(screen.queryByRole('region', { name: 'Work' })).toBeNull()
  })

  // covers: AC-10
  it('stops the movement in flight when the frame unmounts', async () => {
    const user = userEvent.setup()
    const timelines = recordTimelines()

    document.documentElement.style.setProperty('--duration-base', '300')

    const { view } = setup()

    screen.getByRole('button', { name: 'Close Work' }).focus()
    await user.keyboard('{Escape}')
    view.unmount()

    expect(timelines[0]?.kill).toHaveBeenCalled()
  })

  // covers: AC-6
  it('brings the window back holding the keyboard, with no movement at zero', async () => {
    const user = userEvent.setup()

    // gsap is the one boundary a movement crosses, and it is stood in for here: jsdom does not
    // report what the real library leaves on the element when it clears props, so the browser
    // check for this case lives in the end to end suite.
    const fromTo = vi.spyOn(gsap, 'fromTo').mockImplementation((() => ({})) as never)
    const set = vi.spyOn(gsap, 'set').mockImplementation((() => ({})) as never)

    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))
    await user.click(screen.getByRole('button', { name: 'Portfolio' }))

    expect(frame.classList.contains('hidden')).toBe(false)
    expect(document.activeElement).toBe(frame)
    // A movement that reads zero is not played: the props a drag could have left are cleared.
    expect(fromTo).not.toHaveBeenCalled()
    expect(set).toHaveBeenCalledWith(frame, { clearProps: 'transform,opacity' })
  })

  // covers: AC-6
  it('plays the way back from the dock button, at the geometry the window left with', async () => {
    const user = userEvent.setup()
    const fromTo = vi.spyOn(gsap, 'fromTo').mockImplementation((() => ({})) as never)

    const { frame } = setup()

    await user.click(screen.getByRole('button', { name: 'Minimise Work' }))

    // The way back reads the token when the status changes, so the duration is set now.
    document.documentElement.style.setProperty('--duration-slow', '400')

    await user.click(screen.getByRole('button', { name: 'Portfolio' }))

    expect(fromTo).toHaveBeenCalledTimes(1)
    expect(fromTo.mock.calls[0]?.[0]).toBe(frame)
    expect(fromTo.mock.calls[0]?.[2]).toMatchObject({ x: 0, y: 0, scale: 1, opacity: 1 })
    expect(document.activeElement).toBe(frame)
  })
})
