import { useEffect, useState } from 'react'
import { navIcons, navLinks } from '#constants'

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
 * The links are keyboard reachable but open nothing yet, the window manager wires them later.
 */
export function Navbar() {
  const now = useCurrentMinute()

  return (
    <nav aria-label="Desktop menu bar">
      <div>
        <img src="/images/logo.svg" alt="" />
        <ul>
          {navLinks.map(({ id, name }) => (
            <li key={id}>
              <button type="button">{name}</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {navIcons.map(({ id, img }) => (
          <img key={id} src={img} alt="" />
        ))}
        <time dateTime={now.toISOString()}>{CLOCK_FORMAT.format(now)}</time>
      </div>
    </nav>
  )
}
