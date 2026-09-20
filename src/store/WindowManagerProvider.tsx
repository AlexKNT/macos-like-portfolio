import { useCallback, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'

import { EMPTY_WINDOW_MANAGER, focusedKeyOf, reduceWindowManager } from '#store/windowManager'
import { WindowManagerContext } from '#store/useWindowManager'
import type { WindowManager } from '#store/useWindowManager'
import type { WindowKey, WindowOpener } from '#store/windowManager'
import type { OpenTarget } from '#content/types'

/**
 * Holds every window for the whole desktop, so no shell module keeps a window list of its
 * own: the desktop surface, the dock and the menu bar all read this one and call the same
 * actions. The state itself lives in the pure reducer of `#store/windowManager`, and this
 * component is the only place it is held.
 *
 * The three actions are stable across renders, so a control that takes one as a prop does
 * not re-render when a window moves. Spec 0003, AC-8, AC-11.
 */
export function WindowManagerProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceWindowManager, EMPTY_WINDOW_MANAGER)

  const open = useCallback(
    (target: OpenTarget, opener: WindowOpener) => dispatch({ type: 'open', target, opener }),
    [],
  )
  const focus = useCallback((key: WindowKey) => dispatch({ type: 'focus', key }), [])
  const close = useCallback((key: WindowKey) => dispatch({ type: 'close', key }), [])

  const instances = state.instances
  const focusedKey = useMemo(() => focusedKeyOf(instances), [instances])

  const manager = useMemo<WindowManager>(
    () => ({ instances, focusedKey, open, focus, close }),
    [instances, focusedKey, open, focus, close],
  )

  return <WindowManagerContext value={manager}>{children}</WindowManagerContext>
}
