import { useState } from 'react'

import { QuietLine } from '#windows/QuietLine'
import { missingPhotoLine } from '#windows/gallery/galleryLines'
import type { Photo } from '#content/types'

/** What a tile needs: the photo it stands for, what a press does, and where its button lands. */
export type PhotoTileProps = {
  readonly photo: Photo
  readonly onOpen: () => void
  readonly tileRef: (element: HTMLButtonElement | null) => void
}

/**
 * One photo in the grid: a square button holding the thumbnail, at least a touch target wide
 * whatever the grid does, carrying the shared hover, press and focus states so it belongs to the
 * same desktop as every other control.
 *
 * The button is named by the photo's own `alt` text, so the same string names the control for a
 * screen reader whether or not the picture arrived, and the image inside describes itself too. An
 * asset that never loads is the tile's own state rather than the window's: the tile keeps its place
 * in the grid, says what happened, and leaves every other tile drawing.
 * Spec 0010, AC-4, AC-9, AC-10, AC-13.
 */
export function PhotoTile({ photo, onOpen, tileRef }: PhotoTileProps) {
  const [missing, setMissing] = useState(false)

  return (
    <button
      type="button"
      ref={tileRef}
      onClick={onOpen}
      aria-label={photo.alt}
      className="interactive-hover interactive-active focus-visible:interactive-focus rounded-panel bg-surface-sunken col-center aspect-square w-full min-h-touch min-w-0 p-1"
    >
      {missing ? (
        <QuietLine>{missingPhotoLine()}</QuietLine>
      ) : (
        <img
          src={photo.imageUrl}
          alt={photo.alt}
          loading="lazy"
          onError={() => setMissing(true)}
          className="rounded-control size-full object-cover"
        />
      )}
    </button>
  )
}
