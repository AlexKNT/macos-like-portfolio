/*
 * Every word the articles window says that is not portfolio content: the heading over the list,
 * and the line the window shows when the content layer carries no post at all.
 *
 * Each function is named for the state it describes rather than for where it sits on screen, and
 * nothing here holds a colour, a length or a token. Spec 0011, AC-3, AC-8.
 */

/** The heading over the list, which names what the window is showing. */
export function headingLine(): string {
  return 'My Developer Blog'
}

/**
 * The line the window shows in place of the list when the content layer carries no post. The
 * shipped content always carries three, so this state is unreachable today; it exists because the
 * window reads a list, and a list that can be empty deserves a word rather than a blank frame.
 */
export function emptyLine(): string {
  return 'No posts have been published yet.'
}
