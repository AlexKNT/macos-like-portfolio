import { createContext, useContext } from 'react'

import type { WindowInstance, WindowKey, WindowOpener, WorkArea } from '#store/windowManager'
import type { OpenTarget } from '#content/types'
import type { WindowPosition, WindowSize } from '#store/windowManager'

/** What the shell reads from the manager, and the actions it can call. */
export type WindowManager = {
  readonly instances: readonly WindowInstance[]
  readonly focusedKey: WindowKey | null
  readonly workArea: WorkArea
  /** Whether the desktop is below the compact breakpoint, where the focused window fills it. */
  readonly compact: boolean
  readonly open: (target: OpenTarget, opener: WindowOpener) => void
  readonly focus: (key: WindowKey) => void
  readonly close: (key: WindowKey) => void
  readonly move: (key: WindowKey, position: WindowPosition) => void
  readonly minimise: (key: WindowKey) => void
  readonly restore: (key: WindowKey) => void
  readonly zoom: (key: WindowKey) => void
  readonly setWorkArea: (size: WindowSize) => void
  readonly setCompact: (compact: boolean) => void
}

/** Holds the manager for the tree below `WindowManagerProvider`, or null outside one. */
export const WindowManagerContext = createContext<WindowManager | null>(null)

/**
 * Reads the window manager. Called by the menu bar, the desktop icons, the dock and every
 * window frame, so no shell module keeps a window list of its own.
 *
 * It throws when there is no provider above, because that is a wiring mistake rather than a
 * state the shell should paper over. Spec 0003, AC-11.
 */
export function useWindowManager(): WindowManager {
  const manager = useContext(WindowManagerContext)

  if (manager === null) {
    throw new Error('useWindowManager needs a WindowManagerProvider above it')
  }

  return manager
}
