/*
 * Every word this window says that is not portfolio content: the line over its leftovers, the line
 * it shows when there is nothing left, and the two words on its Empty control. Each function is
 * named for the state it describes rather than for where it sits on screen, and nothing here holds
 * a colour, a length or a token. Spec 0012, AC-3, AC-4, AC-6.
 */

/** The count line's words, which say how many leftovers the window holds. */
export function countLine(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

/** The line the window shows once it is empty, and the words the live region announces. */
export function emptyLine(): string {
  return 'The Archive is empty.'
}

/** The control's visible word: one short word, so it fits the title bar at 360 pixels. */
export function emptyControlWord(): string {
  return 'Empty'
}

/**
 * The control's accessible name. It names the window it empties and carries the visible word
 * inside it, so a screen reader hears more than the eye reads while a voice control speaking what
 * is on screen still reaches the control. Spec 0012, AC-4.
 */
export function emptyControlLabel(): string {
  return 'Empty Archive'
}
