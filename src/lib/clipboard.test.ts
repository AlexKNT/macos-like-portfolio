import { afterEach, describe, expect, it, vi } from 'vitest'

import { copyText } from '#lib/clipboard'

/**
 * The one clipboard write in the app, and the two ways it can fail. Both are values rather than
 * throws, because a window shows them rather than catching them. Spec 0006, umbrella AC-2.
 */

/** Puts a clipboard on the environment for one check, since jsdom does not carry one. */
function withClipboard(value: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('copyText', () => {
  // covers: umbrella AC-2
  it('writes the text and hands it back when the clipboard takes it', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    withClipboard({ writeText })

    await expect(copyText('React.js')).resolves.toEqual({ ok: true, value: 'React.js' })
    expect(writeText).toHaveBeenCalledWith('React.js')
  })

  // covers: umbrella AC-2
  it('answers unsupported when the browser offers no clipboard at all', async () => {
    Reflect.deleteProperty(navigator, 'clipboard')

    await expect(copyText('React.js')).resolves.toEqual({
      ok: false,
      error: { kind: 'unsupported' },
    })
  })

  // covers: umbrella AC-2
  it('answers unsupported when the clipboard cannot write', async () => {
    withClipboard({})

    await expect(copyText('React.js')).resolves.toEqual({
      ok: false,
      error: { kind: 'unsupported' },
    })
  })

  // covers: umbrella AC-2
  it('answers refused, and never throws, when the write is rejected', async () => {
    withClipboard({ writeText: () => Promise.reject(new Error('denied')) })

    await expect(copyText('React.js')).resolves.toEqual({ ok: false, error: { kind: 'refused' } })
  })
})
