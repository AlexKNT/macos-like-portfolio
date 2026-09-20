import { useWindowFrame } from '#components/useWindowFrame'
import { Window } from '#components/Window'
import { useWindowManager } from '#store/useWindowManager'
import { windowGeometry } from '#store/windowManager'
import { WINDOW_BODIES } from '#windows/WindowBody'
import type { WindowInstance } from '#store/windowManager'

/**
 * One open window, bound to the manager: it reads where the window sits and what it shows, wires
 * the movement, the lights and the exit onto the frame, and renders the body registered for that
 * window id.
 *
 * It is the only place a window's geometry is written to the screen, and it writes it in pixels
 * from the work area's top left corner, which is the same space the manager stores and clamps
 * in. The geometry it draws is the manager's, except below the compact breakpoint, where the
 * focused window fills the work area without the stored geometry being touched.
 *
 * A minimised window stays in the tree and is hidden: that is what keeps it out of the tab and
 * stacking orders while leaving an element for the movement back from the dock to play on.
 * Spec 0003, AC-1, AC-11; spec 0004, AC-4, AC-6, AC-9.
 */
export function ManagedWindow({ instance }: { readonly instance: WindowInstance }) {
  const { focusedKey, workArea, compact } = useWindowManager()
  const isFocused = focusedKey === instance.key
  const { position, size } = windowGeometry(instance, workArea, compact, isFocused)
  const frame = useWindowFrame({ instance, position, size })
  const Body = WINDOW_BODIES[instance.windowId]

  return (
    <Window
      title={instance.title}
      isFocused={isFocused}
      frameProps={frame.frameProps}
      frameRef={frame.frameRef}
      onClose={frame.onClose}
      onMinimise={frame.onMinimise}
      onZoom={frame.onZoom}
      className={`pointer-events-auto absolute ${frame.isMinimised ? 'hidden' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: instance.z,
      }}
    >
      <Body windowId={instance.windowId} />
    </Window>
  )
}
