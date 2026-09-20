import { LOCATIONS } from '#content/locations'
import { PROJECT_FOLDERS } from '#content/reads'
import type { Place } from '#content/types'

/** What the sidebar needs: the place showing, and what to do with a place a visitor picks. */
export type FinderSidebarProps = {
  readonly place: Place
  readonly onOpen: (place: Place) => void
}

/** What one row needs: what it shows, whether it is the place showing, and what it opens. */
type SidebarRowProps = {
  readonly icon: string
  readonly name: string
  readonly selected: boolean
  readonly onOpen: () => void
}

/**
 * One place in the sidebar. Above the compact breakpoint it is a row: the place's icon, its own
 * name, and the quiet accent pair behind it while it is the place showing, which is the one mark
 * the sidebar paints at a time. Below it, the same control is a square the size of a touch
 * target with its name left to assistive tech, so the whole sidebar fits one line of icons
 * across the top of the window without scrolling sideways.
 * Spec 0005, AC-3, AC-10, AC-12.
 */
function SidebarRow({ icon, name, selected, onOpen }: SidebarRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={selected ? 'true' : undefined}
      className={`interactive-hover interactive-active focus-visible:interactive-focus rounded-control col-center size-11 shrink-0 @min-[40rem]:h-auto @min-[40rem]:w-full @min-[40rem]:flex-row @min-[40rem]:justify-start @min-[40rem]:gap-2 @min-[40rem]:px-2.5 @min-[40rem]:py-1.5 ${
        selected ? 'interactive-selected font-medium' : 'text-text'
      }`}
    >
      <img src={icon} alt="" className="size-4 shrink-0" />
      <span className="sr-only @min-[40rem]:not-sr-only @min-[40rem]:min-w-0 @min-[40rem]:truncate @min-[40rem]:text-left text-sm">
        {name}
      </span>
    </button>
  )
}

/**
 * The places a visitor can browse: the four locations in the order the tree declares them, with the
 * three project folders nested under `Work`, which is where they live in the content layer. Every
 * row is a button that asks for its place, so the manager stays the one thing that decides what the
 * window shows.
 *
 * The order comes from the record's own declaration rather than from `locationIdSchema.options`,
 * because reading a schema at runtime is a value import of `types.ts` and that is what would pull
 * zod into the visitor's bundle. The content suite pins the two together, so the record's order and
 * the union's order cannot drift.
 *
 * The column of rows becomes one line of icons below the compact breakpoint, wrapping rather
 * than scrolling, so the grid beside it keeps the window's full width.
 * Spec 0005, AC-1, AC-10, AC-12.
 */
export function FinderSidebar({ place, onOpen }: FinderSidebarProps) {
  return (
    <nav
      aria-label="Favourites"
      className="bg-surface-sunken border-border flex w-full shrink-0 flex-row flex-wrap items-center gap-1 overflow-x-hidden border-b px-2 py-2 @min-[40rem]:w-48 @min-[40rem]:flex-col @min-[40rem]:flex-nowrap @min-[40rem]:items-stretch @min-[40rem]:overflow-y-auto @min-[40rem]:border-r @min-[40rem]:border-b-0 @min-[40rem]:py-3"
    >
      <h3 className="text-text-subtle hidden px-2 pb-1 text-xs font-medium @min-[40rem]:block">
        Favourites
      </h3>
      <ul className="flex flex-row flex-wrap items-center gap-1 @min-[40rem]:flex-1 @min-[40rem]:flex-col @min-[40rem]:flex-nowrap @min-[40rem]:items-stretch @min-[40rem]:gap-0.5">
        {Object.values(LOCATIONS).map((location) => (
          <li
            key={location.id}
            className="flex flex-row items-center gap-1 @min-[40rem]:flex-col @min-[40rem]:items-stretch @min-[40rem]:gap-0"
          >
            <SidebarRow
              icon={location.icon}
              name={location.name}
              selected={place.kind === 'location' && place.locationId === location.id}
              onOpen={() => onOpen({ kind: 'location', locationId: location.id })}
            />
            {location.id === 'work' ? (
              <ul className="flex flex-row flex-wrap items-center gap-1 @min-[40rem]:mt-0.5 @min-[40rem]:ml-3 @min-[40rem]:flex-col @min-[40rem]:items-stretch @min-[40rem]:gap-0">
                {Object.values(PROJECT_FOLDERS).map((project) => (
                  <li key={project.id}>
                    <SidebarRow
                      icon={project.icon}
                      name={project.name}
                      selected={place.kind === 'project' && place.projectId === project.id}
                      onOpen={() => onOpen({ kind: 'project', projectId: project.id })}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}
