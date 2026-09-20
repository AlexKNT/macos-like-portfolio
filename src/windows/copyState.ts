import type { ClipboardFailure } from '#lib/clipboard'

/**
 * Which copy a state belongs to: the row the press was made in, and the name that was taken.
 * The row is what decides where a confirmation appears, so pressing a second name moves it
 * rather than adding one.
 */
export type CopyKey = { readonly row: string; readonly name: string }

/** What a window has copied: nothing yet, a name, or a refusal naming the item. */
export type CopyState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'copied'; readonly key: CopyKey }
  | { readonly kind: 'failed'; readonly key: CopyKey; readonly reason: ClipboardFailure }

/** What one row shows after a press, or `null` for every row that is not the one pressed. */
export type CopyOutcome =
  | { readonly kind: 'copied'; readonly name: string }
  | { readonly kind: 'failed'; readonly name: string }

/** The state a window starts in, and the state it is back in when a copy is cleared. */
export const IDLE_COPY: CopyState = { kind: 'idle' }
