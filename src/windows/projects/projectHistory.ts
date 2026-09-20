import type { Place } from '#content/types'

/*
 * The projects window's own view state: the places a visitor has read, so the Back control is
 * one press. It lives in the window rather than in the manager, because the manager's model is
 * about what is open and where it sits.
 *
 * The place showing is not stored a second time: it is the instance's target, and the stack's
 * top entry always equals it. Every function here is pure. Spec 0005, AC-5.
 */

/**
 * The place a bare Projects open lands on, and the place the stack is seeded with on the first
 * render. It is deliberately the same two values `resolveOpenTarget` answers a bare `window`
 * target for Projects with, and a test pins the two together so they cannot drift apart.
 */
export const DEFAULT_PLACE: Place = { kind: 'location', locationId: 'work' }

/** Whether two places are the same one, which is the same kind naming the same entry. */
function samePlace(left: Place, right: Place): boolean {
  if (left.kind === 'location') {
    return right.kind === 'location' && right.locationId === left.locationId
  }

  return right.kind === 'project' && right.projectId === left.projectId
}

/**
 * The history with a place pushed onto it. Pushing the place already on top changes nothing,
 * which is what stops Back from writing a target that would push a second time. Pure.
 */
export function pushPlace(history: readonly Place[], place: Place): readonly Place[] {
  const top = placeOnTop(history)

  return top !== null && samePlace(top, place) ? history : [...history, place]
}

/**
 * The history with its last step taken off. Popping a stack of one entry returns it as it is,
 * because there is nothing behind it to go back to. Pure.
 */
export function popPlace(history: readonly Place[]): readonly Place[] {
  return history.length <= 1 ? history : history.slice(0, -1)
}

/** The place on top of a history, which is the place showing, or `null` for an empty one. Pure. */
export function placeOnTop(history: readonly Place[]): Place | null {
  return history[history.length - 1] ?? null
}
