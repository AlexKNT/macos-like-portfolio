import { useEffect } from 'react'
import type { RefObject } from 'react'

import { useWindowManager } from '#store/useWindowManager'

/**
 * Watches the element that defines the work area and reports its content box to the manager:
 * once on the first measurement, then on every change, which is a viewport resize, a rotation,
 * or the dock band leaving at the compact breakpoint.
 *
 * A measurement of zero is passed on and dropped inside the reducer, so a container that is
 * briefly unmeasured changes nothing. The observer is disconnected on unmount, so the store's
 * development double invoke never leaves two of them behind. Spec 0004, AC-9.
 */
export function useWorkArea(elementRef: RefObject<HTMLElement | null>): void {
  const { setWorkArea } = useWindowManager()

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
}
