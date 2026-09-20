import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { composite, contrastRatio, parseColour, roundRatio } from '#lib/contrast'
import { darkOverrides, readTokenLayer, token } from '#lib/tokens'

/*
 * The contrast suite: it reads the token values out of `src/index.css`, computes the
 * WCAG ratio for every pair the app paints, and fails when one is under the bar. The
 * values are never retyped here, so weakening a token in the stylesheet fails the suite
 * rather than shipping. Spec 0002, AC-3, AC-4, AC-7.
 */

/*
 * The stylesheet read straight off disk rather than through a `?raw` import, because a
 * raw import comes back compiled, with the theme block already expanded into `:root`.
 * The suite has to read what the author wrote.
 */
const STYLESHEET = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

const LAYER = readTokenLayer(STYLESHEET)

type Mode = 'light' | 'dark'
type WallpaperTone = 'darkest' | 'lightest'

/** One pair the app paints: two tokens, the bar it must clear, and where it is used. */
type Pair = {
  readonly name: string
  readonly foreground: string
  readonly background: string
  readonly minimum: number
  readonly modes?: readonly Mode[]
  /** Set when the background is translucent, naming the tones it has to be laid over. */
  readonly over?: readonly WallpaperTone[]
}

const BOTH_MODES: readonly Mode[] = ['light', 'dark']
const BOTH_TONES: readonly WallpaperTone[] = ['darkest', 'lightest']

/**
 * The two worst case backdrop colours per mode, read off the two wallpaper images as
 * the 5th and 95th percentile of their tones. A translucent pair is composited over
 * these rather than over white: the light chrome has to hold over a dark region of the
 * light wallpaper, and the dark chrome over the lightest region of the dark one.
 */
const WALLPAPER_TONES: Record<Mode, Record<WallpaperTone, string>> = {
  light: { darkest: '#0131b0', lightest: '#dad3b6' },
  dark: { darkest: '#000e66', lightest: '#6e62ce' },
}

/**
 * The two window shadows. A shadow is not text and no 3:1 bar makes sense for one, and its ink
 * is translucent, so it cannot be an ordinary pair of the shape above either: what the suite can
 * hold is how much the ink darkens the surface it is laid on. That has to be visible at all, and
 * the quiet shadow has to stay softer than the focused one. Spec 0004, AC-3.
 */
const FOCUSED_WINDOW_SHADOW = {
  name: 'window shadow on the window surface',
  colour: '--color-shadow-window',
  minimum: 1.1,
} as const

const QUIET_WINDOW_SHADOW = {
  name: 'quiet window shadow on the window surface',
  colour: '--color-shadow-window-quiet',
  minimum: 1.05,
} as const

const WINDOW_SHADOWS = [FOCUSED_WINDOW_SHADOW, QUIET_WINDOW_SHADOW] as const

/** How much a translucent ink darkens the window surface it is laid on, in one mode. */
function shadowRatio(shadow: { readonly colour: string }, mode: Mode): number {
  const surface = token(LAYER, mode, '--color-surface')

  return contrastRatio(composite(token(LAYER, mode, shadow.colour), surface), surface)
}

/**
 * Every contrast bar the app holds itself to. Body text is 4.5:1, large text and the
 * graphics that carry meaning (a border that marks a control, an icon, the focus ring)
 * are 3:1. Purely decorative hairlines are not listed: `--color-border` and
 * `--color-divider` dress a surface, they never mark a control on their own.
 */
