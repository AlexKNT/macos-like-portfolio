import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { HOME_SURFACE } from '#components/homeLines'

/*
 * The baseline the phone shell's own modules clear, over the files rather than over one case each:
 * the rules a render cannot see. The shell invents exactly one word, and it is read from
 * `homeLines.ts` and nowhere else, so no module of it words a heading, a sentence or a control
 * label of its own. It paints nothing but tokens, so no module holds a colour literal or a palette
 * utility. And it adds no live region, because the frame a window opens in already has the one the
 * app announces through.
 * Spec 0009, AC-14, AC-15.
 */

/** The modules this feature added to `src/components`, which are the phone shell's own. */
const SHELL_MODULES = [
  'HomeSurface.tsx',
  'HomeTile.tsx',
  'PhoneBar.tsx',
  'Clock.tsx',
  'homeLines.ts',
  'windowExit.ts',
]

/** One module of the phone shell: where it is, and what it says. */
type Module = { readonly name: string; readonly source: string }

/** The shell's modules, read off the disk with their comments taken out. */
function shellModules(): readonly Module[] {
  return SHELL_MODULES.map((name) => {
    const text = readFileSync(resolve(process.cwd(), 'src/components', name), 'utf8')

    return {
      name,
      // A colour or a word named in prose is not one that is painted or printed.
      source: text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, ''),
    }
  })
}

/** A palette utility: a colour the token layer already has a semantic name for. */
const PALETTE_UTILITY =
  /(?:^|[\s"'`])(?:bg|text|border|ring|outline|divide|from|via|to|fill|stroke|shadow|accent|caret|placeholder|decoration)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/

/** A colour literal, however it is written. */
const HEX_COLOUR = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

describe('the phone shell modules', () => {
  // covers: AC-15
  it('paint every colour from the token layer, with none of their own', () => {
    const modules = shellModules()
    const offenders: string[] = []

    // A scan that walked no files would pass silently, so the read is checked to be real.
    expect(modules).toHaveLength(SHELL_MODULES.length)

    for (const { name, source } of modules) {
      if (HEX_COLOUR.test(source)) {
        offenders.push(`${name} paints a colour literal`)
      }

      if (PALETTE_UTILITY.test(source)) {
        offenders.push(`${name} paints a palette utility`)
      }
    }

    expect(offenders, 'phone shell modules carrying their own colour').toEqual([])
  })

  // covers: AC-14
  it('keep the one word the shell invented in the words module alone', () => {
    const holders = shellModules().filter(({ source }) =>
      new RegExp(`'${HOME_SURFACE}'`).test(source),
    )

    expect(holders.map(({ name }) => name)).toEqual(['homeLines.ts'])
    expect(HOME_SURFACE.trim()).not.toBe('')
  })

  // covers: AC-14
  it('add no live region of their own, since the frame already announces through one', () => {
    const offenders = shellModules().filter(({ source }) => /aria-live/.test(source))

    expect(offenders.map(({ name }) => name)).toEqual([])
  })
})
