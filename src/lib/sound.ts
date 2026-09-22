import { SOUNDS } from '#content/sounds'
import type { SoundId } from '#content/types'

/*
 * The browser's own sound engine, behind one small player, and the only module in the whole app
 * that names Web Audio. Nothing is loaded and nothing is fetched: a sound is scheduled from the
 * table in the content layer at the moment it plays.
 *
 * It holds no module level state. `createSoundPlayer` builds one player, and the player owns the
 * one engine and every sound still in flight, so a suite gets a player of its own rather than
 * sharing the page's. Every call answers a value and none of them throws: an environment with no
 * audio engine at all, which is what a test runner looks like, is an ordinary answer rather than
 * a fault. Spec 0013, AC-2, AC-9, AC-11, AC-12.
 */

/** The one key the sound preference is stored under, beside the appearance key. */
export const SOUND_STORAGE_KEY = 'portfolio.sound'

/** What the desk did with a request to play one sound. */
export type SoundOutcome = 'played' | 'muted' | 'unsupported'

/** The one player a page holds: it owns the engine and the sounds still sounding. */
export type SoundPlayer = {
  /** Creates the engine, or resumes one a browser opened suspended. Safe to call twice. */
  readonly open: () => void
  /** Whether the engine exists and reports itself running, which is when a sound can be heard. */
  readonly isRunning: () => boolean
  /** Plays one sound, or answers `muted`/`unsupported` without creating a node. */
  readonly play: (id: SoundId, muted: boolean) => SoundOutcome
  /** Ramps every sound in flight out rather than cutting it, so silencing never clicks. */
  readonly silence: () => void
}

/** The share of a sound's own length its gain spends rising, so a tick never clicks as it starts. */
const ATTACK_SHARE = 0.15

/** How long a mute takes to ramp a sounding tone out, in seconds. */
const SILENCE_SECONDS = 0.04

/** The shortest span a ramp may take, so a zero length schedule never reaches the browser. */
const MIN_SECONDS = 0.01

/** How long the white noise a whoosh mixes in is, in seconds. */
const NOISE_SECONDS = 0.08

/** The window's audio constructor: the standard name first, the prefixed one after it. */
type AudioWindow = Window & {
  readonly AudioContext?: typeof AudioContext
  readonly webkitAudioContext?: typeof AudioContext
}

/**
 * The browser's audio constructor, or undefined in an environment that has none: a test runner,
 * a very old browser, and a document with no window at all all answer undefined rather than
 * throwing. Spec 0013, AC-2.
 */
function audioConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const candidate: AudioWindow = window

  return candidate.AudioContext ?? candidate.webkitAudioContext
}

/**
 * The browser's storage, or undefined when there is none to read (a private window, an embedded
 * frame, a test). Reading the property itself can throw, which is why it sits in a guard.
 */
function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/**
 * Reads the saved sound preference. Answers `true` only for the one stored value it understands,
 * and `false` for a value that is missing, unreadable or not one it knows, so the desk is never
 * stuck silent. Spec 0013, AC-10.
 */
export function readMuted(storage: Storage | undefined = browserStorage()): boolean {
  if (storage === undefined) {
    return false
  }

  try {
    return storage.getItem(SOUND_STORAGE_KEY) === 'muted'
  } catch {
    return false
  }
}

/**
 * Writes the saved sound preference, and is the only writer of the key. A storage with nowhere
 * to write (a private window, a test) is swallowed: the desk plays for this visit either way.
 * Spec 0013, AC-10.
 */
export function writeMuted(muted: boolean): void {
  const storage = browserStorage()

  if (storage === undefined) {
    return
  }

  try {
    storage.setItem(SOUND_STORAGE_KEY, muted ? 'muted' : 'on')
  } catch {
    // A storage that refuses the write is not an error the desk shows anyone.
  }
}

/** One sound that is sounding: the node its level runs through, and what to stop when muted. */
type LiveSound = {
  readonly gain: GainNode
  readonly sources: readonly AudioScheduledSourceNode[]
}

/**
 * Builds the one player for a page. The engine is created lazily, on the visitor's first real
 * gesture rather than on load, and it is never rebuilt: a browser that hands one back suspended
 * is resumed instead, because a sound scheduled on a suspended engine is never heard.
 *
 * `play` answers `muted` without creating anything while the desk is silenced, and `unsupported`
 * when there is no engine to hand yet or none at all, which is what keeps a page that nobody has
 * touched silent. Spec 0013, AC-2, AC-3, AC-9.
 */
