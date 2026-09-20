import { useWindowFrame } from '#components/useWindowFrame'
import { Window } from '#components/Window'
import { useWindowManager } from '#store/useWindowManager'
import { windowGeometry } from '#store/windowManager'
import { WINDOW_BODIES } from '#windows/WindowBody'
import type { WindowBodyProps } from '#windows/WindowBody'
import type { WindowInstance } from '#store/windowManager'

/**
 * One open window, bound to the manager: it reads where the window sits and what it shows, wires
 * the movement, the lights and the exit onto the frame, and renders what the window's registry
 * entry says it is.
 *
 * It is the only place a window's geometry is written to the screen, and it writes it in pixels
 * from the work area's top left corner, which is the same space the manager stores and clamps
 * in. The geometry it draws is the manager's, except below the compact breakpoint, where the
 * focused window fills the work area without the stored geometry being touched.
 *
 * It knows three things about a window and nothing about any one of them: a body, an optional
 * control for the title bar, and an optional scope the window's own state lives in. The scope
 * wraps the frame, so the control inside the frame reads the same state the body does.
 *
 * A minimised window stays in the tree and is hidden: that is what keeps it out of the tab and
 * stacking orders while leaving an element for the movement back from the dock to play on.
 * Spec 0003, AC-1, AC-11; spec 0004, AC-4, AC-6, AC-9; spec 0005, AC-13.
 */
export function ManagedWindow({ instance }: { readonly instance: WindowInstance }) {
  const { focusedKey, workArea, compact } = useWindowManager()
  const isFocused = focusedKey === instance.key
  const { position, size } = windowGeometry(instance, workArea, compact, isFocused)
  const frame = useWindowFrame({ instance, position, size })
  const { Body, Lead, Scope } = WINDOW_BODIES[instance.windowId]
  const bodyProps: WindowBodyProps = {
    windowId: instance.windowId,
    windowKey: instance.key,
    target: instance.target,
  }

  const window = (
    <Window
      title={instance.title}
      isFocused={isFocused}
      frameProps={frame.frameProps}
      frameRef={frame.frameRef}
      onClose={frame.onClose}
      onMinimise={frame.onMinimise}
      onZoom={frame.onZoom}
      leading={Lead === undefined ? undefined : <Lead {...bodyProps} />}
      className={`pointer-events-auto absolute ${frame.isMinimised ? 'hidden' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: instance.z,
      }}
    >
      <Body {...bodyProps} />
    </Window>
  )

  return Scope === undefined ? window : <Scope {...bodyProps}>{window}</Scope>
}
