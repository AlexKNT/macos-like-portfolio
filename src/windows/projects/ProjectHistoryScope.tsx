import { useState } from 'react'

import { placeName, placeOfTarget, targetForPlace } from '#content/reads'
import { useWindowManager } from '#store/useWindowManager'
import { DEFAULT_PLACE, popPlace, pushPlace } from '#windows/projects/projectHistory'
import { ProjectHistoryContext } from '#windows/projects/useProjectHistory'
import type { Place } from '#content/types'
import type { WindowBodyScopeProps } from '#windows/WindowBody'

/**
 * Holds the places the projects window has shown, and wraps its frame, so the Back control in
 * the title bar and the body below it read the same history through one hook.
 *
 * The place showing is read from the instance's target, never stored again: a change from
 * inside the window and a change from a desktop icon, a dock button or a menu bar link are the
 * same event here, which is what makes them all push one step and Back reach them all.
 *
 * The stack is folded forward during the render that reads it rather than in an effect, so Back
 * is correct in the frame the place changes in, with no render where it is briefly missing. The
 * write converges: the next render computes exactly this stack, and pushing the place already on
 * top is a no operation, so a change naming the place already showing pushes nothing.
 * Spec 0005, AC-5.
 */
export function ProjectHistoryScope({ windowKey, target, children }: WindowBodyScopeProps) {
  const { open } = useWindowManager()
  const [history, setHistory] = useState<readonly Place[]>(() => [DEFAULT_PLACE])
  const showing = placeOfTarget(target) ?? DEFAULT_PLACE
  const trail = pushPlace(history, showing)

  if (trail !== history) {
    setHistory(trail)
  }

  const below = trail[trail.length - 2] ?? null

  const back = () => {
    if (below === null) {
      return
    }

    setHistory(popPlace(trail))
    open(targetForPlace(below), { kind: 'window', key: windowKey })
  }

  return (
    <ProjectHistoryContext.Provider
      value={{
        place: showing,
        name: placeName(showing),
        canGoBack: below !== null,
        backLabel: below === null ? null : `Back to ${placeName(below)}`,
        back,
      }}
    >
      {children}
    </ProjectHistoryContext.Provider>
  )
}
