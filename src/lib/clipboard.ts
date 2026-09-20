import { err, ok } from '#lib/result'
import type { Result } from '#lib/result'

/** Why a copy did not happen: the browser offers no clipboard, or it refused the write. */
export type ClipboardFailure = { readonly kind: 'unsupported' } | { readonly kind: 'refused' }

/**
 * Writes text to the clipboard, and it is the only place in the app that touches it: nothing is
 * ever read from the clipboard, and nothing is written except on a press.
 *
 * It returns a value rather than throwing, because both ways this can fail are ordinary states a
 * window shows rather than faults: `unsupported` when the browser has no clipboard to write to
 * (an insecure origin, or a test environment), and `refused` when the write itself was rejected,
 * which is what a denied permission looks like. The text it was given comes back on success.
 * Spec 0006, AC-2.
 */
export async function copyText(text: string): Promise<Result<string, ClipboardFailure>> {
  const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard

  if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
    return err({ kind: 'unsupported' })
  }

  try {
    await clipboard.writeText(text)

    return ok(text)
  } catch {
    return err({ kind: 'refused' })
  }
}
