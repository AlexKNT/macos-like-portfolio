import { createContext } from 'react'

import type { WindowId } from '#content/types'
import type { WindowKey } from '#store/windowManager'

/*
 * The elements a window has to reach for and does not own: the dock button it minimises to and
 * hands focus back to, the frames of the other windows, and the desktop itself. The manager
 * holds none of this, so its rules stay pure and testable without a DOM; a component registers
 * its own element here and the frame reads it back by name. Spec 0004, AC-6, AC-8.
 */

/** What the shell registers, and what the frame reads back. */
export type WindowElements = {
  readonly registerDockButton: (windowId: WindowId, element: HTMLElement | null) => void
  readonly dockButtonFor: (windowId: WindowId) => HTMLElement | null
  readonly registerFrame: (key: WindowKey, element: HTMLElement | null) => void
  readonly frameFor: (key: WindowKey) => HTMLElement | null
  readonly registerDesktop: (element: HTMLElement | null) => void
  readonly desktop: () => HTMLElement | null
}

/** Holds the element registry for the tree below `WindowElementsProvider`, or null outside one. */
export const WindowElementsContext = createContext<WindowElements | null>(null)
