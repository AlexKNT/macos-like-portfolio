import { useEffect, useState } from 'react'

import { MenuBarIcon } from '#components/MenuBarIcon'
import { NAV_ICONS, NAV_LINKS } from '#content/shell'
import { useWindowManager } from '#store/useWindowManager'

const CLOCK_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

/** Milliseconds left in the current minute, so the clock can wake on the boundary. */
function msUntilNextMinute(from: Date): number {
  return 60_000 - (from.getSeconds() * 1_000 + from.getMilliseconds())
}

/**
 * Tracks the current moment, re-rendering once the clock minute rolls over.
 * Returns the latest moment for the caller to format.
 */
function useCurrentMinute(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timerId = 0

    const scheduleNext = (from: Date) => {
      timerId = window.setTimeout(() => {
        const next = new Date()
        setNow(next)
        scheduleNext(next)
      }, msUntilNextMinute(from))
    }

    scheduleNext(new Date())

    return () => window.clearTimeout(timerId)
  }, [])

  return now
}

/**
 * The menu bar across the top of the desktop: the logo and the window links on the left,
 * the status icons and the live clock on the right.
 *
 * Every control here does what its content entry says, through the window manager's one open
 * action, so a link opens its window and a second press on the same link focuses the window
 * that is already open rather than opening another. Every surface it paints comes from a
 * semantic token, so it follows the mode without a rule of its own, and the pointer states
 * come from the shared interaction utilities. Spec 0002, AC-7. Spec 0003, AC-4.
 */
export function Navbar() {
  const now = useCurrentMinute()
  const { open } = useWindowManager()

  return (
    <nav
      aria-label="Desktop menu bar"
      className="glass-chrome text-text flex items-center justify-between gap-5 px-5 py-1.5 select-none max-sm:min-h-touch max-sm:px-4"
    >
      <div className="flex items-center gap-5">
        <span aria-hidden="true" className="menu-logo bg-text block h-[17px] w-[14px]" />
        <ul className="flex items-center gap-1 max-sm:hidden">
          {NAV_LINKS.map(({ id, label, windowId }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => open({ kind: 'window', windowId }, { kind: 'bar' })}
                className="rounded-control px-2 py-1 text-sm cursor-pointer interactive-hover interactive-active focus-visible:interactive-focus max-sm:min-h-touch max-sm:px-3"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-4 max-sm:hidden">
        {NAV_ICONS.map((icon) => (
          <MenuBarIcon key={icon.id} icon={icon} onOpen={open} />
        ))}
        <time dateTime={now.toISOString()} className="text-sm font-medium text-text">
          {CLOCK_FORMAT.format(now)}
        </time>
      </div>
    </nav>
  )
}
