import { useCallback, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'

import { readMeasureToken } from '#lib/measure'
import { createWindowManagerState, focusedKeyOf, reduceWindowManager } from '#store/windowManager'
import { readCompactLayout } from '#store/useWorkArea'
import { WindowElementsProvider } from '#store/WindowElementsProvider'
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
 * reducer stays pure and storable.
 *
 * The layout the page is in is read once, here, before the first render: a phone then paints the
 * phone shell on its very first frame, rather than mounting the desktop's chrome and swapping it
 * out once the media query has been observed. Spec 0009, AC-1.
 *
 * The element registry is mounted with it, below this context, because a tree that can open a
 * window is a tree that has a frame looking for its dock button. The two contexts stay
 * separate: the registry holds elements, and the manager's rules never touch the DOM.
 * Spec 0003, AC-8, AC-11; spec 0004, AC-6.
 */
export function WindowManagerProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(
    reduceWindowManager,
    readCompactLayout(),
    createWindowManagerState,
  )

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
  const minimise = useCallback((key: WindowKey) => dispatch({ type: 'minimise', key }), [])
  const restore = useCallback((key: WindowKey) => dispatch({ type: 'restore', key }), [])
  const zoom = useCallback((key: WindowKey) => dispatch({ type: 'zoom', key }), [])
  const setWorkArea = useCallback((size: WindowSize) => dispatch({ type: 'setWorkArea', size }), [])
  const setCompact = useCallback(
    (compact: boolean) => dispatch({ type: 'setCompact', compact }),
    [],
  )

  const instances = state.instances
  const workArea = state.workArea
  const compact = state.compact
  const focusedKey = useMemo(() => focusedKeyOf(instances), [instances])

  const manager = useMemo<WindowManager>(
    () => ({
      instances,
      focusedKey,
      workArea,
      compact,
      open,
      focus,
      close,
      move,
      minimise,
      restore,
      zoom,
      setWorkArea,
      setCompact,
    }),
    [
      instances,
      focusedKey,
      workArea,
      compact,
      open,
      focus,
      close,
      move,
      minimise,
      restore,
      zoom,
      setWorkArea,
      setCompact,
    ],
  )

  return (
    <WindowManagerContext value={manager}>
      <WindowElementsProvider>{children}</WindowElementsProvider>
    </WindowManagerContext>
  )
}
