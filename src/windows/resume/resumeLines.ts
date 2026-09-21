/*
 * The few lines the Resume window says in words of its own. They live in one pure module so every
 * literal a visitor can read is written down once, and each one is named for the state it
 * describes rather than for where it happens to appear. Spec 0007, AC-2, AC-4, AC-5.
 */

/** The word on the download control, which is also the start of the name it is announced by. */
export const DOWNLOAD_WORD = 'Download'

/** What the download is announced as: what the press does, and the file it saves. */
export function downloadLabel(fileName: string): string {
  return `${DOWNLOAD_WORD} ${fileName}`
}

/** The line shown when the site answers without the file, naming it so the state stays concrete. */
export function fileNotServedLine(fileName: string): string {
  return `The file ${fileName} is not on the site.`
}

/** The line shown when the request for the file got no answer at all. */
export function requestFailedLine(): string {
  return 'The resume could not be fetched just now.'
}

/** The line shown when the content layer holds no resume file, where there is no name to use. */
export function noResumeFileLine(): string {
  return 'This window has no resume file to show.'
}

/** The line the embed's own fallback shows in a browser that cannot draw the document. */
export function undrawableDocumentLine(): string {
  return 'This browser cannot show the file here.'
}
