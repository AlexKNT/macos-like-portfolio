import { useWindowMove } from '#components/useWindowMove'
import { Window } from '#components/Window'
import { useWindowManager } from '#store/useWindowManager'
import { WINDOW_BODIES } from '#windows/WindowBody'
import type { WindowInstance } from '#store/windowManager'

/**
 * One open window, bound to the manager: it reads where the window sits and what it shows,
 * wires the movement onto the frame, and renders the body registered for that window id.
 *
 * It is the only place a window's geometry is written to the screen, and it writes it in
 * pixels from the work area's top left corner, which is the same space the manager stores and
 * clamps in. Spec 0003, AC-1, AC-11; spec 0004, AC-4.
 */
export function ManagedWindow({ instance }: { readonly instance: WindowInstance }) {
  const { workArea, move, focus, close } = useWindowManager()
  const frameProps = useWindowMove({
    windowKey: instance.key,
    position: instance.position,
    size: instance.size,
    workArea,
    move,
    focus,
  })
  const Body = WINDOW_BODIES[instance.windowId]

  return (
    <Window
      title={instance.title}
      frameProps={frameProps}
      onClose={() => close(instance.key)}
      className="pointer-events-auto absolute"
      style={{
        left: instance.position.x,
        top: instance.position.y,
        width: instance.size.width,
        height: instance.size.height,
        zIndex: instance.z,
      }}
    >
      <Body windowId={instance.windowId} />
    </Window>
  )
}
