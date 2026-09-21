import type { WindowId } from '#content/types'
import type { WindowKey } from '#store/windowManager'
import type { WindowElements } from '#store/windowElements'

/** What a stand in registry holds: only the elements a case registers. */
export type StubRegistry = {
  readonly frames?: readonly (readonly [WindowKey, HTMLElement])[]
  readonly dockButtons?: readonly (readonly [WindowId, HTMLElement])[]
  readonly homeTiles?: readonly (readonly [WindowId, HTMLElement])[]
  readonly desktop?: HTMLElement | null
}

/**
 * A stand in for the element registry, holding exactly the elements a case hands it, so a rule
 * that reads the registry is checked without rendering a tree. It behaves like the real one:
 * registering `null` removes the element, so a lookup can never hand back something that has gone.
 * Spec 0004, AC-6, AC-8; spec 0009, AC-12.
 */
export function stubRegistry({
  frames = [],
  dockButtons = [],
  homeTiles = [],
  desktop = null,
}: StubRegistry): WindowElements {
  const frameMap = new Map<WindowKey, HTMLElement>(frames)
  const buttonMap = new Map<WindowId, HTMLElement>(dockButtons)
  const tileMap = new Map<WindowId, HTMLElement>(homeTiles)
  const held = { desktop }

  return {
    registerDockButton: (windowId, element) => {
      if (element === null) {
        buttonMap.delete(windowId)
        return
      }

      buttonMap.set(windowId, element)
    },
    dockButtonFor: (windowId) => buttonMap.get(windowId) ?? null,
    registerHomeTile: (windowId, element) => {
      if (element === null) {
        tileMap.delete(windowId)
        return
      }

      tileMap.set(windowId, element)
    },
    homeTileFor: (windowId) => tileMap.get(windowId) ?? null,
    registerFrame: (key, element) => {
      if (element === null) {
        frameMap.delete(key)
        return
      }

      frameMap.set(key, element)
    },
    frameFor: (key) => frameMap.get(key) ?? null,
    registerDesktop: (element) => {
      held.desktop = element
    },
    desktop: () => held.desktop,
  }
}
