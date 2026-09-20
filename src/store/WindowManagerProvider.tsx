import { useCallback, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'

import { readMeasureToken } from '#lib/measure'
import { EMPTY_WINDOW_MANAGER, focusedKeyOf, reduceWindowManager } from '#store/windowManager'
import { WindowManagerContext } from '#store/useWindowManager'
import type { WindowManager } from '#store/useWindowManager'
import type { WindowKey, WindowOpener, WindowPosition, WindowSize } from '#store/windowManager'
import type { OpenTarget } from '#content/types'

/**
 * Holds every window for the whole desktop, so no shell module keeps a window list of its
 * own: the desktop surface, the dock and the menu bar all read this one and call the same
 * actions. The state itself lives in the pure reducer of `#store/windowManager`, and this
 * component is the only place it is held.
 *
 * The actions are stable across renders, so a control that takes one as a prop does not
 * re-render when a window moves. The one value a window's geometry needs from outside is the
 * cascade step, read from the token layer here rather than held in the reducer, so the
 * reducer stays pure and storable. Spec 0003, AC-8, AC-11.
 */
export function WindowManagerProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceWindowManager, EMPTY_WINDOW_MANAGER)

  const open = useCallback(
    (target: OpenTarget, opener: WindowOpener) =>
      dispatch({
        type: 'open',
        target,
        opener,
        cascadeStep: readMeasureToken('window-cascade-step'),
      }),
    [],
  )
  const focus = useCallback((key: WindowKey) => dispatch({ type: 'focus', key }), [])
  const close = useCallback((key: WindowKey) => dispatch({ type: 'close', key }), [])
  const move = useCallback(
    (key: WindowKey, position: WindowPosition) => dispatch({ type: 'move', key, position }),
    [],
  )
  const setWorkArea = useCallback((size: WindowSize) => dispatch({ type: 'setWorkArea', size }), [])

  const instances = state.instances
  const workArea = state.workArea
  const focusedKey = useMemo(() => focusedKeyOf(instances), [instances])

  const manager = useMemo<WindowManager>(
    () => ({ instances, focusedKey, workArea, open, focus, close, move, setWorkArea }),
    [instances, focusedKey, workArea, open, focus, close, move, setWorkArea],
  )

  return <WindowManagerContext value={manager}>{children}</WindowManagerContext>
}
