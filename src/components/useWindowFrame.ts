import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { KeyboardEvent } from 'react'

import { useWindowMove } from '#components/useWindowMove'
import { applyFocusHop } from '#components/windowFocus'
import { exitTargetFor } from '#components/windowExit'
import { readMeasureToken } from '#lib/measure'
import { readEaseToken, readMotionToken } from '#lib/motion'
import { focusHopAfter, hasDockButton, hasHomeTile } from '#store/windowManager'
import { useWindowElements } from '#store/useWindowElements'
import { useWindowManager } from '#store/useWindowManager'
import type { WindowFrameProps } from '#components/Window'
import type { MotionToken } from '#lib/motion'
import type { WindowInstance, WindowPosition, WindowSize } from '#store/windowManager'

/*
 * What a window does when it is asked to close, to minimise or to fill: the movement is played
 * here, on the frame's own element, and the manager hears about the new state once the movement
 * has landed. That is why the store is briefly out of step with the screen, and why every path
 * ends in a dispatch rather than starting with one. Spec 0004, AC-6, AC-7, AC-8.
 */

/** How far a window shrinks as it leaves, which is what makes an exit read as a departure. */
const EXIT_SCALE = 0.96

/** What a frame needs to know about itself. */
type WindowFrameInput = {
  readonly instance: WindowInstance
  /** Where the frame is drawn, which is its own spot or the compact fill. */
  readonly position: WindowPosition
  readonly size: WindowSize
}

/** Everything a frame hands to the frame component. */
export type WindowFrame = {
  readonly frameProps: WindowFrameProps
  readonly frameRef: (element: HTMLElement | null) => void
  readonly isMinimised: boolean
  readonly onClose: () => void
  readonly onMinimise: (() => void) | undefined
  /** Absent on a phone, where a window already fills the work area and Zoom has nothing to do. */
  readonly onZoom: (() => void) | undefined
}

/** The timing every movement on a frame shares: the token duration and the token easing. */
function motion(token: MotionToken): gsap.TweenVars {
  return { duration: readMotionToken(token) / 1000, ease: readEaseToken('out') }
}

/**
 * Where a frame travels for its middle to reach a small target: the dock button it minimises to
 * above the breakpoint, or the home tile it grows from and shrinks back into on a phone. Both
 * targets send a window to the same size, which is the shrink measure token.
 */
function travelTween(frame: HTMLElement, target: HTMLElement): gsap.TweenVars {
  const box = frame.getBoundingClientRect()
  const seat = target.getBoundingClientRect()
  const shrink = readMeasureToken('window-dock-shrink')

  return {
    x: seat.left + seat.width / 2 - (box.left + box.width / 2),
    y: seat.top + seat.height / 2 - (box.top + box.height / 2),
    scale: shrink > 0 ? shrink : 1,
  }
}

/**
 * One window's own behaviour: the exit timeline, the shrink toward the dock or the home surface and
 * the movement back from it, each played on the frame and each finishing in the manager's action.
 * The keyboard ends up somewhere reachable every time, whether the window closed, was put away, or
 * came back.
 *
 * A phone changes three things and no more: a window grows out of the tile that opened it and
 * shrinks back into that tile, it takes the keyboard when it opens, and its green light goes
 * because a window that already fills the work area has nothing left to fill.
 *
 * Reduced motion needs no second path here: the durations come from the tokens, and when they read
 * zero the end state is reached at once rather than through a timeline that never moves. The
 * movement in flight is killed on unmount, so nothing runs on after the frame is gone.
 * Spec 0004, AC-6, AC-7, AC-8, AC-9, AC-10; spec 0009, AC-3, AC-7, AC-12.
 */
