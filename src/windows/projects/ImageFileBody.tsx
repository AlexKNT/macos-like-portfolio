import { useState } from 'react'

import { QuietLine } from '#windows/projects/QuietLine'
import { imageFileFrom } from '#windows/projects/fileFromTarget'
import { missingImageLine, unreadableFileLine } from '#windows/projects/quietLines'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * An image shown whole, on a well of its own so the picture reads against a plain surface, with
 * the text a screen reader announces repeated under it as a visible caption.
 *
 * An asset that never loads is a state rather than a broken frame: the window keeps the file's
 * name, its alt text and a line saying what happened, so a missing portrait still reads as a
 * missing picture and never as a broken window.
 * Spec 0005, AC-6, AC-9.
 */
export function ImageFileBody({ target }: WindowBodyProps) {
  const file = imageFileFrom(target)
  const [missing, setMissing] = useState(false)

  if (file === null) {
    return (
      <div className="p-6">
        <QuietLine>{unreadableFileLine()}</QuietLine>
      </div>
    )
  }

  return (
    <figure className="flex h-full min-h-0 flex-col">
      {missing ? (
        <div className="col-center flex-1 gap-3 p-6 text-center">
          <p className="text-text text-base font-medium">{file.name}</p>
          <p className="text-text-muted max-w-prose text-sm">{file.alt}</p>
          <QuietLine>{missingImageLine()}</QuietLine>
        </div>
      ) : (
        <div className="bg-surface-sunken col-center min-h-0 flex-1 p-3">
          <img
            src={file.imageUrl}
            alt={file.alt}
            onError={() => setMissing(true)}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
      {/*
        The caption repeats what the image's own alt text already says, so it is written for the
        eye only: assistive tech hears the description once, from the image itself.
      */}
      {missing ? null : (
        <figcaption
          aria-hidden="true"
          className="border-border text-text-muted border-t px-4 py-3 text-sm"
        >
          {file.alt}
        </figcaption>
      )}
    </figure>
  )
}
