import { createContext, useContext } from 'react'

import type { Place } from '#content/types'

/** What the projects window reads from its own history: the place showing, and the way back. */
export type ProjectHistory = {
  readonly place: Place
  readonly name: string
  readonly canGoBack: boolean
  /** The accessible name of the Back control, or `null` while there is nowhere to go back to. */
  readonly backLabel: string | null
  readonly back: () => void
}

/** Holds the projects window's history for the frame below its scope, or null outside one. */
export const ProjectHistoryContext = createContext<ProjectHistory | null>(null)

/**
 * Reads the projects window's history for the control in its title bar and for its body.
 *
 * It throws when there is no scope above, because that is a wiring mistake rather than a state
 * the window should paper over, exactly as `useWindowManager` does for the desktop.
 * Spec 0005, AC-5.
 */
export function useProjectHistory(): ProjectHistory {
  const history = useContext(ProjectHistoryContext)

  if (history === null) {
    throw new Error('useProjectHistory needs a ProjectHistoryScope above it')
  }

  return history
}