export function useWindowFrame({ instance, position, size }: WindowFrameInput): WindowFrame {
  const { instances, focusedKey, workArea, compact, move, focus, close, minimise, zoom } =
    useWindowManager()
  const elements = useWindowElements()
  const frame = useRef<HTMLElement | null>(null)
  const leaving = useRef(false)
  const openedCompact = useRef(compact)
  const entered = useRef(false)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const previousStatus = useRef(instance.status)
  const isFocused = focusedKey === instance.key

  const { frameProps, commitDrag } = useWindowMove({
    windowKey: instance.key,
    position,
    size,
    workArea,
    draggable: !compact,
    move,
    focus,
  })

  const frameRef = useCallback(
    (element: HTMLElement | null) => {
      frame.current = element
      elements.registerFrame(instance.key, element)
    },
    [elements, instance.key],
  )

  /**
   * Where a phone window travels to and comes from: its own tile, or the tile of the window that
   * opened it. Null above the breakpoint, where the dock panel is the movement's target.
   */
  const homeTarget = useCallback(
    (): HTMLElement | null => (compact ? exitTargetFor(instance, instances, elements) : null),
    [compact, elements, instance, instances],
  )

  useEffect(
    () => () => {
      timeline.current?.kill()
    },
    [],
  )

  const requestClose = useCallback(() => {
    // A second close on a key that is already on its way out, and a minimise arriving during
    // the same movement, both do nothing: a window is removed once, never twice.
    if (leaving.current) {
      return
    }

    leaving.current = true

    // A close during a drag keeps the last valid spot rather than losing it.
    commitDrag()

    const element = frame.current
    const exit = motion('base')
    const finish = () => {
      close(instance.key)
      applyFocusHop(focusHopAfter(instances, instance.key, compact), elements)
    }

    if (element === null || exit.duration === 0) {
      finish()
      return
    }

    const tile = homeTarget()

    // On a phone the window shrinks back into the tile it came from; above the breakpoint it
    // fades where it stands, which is what the desktop has always done.
    timeline.current = gsap
      .timeline({ onComplete: finish })
      .to(
        element,
        tile === null
          ? { ...exit, scale: EXIT_SCALE, opacity: 0 }
          : { ...exit, ...travelTween(element, tile), opacity: 0 },
      )
  }, [close, commitDrag, compact, elements, homeTarget, instance.key, instances])

  const requestMinimise = useCallback(() => {
    if (leaving.current) {
      return
    }

    const element = frame.current
    const target = compact ? homeTarget() : elements.dockButtonFor(instance.windowId)
    const shrink = motion('slow')
    const finish = () => {
      minimise(instance.key)
      applyFocusHop(focusHopAfter(instances, instance.key, compact), elements)
    }

    // With motion reduced, or a target that is not on screen, the window is simply put away: the
    // state it reaches is the same one the shrink would have reached.
    if (element === null || target === null || shrink.duration === 0) {
      finish()
      return
    }

    timeline.current = gsap
      .timeline({ onComplete: finish })
      .to(element, { ...shrink, ...travelTween(element, target), opacity: 0 })
  }, [compact, elements, homeTarget, instance.key, instance.windowId, instances, minimise])

  const requestZoom = useCallback(() => {
    zoom(instance.key)
  }, [instance.key, zoom])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      // Escape belongs to the window, so a focused window closes without the visitor reaching
      // for the red light. Spec 0004, AC-5.
      if (event.key === 'Escape') {
        requestClose()
        return
      }

      frameProps.onKeyDown?.(event)
    },
    [frameProps, requestClose],
  )

  /*
   * A window coming back from the dock, or a parked one coming back from a tile, is drawn at its
   * own spot again, so the movement is played the other way: from the target it left from,
   * growing back into place.
   */
  useEffect(() => {
    const before = previousStatus.current

    previousStatus.current = instance.status

    if (before !== 'minimised' || instance.status !== 'normal') {
      return
    }

    const element = frame.current
    const target = compact ? homeTarget() : elements.dockButtonFor(instance.windowId)
    const grow = motion('slow')

    if (element === null) {
      return
    }

    // Whatever asked for it holds the keyboard when it lands, so a window comes back with the
    // focus it left with.
    element.focus()

    if (target === null || grow.duration === 0) {
      gsap.set(element, { clearProps: 'transform,opacity' })
      return
    }

    gsap.fromTo(
      element,
      { ...travelTween(element, target), opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, ...grow },
    )
  }, [compact, elements, homeTarget, instance.status, instance.windowId])

  /*
   * A window that opens on a phone grows out of the tile that opened it. It runs once per frame, and
   * only for a frame that opened on a phone: a window the desktop already had, reshaped by a resize
   * into the compact layout, is put at its new box rather than made to arrive from somewhere. The
   * guard is set before the movement starts and is never cleared, so neither the store's double
   * invoke in development nor a later move of the same window replays it.
   */
  useEffect(() => {
    const element = frame.current

    if (!compact || !openedCompact.current || entered.current || element === null) {
      return
    }

    entered.current = true

    const tile = homeTarget()

    if (tile === null) {
      return
    }

    gsap.fromTo(
      element,
      { ...travelTween(element, tile), opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, ...motion('base') },
    )
  }, [compact, homeTarget])

  /*
   * On a phone the window that opens takes the keyboard, since the tile that opened it is not a
   * place to leave a visitor: there is no dock and no bar to hand focus back to, and the next press
   * should land inside the screen that now covers the phone. Above the breakpoint nothing moves, so
   * the desktop's own handoff is exactly what it was.
   */
  useEffect(() => {
    if (!compact || !isFocused) {
      return
    }

    frame.current?.focus()
  }, [compact, instance.key, isFocused])

  const canMinimise = compact ? hasHomeTile(instance.windowId) : hasDockButton(instance.windowId)

  return {
    frameProps: { ...frameProps, onKeyDown: handleKeyDown },
    frameRef,
    isMinimised: instance.status === 'minimised',
    onClose: requestClose,
    // A window offers Minimise when the surface it came from has a way back to it: the dock's six
    // buttons above the breakpoint, the home surface's seven tiles below it. Resume has a tile and
    // no dock button, so it offers Minimise on a phone and not on the desktop.
    onMinimise: canMinimise ? requestMinimise : undefined,
    // A phone's window already fills the work area, so the green light has nothing left to fill: it
    // renders disabled rather than offering an action with no effect.
    onZoom: compact ? undefined : requestZoom,
  }
}
