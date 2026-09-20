import { openTargetFor } from '#content/reads'
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
 * Where an item of the grid leads: a project folder opens the place it stands for, and a file
 * goes wherever its own kind says, which is a file window for text and images and out of the
 * page for a link and for the resume.
 */
function targetFor(entry: TreeEntry): OpenTarget {
  return entry.kind === 'folder' ? { kind: 'project', projectId: entry.id } : openTargetFor(entry)
}

/** What one item of the grid needs. */
type FinderItemProps = {
  readonly item: TreeEntry
  readonly onOpen: (target: OpenTarget) => void
}

/**
 * One item of the grid: its icon and its own name, which is the name assistive tech announces
 * because the icon carries no text of its own.
 *
 * What it is follows what it does: a button when the press opens something inside the
 * application, and a real anchor when it leaves the page, so the browser's own link behaviour
 * (open in a tab, copy the address, follow with the keyboard) is what a link gets rather than a
 * press handler pretending to be one. Both kinds carry the same face, so the focus ring and the
 * hover and press states are the state utilities' and not a second implementation.
 * Spec 0005, AC-3, AC-7.
 */
function FinderItem({ item, onOpen }: FinderItemProps) {
  const target = targetFor(item)
  const face =
    'interactive-hover interactive-active focus-visible:interactive-focus rounded-panel flex h-full w-full min-w-0 flex-col items-center gap-2 p-2'
  const content = (
    <>
      <img src={item.icon} alt="" className="size-11 shrink-0 object-contain" />
      <span className="text-text w-full text-center text-sm break-words">{item.name}</span>
    </>
  )

  if (target.kind === 'external') {
    return (
      <a href={target.href} target="_blank" rel="noopener noreferrer" className={face}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={() => onOpen(target)} className={face}>
      {content}
    </button>
  )
}

/**
 * The items of a place, in the order the content layer lists them, which is the order Tab walks
 * them in because the controls are the real document order. The grid flows to as many columns as
 * the window's own width allows, and below the compact breakpoint it keeps the whole width of
 * the window, since the sidebar has moved above it.
 *
 * A place with nothing in it says so, naming itself, rather than showing an empty area: that is
 * the one state a grid cannot show by rendering its items.
 * Spec 0005, AC-1, AC-3, AC-8, AC-12.
 */
export function FinderGrid({ items, placeName, onOpen }: FinderGridProps) {
  if (items.length === 0) {
    return <QuietLine>{emptyPlaceLine(placeName)}</QuietLine>
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0">
          <FinderItem item={item} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
