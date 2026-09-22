import gsap from 'gsap'
import { useEffect } from 'react'
import type { RefObject } from 'react'

import { readEaseToken, readMotionToken } from '#lib/motion'
import type { ArchiveState } from '#windows/archive/archiveState'

/**
 * How far the block shrinks where it stands as it leaves. It is the same shape the frame's own
 * exit uses, which is what makes a departure read as a departure rather than a disappearance.
 */
const CLEAR_SHRINK = 0.96

/**
 * The one movement the Archive makes: the block holding its count and its leftovers fades and
 * shrinks where it stands, and tells the window when it has gone.
 *
 * The timing comes from the token layer, so reduced motion needs no second path: when the duration
 * reads zero no timeline is started at all and the window lands at once, rather than waiting on a
 * movement that would never run. The tween is created inside a GSAP context that this hook's own
 * cleanup reverts, so a window closed mid gesture and an effect that runs twice in development
 * both leave nothing running and nothing half applied.
 *
 * The landing is only ever a state transition, and the machine's own guard is what makes it safe
 * to call twice, so this hook may call it and forget it. Spec 0012, AC-5, AC-9, AC-10.
 */
export function useEmptyMovement(
  state: ArchiveState,
  block: RefObject<HTMLElement | null>,
  landed: () => void,
): void {
  useEffect(() => {
    if (state !== 'clearing') {
      return
    }

    const element = block.current

    // With nothing to move there is nothing to wait for, so the window lands now rather than
    // sitting in a state it can only leave through a movement that cannot run.
    if (element === null) {
      landed()
      return
    }

    const duration = readMotionToken('fast')
    const context = gsap.context(() => {
      if (duration === 0) {
        return
      }

      gsap.to(element, {
        opacity: 0,
        scale: CLEAR_SHRINK,
        duration: duration / 1000,
        ease: readEaseToken('out'),
        onComplete: () => {
          landed()
        },
      })
    }, element)

    if (duration === 0) {
      landed()
    }

    return () => {
      context.revert()
    }
  }, [state, block, landed])
}
