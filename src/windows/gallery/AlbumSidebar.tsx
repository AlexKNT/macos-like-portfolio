import { ALBUMS } from '#content/gallery'
import { albumNavLabel } from '#windows/gallery/galleryLines'
import type { Album, AlbumId } from '#content/types'

/** What the sidebar needs: the album showing, and what to do with an album a visitor picks. */
export type AlbumSidebarProps = {
  readonly albumId: AlbumId
  readonly onChoose: (albumId: AlbumId) => void
}

/** What one row needs: the album it stands for, whether it is the album showing, and its press. */
type AlbumRowProps = {
  readonly album: Album
  readonly selected: boolean
  readonly onChoose: () => void
}

/**
 * One album in the sidebar. Above the compact breakpoint it is a row: the album's own icon, its own
 * title, and the quiet accent pair behind it while it is the album showing, which is the one mark
 * the sidebar paints at a time. Below the breakpoint the same control is a square the size of a
 * touch target with its title left to assistive tech, so every album fits one line of icons across
 * the top of the window without scrolling sideways.
 *
 * The mark is `aria-current` as well as a colour, so which album is showing is never carried by
 * colour alone. Spec 0010, AC-2, AC-11, AC-13.
 */
function AlbumRow({ album, selected, onChoose }: AlbumRowProps) {
  return (
    <button
      type="button"
      onClick={onChoose}
      aria-current={selected ? 'true' : undefined}
      className={`interactive-hover interactive-active focus-visible:interactive-focus rounded-control col-center size-11 shrink-0 @min-[40rem]:h-auto @min-[40rem]:w-full @min-[40rem]:flex-row @min-[40rem]:justify-start @min-[40rem]:gap-2 @min-[40rem]:px-2.5 @min-[40rem]:py-1.5 ${
        selected ? 'interactive-selected font-medium' : 'text-text'
      }`}
    >
      <img src={album.icon} alt="" className="size-4 shrink-0" />
      <span className="sr-only text-sm @min-[40rem]:not-sr-only @min-[40rem]:min-w-0 @min-[40rem]:truncate @min-[40rem]:text-left">
        {album.title}
      </span>
    </button>
  )
}

/**
 * The albums a visitor can browse, in the order the content layer declares them. Every row is a
 * button that asks for its own album, so this component decides nothing about what the window
 * shows: it names an album and the window's state does the rest.
 *
 * The column of rows becomes one line of icons below the compact breakpoint, wrapping rather than
 * scrolling, so the grid beside it keeps the window's whole width.
 * Spec 0010, AC-2, AC-11, AC-13.
 */
export function AlbumSidebar({ albumId, onChoose }: AlbumSidebarProps) {
  return (
    <nav
      aria-label={albumNavLabel()}
      className="bg-surface-sunken border-border flex w-full shrink-0 flex-row flex-wrap items-center gap-1 overflow-x-hidden border-b px-2 py-2 @min-[40rem]:w-48 @min-[40rem]:flex-col @min-[40rem]:flex-nowrap @min-[40rem]:items-stretch @min-[40rem]:overflow-y-auto @min-[40rem]:border-r @min-[40rem]:border-b-0 @min-[40rem]:py-3"
    >
      <h3 className="text-text-subtle hidden px-2 pb-1 text-xs font-medium @min-[40rem]:block">
        {albumNavLabel()}
      </h3>
      <ul className="flex flex-row flex-wrap items-center gap-1 @min-[40rem]:flex-1 @min-[40rem]:flex-col @min-[40rem]:flex-nowrap @min-[40rem]:items-stretch @min-[40rem]:gap-0.5">
        {ALBUMS.map((album) => (
          <li key={album.id} className="flex min-w-0 @min-[40rem]:flex-col">
            <AlbumRow
              album={album}
              selected={album.id === albumId}
              onChoose={() => onChoose(album.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
