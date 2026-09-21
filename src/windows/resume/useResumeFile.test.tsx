import { render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { findResumeFile } from '#content/reads'
import { useResumeFile } from '#windows/resume/useResumeFile'
import type { LookupFailure, PdfFile } from '#content/types'
import type { Result } from '#lib/result'
import type { ResumeFileState } from '#windows/resume/useResumeFile'

/**
 * The five states the Resume window can be in, and the two rules that hold across all of them: an
 * answer that arrives after the window is gone changes nothing, and one failure never throws.
 *
 * The check is stubbed rather than left to the environment, because jsdom has no server to answer
 * for a relative path, and the reader's own answer is passed in rather than read, which is what
 * makes the `absent` state reachable here at all. Spec 0007, AC-3, AC-4.
 */

/** The real `fetch`, so every check puts it back and the environment is left as it was found. */
const REAL_FETCH = globalThis.fetch

/** Puts a `fetch` on the environment for one check, or takes it away by passing `undefined`. */
function withFetch(value: unknown): void {
  Object.defineProperty(globalThis, 'fetch', { value, configurable: true, writable: true })
}

/** The reader's answer for the file the tree actually holds. */
const HELD = findResumeFile()

/** The reader's answer when the content layer holds no resume file at all. */
const ABSENT: Result<PdfFile, LookupFailure> = {
  ok: false,
  error: { kind: 'notFound', collection: 'files', id: 'resume-pdf' },
}

/** Stands the hook up and records every state it reports, so a check can read the last one. */
function Probe({
  found,
  onState,
}: {
  readonly found: Result<PdfFile, LookupFailure>
  readonly onState: (state: ResumeFileState) => void
}) {
  const state = useResumeFile(found)

  useEffect(() => {
    onState(state)
  }, [onState, state])

  return <p>{state.kind}</p>
}

/** Renders the hook over one reader's answer and hands back the states it reported. */
function statesFrom(found: Result<PdfFile, LookupFailure>): readonly ResumeFileState[] {
  const seen: ResumeFileState[] = []

  render(<Probe found={found} onState={(state) => seen.push(state)} />)

  return seen
}

beforeEach(() => {
  withFetch(vi.fn(() => Promise.resolve({ ok: true, status: 200 })))
})

afterEach(() => {
  withFetch(REAL_FETCH)
})

describe('useResumeFile', () => {
  // covers: AC-3
  it('holds nothing but the check while the answer is still in flight', () => {
    withFetch(vi.fn(() => new Promise(() => {})))

    const seen = statesFrom(HELD)

    expect(seen).toEqual([{ kind: 'checking' }])
  })

  // covers: AC-3, AC-4
  it('moves to ready with the file the reader answered, once the site says it is serving it', async () => {
    const seen = statesFrom(HELD)

    await waitFor(() => expect(seen.at(-1)?.kind).toBe('ready'))
    expect(seen.at(-1)).toEqual({ kind: 'ready', file: HELD.ok ? HELD.value : undefined })
  })

  // covers: AC-4
  it('moves to missing, carrying the file it could not find, when the answer is not ok', async () => {
    withFetch(vi.fn(() => Promise.resolve({ ok: false, status: 404 })))

    const seen = statesFrom(HELD)

    await waitFor(() => expect(seen.at(-1)?.kind).toBe('missing'))
    expect(seen.at(-1)).toEqual({ kind: 'missing', fileName: 'Resume.pdf' })
  })

  // covers: AC-4
  it('moves to unreachable when the request throws', async () => {
    withFetch(vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    const seen = statesFrom(HELD)

    await waitFor(() => expect(seen.at(-1)?.kind).toBe('unreachable'))
  })

  // covers: AC-4
  it('moves to unreachable where there is no fetch to call at all', async () => {
    withFetch(undefined)

    const seen = statesFrom(HELD)

    await waitFor(() => expect(seen.at(-1)?.kind).toBe('unreachable'))
  })

  // covers: AC-4
  it('lands straight on absent when the content layer holds no resume file, and asks nothing', () => {
    const fetchStub = vi.fn(() => Promise.resolve({ ok: true, status: 200 }))

    withFetch(fetchStub)

    expect(statesFrom(ABSENT)).toEqual([{ kind: 'absent' }])
    expect(fetchStub).not.toHaveBeenCalled()
  })

  // covers: AC-3
  it('asks the site once for the window it was opened in, and once more in development only', async () => {
    const fetchStub = vi.fn(() => Promise.resolve({ ok: true, status: 200 }))

    withFetch(fetchStub)

    const seen = statesFrom(HELD)

    await waitFor(() => expect(seen.at(-1)?.kind).toBe('ready'))
    // React invokes an effect twice in development, so one ask here is one ask in production.
    expect(fetchStub.mock.calls.length).toBeLessThanOrEqual(2)
    expect(fetchStub).toHaveBeenCalledWith(
      HELD.ok ? HELD.value.href : '',
      expect.objectContaining({ method: 'HEAD' }),
    )
  })

  // covers: AC-3
  it('sets no state and logs nothing when the window goes while the check is in flight', async () => {
    let answer: (value: { ok: boolean; status: number }) => void = () => {}

    withFetch(
      vi.fn(
        () =>
          new Promise<{ ok: boolean; status: number }>((resolve) => {
            answer = resolve
          }),
      ),
    )

    const reported: string[] = []
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const view = render(<Probe found={HELD} onState={(state) => reported.push(state.kind)} />)

    view.unmount()
    answer({ ok: true, status: 200 })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(reported).toEqual(['checking'])
    expect(logged).not.toHaveBeenCalled()

    logged.mockRestore()
  })
})
