import { itemTarget } from '#windows/itemTarget'
import type { TreeEntry } from '#content/reads'
import type { OpenTarget } from '#content/types'

/** What one entry of the file tree needs: the entry, what a press does, and whether it answers. */
export type ItemTileProps = {
  readonly entry: TreeEntry
  readonly onOpen: (target: OpenTarget) => void
  /**
   * Whether the tile still answers a press. The Finder never disables one; the Archive disables
   * every tile for the moment its leftovers are leaving, which is what keeps a press landing on
   * something already on its way out.
   */
  readonly disabled?: boolean
}

/**
 * The one face an entry of the file tree shows, wherever a window draws one: the file's own icon
 * above its own name, which is also the name assistive tech announces because the icon carries no
 * text of its own.
 *
 * What it is follows what it does: a button when the press opens something inside the application,
 * and a real anchor when it leaves the page, so the browser's own link behaviour (open in a tab,
 * copy the address, follow with the keyboard) is what a link gets rather than a press handler
 * pretending to be one. Both kinds wear the same face, so the focus ring and the hover and press
 * states are the state utilities' and not a second implementation.
 *
 * A tile that stops answering takes the native `disabled` as a button, and `aria-disabled`,
 * `tabIndex={-1}` and no pointer events as an anchor, since an anchor has no `disabled` of its
 * own. Either way the tile stays in the page, so a placeholder that is still being uncovered is
 * still there for a screen reader and for a selection.
 * Spec 0005, AC-3, AC-7; spec 0012, AC-2, AC-5.
 */
export function ItemTile({ entry, onOpen, disabled = false }: ItemTileProps) {
  const target = itemTarget(entry)
  const face = `interactive-hover interactive-active focus-visible:interactive-focus rounded-panel flex h-full w-full min-w-0 flex-col items-center gap-2 p-2${
    disabled ? ' pointer-events-none' : ''
  }`
  const content = (
    <>
      <img src={entry.icon} alt="" className="size-11 shrink-0 object-contain" />
      <span className="text-text w-full text-center text-sm break-words">{entry.name}</span>
    </>
  )

  if (target.kind === 'external') {
    return (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled ? true : undefined}
        tabIndex={disabled ? -1 : undefined}
        className={face}
      >
        {content}
      </a>
    )
  }

  return (
    <button type="button" disabled={disabled} onClick={() => onOpen(target)} className={face}>
      {content}
    </button>
  )
}
