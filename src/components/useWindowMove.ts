import { useCallback, useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

import { readMeasureToken } from '#lib/measure'
import { clampPosition } from '#store/windowManager'
import type { WindowFrameProps } from '#components/Window'
import type { WindowKey, WindowPosition, WindowSize, WorkArea } from '#store/windowManager'

/*
 * Moving one window, from the pointer and from the keyboard, both ending in the manager's one
 * move action so the two can never disagree about where a window sits. Spec 0004, AC-4, AC-5.
 */

/** The arrows that move a window, each as the direction of one step along each axis. */
const ARROW_DIRECTIONS = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
} as const

/** The four keys that move a window, and nothing else. */
type ArrowKey = keyof typeof ARROW_DIRECTIONS

/** A pointer press the window is following: the element it is moving, where it started, and where the window has reached. */
type Drag = {
  readonly element: HTMLElement
  readonly pointerId: number
  readonly from: WindowPosition
  readonly origin: WindowPosition
  live: WindowPosition
}

/** What moving this window needs to know. */
type WindowMoveInput = {
  readonly windowKey: WindowKey
  readonly position: WindowPosition
  readonly size: WindowSize
  readonly workArea: WorkArea
  /** False below the compact breakpoint, where a window fills the work area and is not dragged. */
  readonly draggable: boolean
  readonly move: (key: WindowKey, position: WindowPosition) => void
  readonly focus: (key: WindowKey) => void
}

/** What a frame spreads onto its own element, and the one call it makes on the way out. */
export type WindowMove = {
  readonly frameProps: WindowFrameProps
  /** Commits a drag that is still under the pointer, so a close during one keeps the last valid spot. */
  readonly commitDrag: () => void
}

/** Reads an event's key as the direction it steps a window, so anything else falls through. */
function directionOf(key: string): WindowPosition | null {
  return key in ARROW_DIRECTIONS ? ARROW_DIRECTIONS[key as ArrowKey] : null
}

/** Whether a press lands on something that does its own job with a press. */
function isControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return target.closest('button, a, input, select, textarea, [contenteditable="true"]') !== null
}

/** Whether a press lands inside the title bar of this frame. */
function hasHandle(target: EventTarget | null, frame: HTMLElement): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  const handle = target.closest('[data-window-handle]')

  return handle !== null && frame.contains(handle)
}

/** Whether a key press belongs to a field rather than to the window. */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName

  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/** Whether a box still has room to scroll the way an arrow points. */
function hasRoomToScroll(box: HTMLElement, axis: 'x' | 'y', direction: number): boolean {
  const overflow = getComputedStyle(box)[axis === 'x' ? 'overflowX' : 'overflowY']

  // A box the page hides still scrolls under script, but an arrow key is not how a visitor
  // reaches it, so only a box that says it scrolls counts.
  if (overflow !== 'auto' && overflow !== 'scroll') {
    return false
  }

  const travel =
    axis === 'x' ? box.scrollWidth - box.clientWidth : box.scrollHeight - box.clientHeight

  if (travel <= 1) {
    return false
  }

  const behind = axis === 'x' ? box.scrollLeft : box.scrollTop

  return direction < 0 ? behind > 0 : behind < travel
}

/**
 * Whether the arrow belongs to a scrollable box inside the window instead of to the window,
 * so a body that already scrolls with the arrow keys keeps them. Spec 0004, AC-5.
 */
function scrollsInstead(
  target: EventTarget | null,
  frame: HTMLElement,
  direction: WindowPosition,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  for (let node: HTMLElement | null = target; node !== null && node !== frame;) {
    if (direction.x !== 0 && hasRoomToScroll(node, 'x', direction.x)) {
      return true
    }

    if (direction.y !== 0 && hasRoomToScroll(node, 'y', direction.y)) {
      return true
    }

    node = node.parentElement
  }

  return false
}

/** Asks an element to capture a pointer, where the environment offers the call at all. */
function capturePointer(element: HTMLElement, pointerId: number): void {
  if (typeof element.setPointerCapture !== 'function') {
    return
  }

  try {
    element.setPointerCapture(pointerId)
  } catch {
    // A pointer that has already gone cannot be captured. The press simply moves nothing.
  }
}

