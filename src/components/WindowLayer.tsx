import { ManagedWindow } from '#components/ManagedWindow'
import { useWindowManager } from '#store/useWindowManager'

/**
 * The layer every open window sits on: one bound window per instance the manager holds, in
 * order. It reads the manager for the list and writes nothing, so the desktop surface stays
 * free of window behaviour and adding a window never means touching the desktop.
 *
 * The layer itself takes no pointer events, so a click on the wallpaper and on the desktop
 * icons still lands where it should, and each frame takes them back. Spec 0003, AC-1, AC-11.
 */
export function WindowLayer() {
  const { instances } = useWindowManager()

  return (
    <div className="pointer-events-none absolute inset-0">
      {instances.map((instance) => (
        <ManagedWindow key={instance.key} instance={instance} />
      ))}
    </div>
  )
}
