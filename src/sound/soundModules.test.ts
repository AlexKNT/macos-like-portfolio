import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/*
 * The baseline the modules this feature adds clear, read off the files rather than one case at a
 * time: the rules a render cannot see. Every value a control paints comes from the token layer, so
 * no module here holds a colour literal or a palette utility of its own, and every sound is
 * scheduled from the content table, so no module anywhere loads one.
 * Spec 0013, AC-2, AC-11, AC-14.
 */

/** The modules this feature adds under `src/`, which are the ones held to the baseline. */
const SOUND_MODULES = [
  'src/lib/sound.ts',
  'src/sound/SoundProvider.tsx',
  'src/sound/soundForChange.ts',
  'src/sound/useSound.ts',
  'src/sound/useWindowSounds.ts',
]

/** One module: where it is, and what it says. */
type Module = { readonly name: string; readonly source: string }

/** The modules, read off the disk with their comments taken out. */
function soundModules(): readonly Module[] {
  return SOUND_MODULES.map((name) => {
    const text = readFileSync(resolve(process.cwd(), name), 'utf8')

    return {
      name,
      // A colour named in prose is not one that is painted.
      source: text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, ''),
    }
  })
}

/** A palette utility: a colour the token layer already has a semantic name for. */
const PALETTE_UTILITY =
  /(?:^|[\s"'`])(?:bg|text|border|ring|outline|divide|from|via|to|fill|stroke|shadow|accent|caret|placeholder|decoration)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/

/** A colour literal, however it is written. */
const HEX_COLOUR = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

describe('the sound modules', () => {
  // covers: AC-14
  it('paint every colour from the token layer, with none of their own', () => {
    const modules = soundModules()
    const offenders: string[] = []

    // A scan that walked no files would pass silently, so the read is checked to be real.
    expect(modules).toHaveLength(SOUND_MODULES.length)

    for (const { name, source } of modules) {
      if (HEX_COLOUR.test(source)) {
        offenders.push(`${name} paints a colour literal`)
      }

      if (PALETTE_UTILITY.test(source)) {
        offenders.push(`${name} paints a palette utility`)
      }
    }

    expect(offenders, 'sound modules carrying their own colour').toEqual([])
  })

  // covers: AC-2, AC-11
  it('names a browser audio API in one module only, the edge the player is built behind', () => {
    const files = sourceFiles()

    expect(files.length).toBeGreaterThan(50)

    const holders = files.filter((name) =>
      /AudioContext|webkitAudioContext|new Audio\(/.test(read(name)),
    )

    // The one other name is the stand in the suites hand the player instead of a browser engine.
    expect(holders).toEqual(['src/lib/sound.ts', 'src/test/audio.ts'])
  })

  // covers: AC-11
  it('names no audio file at all, since every sound is scheduled rather than loaded', () => {
    const offenders = sourceFiles().filter((name) =>
      /['"`][^'"`]*\.(mp3|wav|ogg|m4a|aac|flac)['"`]/i.test(read(name)),
    )

    expect(offenders, 'modules naming an audio file').toEqual([])
  })
})

/** Every shipped module under `src/`, so a scan sees the whole tree rather than one folder.
 *  The suites themselves are left out: they are not built, and this one names what it looks for. */
function sourceFiles(dir = 'src'): readonly string[] {
  return readdirSync(resolve(process.cwd(), dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`

    if (entry.isDirectory()) {
      return sourceFiles(path)
    }

    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

/** One module's text, with its comments taken out. */
function read(name: string): string {
  return readFileSync(resolve(process.cwd(), name), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
}
