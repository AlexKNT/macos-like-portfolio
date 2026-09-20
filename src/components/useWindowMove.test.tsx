import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWindowMove } from '#components/useWindowMove'
import type { WindowKey, WindowPosition, WindowSize } from '#store/windowManager'

/**
 * Moving a window: the drag of its title bar and the arrow key path, both of which end in the
 * manager's one move action. Spec 0004, AC-4, AC-5.
 *
 * The host below is the smallest thing that carries the frame's anatomy: a title bar marked as
 * the drag handle, a control beside it, and a body that scrolls. jsdom cannot compile the
 * stylesheet, so the two measure tokens a key press reads are declared for each test.
 */

const AREA = { width: 1600, height: 900 }
const SIZE = { width: 720, height: 460 }

/** The furthest the window may sit in this work area before it is clamped. */
const CORNER = { x: AREA.width - SIZE.width, y: AREA.height - SIZE.height }

type HostProps = {
  readonly move: (key: WindowKey, position: WindowPosition) => void
  readonly focus: (key: WindowKey) => void
  readonly position?: WindowPosition
  readonly workArea?: WindowSize
  readonly draggable?: boolean
}

/** A stand in frame with the handlers under test spread onto it. */
function Host({
  move,
  focus,
  position = { x: 0, y: 0 },
  workArea = AREA,
  draggable = true,
}: HostProps) {
  const { frameProps, commitDrag } = useWindowMove({
    windowKey: 'projects',
    position,
    size: SIZE,
    workArea,
    draggable,
    move,
    focus,
  })

  return (
    <section {...frameProps} data-testid="frame" tabIndex={-1}>
      <header data-window-handle="">
        {/* The close path commits a drag that is still under the pointer before it leaves. */}
        <button type="button" onClick={commitDrag}>
          Close Projects
        </button>
      </header>
      <div data-testid="body" style={{ overflowY: 'auto' }}>
        <input aria-label="Search" />
        <p data-testid="text">Project files</p>
      </div>
    </section>
  )
}

/** Renders the host and returns the parts the checks reach for. */
function setup(position?: WindowPosition, draggable = true) {
  const move = vi.fn()
  const focus = vi.fn()

  const view = render(<Host move={move} focus={focus} position={position} draggable={draggable} />)

  return {
    move,
    focus,
    frame: screen.getByTestId('frame'),
    handle: screen.getByTestId('frame').querySelector('header') as HTMLElement,
    /** The same window, after the desktop box it sits in has been measured again. */
    resizeTo: (box: WindowSize) =>
      view.rerender(
        <Host move={move} focus={focus} position={position} workArea={box} draggable={draggable} />,
      ),
  }
}

/** Fakes the scroll room a body has, which jsdom cannot measure. */
function makeScrollable(element: HTMLElement, travel: number, behind: number) {
  Object.defineProperty(element, 'scrollHeight', { value: travel, configurable: true })
  Object.defineProperty(element, 'clientHeight', { value: 0, configurable: true })
  Object.defineProperty(element, 'scrollTop', { value: behind, configurable: true })
}

beforeEach(() => {
  document.documentElement.style.setProperty('--window-nudge-step', '16')
  document.documentElement.style.setProperty('--window-nudge-step-large', '64')
})

afterEach(() => {
  document.documentElement.style.removeProperty('--window-nudge-step')
  document.documentElement.style.removeProperty('--window-nudge-step-large')
})

