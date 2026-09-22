import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SOUND_STORAGE_KEY } from '#lib/sound'
import { SoundProvider } from '#sound/SoundProvider'
import { useSound } from '#sound/useSound'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import { restoreAudio, scheduledRow, stubAudio } from '../test/audio'
import type { AudioRecording } from '../test/audio'

/*
 * The desk's sound as the app wires it: one player for the page, a listener that opens the audio
 * on the visitor's first real gesture, and the effect that turns a change of the window manager
 * into the sound the rule names. The engine is stood in for, so what is read back is the schedule
 * the desk wrote. Spec 0013, AC-3, AC-4, AC-6, AC-9, AC-13.
 */

/** The desk, wired to both hooks, so a check can drive what changes and read what is held. */
function Desk() {
  const { open, close, minimise, restore } = useWindowManager()
  const { muted, toggleMuted } = useSound()

  return (
    <div>
      <button
        type="button"
        onClick={() => open({ kind: 'window', windowId: 'contact' }, { kind: 'dock' })}
      >
        Open Contact
      </button>
      <button
        type="button"
        onClick={() => open({ kind: 'window', windowId: 'resume' }, { kind: 'dock' })}
      >
        Open Resume
      </button>
      <button type="button" onClick={() => close('contact')}>
        Close Contact
      </button>
      <button type="button" onClick={() => minimise('contact')}>
        Minimise Contact
      </button>
      <button type="button" onClick={() => restore('contact')}>
        Restore Contact
      </button>
      <button type="button" onClick={toggleMuted}>
        Toggle Sound
      </button>
      <p>{muted ? 'sound off' : 'sound on'}</p>
    </div>
  )
}

/** Renders the desk inside the two providers, in the order `App` mounts them. */
function setup(strict = false): AudioRecording {
  const audio = stubAudio('suspended')
  const desk = (
    <WindowManagerProvider>
      <SoundProvider>
        <Desk />
      </SoundProvider>
    </WindowManagerProvider>
  )

  render(strict ? <StrictMode>{desk}</StrictMode> : desk)

  return audio
}

/** Presses one of the desk's own controls. */
function press(name: string): void {
  fireEvent.click(screen.getByRole('button', { name }))
}

/** The visitor's first real gesture, which is what lets a browser open its own audio. */
function touchThePage(): void {
  fireEvent.keyDown(window)
}

afterEach(() => {
  localStorage.clear()
  restoreAudio()
})

describe('opening the audio', () => {
  // covers: AC-3
  it('keeps the desk silent until the visitor has touched the page, then sounds', () => {
    const audio = setup()

    // Nothing has happened yet, so the engine is not even built and the sound is refused.
    press('Open Contact')
    expect(audio.contexts).toBe(0)
    expect(audio.oscillators).toHaveLength(0)

    touchThePage()
    expect(audio.contexts).toBe(1)

    press('Open Resume')
    expect(audio.oscillators).toHaveLength(1)
    expect(scheduledRow(audio, 0, 'open')).toBe(true)
  })
})

describe('a change of the window manager', () => {
  // covers: AC-4
  it('asks for the open sound when a window arrives', () => {
    const audio = setup()

    touchThePage()
    press('Open Contact')

    expect(audio.oscillators).toHaveLength(1)
    expect(scheduledRow(audio, 0, 'open')).toBe(true)
  })

  // covers: AC-4
  it('asks for the close sound when a window leaves', () => {
    const audio = setup()

    touchThePage()
    press('Open Contact')
    press('Close Contact')

    expect(audio.oscillators).toHaveLength(2)
    expect(scheduledRow(audio, 1, 'close')).toBe(true)
  })

  // covers: AC-4
  it('asks for the minimise sound when a window goes down to the dock', () => {
    const audio = setup()

    touchThePage()
    press('Open Contact')
    press('Minimise Contact')

    expect(audio.oscillators).toHaveLength(2)
    expect(scheduledRow(audio, 1, 'minimise')).toBe(true)
  })

  // covers: AC-5
  it('asks for nothing when the same window is asked for twice, or comes back from the dock', () => {
    const audio = setup()

    touchThePage()
    press('Open Contact')
    press('Open Contact')

    expect(audio.oscillators).toHaveLength(1)

    press('Minimise Contact')
    press('Restore Contact')

    // The minimise is the second sound; the restore, which only hands the status back, is not one.
    expect(audio.oscillators).toHaveLength(2)
    expect(scheduledRow(audio, 1, 'minimise')).toBe(true)
  })
})

describe('the muted desk', () => {
  // covers: AC-9
  it('asks for nothing while it is silenced, and sounds again once it is brought back', () => {
    const audio = setup()

    touchThePage()
    press('Toggle Sound')
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('muted')

    press('Open Contact')
    expect(audio.oscillators).toHaveLength(0)

    press('Toggle Sound')
    press('Open Resume')

    expect(audio.oscillators).toHaveLength(1)
    expect(scheduledRow(audio, 0, 'open')).toBe(true)
  })
})

describe('the effect under a double invoke', () => {
  // covers: AC-13
  it('sounds nothing on the second mount, and one sound for a real change', () => {
    const audio = setup(true)

    // The effect seeded its previous state without sounding, so mounting twice is silence.
    expect(audio.oscillators).toHaveLength(0)

    touchThePage()
    press('Open Contact')

    expect(audio.oscillators).toHaveLength(1)
  })
})
