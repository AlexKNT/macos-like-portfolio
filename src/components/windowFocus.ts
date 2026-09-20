import type { FocusHop } from '#store/windowManager'
import type { WindowElements } from '#store/windowElements'

/*
 * The DOM end of the focus handoff: turning the hop the manager computed into a focused element.
 * The manager stays pure (it decides where focus goes), and the elements registry says which
 * element that is, so nothing here queries the document.
 */

/** The element a hop names, or null when that element has gone while the window was closing. */
export function hopElement(hop: FocusHop, elements: WindowElements): HTMLElement | null {
  switch (hop.kind) {
    case 'window':
      return elements.frameFor(hop.key)
    case 'dock':
      return elements.dockButtonFor(hop.windowId)
    case 'desktop':
      return elements.desktop()
  }
}

/**
 * Moves the keyboard where a hop points, falling back to the desktop, so focus never rests on a
 * window that has just gone and is never left nowhere. Spec 0004, AC-8.
 */
export function applyFocusHop(hop: FocusHop, elements: WindowElements): void {
  const target = hopElement(hop, elements) ?? elements.desktop()

  target?.focus()
}
