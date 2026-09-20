import { describe, expect, it } from 'vitest'

import { COPY_HINT, MARK_GLYPH, PROMPT_LINE, emptyGroupLine } from '#windows/skills/skillsLines'

/**
 * The few lines the Skills window says in words of its own. They are fixed text rather than
 * anything read from the content layer, so nothing here depends on what the portfolio holds, and
 * the one line that describes a state is stable: the same call gives the same words.
 * Spec 0006, AC-9, AC-10.
 */

describe('the Skills window’s own words', () => {
  // covers: AC-10
  it('has a prompt line and a hint that say something, and say different things', () => {
    expect(PROMPT_LINE.trim().length).toBeGreaterThan(0)
    expect(COPY_HINT.trim().length).toBeGreaterThan(0)
    expect(PROMPT_LINE).not.toBe(COPY_HINT)
  })

  // covers: AC-6
  it('marks an area with one glyph, since the category name carries the meaning', () => {
    expect([...MARK_GLYPH]).toHaveLength(1)
  })

  // covers: AC-9
  it('words the empty area line as a finished sentence, and gives the same one every time', () => {
    const line = emptyGroupLine()

    expect(line.trim().length).toBeGreaterThan(0)
    expect(line.endsWith('.')).toBe(true)
    expect(emptyGroupLine()).toBe(line)
  })
})
