/*
 * The few lines this window says in words of its own. They live in one pure module so every
 * literal a visitor can read is written down once, and each one is named for the state it
 * describes rather than for where it happens to appear. Spec 0005, AC-8, AC-9.
 */

/** The line an empty place shows, naming the place so it reads as a state rather than a fault. */
export function emptyPlaceLine(placeName: string): string {
  return `Nothing in ${placeName} yet.`
}

/** The line an image window shows when its asset never loaded. */
export function missingImageLine(): string {
  return 'This image did not load.'
}

/** The line a file window shows when the file its target names cannot be read at all. */
export function unreadableFileLine(): string {
  return 'This file could not be read.'
}
