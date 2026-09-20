import { WALLPAPER } from '#content/theme'

/** The one key the appearance preference is stored under. */
export const APPEARANCE_STORAGE_KEY = 'portfolio.appearance'

/**
 * What a visitor has asked for. `system` means they have not chosen, so the operating
 * system decides. Only the resolved mode is ever written to the document.
 */
export type AppearancePreference = 'light' | 'dark' | 'system'

/** The appearance actually painted: the preference with `system` already resolved. */
export type AppearanceMode = 'light' | 'dark'

/** Whether a stored value is one of the three the app understands. */
function isPreference(value: string | null): value is AppearancePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * The browser's storage, or undefined when there is none to read (a private window, an
 * embedded frame, a test). Reading it is wrapped because the property itself can throw.
 */
function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/**
 * Reads the saved appearance preference. Returns the preference, or `system` when
 * nothing is stored, when the stored value is not one the app understands, and when
 * the store cannot be read at all. Spec 0002, AC-2.
 */
export function readPreference(
  storage: Storage | undefined = browserStorage(),
): AppearancePreference {
  if (!storage) {
    return 'system'
  }

  try {
    const stored = storage.getItem(APPEARANCE_STORAGE_KEY)
    return isPreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Resolves the preference against the system setting. Pure: the caller passes what the
 * system says, so the same pair always gives the same mode.
 */
export function resolveMode(
  preference: AppearancePreference,
  systemPrefersDark: boolean,
): AppearanceMode {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light'
  }

  return preference
}

/**
 * The one side effect in this module: writes the resolved mode and the wallpapers onto
 * the document element, so the stylesheet follows without a class on every component.
 * The compact path is written too, and the base layer prefers it on a narrow screen.
 * Spec 0002, AC-2, AC-8.
 */
export function applyAppearance(mode: AppearanceMode): void {
  const root = document.documentElement

  root.dataset.theme = mode
  root.style.setProperty('--wallpaper-image', `url('${WALLPAPER[mode].imageUrl}')`)
  root.style.setProperty('--wallpaper-image-compact', `url('${WALLPAPER.compact.imageUrl}')`)
}

/** What the operating system asks for. False when the platform cannot be asked. */
function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Reads the preference, resolves it against the system setting and applies it.
 * Called once from `main.tsx` before the desktop renders; returns the mode it applied,
 * so a caller can log or test it. The pre paint answer comes from the script in
 * `index.html`, which repeats the storage key because it cannot import this module.
 * Spec 0002, AC-2.
 */
export function initAppearance(): AppearanceMode {
  const mode = resolveMode(readPreference(), systemPrefersDark())

  applyAppearance(mode)

  return mode
}
