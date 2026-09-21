import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkFileIsServed } from '#lib/files'

/**
 * The one check the Resume window makes at the edge, and the three ways it answers. Every answer is
 * a value rather than a throw, because the window shows what it gets instead of catching it, and
 * because the registry suite renders this window with no stub and a synchronous unmount.
 * Spec 0007, AC-4, AC-7.
 */

/** The href the window checks, which is the one the content layer holds. */
const HREF = '/files/resume.pdf'

/** The real `fetch`, so each check puts it back and the environment is left as it was found. */
const REAL_FETCH = globalThis.fetch

/** Puts a `fetch` on the environment for one check, or takes it away by passing `undefined`. */
function withFetch(value: unknown): void {
  Object.defineProperty(globalThis, 'fetch', { value, configurable: true, writable: true })
}

afterEach(() => {
  withFetch(REAL_FETCH)
})

describe('checkFileIsServed', () => {
  // covers: AC-4
  it('hands the href back when the site answers that the file is served', async () => {
    withFetch(vi.fn(() => Promise.resolve({ ok: true, status: 200 })))

    await expect(checkFileIsServed(HREF)).resolves.toEqual({ ok: true, value: HREF })
  })

  // covers: AC-4
  it('answers missing when the site answers without the file', async () => {
    withFetch(vi.fn(() => Promise.resolve({ ok: false, status: 404 })))

    await expect(checkFileIsServed(HREF)).resolves.toEqual({
      ok: false,
      error: { kind: 'missing' },
    })
  })

  // covers: AC-4
  it('answers unreachable when the request throws, and never throws itself', async () => {
    withFetch(vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    await expect(checkFileIsServed(HREF)).resolves.toEqual({
      ok: false,
      error: { kind: 'unreachable' },
    })
  })

  // covers: AC-4, AC-7
  it('answers unreachable where there is no fetch to call at all', async () => {
    withFetch(undefined)

    await expect(checkFileIsServed(HREF)).resolves.toEqual({
      ok: false,
      error: { kind: 'unreachable' },
    })
  })

  // covers: AC-4
  it('asks whether the file is served without pulling it down, and carries the signal it was given', async () => {
    const fetchStub = vi.fn(() => Promise.resolve({ ok: true, status: 200 }))
    const controller = new AbortController()

    withFetch(fetchStub)
    await checkFileIsServed(HREF, controller.signal)

    expect(fetchStub).toHaveBeenCalledWith(HREF, { method: 'HEAD', signal: controller.signal })
  })
})
