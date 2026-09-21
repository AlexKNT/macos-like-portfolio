import { hasHomeTile } from '#store/windowManager'
import type { WindowInstance } from '#store/windowManager'
import type { WindowElements } from '#store/windowElements'

/*
 * The DOM end of the phone's movement: the tile a window grows from when it opens, and shrinks
 * back into when it closes. The manager stays pure (it owns no elements) and the registry says
 * which element a tile is, so nothing here queries the document.
 */

/**
 * The tile a window travels to on a phone: its own tile when that window has one, and otherwise
 * the tile of the window that opened it, so a file opened from the Finder grows from the Finder's
 * tile and shrinks back into it. `null` when neither has a tile, which is every window on the
 * desktop. Pure: the registry does the lookups, so a check can hand it a plain object.
 * Spec 0009, AC-12.
 */
export function exitTargetFor(
  instance: WindowInstance,
  instances: readonly WindowInstance[],
  elements: WindowElements,
): HTMLElement | null {
  if (hasHomeTile(instance.windowId)) {
    return elements.homeTileFor(instance.windowId)
  }

  const opener = instance.opener

  if (opener.kind !== 'window') {
    return null
  }

  const openedBy = instances.find((open) => open.key === opener.key)

  if (openedBy === undefined || !hasHomeTile(openedBy.windowId)) {
    return null
  }

  return elements.homeTileFor(openedBy.windowId)
}
