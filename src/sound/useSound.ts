import { createContext, useContext } from 'react'

import type { SoundId } from '#content/types'

/** What a control reads from the sound provider, and the two things it can ask it to do. */
export type SoundControl = {
  /** Whether the desk is silenced. The one source the switch and the player both read. */
  readonly muted: boolean
  /** Silences the desk or brings it back, and remembers the choice for the next visit. */
  readonly toggleMuted: () => void
  /** Asks for one sound, which the provider plays unless the desk is silenced. */
  readonly play: (id: SoundId) => void
}

/** Holds the sound control for the tree below `SoundProvider`, or null outside one. */
export const SoundContext = createContext<SoundControl | null>(null)

/**
 * Reads the desk's sound state. Called by the switch in both bars and by a dock button's hover,
 * so no control keeps a copy of the choice of its own.
 *
 * It throws when there is no provider above, because that is a wiring mistake rather than a
 * state the shell should paper over, the way `useWindowManager` already answers. Spec 0013, AC-8.
 */
export function useSound(): SoundControl {
  const control = useContext(SoundContext)

  if (control === null) {
    throw new Error('useSound needs a SoundProvider above it')
  }

  return control
}
