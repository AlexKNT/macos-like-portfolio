/*
 * The few lines this window says in words of its own: the prompt it prints above the stack, the
 * glyph that marks each area, the hint that says a name can be taken away, and the line an area
 * with nothing listed under it shows. It deliberately does not hold the copy wording: that is
 * shared, so every window words a copy the same way.
 * Spec 0006, AC-9, AC-10.
 */

/** The prompt line the window prints above the stack. */
export const PROMPT_LINE = 'guest@portfolio:~$ cat skills.txt'

/** The glyph that marks each area. It is decorative, so the category name carries the meaning. */
export const MARK_GLYPH = '✓'

/** The line that says what pressing a name does. */
export const COPY_HINT = 'Press a name to copy it.'

/** The line an area with nothing listed under it shows. */
export function emptyGroupLine(): string {
  return 'Nothing listed here yet.'
}
