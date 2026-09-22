import { SOUNDS } from '#content/sounds'
import type { SoundId } from '#content/types'

/*
 * A stand in for the browser's own audio engine, installed on the window for the length of one
 * check, so a suite can prove what the desk asked for without playing anything. It records the
 * engine it was asked to build: how many, which wave, which sweep and which level.
 *
 * It is here rather than beside one suite because more than one of them needs it: the player's own
 * suite drives the factory with it, the provider's suite proves that a change of the window
 * manager reaches it, and a dock button's suite proves that the pointer does. Spec 0013, AC-13.
 */

/** One call scheduled on a value. */
export type ParamCall = { readonly kind: 'set' | 'ramp' | 'cancel'; readonly value: number }

/** One recorded value: the three methods the player calls, and what it asked them for. */
export type StubParam = {
  value: number
  readonly calls: ParamCall[]
  readonly setValueAtTime: (value: number) => void
  readonly linearRampToValueAtTime: (value: number) => void
  readonly cancelScheduledValues: () => void
}

/** One recorded tone: the shape the player asked for, and when it was started and stopped. */
export type StubOscillator = {
  type: string
  readonly frequency: StubParam
  readonly starts: number[]
  readonly stops: number[]
}

/** Everything the stub engine was asked to build, which is the evidence a check reads. */
export type AudioRecording = {
  contexts: number
  resumes: number
  state: AudioContextState
  readonly oscillators: StubOscillator[]
  readonly gains: StubParam[]
  bursts: number
}

/** The two names a browser may carry its engine under, so both are stood in for. */
const AUDIO_NAMES = ['AudioContext', 'webkitAudioContext'] as const

/** The window, seen as an object a property can be written on and taken off again. */
function asRecord(): Record<string, unknown> {
  return window as unknown as Record<string, unknown>
}

/** One recorded value, answering every call the player makes and remembering each one. */
function stubParam(): StubParam {
  const calls: ParamCall[] = []

  return {
    value: 0,
    calls,
    setValueAtTime: (value: number) => {
      calls.push({ kind: 'set', value })
    },
    linearRampToValueAtTime: (value: number) => {
      calls.push({ kind: 'ramp', value })
    },
    cancelScheduledValues: () => {
      calls.push({ kind: 'cancel', value: 0 })
    },
  }
}

/** One tone the player may build, recorded and then handed back as the node it asked for. */
function stubOscillator(recording: AudioRecording) {
  const frequency = stubParam()
  const oscillator: StubOscillator = { type: 'sine', frequency, starts: [], stops: [] }

  recording.oscillators.push(oscillator)

  return Object.assign(oscillator, {
    connect: () => undefined,
    start: (at?: number) => {
      oscillator.starts.push(at ?? 0)
    },
    stop: (at?: number) => {
      oscillator.stops.push(at ?? 0)
    },
    onended: null as (() => void) | null,
  })
}

/**
 * Installs the stub under both names a browser may use, and answers what it records. The
 * constructor hands back the same engine every time, so a check can also prove that one engine
 * is built for the page rather than one per sound.
 */
export function stubAudio(state: AudioContextState = 'suspended'): AudioRecording {
  const recording: AudioRecording = {
    contexts: 0,
    resumes: 0,
    state,
    oscillators: [],
    gains: [],
    bursts: 0,
  }

  const engine = {
    get state(): AudioContextState {
      return recording.state
    },
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume: () => {
      recording.resumes += 1
      recording.state = 'running'

      return Promise.resolve()
    },
    createGain: () => {
      const gain = stubParam()

      recording.gains.push(gain)

      return { gain, connect: () => undefined }
    },
    createOscillator: () => stubOscillator(recording),
    createBufferSource: () => {
      recording.bursts += 1

      return {
        buffer: null,
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      }
    },
    createBuffer: (_channels: number, frames: number) => ({
      getChannelData: () => new Float32Array(frames),
    }),
  }

  const Constructor = function () {
    recording.contexts += 1

    return engine
  } as unknown as typeof AudioContext

  for (const name of AUDIO_NAMES) {
    asRecord()[name] = Constructor
  }

  return recording
}

/** Takes the stub back off the window, so one check cannot shape the next. */
export function restoreAudio(): void {
  for (const name of AUDIO_NAMES) {
    Reflect.deleteProperty(asRecord(), name)
  }
}

/**
 * Whether the tone the desk wrote at `index` is the one the named row of the table describes.
 * The wave and the two ends of the sweep identify a row, since no two rows share all three.
 */
export function scheduledRow(audio: AudioRecording, index: number, id: SoundId): boolean {
  const row = SOUNDS[id]
  const tone = audio.oscillators[index]

  return (
    tone?.type === row.wave &&
    tone.frequency.calls[0]?.value === row.fromHz &&
    tone.frequency.calls[1]?.value === row.toHz
  )
}