const PAIRS: readonly Pair[] = [
  // text on the surfaces the app paints
  {
    name: 'text on surface',
    foreground: '--color-text',
    background: '--color-surface',
    minimum: 4.5,
  },
  {
    name: 'text on surface-sunken',
    foreground: '--color-text',
    background: '--color-surface-sunken',
    minimum: 4.5,
  },
  {
    name: 'text on surface-raised',
    foreground: '--color-text',
    background: '--color-surface-raised',
    minimum: 4.5,
  },
  {
    name: 'muted text on surface',
    foreground: '--color-text-muted',
    background: '--color-surface',
    minimum: 4.5,
  },
  {
    name: 'muted text on surface-sunken',
    // The quiet window's title: a window that does not have the keyboard reads its title in
    // this pair, so the softer treatment is a weight of ink and of shadow, not a gap in the
    // suite. Spec 0004, AC-3.
    foreground: '--color-text-muted',
    background: '--color-surface-sunken',
    minimum: 4.5,
  },
  {
    name: 'quiet text on surface',
    foreground: '--color-text-subtle',
    background: '--color-surface',
    minimum: 4.5,
  },
  {
    name: 'link on surface',
    foreground: '--color-link',
    background: '--color-surface',
    minimum: 4.5,
  },

  // the paper is a page, and it stays light in both modes, so its ink is checked where
  // the app paints it today: in light mode. A window that paints on the paper brings its
  // own ink, and that decision belongs to the window (see design.md, Open items)
  {
    name: 'text on surface-paper',
    foreground: '--color-text',
    background: '--color-surface-paper',
    minimum: 4.5,
    modes: ['light'],
  },
  {
    name: 'quiet text on surface-paper',
    foreground: '--color-text-subtle',
    background: '--color-surface-paper',
    minimum: 4.5,
    modes: ['light'],
  },
  {
    name: 'link on surface-paper',
    foreground: '--color-link',
    background: '--color-surface-paper',
    minimum: 4.5,
    modes: ['light'],
  },

  // the accent
  {
    name: 'text on accent',
    foreground: '--color-text-on-accent',
    background: '--color-accent',
    minimum: 4.5,
  },
  {
    name: 'selected row text',
    foreground: '--color-accent-quiet-fg',
    background: '--color-accent-quiet-bg',
    minimum: 4.5,
  },
  {
    name: 'accent as an icon',
    foreground: '--color-accent',
    background: '--color-surface',
    minimum: 3,
  },

  // status
  {
    name: 'success on surface',
    foreground: '--color-success',
    background: '--color-surface',
    minimum: 4.5,
  },
  {
    name: 'warning on surface',
    foreground: '--color-warning',
    background: '--color-surface',
    minimum: 4.5,
  },
  {
    name: 'danger on surface',
    foreground: '--color-danger',
    background: '--color-surface',
    minimum: 4.5,
  },
  {
    name: 'info on surface',
    foreground: '--color-info',
    background: '--color-surface',
    minimum: 4.5,
  },

  // the glass, composited over the wallpaper tones it can sit on
  {
    name: 'menu bar text on chrome',
    foreground: '--color-text',
    background: '--color-chrome',
    minimum: 4.5,
    over: BOTH_TONES,
  },
  // These two are the desktop labels' pairs and the greeting's: the greeting's lead line and
  // display line both paint in `--color-desktop-text` on the scrim, and the greeting and the
  // labels both swap to the hover wash under the pointer. Spec 0003, AC-2.
  {
    name: 'desktop label on its wash',
    foreground: '--color-desktop-text',
    background: '--color-scrim',
    minimum: 4.5,
    over: BOTH_TONES,
  },
  {
    name: 'hovered desktop label',
    foreground: '--color-desktop-text',
    background: '--color-glass-hover',
    minimum: 4.5,
    over: BOTH_TONES,
  },

  // the graphics that carry meaning
  {
    name: 'control boundary on surface',
    foreground: '--color-border-strong',
    background: '--color-surface',
    minimum: 3,
  },
  {
    name: 'control boundary on surface-sunken',
    foreground: '--color-border-strong',
    background: '--color-surface-sunken',
    minimum: 3,
  },
  {
    name: 'ring on surface',
    foreground: '--color-focus-outer',
    background: '--color-surface',
    minimum: 3,
  },
  {
    name: 'ring on surface-sunken',
    foreground: '--color-focus-outer',
    background: '--color-surface-sunken',
    minimum: 3,
  },
  {
    name: 'ring on the ground colour',
    foreground: '--color-focus-outer',
    background: '--color-background',
    minimum: 3,
  },
  {
    name: 'ring on the menu bar',
    foreground: '--color-focus-outer',
    background: '--color-chrome',
    minimum: 3,
    over: BOTH_TONES,
  },
  // The pair spec 0002 could not judge, because it had no control on the translucent panel
  // yet: the dock's own ring, on the dock's own glass. Spec 0003, AC-9.
  {
    name: 'ring on the dock panel',
    foreground: '--color-focus-outer',
    background: '--color-glass-panel',
    minimum: 3,
    over: BOTH_TONES,
  },
  // The dot under a dock icon that says its window is open, quieter while it is minimised.
  {
    name: 'dock indicator on the panel',
    foreground: '--color-text',
    background: '--color-glass-panel',
    minimum: 3,
    over: BOTH_TONES,
  },
]

/**
 * The three lights are the one exception, and it is stated rather than hidden: the spec
 * fixes their colours (they picture a window, they do not change with the mode), and no
 * single red, amber and green can clear 3:1 against both a light and a dark title bar.
 * Each light is a button with its own accessible name, so nothing depends on seeing the
 * colour, and the floor below only asks that the light is distinguishable from the bar.
 */
