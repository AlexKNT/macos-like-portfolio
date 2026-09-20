/** The durations the desktop animates with, as the stylesheet names them. */
export type MotionToken = 'fast' | 'base' | 'slow' | 'stagger'

/** The easings the desktop animates with, as the stylesheet names them. */
export type EaseToken = 'out' | 'in-out'

/** Used when a caller asks for an easing the stylesheet does not declare. */
const FALLBACK_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** The computed value of one custom property on the document element, trimmed. */
function readToken(name: string): string {
  if (typeof document === 'undefined') {
    return ''
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Reads a duration token in milliseconds, the only way a timeline gets its timing.
 * The value is read off the document element, so it inherits the reduced motion answer
 * rather than the media query being checked a second time here: under
 * `prefers-reduced-motion: reduce` every duration resolves to 0. A missing token also
 * gives 0, since no motion is the safe reading of nothing. Spec 0002, AC-9.
 */
export function readMotionToken(name: MotionToken): number {
  const milliseconds = Number.parseFloat(readToken(`--duration-${name}`))

  return Number.isFinite(milliseconds) ? milliseconds : 0
}

/**
 * Reads an easing token, the string a timeline passes to GSAP. A missing token gives
 * the standard ease out, so a caller always gets something usable. Spec 0002, AC-9.
 */
export function readEaseToken(name: EaseToken): string {
  return readToken(`--ease-${name}`) || FALLBACK_EASE
}
