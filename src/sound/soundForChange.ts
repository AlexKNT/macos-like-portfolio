import type { SoundId } from '#content/types'
import type { WindowManagerState } from '#store/windowManager'

/*
 * The one rule that decides what the desk sounds like: two window manager states in, the sound
 * the change deserves or nothing out. Pure, so it holds no DOM and no audio and is tested with
 * no browser.
 *
 * It reads the manager's own state rather than anything a component reports, which is what makes
 * every way into a window covered: a dock press, a menu bar link, a desktop icon, a phone tile,
 * one of the three lights, Escape and the phone's back press all end in the same reducer, so all
 * of them arrive here without an entry point being touched. Spec 0013, AC-4, AC-5, AC-7.
 */

/** The keys the manager is holding in one state. */
function keysOf(state: WindowManagerState): readonly string[] {
  return state.instances.map((instance) => instance.key)
}

/**
 * The sound a change between two manager states deserves, or `undefined` for a change that is
 * not a window arriving, a window leaving or a window being put away.
 *
 * The order of precedence is fixed, and it is what the phone needs: opening a second window
 * there closes the first under the one window rule, and one press is one sound, so the arrival
 * is answered before the departure. Everything else is silent by construction rather than by a
 * list of exceptions: focusing a window only moves its stacking number, restoring one only
 * changes its status back, and a state handed back untouched holds the same keys in the same
 * statuses. A compact layout that hides a window rather than closing it changes no instance at
 * all. Spec 0013, AC-4, AC-5, AC-7.
 */
export function soundForChange(
  previous: WindowManagerState,
  next: WindowManagerState,
): SoundId | undefined {
  const before = keysOf(previous)
  const after = keysOf(next)

  if (after.some((key) => !before.includes(key))) {
    return 'open'
  }

  if (before.some((key) => !after.includes(key))) {
    return 'close'
  }

  const putAway = next.instances.some(
    (instance) =>
      instance.status === 'minimised' &&
      previous.instances.some((was) => was.key === instance.key && was.status !== 'minimised'),
  )

  return putAway ? 'minimise' : undefined
}
