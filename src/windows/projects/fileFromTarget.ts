import { findFile } from '#content/reads'
import type { FileEntry, ImageFile, OpenTarget, TextFile } from '#content/types'

/*
 * Reading the file a window was opened for. A file window's target names the file rather than
 * carrying it, so the file is looked up in the content layer when the body renders, which keeps
 * one truth about what a file holds. Spec 0005, AC-6.
 */

/** The file a target names, or `null` when it names no file or names one that is not there. */
function fileOf(target: OpenTarget): FileEntry | null {
  if (target.kind !== 'file') {
    return null
  }

  const found = findFile(target.fileId)

  return found.ok ? found.value : null
}

/** The text file a target names, or `null` when it names something else. Spec 0005, AC-6. */
export function textFileFrom(target: OpenTarget): TextFile | null {
  const file = fileOf(target)

  return file !== null && file.kind === 'text' ? file : null
}

/** The image file a target names, or `null` when it names something else. Spec 0005, AC-6. */
export function imageFileFrom(target: OpenTarget): ImageFile | null {
  const file = fileOf(target)

  return file !== null && file.kind === 'image' ? file : null
}
