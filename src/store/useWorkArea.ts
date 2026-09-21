import { useEffect } from 'react'
import type { RefObject } from 'react'

import { useWindowManager } from '#store/useWindowManager'

/**
 * The breakpoint below which the desktop is compact: Tailwind's `sm`, written as the stylesheet
 * writes it, so the dock band leaving, the home surface arriving and the focused window filling
 * the work area are one moment rather than three. It is the only width any module compares, which
 * is why it is exported rather than repeated. Spec 0009, AC-1.
 */
export const COMPACT_QUERY = '(width < 40rem)'

/**
 * Whether the page is below the compact breakpoint right now. It asks the browser one question and
 * answers it, with no state and no subscription, so the manager can be created already knowing
 * which shell to render: a phone's first render is the phone shell rather than a frame of the
 * desktop's own chrome. The observer below reports every change after that. An environment with no
 * media query at all, which is what a test runner with no stylesheet looks like, is the wide
 * layout. Spec 0009, AC-1.
 */
export function readCompactLayout(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(COMPACT_QUERY).matches
}

/**
 * Watches the element that defines the work area and reports its content box to the manager:
 * once on the first measurement, then on every change, which is a viewport resize, a rotation,
 * or the dock band leaving at the compact breakpoint.
 *
 * It also reports whether the desktop is below the compact breakpoint, since that is the other
 * half of the same box: below it the dock is not shown, no window is dragged, and the focused
 * window fills the work area. An environment with no media query support at all, which is what
 * a test runner with no stylesheet looks like, simply stays in the wide layout.
 *
 * A measurement of zero is passed on and dropped inside the reducer, so a container that is
 * briefly unmeasured changes nothing. Both observers are disconnected on unmount, so the store's
 * development double invoke never leaves two of them behind. Spec 0004, AC-9, AC-10.
 */
export function useWorkArea(elementRef: RefObject<HTMLElement | null>): void {
  const { setWorkArea, setCompact } = useWindowManager()

  useEffect(() => {
    const element = elementRef.current

    if (element === null) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect

        if (width > 0 && height > 0) {
          setWorkArea({ width, height })
        }
      })
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, setWorkArea])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const query = window.matchMedia(COMPACT_QUERY)
    const report = () => setCompact(query.matches)

    report()
    query.addEventListener('change', report)

    return () => {
      query.removeEventListener('change', report)
    }
  }, [setCompact])
}
