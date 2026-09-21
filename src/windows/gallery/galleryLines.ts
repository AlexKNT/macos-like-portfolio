/*
 * Every word this window says that is not portfolio content: the name the album sidebar carries,
 * the word on the control that closes the viewer, the line an album with no photos shows, the line
 * a photo whose asset never loaded shows, the line a content layer with no albums shows, and the
 * sentence the live region reads whenever a photo appears.
 *
 * Each function is named for the state it describes rather than for where it sits on screen, and
 * nothing here holds a colour, a length or a token. Spec 0010, AC-8, AC-9.
 */

/** The name the album sidebar carries: its navigation label, and its heading while there is room. */
export function albumNavLabel(): string {
  return 'Albums'
}

/** The word on the control that closes the viewer and hands the keyboard back to the grid. */
export function closePhotoLabel(): string {
  return 'Close photo'
}

/**
 * The line an album holding no photos shows. It names the album, so the four albums the content
 * layer leaves empty read as states rather than as faults.
 */
export function emptyAlbumLine(albumTitle: string): string {
  return `Nothing in ${albumTitle} yet.`
}

/** The line a photo shows in place of its own picture, inside its tile or in the viewer. */
export function missingPhotoLine(): string {
  return 'This photo did not load.'
}

/**
 * The line the window shows when the content layer carries no album at all. The shipped content
 * always carries five, so this state is unreachable today; it exists because the window reads a
 * list, and a list that can be empty deserves a word rather than a blank frame.
 */
export function noAlbumsLine(): string {
  return 'No albums have been added yet.'
}

/**
 * What the live region reads when a photo appears: the photo's place in the album, so a step is
 * announced exactly as an opening is, and the photo's own description, so the announcement names
 * what is on screen rather than a number alone.
 */
export function photoAnnouncement(position: number, total: number, alt: string): string {
  return `Photo ${position} of ${total}. ${alt}`
}