const LIGHT_PAIRS: readonly Pair[] = [
  {
    name: 'close light on the title bar',
    foreground: '--color-traffic-close',
    background: '--color-surface-sunken',
    minimum: 1.2,
  },
  {
    name: 'minimise light on the title bar',
    foreground: '--color-traffic-minimise',
    background: '--color-surface-sunken',
    minimum: 1.2,
  },
  {
    name: 'zoom light on the title bar',
    foreground: '--color-traffic-zoom',
    background: '--color-surface-sunken',
    minimum: 1.2,
  },
]

/**
 * The tokens whose value has to change with the mode. A token missing from either block
 * is a token that stops following the visitor, so the list is explicit and checked.
 */
const MODE_DEPENDENT: readonly string[] = [
  '--color-background',
  '--color-scrim',
  '--color-surface',
  '--color-surface-sunken',
  '--color-surface-raised',
  '--color-chrome',
  '--color-glass-panel',
  '--color-glass-hover',
  '--color-text',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-text-on-accent',
  '--color-border',
  '--color-border-strong',
  '--color-divider',
  '--color-accent',
  '--color-accent-quiet-bg',
  '--color-accent-quiet-fg',
  '--color-link',
  '--color-focus-inner',
  '--color-focus-outer',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-info',
  '--color-shadow-window',
  '--color-shadow-window-quiet',
]

/** The ratio for one pair in one mode, composited over a wallpaper tone where it has to be. */
function ratioFor(pair: Pair, mode: Mode, tone?: WallpaperTone): number {
  const foreground = token(LAYER, mode, pair.foreground)
  const background = token(LAYER, mode, pair.background)

  if (!tone) {
    return contrastRatio(foreground, background)
  }

  const fixture = parseColour(WALLPAPER_TONES[mode][tone])

  if (!fixture) {
    throw new Error(`the ${mode} ${tone} fixture is not a colour`)
  }

  return contrastRatio(foreground, composite(background, fixture))
}

describe('the token layer', () => {
  it('declares a light and a dark value for every mode dependent token', () => {
    const overridden = darkOverrides(STYLESHEET)
    const missingDark = MODE_DEPENDENT.filter((name) => !overridden.includes(name))
    const missingLight = MODE_DEPENDENT.filter((name) => !LAYER.light[name])

    expect(missingDark, 'tokens with no dark value').toEqual([])
    expect(missingLight, 'tokens with no light value').toEqual([])
  })

  it('keeps every text token opaque, so only a background ever composites', () => {
    const translucent = Object.entries(LAYER.light)
      .filter(([name]) => name.startsWith('--color-text') || name === '--color-desktop-text')
      .filter(([, colour]) => colour.alpha < 1)
      .map(([name]) => name)

    expect(translucent).toEqual([])
  })

  it('clears the bar for every pair, in both modes', () => {
    const failures: string[] = []

    for (const mode of BOTH_MODES) {
      for (const pair of [...PAIRS, ...LIGHT_PAIRS]) {
        if (pair.modes && !pair.modes.includes(mode)) {
          continue
        }

        const tones: readonly (WallpaperTone | undefined)[] = pair.over ?? [undefined]

        for (const tone of tones) {
          const ratio = roundRatio(ratioFor(pair, mode, tone))

          if (ratio < pair.minimum) {
            failures.push(
              `${mode}${tone ? ` over the ${tone} wallpaper tone` : ''}: ${pair.name} is ${ratio}:1, below ${pair.minimum}:1`,
            )
          }
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('names a token the suite can read for every pair', () => {
    const unreadable = PAIRS.flatMap((pair) => [pair.foreground, pair.background]).filter(
      (name) => !LAYER.light[name] || !LAYER.dark[name],
    )

    expect(unreadable).toEqual([])
  })

  it('keeps every window shadow visible on the window surface, in both modes', () => {
    const failures: string[] = []

    for (const mode of BOTH_MODES) {
      for (const shadow of WINDOW_SHADOWS) {
        const ratio = roundRatio(shadowRatio(shadow, mode))

        if (ratio < shadow.minimum) {
          failures.push(`${mode}: ${shadow.name} is ${ratio}:1, below ${shadow.minimum}:1`)
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('keeps the quiet window shadow softer than the focused one, in both modes', () => {
    const louder = BOTH_MODES.filter(
      (mode) => shadowRatio(QUIET_WINDOW_SHADOW, mode) >= shadowRatio(FOCUSED_WINDOW_SHADOW, mode),
    )

    expect(louder, 'modes where the quiet window shadow is not the softer of the two').toEqual([])
  })
})
