import { QuietLine } from '#windows/QuietLine'
import { PhotoTile } from '#windows/gallery/PhotoTile'
import { emptyAlbumLine } from '#windows/gallery/galleryLines'
import type { Album } from '#content/types'

/** What the grid needs: the album it shows, what a press does, and where the tile buttons land. */
export type PhotoGridProps = {
  readonly album: Album
  readonly onOpen: (index: number) => void
  readonly tileRef: (index: number, element: HTMLButtonElement | null) => void
}

/**
 * The photos of one album as a named list, in the order the content layer writes them, which is the
 * order Tab walks them in because the tiles are the real document order. The list is named by the
 * album it holds, so a screen reader reads it as that album's photos rather than as an anonymous
 * list, and each tile is one item.
 *
 * The grid flows to as many square columns as the window's own width allows and keeps the whole
 * width below the compact breakpoint, where the sidebar has moved above it. An album holding no
 * photos says so, naming itself, rather than showing an empty area: that is the one state a grid
 * cannot show by drawing its items.
 * Spec 0010, AC-4, AC-8, AC-11, AC-13.
 */
export function PhotoGrid({ album, onOpen, tileRef }: PhotoGridProps) {
  if (album.photos.length === 0) {
    return <QuietLine>{emptyAlbumLine(album.title)}</QuietLine>
  }

  return (
    <ul
      aria-label={album.title}
      className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] items-start gap-2"
    >
      {album.photos.map((photo, index) => (
        <li key={photo.id} className="flex min-w-0">
          <PhotoTile
            photo={photo}
            onOpen={() => onOpen(index)}
            tileRef={(element) => tileRef(index, element)}
          />
        </li>
      ))}
    </ul>
  )
}
