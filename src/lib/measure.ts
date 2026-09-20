/** The measures script reads off the document element, as the stylesheet names them. */
export type MeasureToken =
  'dock-magnify-scale' | 'window-cascade-step' | 'window-nudge-step' | 'window-nudge-step-large'

/** The computed value of one custom property on the document element, trimmed. */
function readToken(name: string): string {
  if (typeof document === 'undefined') {
    return ''
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Reads a measure token as a number, the same way `readMotionToken` reads a duration. It is
 * for the one measure the dock magnify has to compute with rather than let CSS apply on its
 * own, so the value still comes from the token layer instead of a literal in a component.
 * A missing token gives 0, and the caller decides what that means. Spec 0003, AC-7.
 */
export function readMeasureToken(name: MeasureToken): number {
  const value = Number.parseFloat(readToken(`--${name}`))

  return Number.isFinite(value) ? value : 0
}
