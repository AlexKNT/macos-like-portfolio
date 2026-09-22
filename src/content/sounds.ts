import type { Sound, SoundId } from '#content/types'

/*
 * The four sounds the desk plays, described as numbers rather than shipped as audio, so nothing
 * is fetched and no clip has to be sourced. Each row is a wave, a pitch it sweeps between, a
 * length and its own gain, which `#lib/sound` schedules when the desk asks for it.
 *
 * The levels are relative on purpose: the two events a visitor causes deliberately (a window
 * opening, and the pointer arriving on the dock) are the loud ones, and the two they get
 * without asking (a close, a minimise) are quieter, with the hover tick the smallest of all.
 * `sounds.test.ts` holds that order, so a row cannot be authored louder by accident.
 * Spec 0013, AC-1, AC-12.
 */

/** The four sounds, keyed by the union so a missing one fails to typecheck. */
export const SOUNDS: Record<SoundId, Sound> = {
  /** A window arriving: a short rise, which is what makes the open feel like one. */
  open: {
    id: 'open',
    wave: 'sine',
    fromHz: 420,
    toHz: 760,
    durationMs: 120,
    gain: 0.16,
  },
  /** A window leaving: the same shape falling, with a little noise so it reads as a swish. */
  close: {
    id: 'close',
    wave: 'sine',
    fromHz: 540,
    toHz: 250,
    durationMs: 140,
    gain: 0.14,
    noise: 0.12,
  },
  /** A window going down to the dock: lower, shorter and quieter, since it is not asked for. */
  minimise: {
    id: 'minimise',
    wave: 'triangle',
    fromHz: 360,
    toHz: 170,
    durationMs: 150,
    gain: 0.11,
    noise: 0.25,
  },
  /** The pointer arriving on a dock icon: a flat tick, the smallest level in the table. */
  hover: {
    id: 'hover',
    wave: 'sine',
    fromHz: 900,
    toHz: 900,
    durationMs: 45,
    gain: 0.05,
  },
}
