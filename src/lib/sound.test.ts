import { afterEach, describe, expect, it, vi } from 'vitest'

import { SOUNDS } from '#content/sounds'
import { SOUND_STORAGE_KEY, createSoundPlayer, readMuted, writeMuted } from '#lib/sound'
import { restoreAudio, stubAudio } from '../test/audio'

/*
 * The player edge and the stored choice, with no audio in sight: what the desk builds, what it
 * refuses to build, and what it remembers. The engine is stood in for, so a check reads the
 * schedule the player wrote rather than a sound nobody can hear. Spec 0013, AC-2, AC-9, AC-10,
 * AC-11, AC-12, AC-13.
 */

afterEach(() => {
  localStorage.clear()
  restoreAudio()
  vi.restoreAllMocks()
})

describe('the stored choice', () => {
  // covers: AC-10
  it('reads a missing value, and every value it does not know, as sound on', () => {
    expect(readMuted()).toBe(false)

    for (const stored of ['on', 'true', '', 'quiet']) {
      localStorage.setItem(SOUND_STORAGE_KEY, stored)

      expect(readMuted(), stored).toBe(false)
    }
  })

  // covers: AC-10
  it('reads only the one value it understands as muted', () => {
    localStorage.setItem(SOUND_STORAGE_KEY, 'muted')

    expect(readMuted()).toBe(true)
  })

  // covers: AC-10
  it('answers sound on when there is no storage to read, and when reading it throws', () => {
    expect(readMuted(undefined)).toBe(false)

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('a private window refuses to read')
    })

    expect(readMuted()).toBe(false)
  })

  // covers: AC-10
  it('writes the choice under one key, and swallows a storage that refuses the write', () => {
    writeMuted(true)
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('muted')

    writeMuted(false)
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on')

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('a private window refuses to write')
    })

    expect(() => writeMuted(true)).not.toThrow()
  })
})

describe('the player with no engine to hand', () => {
  // covers: AC-2
  it('answers unsupported, builds nothing, and throws nothing at all', () => {
    const player = createSoundPlayer()

    expect(() => player.open()).not.toThrow()
    expect(player.isRunning()).toBe(false)
    expect(player.play('open', false)).toBe('unsupported')
    expect(() => player.silence()).not.toThrow()
  })

  // covers: AC-3
  it('plays nothing at all before the visitor has touched the page', () => {
    const audio = stubAudio()
    const player = createSoundPlayer()

    expect(player.play('open', false)).toBe('unsupported')
    expect(audio.contexts).toBe(0)
    expect(audio.oscillators).toHaveLength(0)
  })
})

describe('the player with an engine', () => {
  // covers: AC-2, AC-12
  it('builds one engine for the page, and resumes one the browser left suspended', () => {
    const audio = stubAudio()
    const player = createSoundPlayer()

    player.open()
    expect(audio.contexts).toBe(1)
    expect(audio.resumes).toBe(1)
    expect(player.isRunning()).toBe(true)

    // A second call finds the same engine, already running, so nothing is built and no resume
    // is asked for a second time.
    player.open()
    expect(audio.contexts).toBe(1)
    expect(audio.resumes).toBe(1)
  })

  // covers: AC-2, AC-12
  it('schedules the row the table holds: its wave, its sweep and its own gain', () => {
    const audio = stubAudio('running')
    const player = createSoundPlayer()
    const row = SOUNDS.open

    player.open()
    expect(player.play('open', false)).toBe('played')

    expect(audio.oscillators).toHaveLength(1)
    expect(audio.oscillators[0]?.type).toBe(row.wave)
    expect(audio.oscillators[0]?.frequency.calls).toEqual([
      { kind: 'set', value: row.fromHz },
      { kind: 'ramp', value: row.toHz },
    ])
    expect(audio.gains[0]?.calls).toEqual([
      { kind: 'set', value: 0 },
      { kind: 'ramp', value: row.gain },
      { kind: 'ramp', value: 0 },
    ])
  })

  // covers: AC-2, AC-12
  it('mixes in the noise share of the rows that carry one, and none for the rows that do not', () => {
    const audio = stubAudio('running')
    const player = createSoundPlayer()

    player.open()
    player.play('open', false)
    expect(audio.bursts).toBe(0)

    player.play('close', false)
    expect(audio.bursts).toBe(1)
  })

  // covers: AC-12
  it('lets a second sound through whole, with no limit and no queue', () => {
    const audio = stubAudio('running')
    const player = createSoundPlayer()

    player.open()
    player.play('open', false)
    player.play('hover', false)

    expect(audio.oscillators).toHaveLength(2)
    expect(audio.gains).toHaveLength(2)
  })

  // covers: AC-9
  it('builds nothing at all while the desk is muted', () => {
    const audio = stubAudio('running')
    const player = createSoundPlayer()

    player.open()

    expect(player.play('hover', true)).toBe('muted')
    expect(audio.oscillators).toHaveLength(0)
    expect(audio.gains).toHaveLength(0)
  })

  // covers: AC-9
  it('ramps a sound in flight out rather than cutting it dead, and stops it with the ramp', () => {
    const audio = stubAudio('running')
    const player = createSoundPlayer()

    player.open()
    player.play('hover', false)

    const tone = audio.oscillators[0]

    player.silence()

    const calls = audio.gains[0]?.calls ?? []
    const last = calls[calls.length - 1]

    expect(last?.kind).toBe('ramp')
    expect(last?.value).toBe(0)
    // The tone is stopped when the ramp lands rather than left sounding behind it, so a silence
    // is one sound going quiet rather than a click.
    expect(tone?.stops).toHaveLength(2)
  })
})