export function createSoundPlayer(): SoundPlayer {
  let context: AudioContext | null = null
  let noiseBuffer: AudioBuffer | null = null
  let live: readonly LiveSound[] = []

  /** The engine, created once and only ever through `open`. */
  function engine(): AudioContext | null {
    if (context !== null) {
      return context
    }

    const Constructor = audioConstructor()

    if (Constructor === undefined) {
      return null
    }

    try {
      context = new Constructor()
    } catch {
      context = null
    }

    return context
  }

  /** A short buffer of white noise, built once and reused by every whoosh. */
  function noiseFor(engineContext: AudioContext): AudioBuffer {
    if (noiseBuffer !== null) {
      return noiseBuffer
    }

    const frames = Math.max(Math.ceil(engineContext.sampleRate * NOISE_SECONDS), 1)
    const buffer = engineContext.createBuffer(1, frames, engineContext.sampleRate)
    const channel = buffer.getChannelData(0)

    for (let frame = 0; frame < frames; frame += 1) {
      channel[frame] = Math.random() * 2 - 1
    }

    noiseBuffer = buffer

    return buffer
  }

  /**
   * Schedules one row of the table, and answers the sound it left sounding. A tone that starts
   * at full level clicks, so every sound rises to its own gain and falls back to silence before
   * it stops; the optional noise share runs through the same level, so one node carries the
   * whole envelope. Spec 0013, AC-2, AC-12.
   */
  function schedule(id: SoundId, at: number): LiveSound | null {
    const engineContext = context

    if (engineContext === null) {
      return null
    }

    const row = SOUNDS[id]
    const seconds = Math.max(row.durationMs / 1000, MIN_SECONDS)
    const attack = Math.max(seconds * ATTACK_SHARE, MIN_SECONDS)
    const gain = engineContext.createGain()

    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(row.gain, at + attack)
    gain.gain.linearRampToValueAtTime(0, at + seconds)
    gain.connect(engineContext.destination)

    const oscillator = engineContext.createOscillator()

    oscillator.type = row.wave
    oscillator.frequency.setValueAtTime(row.fromHz, at)
    oscillator.frequency.linearRampToValueAtTime(row.toHz, at + seconds)
    oscillator.connect(gain)
    oscillator.start(at)
    oscillator.stop(at + seconds)

    const sources: AudioScheduledSourceNode[] = [oscillator]

    if (row.noise !== undefined && row.noise > 0) {
      const burst = engineContext.createBufferSource()
      const share = engineContext.createGain()

      burst.buffer = noiseFor(engineContext)
      share.gain.setValueAtTime(row.noise, at)
      burst.connect(share)
      share.connect(gain)
      burst.start(at)
      burst.stop(at + seconds)
      sources.push(burst)
    }

    const sound: LiveSound = { gain, sources }

    // The tone is the sound's clock, so one ends when the other does and nothing is left held.
    oscillator.onended = () => {
      live = live.filter((entry) => entry.gain !== gain)
    }

    return sound
  }

  function open(): void {
    const engineContext = engine()

    if (engineContext === null || engineContext.state === 'running') {
      return
    }

    // A browser may hand the engine back suspended even inside a gesture, and it may refuse the
    // resume outright. Neither is an error here: the caller asks `isRunning` and, while the
    // answer is no, keeps the listener that a further gesture will arrive through.
    void engineContext.resume().catch(() => undefined)
  }

  function isRunning(): boolean {
    return context !== null && context.state === 'running'
  }

  function play(id: SoundId, muted: boolean): SoundOutcome {
    if (muted) {
      return 'muted'
    }

    // No engine, or one that is still suspended, means no node is created: a page nobody has
    // touched stays silent, and a hover before the first press plays nothing.
    if (context === null || context.state !== 'running') {
      return 'unsupported'
    }

    const sound = schedule(id, context.currentTime)

    if (sound === null) {
      return 'unsupported'
    }

    live = [...live, sound]

    return 'played'
  }

  function silence(): void {
    const engineContext = context

    if (engineContext === null || live.length === 0) {
      return
    }

    const now = engineContext.currentTime

    for (const sound of live) {
      sound.gain.gain.cancelScheduledValues(now)
      sound.gain.gain.setValueAtTime(sound.gain.gain.value, now)
      sound.gain.gain.linearRampToValueAtTime(0, now + SILENCE_SECONDS)

      for (const source of sound.sources) {
        source.stop(now + SILENCE_SECONDS)
      }
    }

    live = []
  }

  return { open, isRunning, play, silence }
}
