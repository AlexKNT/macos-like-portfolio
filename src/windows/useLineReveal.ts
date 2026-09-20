import gsap from 'gsap'
import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

import { readEaseToken, readMotionToken } from '#lib/motion'

/**
 * Prints the lines inside a container: every element marked `data-line` is masked and then
 * uncovered in document order, so a window can print its content without ever typing it in. The
 * text is in the page from the first paint, which is what keeps a screen reader, a selection and
 * a test reading the finished thing while it is still being uncovered.
 *
 * The timing comes from the token layer, so reduced motion needs no second path: under
 * `prefers-reduced-motion: reduce` every duration reads 0 and the hook does nothing at all, which
 * leaves the lines open rather than reaching the end of an animation that never started. The mask
 * is cleared when the timeline ends and on unmount, so nothing is ever left clipped.
 * Spec 0006, AC-5.
 */
export function useLineReveal(container: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const root = container.current
    const duration = readMotionToken('base')

    if (root === null || duration === 0) {
      return
    }

    const lines = gsap.utils.toArray<HTMLElement>('[data-line]', root)

    if (lines.length === 0) {
      return
    }

    const context = gsap.context(() => {
      gsap.set(lines, { clipPath: 'inset(0 100% 0 0)' })
      gsap.to(lines, {
        clipPath: 'inset(0 0% 0 0)',
        duration: duration / 1000,
        ease: readEaseToken('out'),
        stagger: readMotionToken('stagger') / 1000,
        onComplete: () => {
          // The mask is removed rather than left at its end value, so no line keeps a clip that
          // could cut a focus ring or a text selection.
          gsap.set(lines, { clearProps: 'clipPath' })
        },
      })
    }, root)

    return () => {
      context.revert()
    }
  }, [container])
}