/**
 * Wires one window's movement onto its frame: a press on the title bar drags it, the arrow
 * keys step it, and both write through the manager's one move action.
 *
 * The drag follows the pointer as a transform written straight to the element, so a pointer
 * event never costs a React render, and only the release commits a position. Clamping happens
 * on the way through, against the newest work area, so a container that changes size mid drag
 * re-clamps on the next move. A window in the compact layout is not draggable at all: the
 * pointer still focuses it, and nothing follows. Spec 0004, AC-4, AC-5, AC-9.
 */
export function useWindowMove({
  windowKey,
  position,
  size,
  workArea,
  draggable,
  move,
  focus,
}: WindowMoveInput): WindowMove {
  const drag = useRef<Drag | null>(null)

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      // A press anywhere in a window focuses it; only a press on the title bar starts a drag.
      focus(windowKey)

      if (event.button !== 0) {
        return
      }

      const onControl = isControl(event.target)

      // A press on the body hands the window the keyboard, so the arrow keys work without the
      // visitor reaching for the tab key first. A press on a control keeps the control's own
      // focus, and the frame is `tabIndex={-1}` so Tab never lands on it.
      if (!onControl) {
        event.currentTarget.focus()
      }

      // Only the title bar is a drag handle, and the lights in it are controls. Below the
      // compact breakpoint the window fills the work area, so no drag starts at all.
      if (!draggable || onControl || !hasHandle(event.target, event.currentTarget)) {
        return
      }

      drag.current = {
        element: event.currentTarget,
        pointerId: event.pointerId,
        from: { x: event.clientX, y: event.clientY },
        origin: position,
        live: position,
      }

      // Capture keeps a pointer that outruns the window, and one released outside it, still
      // delivering here, which is what lets the release commit the last valid spot.
      capturePointer(event.currentTarget, event.pointerId)
    },
    [draggable, focus, position, windowKey],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const current = drag.current

      if (current === null || current.pointerId !== event.pointerId) {
        return
      }

      const live = clampPosition(
        {
          x: current.origin.x + (event.clientX - current.from.x),
          y: current.origin.y + (event.clientY - current.from.y),
        },
        size,
        workArea,
      )

      drag.current = { ...current, live }
      event.currentTarget.style.transform = `translate(${live.x - current.origin.x}px, ${live.y - current.origin.y}px)`
    },
    [size, workArea],
  )

  /**
   * Writes the spot the pointer reached: the one commit of a drag, whether it ends with a
   * release, a cancellation, or a close arriving mid drag. The spot goes onto the element
   * before the store hears about it, so the window is never seen jumping back to where the
   * drag began while React catches up.
   */
  const endDrag = useCallback(
    (current: Drag) => {
      drag.current = null
      current.element.style.left = `${current.live.x}px`
      current.element.style.top = `${current.live.y}px`
      current.element.style.transform = ''
      move(windowKey, current.live)
    },
    [move, windowKey],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const current = drag.current

      if (current === null || current.pointerId !== event.pointerId) {
        return
      }

      endDrag(current)
    },
    [endDrag],
  )

  const commitDrag = useCallback(() => {
    const current = drag.current

    if (current !== null) {
      endDrag(current)
    }
  }, [endDrag])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const direction = directionOf(event.key)

      if (direction === null || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (
        isEditable(event.target) ||
        scrollsInstead(event.target, event.currentTarget, direction)
      ) {
        return
      }

      const step = readMeasureToken(
        event.shiftKey ? 'window-nudge-step-large' : 'window-nudge-step',
      )

      if (step === 0) {
        return
      }

      // The window takes the key, so the page underneath never scrolls as a side effect.
      event.preventDefault()
      move(windowKey, {
        x: position.x + direction.x * step,
        y: position.y + direction.y * step,
      })
    },
    [move, position, windowKey],
  )

  const handleFocus = useCallback(() => {
    focus(windowKey)
  }, [focus, windowKey])

  return {
    frameProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
    },
    commitDrag,
  }
}