describe('dragging a window', () => {
  it('focuses the window, follows the pointer, and commits one spot on release', () => {
    const { move, focus, frame, handle } = setup()

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })

    expect(focus).toHaveBeenCalledWith('projects')

    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 180, clientY: 140 })

    expect(frame.style.transform).toBe('translate(80px, 40px)')
    // The pointer never writes to the store: the release is the one commit.
    expect(move).not.toHaveBeenCalled()

    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 180, clientY: 140 })

    expect(move).toHaveBeenCalledOnce()
    expect(move).toHaveBeenCalledWith('projects', { x: 80, y: 40 })
    expect(frame.style.transform).toBe('')
    expect(frame.style.left).toBe('80px')
    expect(frame.style.top).toBe('40px')
  })

  it('keeps the whole window inside the work area while the pointer runs past the edge', () => {
    const { move, frame, handle } = setup({ x: 100, y: 100 })

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 500, clientY: 500 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 4000, clientY: 4000 })

    expect(frame.style.transform).toBe(`translate(${CORNER.x - 100}px, ${CORNER.y - 100}px)`)

    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 4000, clientY: 4000 })

    expect(move).toHaveBeenCalledWith('projects', CORNER)
  })

  it('commits the last valid spot when the pointer is taken away', () => {
    const { move, frame, handle } = setup()

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 40, clientY: 0 })
    fireEvent.pointerCancel(frame, { pointerId: 1 })

    expect(move).toHaveBeenCalledWith('projects', { x: 40, y: 0 })
    expect(frame.style.transform).toBe('')
  })

  it('starts no drag from the lights in the title bar, from the body, or from a second button', () => {
    const { move, frame, handle } = setup()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Close Projects' }), {
      pointerId: 1,
      button: 0,
      clientX: 0,
      clientY: 0,
    })
    fireEvent.pointerDown(screen.getByTestId('body'), {
      pointerId: 1,
      button: 0,
      clientX: 0,
      clientY: 0,
    })
    fireEvent.pointerDown(handle, { pointerId: 1, button: 2, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 120, clientY: 60 })
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 120, clientY: 60 })

    expect(frame.style.transform).toBe('')
    expect(move).not.toHaveBeenCalled()
  })

  it('leaves a press anywhere in the window focusing it, and takes its keyboard', () => {
    const { focus, frame } = setup()

    fireEvent.pointerDown(screen.getByTestId('body'), { pointerId: 1, button: 0 })

    expect(focus).toHaveBeenCalledWith('projects')
    // Focus moves to the frame, which is what makes an arrow key afterwards move the window.
    expect(document.activeElement).toBe(frame)
  })

  it('leaves the focus of a control alone, so a press on a light keeps its own', () => {
    const { frame } = setup()
    const light = screen.getByRole('button', { name: 'Close Projects' })

    light.focus()
    fireEvent.pointerDown(light, { pointerId: 1, button: 0 })

    expect(document.activeElement).toBe(light)
    expect(document.activeElement).not.toBe(frame)
  })

  // covers: AC-3
  it('focuses the window from a press on a light, without starting a drag', () => {
    const { focus, move, frame } = setup()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Close Projects' }), {
      pointerId: 1,
      button: 0,
      clientX: 40,
      clientY: 40,
    })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 240, clientY: 240 })
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 240, clientY: 240 })

    expect(focus).toHaveBeenCalledWith('projects')
    expect(move).not.toHaveBeenCalled()
  })

  // covers: AC-4
  it('follows only the pointer that started the drag', () => {
    const { move, frame, handle } = setup()

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 400, clientY: 400 })

    expect(frame.style.transform).toBe('')

    fireEvent.pointerUp(frame, { pointerId: 2 })

    expect(move).not.toHaveBeenCalled()
  })

  // covers: AC-4, AC-9
  it('re-clamps from the live work area when the container changes size mid drag', () => {
    const { move, frame, handle, resizeTo } = setup({ x: 0, y: 0 })

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })

    // The same pointer travel now lands past the bottom right of a smaller desktop.
    resizeTo({ width: SIZE.width + 40, height: SIZE.height + 40 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 180, clientY: 140 })

    expect(frame.style.transform).toBe('translate(40px, 40px)')

    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 180, clientY: 140 })

    expect(move).toHaveBeenCalledWith('projects', { x: 40, y: 40 })
  })

  // covers: AC-4
  it('commits the last valid spot when the window is closed mid drag, and only once', () => {
    const { move, frame, handle } = setup({ x: 100, y: 100 })

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 60, clientY: 20 })
    fireEvent.click(screen.getByRole('button', { name: 'Close Projects' }))

    expect(move).toHaveBeenCalledWith('projects', { x: 160, y: 120 })
    expect(frame.style.transform).toBe('')

    // The drag is over, so the release that follows finds nothing left to commit.
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 60, clientY: 20 })

    expect(move).toHaveBeenCalledOnce()
  })

  // covers: AC-9
  it('starts no drag below the compact breakpoint, and still focuses the window', () => {
    const { focus, frame, handle, move } = setup(undefined, false)

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 240, clientY: 240 })
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 240, clientY: 240 })

    expect(focus).toHaveBeenCalledWith('projects')
    expect(frame.style.transform).toBe('')
    expect(move).not.toHaveBeenCalled()
  })
})

describe('moving a window with the keyboard', () => {
  it('steps with an arrow key, and further with Shift held', () => {
    const { move } = setup()
    const text = screen.getByTestId('text')

    fireEvent.keyDown(text, { key: 'ArrowRight' })

    expect(move).toHaveBeenLastCalledWith('projects', { x: 16, y: 0 })

    fireEvent.keyDown(text, { key: 'ArrowUp', shiftKey: true })

    expect(move).toHaveBeenLastCalledWith('projects', { x: 0, y: -64 })
  })

  it('takes the key from the page, so nothing scrolls underneath', () => {
    const { frame } = setup()

    const carried = fireEvent.keyDown(screen.getByTestId('text'), {
      key: 'ArrowDown',
      cancelable: true,
    })

    // `fireEvent` reports false once a handler has claimed the event.
    expect(carried).toBe(false)
    expect(frame).toBeInTheDocument()
  })

  it('leaves an arrow key to a field, and to a box that still has room to scroll', () => {
    const { move } = setup()
    const body = screen.getByTestId('body')

    fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'ArrowRight' })

    expect(move).not.toHaveBeenCalled()

    makeScrollable(body, 400, 0)

    // Down the body can still scroll, so the window stays put.
    fireEvent.keyDown(screen.getByTestId('text'), { key: 'ArrowDown' })

    expect(move).not.toHaveBeenCalled()

    // Up it cannot, so the key belongs to the window again.
    fireEvent.keyDown(screen.getByTestId('text'), { key: 'ArrowUp' })

    expect(move).toHaveBeenCalledWith('projects', { x: 0, y: -16 })
  })

  it('ignores a key that is not an arrow, and an arrow carrying a modifier', () => {
    const { move } = setup()

    fireEvent.keyDown(screen.getByTestId('text'), { key: 'a' })
    fireEvent.keyDown(screen.getByTestId('text'), { key: 'ArrowRight', ctrlKey: true })

    expect(move).not.toHaveBeenCalled()
  })
})
