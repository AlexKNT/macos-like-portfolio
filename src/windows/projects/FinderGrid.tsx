import { ItemTile } from '#windows/ItemTile'
import { QuietLine } from '#windows/QuietLine'
import { emptyPlaceLine } from '#windows/projects/quietLines'
import type { TreeEntry } from '#content/reads'
import type { OpenTarget } from '#content/types'

/** What the grid needs: the items to show, the place they belong to, and what a press does. */
export type FinderGridProps = {
  readonly items: readonly TreeEntry[]
  readonly placeName: string
  readonly onOpen: (target: OpenTarget) => void
}

/**
 * The items of a place, in the order the content layer lists them, which is the order Tab walks
 * them in because the controls are the real document order. The grid flows to as many columns as
 * the window's own width allows, and below the compact breakpoint it keeps the whole width of
 * the window, since the sidebar has moved above it.
 *
 * Each item is drawn by the shared `ItemTile`, which is the one face the desktop gives an entry
 * of its file tree: what a tile is and where a press on one leads both live there, so an item
 * looks and behaves the same in this window and in the Archive. What stays here is what the two
 * windows differ in: this list and the line an empty place shows.
 *
 * A place with nothing in it says so, naming itself, rather than showing an empty area: that is
 * the one state a grid cannot show by rendering its items.
 * Spec 0005, AC-1, AC-3, AC-8, AC-12; spec 0012, AC-2.
 */
export function FinderGrid({ items, placeName, onOpen }: FinderGridProps) {
  if (items.length === 0) {
    return <QuietLine>{emptyPlaceLine(placeName)}</QuietLine>
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0">
          <ItemTile entry={item} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
