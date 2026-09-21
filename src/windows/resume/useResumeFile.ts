import { useEffect, useState } from 'react'

import { checkFileIsServed } from '#lib/files'
import type { FileCheckFailure } from '#lib/files'
import type { LookupFailure, PdfFile } from '#content/types'
import type { Result } from '#lib/result'

/**
 * What the Resume window knows, which is the reader's answer plus the check's: no resume file at
 * all (`absent`), a check still in flight (`checking`), and the three ways it can land (`ready`,
 * `missing`, `unreachable`).
 *
 * Each failure carries exactly what its own line needs, and no more: the `missing` line names the
 * file, the other two have no name to use, because in `absent` there is none and in `unreachable`
 * the answer is about the request rather than about the file. The window has no way back out of
 * four of the five: a second attempt is a reopened window, so there is no retry state to hold.
 * Spec 0007, AC-3, AC-4.
 */
export type ResumeFileState =
  | { readonly kind: 'checking' }
  | { readonly kind: 'ready'; readonly file: PdfFile }
  | { readonly kind: 'missing'; readonly fileName: string }
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'absent' }

/** The state before the file's own question has an answer, which is also the state the check runs in. */
const CHECKING: ResumeFileState = { kind: 'checking' }

/** The state when the content layer holds no resume file, so there is no path to check. */
const ABSENT: ResumeFileState = { kind: 'absent' }

/**
 * The state the window shows, derived from two values rather than set in order: the reader's
 * answer (does the content layer hold a resume file at all?) and the check's answer (is the site
 * serving it?). Only the check's answer is state, so a window that never gets one stays in
 * `checking` and draws nothing.
 *
 * The effect aborts its own request on cleanup, and drops whatever answer still arrives afterwards,
 * so closing the window while the check is in flight sets no state and logs no warning. Development
 * invokes the effect twice, which is why the window asks twice there and once in production.
 * Spec 0007, AC-3.
 */
export function useResumeFile(found: Result<PdfFile, LookupFailure>): ResumeFileState {
  const [answer, setAnswer] = useState<Result<string, FileCheckFailure> | null>(null)

  useEffect(() => {
    if (!found.ok) {
      return
    }

    const controller = new AbortController()

    void checkFileIsServed(found.value.href, controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setAnswer(result)
      }
    })

    return () => {
      controller.abort()
    }
  }, [found])

  if (!found.ok) {
    return ABSENT
  }

  if (answer === null) {
    return CHECKING
  }

  if (answer.ok) {
    return { kind: 'ready', file: found.value }
  }

  return answer.error.kind === 'missing'
    ? { kind: 'missing', fileName: found.value.name }
    : { kind: 'unreachable' }
}
