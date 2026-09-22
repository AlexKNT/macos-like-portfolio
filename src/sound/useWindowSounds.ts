import { useEffect, useRef } from 'react'

import { soundForChange } from '#sound/soundForChange'
import { useWindowManager } from '#store/useWindowManager'
import type { SoundId } from '#content/types'
import type { WindowManagerState } from '#store/windowManager'

/*
 * The one place a change of the window manager turns into a sound.
 *
 * It sits beside the manager rather than in any entry point, so a window that opens from a
 * dock press, a menu bar link, a desktop icon, a phone tile, one of the three lights, Escape or
 * a phone's back press all arrive through the same reducer and all sound correctly without the
 * control that asked being touched. Spec 0013, AC-4, AC-6, AC-7.
 */

/** Asks for one sound, the way the provider's own control does. */
type SoundRequest = (id: SoundId) => void

/**
 * Plays the sound each change of the manager deserves, by asking the pure rule about the state
 * before this render and the state after it.
 *
 * The very first render seeds the state it remembers and sounds nothing, which is also what
 * makes React's development double invoke silent: the second pass compares the state it already
 * holds against itself. A change that is not an arrival, a departure or a window going down to
 * the dock is handed back with no sound at all. Spec 0013, AC-4, AC-5, AC-13.
 */
export function useWindowSounds(request: SoundRequest): void {
  const { instances, workArea, compact } = useWindowManager()
  const previous = useRef<WindowManagerState | null>(null)

  useEffect(() => {
    const next: WindowManagerState = { instances, workArea, compact }
    const before = previous.current

    previous.current = next

    if (before === null) {
      return
    }

    const sound = soundForChange(before, next)

    if (sound !== undefined) {
      request(sound)
    }
  }, [request, instances, workArea, compact])
}
