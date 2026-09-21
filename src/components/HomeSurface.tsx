import { HomeTile } from '#components/HomeTile'
import { HOME_SURFACE } from '#components/homeLines'
import { HOME_APPS } from '#content/shell'
import { useWindowManager } from '#store/useWindowManager'

/**
 * The phone's home surface: one heading naming the surface, and under it one named list of the
 * seven tiles the desktop's own words open, in the content's order. A press opens that window
 * through the manager's one open action recorded as coming from home, so a window is focused rather
 * than doubled, and a parked window comes back through the same rule rather than around it.
 *
 * While a window is on screen the surface stays in the page but is not shown. It keeps its layout,
 * so a tile holds the box a window grows from and shrinks back into, and it is invisible, so it
 * paints nothing, takes no pointer, stays out of the tab order and is absent from the accessibility
 * tree. That is what keeps seven tiles from being reachable behind a window that covers them, and
 * it is why a phone's window has somewhere to come from and go back to.
 *
 * Spec 0009, AC-1, AC-2, AC-3, AC-5, AC-6.
 */
export function HomeSurface() {
  const { instances, focusedKey, open } = useWindowManager()
  const isCovered = focusedKey !== null

  return (
    <div
      className={`absolute inset-0 flex flex-col gap-5 overflow-y-auto overflow-x-hidden p-5 ${
        isCovered ? 'invisible' : ''
      }`}
    >
      <h1 className="bg-scrim rounded-panel text-desktop-text self-start px-5 py-3 text-2xl font-semibold">
        {HOME_SURFACE}
      </h1>
      <ul aria-label={HOME_SURFACE} className="grid grid-cols-2 gap-3">
        {HOME_APPS.map((app) => {
          const matching = instances.filter((instance) => instance.windowId === app.windowId)

          return (
            <HomeTile
              key={app.id}
              app={app}
              isOpen={matching.length > 0}
              isMinimised={matching.some((instance) => instance.status === 'minimised')}
              onActivate={() => open({ kind: 'window', windowId: app.windowId }, { kind: 'home' })}
            />
          )
        })}
      </ul>
    </div>
  )
}
