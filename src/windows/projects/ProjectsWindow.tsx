import { useCallback, useEffect, useRef } from 'react'

import { PROJECT_FOLDERS, findPlace, placeOfTarget, targetForPlace } from '#content/reads'
import { useWindowManager } from '#store/useWindowManager'
import { FinderGrid } from '#windows/projects/FinderGrid'
import { FinderSidebar } from '#windows/projects/FinderSidebar'
import { ProjectDetail } from '#windows/projects/ProjectDetail'
import { DEFAULT_PLACE } from '#windows/projects/projectHistory'
import type { OpenTarget, Place } from '#content/types'
import type { WindowBodyProps } from '#windows/WindowBody'

/** A place written as one string, so an effect can tell a place change from a re-render. */
function placeKey(place: Place): string {
  return place.kind === 'location' ? `location:${place.locationId}` : `project:${place.projectId}`
}

/**
 * The Finder: a sidebar of places on the left and the content of the place showing on the right,
 * which is the items of a location or a project's own words and files. The body is a pure
 * function of what the manager holds, since the place showing is read from its target, and every
 * press asks the manager for a place rather than keeping a place of its own.
 *
 * The content region is focusable but not in the tab order, and it is named by the place, so a
 * place change moves the keyboard to the new content and assistive tech announces where it
 * arrived. The move fires on a change of place only: the first render is left alone, so the
 * focus the window manager puts on a window as it opens stays where it is.
 * Spec 0005, AC-1, AC-2, AC-3, AC-11.
 */
export function ProjectsWindow({ windowKey, target }: WindowBodyProps) {
  const { open } = useWindowManager()
  const place = placeOfTarget(target) ?? DEFAULT_PLACE
  const view = findPlace(place)
  const key = placeKey(place)
  const region = useRef<HTMLDivElement>(null)
  const previous = useRef(key)

  useEffect(() => {
    if (previous.current === key) {
      return
    }

    previous.current = key
    region.current?.focus()
  }, [key])

  const openAt = useCallback(
    (next: OpenTarget) => {
      open(next, { kind: 'window', key: windowKey })
    },
    [open, windowKey],
  )

  const goTo = useCallback((next: Place) => openAt(targetForPlace(next)), [openAt])

  return (
    <div className="@container h-full min-h-0">
      <div className="flex h-full flex-col @min-[40rem]:flex-row">
        <FinderSidebar place={place} onOpen={goTo} />
        {/*
          The content area is named by the place, so a place change announces where the keyboard
          just arrived. It is a named group rather than a second landmark region on purpose: the
          window frame is already a region named by the same place, and two nested regions with
          one name read as a stutter to a screen reader's landmark list.
        */}
        <div
          ref={region}
          role="group"
          tabIndex={-1}
          aria-label={view.name}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5 @min-[40rem]:p-6"
        >
          <h2 className="text-text text-lg font-semibold">{view.name}</h2>
          {place.kind === 'project' ? (
            <ProjectDetail
              project={PROJECT_FOLDERS[place.projectId]}
              pitch={view.pitch}
              onOpen={openAt}
            />
          ) : (
            <FinderGrid items={view.items} placeName={view.name} onOpen={openAt} />
          )}
        </div>
      </div>
    </div>
  )
}
