import { useContext } from 'react'

import { WindowElementsContext } from '#store/windowElements'
import type { WindowElements } from '#store/windowElements'

/**
 * Reads the element registry: the dock buttons by window id, the frames by window key, and the
 * desktop. Called by the dock and by every window frame, so nothing has to query the document
 * for an element another component owns.
 *
 * It throws when there is no provider above, because that is a wiring mistake rather than a
 * state the shell should paper over. Spec 0004, AC-6, AC-8.
 */
export function useWindowElements(): WindowElements {
  const elements = useContext(WindowElementsContext)

  if (elements === null) {
    throw new Error('useWindowElements needs a WindowElementsProvider above it')
  }

  return elements
}
