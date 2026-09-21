import { err, ok } from '#lib/result'
import type { Result } from '#lib/result'

/** Why a file is not there: the site answers without it, or the request never got an answer. */
export type FileCheckFailure = { readonly kind: 'missing' } | { readonly kind: 'unreachable' }

/**
 * Asks whether the site is serving the file at `href`, and answers as a value rather than
 * throwing, so a window can show a state instead of a broken frame.
 *
 * `missing` is the site's own answer (a status that is not ok, which is what a file that never
 * shipped looks like), and `unreachable` is no answer at all: an environment with no `fetch` to
 * call, a request that threw, or a request aborted by whoever asked, since the abort arrives here
 * as a rejection and the caller is gone by then. The href comes back on success, so the caller
 * knows which file answered.
 *
 * The whole call sits inside one guard and the function is `async`, so it always answers through
 * a promise and never throws, whichever of those happens, including a throw from `fetch` itself
 * in an environment that has no such function. Spec 0007, AC-4.
 */
export async function checkFileIsServed(
  href: string,
  signal?: AbortSignal,
): Promise<Result<string, FileCheckFailure>> {
  try {
    // A `HEAD` asks whether the file is served without pulling the document down: the window
    // draws it from the same path anyway, and the answer it needs is only whether the site has it.
    const response = await fetch(href, { method: 'HEAD', signal })

    return response.ok ? ok(href) : err({ kind: 'missing' })
  } catch {
    return err({ kind: 'unreachable' })
  }
}
