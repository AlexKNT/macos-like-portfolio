import { useCallback, useRef } from 'react'

import { DESKTOP_ITEMS } from '#content/desktop'
import { DesktopIcon } from '#components/DesktopIcon'
import { Greeting } from '#components/Greeting'
import { HOME_SURFACE } from '#components/homeLines'
import { HomeSurface } from '#components/HomeSurface'
import { WindowLayer } from '#components/WindowLayer'
import { useWindowElements } from '#store/useWindowElements'
import { useWindowManager } from '#store/useWindowManager'
import { useWorkArea } from '#store/useWorkArea'

/**
 * The desktop surface: the one container between the bar and the dock band, holding the greeting,
 * the desktop items and the layer every open window sits on. It is the one box a window is placed
 * inside, which is why it measures itself and hands that box to the window manager rather than
 * letting any window measure the viewport.
 *
 * It is the same container on both sides of the compact breakpoint, so the work area keeps one
 * owner however the page is shaped; only the chrome inside it swaps. Above the breakpoint that is
 * the greeting and the desktop items, and on a phone it is the home surface, which stands where
 * they stood. The greeting is not rendered there at all rather than hidden. The container itself
 * is named by the shell it holds: the home surface's own word on a phone, `Desktop` everywhere
 * else, so assistive tech never announces a desktop that is not on the screen.
 *
 * It isolates its own stacking so no window can paint over the menu bar above it or the dock band
 * below it however high a window's stacking number climbs. It keeps no window state of its own: the
 * window layer reads the manager.
 *
 * It is also the floor of the focus handoff: it registers itself as the desktop, and it is
 * focusable without being tabbable, so the keyboard lands here when the last window closes, which
 * on a phone is the surface a visiting thumb returns to. Spec 0003, AC-1, AC-10, AC-11; spec 0004,
 * AC-8, AC-9; spec 0009, AC-1, AC-8, AC-13.
 */
export function Desktop() {
  const containerRef = useRef<HTMLElement | null>(null)
  const { registerDesktop } = useWindowElements()
  const { compact } = useWindowManager()

  useWorkArea(containerRef)

  const attach = useCallback(
    (element: HTMLElement | null) => {
      containerRef.current = element
      registerDesktop(element)
    },
    [registerDesktop],
  )

  return (
    <section
      ref={attach}
      aria-label={compact ? HOME_SURFACE : 'Desktop'}
      tabIndex={-1}
      className="relative isolate min-h-0 flex-1 overflow-hidden"
    >
      {compact ? (
        <HomeSurface />
      ) : (
        <>
          <Greeting />
          <ul aria-label="Desktop items" className="absolute inset-0">
            {DESKTOP_ITEMS.map((item) => (
              <li key={item.id} className={`absolute ${item.position}`}>
                <DesktopIcon item={item} />
              </li>
            ))}
          </ul>
        </>
      )}
      <WindowLayer />
    </section>
  )
}
