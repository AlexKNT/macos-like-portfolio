import { afterEach, describe, expect, it, vi } from 'vitest'

import markup from '../../index.html?raw'
import {
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  initAppearance,
  readPreference,
  resolveMode,
} from '#lib/appearance'
import { WALLPAPER } from '#content/theme'

/** A store holding one value, which is all the read side of the preference needs. */
function storageWith(value: string | null): Storage {
  return { getItem: () => value } as unknown as Storage
}

/** A store that throws on read, which is what a blocked or unavailable store does. */
function unreadableStorage(): Storage {
  return {
    getItem() {
      throw new Error('the store is not readable here')
    },
  } as unknown as Storage
}

/** Stops the answer to one load from leaking into the next test. */
function answerSystemPreference(prefersDark: boolean): void {
  vi.stubGlobal('matchMedia', () => ({ matches: prefersDark }) as MediaQueryList)
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
  document.documentElement.removeAttribute('style')
})

describe('readPreference', () => {
  it('falls back to the system when nothing is stored', () => {
    expect(readPreference(storageWith(null))).toBe('system')
  })

  it('reads back each preference the app understands, including system', () => {
    expect(readPreference(storageWith('light'))).toBe('light')
    expect(readPreference(storageWith('dark'))).toBe('dark')
    expect(readPreference(storageWith('system'))).toBe('system')
  })

  it('falls back to the system when the stored value is not one it knows', () => {
    expect(readPreference(storageWith('sepia'))).toBe('system')
  })

  it('falls back to the system when the store cannot be read', () => {
    expect(readPreference(unreadableStorage())).toBe('system')
    expect(readPreference(undefined)).toBe('system')
  })
})

describe('resolveMode', () => {
  it('resolves the four combinations the state table describes', () => {
    expect(resolveMode('system', false)).toBe('light')
    expect(resolveMode('system', true)).toBe('dark')
    expect(resolveMode('light', true)).toBe('light')
    expect(resolveMode('dark', false)).toBe('dark')
  })
})

describe('applyAppearance', () => {
  it('writes the mode and both wallpapers onto the document element', () => {
    applyAppearance('dark')

    const root = document.documentElement

    expect(root.dataset.theme).toBe('dark')
    expect(root.style.getPropertyValue('--wallpaper-image')).toBe(
      `url('${WALLPAPER.dark.imageUrl}')`,
    )
    expect(root.style.getPropertyValue('--wallpaper-image-compact')).toBe(
      `url('${WALLPAPER.compact.imageUrl}')`,
    )
  })
})

describe('initAppearance', () => {
  it('follows the system setting on a first visit', () => {
    answerSystemPreference(true)
    vi.stubGlobal('localStorage', storageWith(null))

    expect(initAppearance()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('lets a stored choice win over the system setting', () => {
    answerSystemPreference(true)
    vi.stubGlobal('localStorage', storageWith('light'))

    expect(initAppearance()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

describe('the appearance storage key', () => {
  it('is the same literal the pre paint script in index.html writes', () => {
    expect(markup).toContain(APPEARANCE_STORAGE_KEY)
  })
})
