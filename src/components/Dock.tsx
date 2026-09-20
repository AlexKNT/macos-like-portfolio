import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'

import { DockButton } from '#components/DockButton'
import { DOCK_APPS } from '#content/shell'
import { readMeasureToken } from '#lib/measure'
import { readEaseToken, readMotionToken } from '#lib/motion'
import { useWindowManager } from '#store/useWindowManager'

/**
 * How far the magnify reaches on each side of the pointer, counted in icons. The icon under
 * the pointer reaches the largest scale, the two neighbours on each side fall away from it in
 * a straight line, and everything past them rests at its own size. Spec 0003, AC-7.
 */
const MAGNIFY_REACH = 2

/** The icon elements of a panel, in the order the dock renders them. */
function iconElements(panel: HTMLElement): readonly HTMLImageElement[] {
  return [...panel.querySelectorAll<HTMLImageElement>('button > img')]
}

/** The middle of an element across the screen, which is the only axis the magnify reads. */
function centreOf(element: HTMLImageElement): number {
  const box = element.getBoundingClientRect()

  return box.left + box.width / 2
}

/**
 * The dock: a labelled region in the band at the bottom of the desktop, holding the six dock
 * apps as buttons. Each one opens its window through the window manager's one open action, so
 * clicking an app that is already open focuses it instead of opening it twice, and each one
 * shows a dot while its window is open.
 *
 * The magnify is the pointer's business and nothing else's: the handler writes scales straight
 * onto the image elements, so no window state changes and the desktop never re-renders while
 * the pointer moves. The reach, the falloff and the largest scale come from the token layer
 * rather than from numbers written here, and reduced motion, which resolves every duration to
 * zero, is the same signal as "do not magnify at all".
 *
 * Below the compact breakpoint the panel is not shown, and the desktop icons are the way in.
 * Spec 0003, AC-6, AC-7, AC-9, AC-10.
 */
export function Dock() {
  const { instances, open, restore } = useWindowManager()
  const panelRef = useRef<HTMLUListElement | null>(null)
  const centres = useRef<readonly number[]>([])
  const pitch = useRef(0)
  const scaleMax = useRef(1)
  const setters = useRef<readonly ((scale: number) => void)[]>([])

  useEffect(() => {
    const panel = panelRef.current

    if (panel === null) {
      return
    }

    const icons = iconElements(panel)
    const duration = readMotionToken('fast') / 1000
    const largest = readMeasureToken('dock-magnify-scale')

    // Reduced motion resolves every duration to zero, and a missing scale token reads as 0.
    // Either way the dock does not magnify, rather than magnifying with no movement.
    if (duration === 0 || largest <= 1) {
      return
    }

    const ease = readEaseToken('out')

    scaleMax.current = largest
    setters.current = icons.map((icon) => {
      gsap.set(icon, { transformOrigin: 'bottom center' })

      // `scale` is a shorthand, and a quick setter cannot drive one: GSAP warns and leaves the
      // element alone, so the two axes are set separately and wrapped back into one call.
      const scaleX = gsap.quickTo(icon, 'scaleX', { duration, ease })
      const scaleY = gsap.quickTo(icon, 'scaleY', { duration, ease })

      return (scale: number) => {
        scaleX(scale)
        scaleY(scale)
      }
    })

    return () => {
      setters.current = []
      icons.forEach((icon) => gsap.set(icon, { scale: 1 }))
    }
  }, [])

  const resetMagnify = useCallback(() => {
    setters.current.forEach((setScale) => setScale(1))
  }, [])

  const handlePointerEnter = useCallback(() => {
    const panel = panelRef.current

    if (panel === null) {
      return
    }

    const measured = iconElements(panel).map(centreOf)
    const first = measured[0] ?? 0

    centres.current = measured
    pitch.current = Math.abs((measured[1] ?? first) - first)
  }, [])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLUListElement>) => {
    const scale = setters.current
    const step = pitch.current

    if (scale.length === 0 || step === 0) {
      return
    }

    const pointerX = event.clientX
    const largest = scaleMax.current

    scale.forEach((setScale, index) => {
      const distance = Math.abs((centres.current[index] ?? pointerX) - pointerX) / step
      const toward = gsap.utils.mapRange(0, MAGNIFY_REACH, largest, 1, distance)

      setScale(gsap.utils.clamp(1, largest, toward))
    })
  }, [])

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLUListElement>) => {
      if (
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return
      }

      resetMagnify()
    },
    [resetMagnify],
  )

  return (
    <section
      aria-label="Dock"
      className="relative z-10 flex min-h-[var(--dock-clearance)] shrink-0 items-end justify-center select-none max-sm:hidden"
    >
      <ul
        ref={panelRef}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetMagnify}
        onBlur={handleBlur}
        className="glass-panel rounded-dock shadow-control mb-5 flex items-end gap-2 p-1.5"
      >
        {DOCK_APPS.map((app) => {
          const matching = instances.filter((instance) => instance.windowId === app.windowId)
          const waiting = matching.find((instance) => instance.status === 'minimised')

          return (
            <DockButton
              key={app.id}
              app={app}
              isOpen={matching.length > 0}
              isMinimised={waiting !== undefined}
              onActivate={() => {
                // A window waiting in the dock comes back to where it left; one that is
                // already on the desk is focused rather than opened a second time.
                if (waiting !== undefined) {
                  restore(waiting.key)
                  return
                }

                open({ kind: 'window', windowId: app.windowId }, { kind: 'dock' })
              }}
            />
          )
        })}
      </ul>
    </section>
  )
}
