import { createContext, useContext } from 'react'

import type { TreeEntry } from '#content/reads'
import type { ArchiveState } from '#windows/archive/archiveState'

/** What the Archive window reads from its own state, and the two things it can ask it to do. */
export type ArchiveView = {
  /** Where the gesture stands. */
  readonly state: ArchiveState
  /** The leftovers the Trash place holds, in the order the content layer lists them. */
  readonly items: readonly TreeEntry[]
  /** Whether the Empty control has anything to answer. */
  readonly canEmpty: boolean
  /** Starts the gesture. A press while there is nothing to answer changes nothing. */
  readonly requestEmpty: () => void
  /** Told by the movement when the block has gone, and safe to land more than once. */
  readonly landed: () => void
}

/** Holds the window's own value for the frame below its scope, or null outside one. */
export const ArchiveStateContext = createContext<ArchiveView | null>(null)

/**
 * Reads the Archive window's own state for its body and for the control in its title bar.
 *
 * It throws when there is no scope above, because that is a wiring mistake rather than a state the
 * window should paper over, exactly as `useProjectHistory` does for the Finder and
 * `useWindowManager` does for the desktop. Spec 0012, AC-7.
 */
export function useArchiveState(): ArchiveView {
  const view = useContext(ArchiveStateContext)

  if (view === null) {
    throw new Error('useArchiveState needs an ArchiveScope above it')
  }

  return view
}
