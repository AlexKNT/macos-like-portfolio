import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { KeyboardEvent } from 'react'

import { useWindowMove } from '#components/useWindowMove'
import { applyFocusHop } from '#components/windowFocus'
import { readMeasureToken } from '#lib/measure'
import { readEaseToken, readMotionToken } from '#lib/motion'
import { focusHopAfter, hasDockButton } from '#store/windowManager'
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
  readonly onZoom: () => void
}

/** The timing every movement on a frame shares: the token duration and the token easing. */
function motion(token: MotionToken): gsap.TweenVars {
  return { duration: readMotionToken(token) / 1000, ease: readEaseToken('out') }
}

/** Where a frame travels for its middle to reach a dock button, shrunk to the icon's scale. */
function dockTween(frame: HTMLElement, button: HTMLElement): gsap.TweenVars {
  const box = frame.getBoundingClientRect()
  const target = button.getBoundingClientRect()
  const shrink = readMeasureToken('window-dock-shrink')

  return {
    x: target.left + target.width / 2 - (box.left + box.width / 2),
    y: target.top + target.height / 2 - (box.top + box.height / 2),
    scale: shrink > 0 ? shrink : 1,
  }
}

/**
 * One window's own behaviour: the exit timeline, the shrink toward the dock and the movement
 * back from it, each played on the frame and each finishing in the manager's action. The
 * keyboard ends up somewhere reachable every time, whether the window closed, was put away, or
 * came back.
 *
 * Reduced motion needs no second path here: the durations come from the tokens, and when they
 * read zero the end state is reached at once rather than through a timeline that never moves.
 * The movement in flight is killed on unmount, so nothing runs on after the frame is gone.
 * Spec 0004, AC-6, AC-7, AC-8, AC-9, AC-10.
 */
export function useWindowFrame({ instance, position, size }: WindowFrameInput): WindowFrame {
  const { instances, workArea, compact, move, focus, close, minimise, zoom } = useWindowManager()
  const elements = useWindowElements()
  const frame = useRef<HTMLElement | null>(null)
  const leaving = useRef(false)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const previousStatus = useRef(instance.status)

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
      applyFocusHop(focusHopAfter(instances, instance.key), elements)
    }

    if (element === null || exit.duration === 0) {
      finish()
      return
    }

    timeline.current = gsap
      .timeline({ onComplete: finish })
      .to(element, { ...exit, scale: EXIT_SCALE, opacity: 0 })
  }, [close, commitDrag, elements, instance.key, instances])

  const requestMinimise = useCallback(() => {
    if (leaving.current) {
      return
    }

    const element = frame.current
    const button = elements.dockButtonFor(instance.windowId)
    const shrink = motion('slow')
    const finish = () => {
      minimise(instance.key)
      applyFocusHop(focusHopAfter(instances, instance.key), elements)
    }

    // With motion reduced, or a dock button that is not on screen, the window is simply put
    // away: the state it reaches is the same one the shrink would have reached.
    if (element === null || button === null || shrink.duration === 0) {
      finish()
      return
    }

    timeline.current = gsap
      .timeline({ onComplete: finish })
      .to(element, { ...shrink, ...dockTween(element, button), opacity: 0 })
  }, [elements, instance.key, instance.windowId, instances, minimise])

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
   * A window coming back from the dock is drawn at its own spot again, so the movement is
   * played the other way: from the dock button it left from, growing back into place.
   */
  useEffect(() => {
    const before = previousStatus.current

    previousStatus.current = instance.status

    if (before !== 'minimised' || instance.status !== 'normal') {
      return
    }

    const element = frame.current
    const button = elements.dockButtonFor(instance.windowId)
    const grow = motion('slow')

    if (element === null) {
      return
    }

    // The dock button is what asked for it, so the window comes back holding the keyboard.
    element.focus()

    if (button === null || grow.duration === 0) {
      gsap.set(element, { clearProps: 'transform,opacity' })
      return
    }

    gsap.fromTo(
      element,
      { ...dockTween(element, button), opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, ...grow },
    )
  }, [elements, instance.status, instance.windowId])

  return {
    frameProps: { ...frameProps, onKeyDown: handleKeyDown },
    frameRef,
    isMinimised: instance.status === 'minimised',
    onClose: requestClose,
    // A window with no dock button offers no minimise, because there would be no way back to
    // it. Its yellow light renders disabled rather than doing nothing.
    onMinimise: hasDockButton(instance.windowId) ? requestMinimise : undefined,
    onZoom: requestZoom,
  }
}
