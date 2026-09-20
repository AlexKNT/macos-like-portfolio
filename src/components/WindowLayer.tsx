import { Window } from '#components/Window'
import { useWindowManager } from '#store/useWindowManager'
import { WINDOW_BODIES } from '#windows/WindowBody'

/**
 * The layer every open window sits on: one positioned frame per window the manager holds, in
 * order. It reads the manager and writes nothing, so the desktop surface stays free of window
 * behaviour and adding a window never means touching the desktop.
 *
 * The layer itself takes no pointer events, so a click on the wallpaper and on the desktop
 * icons still lands where it should, and each frame takes them back. The spot and the size
 * are written in pixels from the container's top left corner, which is the work area a later
 * feature clamps against. Spec 0003, AC-1, AC-11.
 */
export function WindowLayer() {
  const { instances, close } = useWindowManager()

  return (
    <div className="pointer-events-none absolute inset-0">
      {instances.map((instance) => {
        const Body = WINDOW_BODIES[instance.windowId]

        return (
          <Window
            key={instance.key}
            title={instance.title}
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
      })}
    </div>
  )
}
