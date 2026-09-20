import { DESKTOP_ITEMS } from '#content/desktop'
import { DesktopIcon } from '#components/DesktopIcon'
import { Greeting } from '#components/Greeting'
import { WindowLayer } from '#components/WindowLayer'

/**
 * The desktop itself: the one container between the menu bar and the dock band, holding the
 * greeting, the desktop items and the layer every open window sits on.
 *
 * It is where the work area is defined, since it is the only box a window is placed inside,
 * and it isolates its own stacking so no window can paint over the menu bar above it or the
 * dock band below it however high a window's stacking number climbs. It keeps no window
 * state of its own: the window layer reads the manager. Spec 0003, AC-1, AC-10, AC-11.
 */
export function Desktop() {
  return (
    <section aria-label="Desktop" className="relative isolate min-h-0 flex-1 overflow-hidden">
      <Greeting />
      <ul aria-label="Desktop items" className="absolute inset-0">
        {DESKTOP_ITEMS.map((item) => (
          <li key={item.id} className={`absolute ${item.position}`}>
            <DesktopIcon item={item} />
          </li>
        ))}
      </ul>
      <WindowLayer />
    </section>
  )
}
