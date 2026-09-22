import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  countLine,
  emptyControlLabel,
  emptyControlWord,
  emptyLine,
} from '#windows/archive/archiveLines'

/**
 * The words this window says, which are the only ones a visitor reads in it: the count over the
 * leftovers, the line an empty Archive shows, and the two words on its control. The second half is
 * the rule a reading cannot check: no other module of the window writes any of these words itself,
 * so there is one place to change them.
 * Spec 0012, AC-3, AC-4, AC-6, AC-13.
 */

const ARCHIVE_DIR = resolve(process.cwd(), 'src/windows/archive')

/** The words module itself, which is the one file allowed to hold them. */
const WORDS_MODULE = 'archiveLines.ts'

/** The words as the window shows them, written out so the check does not ask the module twice. */
const WORDS = ['2 items', '1 item', 'The Archive is empty.', 'Empty', 'Empty Archive']

/** One module of the window folder: where it is, and what it says. */
type Module = { readonly path: string; readonly text: string }

/** Every source module under `src/windows/archive`, tests and the words module left out. */
function otherModules(): readonly Module[] {
  return readdirSync(ARCHIVE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))
    .filter((name) => name !== WORDS_MODULE)
    .sort()
    .map((name) => ({
      path: join(ARCHIVE_DIR, name),
      text: readFileSync(join(ARCHIVE_DIR, name), 'utf8'),
    }))
}

describe('the Archive words', () => {
  // covers: AC-3, AC-4, AC-6
  it('answers the count, the empty line and the two words on the control', () => {
    expect(countLine(2)).toBe('2 items')
    expect(countLine(1)).toBe('1 item')
    expect(emptyLine()).toBe('The Archive is empty.')
    expect(emptyControlWord()).toBe('Empty')
    expect(emptyControlLabel()).toBe('Empty Archive')
  })

  // covers: AC-4
  it('carries the visible word inside the announced name', () => {
    // A voice control speaking what is on screen has to reach the control, so the name a screen
    // reader hears contains the word the eye reads rather than replacing it.
    expect(emptyControlLabel()).toContain(emptyControlWord())
  })

  // covers: AC-13
  it('keeps every word of this window in the words module', () => {
    const modules = otherModules()

    // A scan that walked no files would pass silently, so the folder is checked to be real.
    expect(modules.length).toBeGreaterThan(1)

    const offenders: string[] = []

    for (const { path, text } of modules) {
      for (const word of WORDS) {
        if (
          text.includes(`'${word}'`) ||
          text.includes(`"${word}"`) ||
          text.includes(`\`${word}\``)
        ) {
          offenders.push(`${path} writes ${word}`)
        }
      }
    }

    expect(offenders, 'window modules writing a word of their own').toEqual([])
  })
})
