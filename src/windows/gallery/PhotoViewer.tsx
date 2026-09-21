import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import { QuietLine } from '#windows/QuietLine'
import { closePhotoLabel, missingPhotoLine } from '#windows/gallery/galleryLines'
import type { Photo } from '#content/types'

/** What the viewer needs: the photo showing, what its controls do, and where its panel lands. */
export type PhotoViewerProps = {
  readonly photo: Photo
  readonly onClose: () => void
  readonly onStep: (step: number) => void
  readonly panelRef: (element: HTMLElement | null) => void
}

/*
 * The Close control's face: a control on the window body, at least a touch target tall, with the
 * ladder's hover and press steps and the shared focus ring. It is the word and the ring that mark
 * it as something you can press, the same treatment every other body control uses.
 */
const CLOSE_FACE =
  'interactive-hover interactive-active focus-visible:interactive-focus text-text rounded-control inline-flex min-h-touch shrink-0 items-center px-3 text-sm font-medium'

/**
 * One photo shown whole, with its description under it and one control to leave by.
 *
 * The panel is a figure named by the photo's own `alt` text, so assistive tech hears what is on
 * screen once, from the panel itself. The image inside carries no description of its own and the
 * caption is hidden from assistive tech, because repeating either would say the same sentence a
 * second time. The panel is focusable but stays out of the tab order: it takes the keyboard when a
 * photo opens, so the arrow keys land here, while Tab carries on to the Close control and then
 * through the window's own controls. Nothing is trapped.
 *
 * The panel answers its own keys for as long as it is open. Escape and the two arrows stop where
 * they are answered, so Escape closes the nearest thing first, which is the viewer rather than the
 * window, and the arrows step the album rather than moving the window. No previous or next control
 * is drawn: stepping belongs to the keyboard alone.
 *
 * An asset that never loads is this panel's own state: the quiet line takes the picture's place and
 * the caption still reads, so the description is never lost to a broken frame.
 * Spec 0010, AC-5, AC-6, AC-9, AC-10, AC-13.
 */
export function PhotoViewer({ photo, onClose, onStep, panelRef }: PhotoViewerProps) {
  const [missing, setMissing] = useState(false)

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onStep(event.key === 'ArrowLeft' ? -1 : 1)
  }

  return (
    <figure
      ref={panelRef}
      tabIndex={-1}
      aria-label={photo.alt}
      onKeyDown={handleKeyDown}
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <div className="bg-surface-sunken rounded-panel col-center min-h-0 flex-1 p-3">
        {missing ? (
          <QuietLine>{missingPhotoLine()}</QuietLine>
        ) : (
          <img
            src={photo.imageUrl}
            alt=""
            loading="eager"
            onError={() => setMissing(true)}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        {/*
          The caption repeats what the panel is already named by, so it is written for the eye
          only: assistive tech hears the description once, from the figure itself.
        */}
        <p aria-hidden="true" className="text-text-muted min-w-0 text-sm break-words">
          {photo.alt}
        </p>
        <button type="button" onClick={onClose} className={CLOSE_FACE}>
          {closePhotoLabel()}
        </button>
      </div>
    </figure>
  )
}
