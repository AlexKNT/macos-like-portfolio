import { useEffect, useState } from 'react'

/** The one place the time is formatted, so both bars read the same clock the same way. */
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
 * The live time, in one place: the desktop's menu bar and the phone's slim bar both read this, so
 * the app has one clock and one format rather than two that drift apart.
 *
 * It is a `<time>` carrying the machine readable instant, so the moment is announced as a time
 * rather than as a string of digits, and it wakes on the minute boundary rather than on a tick.
 * Spec 0003, AC-4; spec 0009, AC-1.
 */
export function Clock() {
  const now = useCurrentMinute()

  return (
    <time dateTime={now.toISOString()} className="text-text text-sm font-medium">
      {CLOCK_FORMAT.format(now)}
    </time>
  )
}
