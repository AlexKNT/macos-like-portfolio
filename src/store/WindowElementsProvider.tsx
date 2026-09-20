import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'

import { WindowElementsContext } from '#store/windowElements'
import type { WindowElements } from '#store/windowElements'
import type { WindowId } from '#content/types'
import type { WindowKey } from '#store/windowManager'

/**
 * Holds the elements a window reaches for while it is on the desk. Each one is registered by the
 * component that owns it and removed when that component unmounts, so a lookup can never hand
 * back an element that has gone.
 *
 * The registry holds elements rather than state, which is why it lives beside the manager
 * instead of inside it: the manager's reducer stays pure, and the frame can still find the dock
 * button it minimises to. Spec 0004, AC-6, AC-8.
 */
export function WindowElementsProvider({ children }: { readonly children: ReactNode }) {
  const dockButtons = useRef<Map<WindowId, HTMLElement>>(new Map())
  const frames = useRef<Map<WindowKey, HTMLElement>>(new Map())
  const desktop = useRef<HTMLElement | null>(null)

  const elements = useMemo<WindowElements>(
    () => ({
      registerDockButton: (windowId, element) => {
        if (element === null) {
          dockButtons.current.delete(windowId)
          return
        }

        dockButtons.current.set(windowId, element)
      },
      dockButtonFor: (windowId) => dockButtons.current.get(windowId) ?? null,
      registerFrame: (key, element) => {
        if (element === null) {
          frames.current.delete(key)
          return
        }

        frames.current.set(key, element)
      },
      frameFor: (key) => frames.current.get(key) ?? null,
      registerDesktop: (element) => {
        desktop.current = element
      },
      desktop: () => desktop.current,
    }),
    [],
  )

  return <WindowElementsContext value={elements}>{children}</WindowElementsContext>
}
