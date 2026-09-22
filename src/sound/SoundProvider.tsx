import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { createSoundPlayer, readMuted, writeMuted } from '#lib/sound'
import { SoundContext } from '#sound/useSound'
import { useWindowSounds } from '#sound/useWindowSounds'
import type { SoundControl } from '#sound/useSound'
import type { SoundId } from '#content/types'

/*
 * The desk's sound, held in one place: the one player for the page, the visitor's choice, and the
 * effect that turns a window manager change into a sound.
 *
 * It is nested inside the window manager's own provider, because that effect reads the manager's
 * state and that hook throws outside it. Both `#store` and `#components` are left alone by this:
 * the store stays the window manager, and the chrome keeps painting what it hands it.
 */

/** The events a browser counts as a real gesture, which is what lets it open its audio engine. */
const GESTURES = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Holds the sound for the whole app, and is the only thing holding the player.
 *
 * The player is built once for the life of the page, and the muted state is read once from the
 * browser's storage, so the switch and the player can never disagree about the choice: there is
 * one value, and every sound is asked for through it. Nothing is created before the visitor's
 * first real gesture, and the listener that waits for one stands down only once the engine
 * reports that it is running, because a browser may hand the engine back suspended. A pointer
 * hover is not a gesture to a browser, so this is also what makes the first hover after a press
 * audible. Spec 0013, AC-3, AC-9, AC-10.
 */
export function SoundProvider({ children }: { readonly children: ReactNode }) {
  // The factory is called by `useState`, so it runs once and a second render cannot build a
  // second player.
  const [player] = useState(createSoundPlayer)
  const [muted, setMuted] = useState(readMuted)

  const play = useCallback(
    (id: SoundId) => {
      // The player is handed the state rather than reading it, so what it does and what the
      // switch shows are the same answer.
      player.play(id, muted)
    },
    [muted, player],
  )

  useWindowSounds(play)

  useEffect(() => {
    const stand = () => {
      GESTURES.forEach((name) => window.removeEventListener(name, hear))
    }

    function hear() {
      player.open()

      if (player.isRunning()) {
        stand()
      }
    }

    // An engine that is already awake needs no listener at all, which is what a second mount of
    // this effect in development finds.
    if (player.isRunning()) {
      return
    }

    GESTURES.forEach((name) => window.addEventListener(name, hear))

    return stand
  }, [player])

  const toggleMuted = useCallback(() => {
    const next = !muted

    writeMuted(next)

    // Anything in flight is ramped out rather than cut dead, since a hard stop on a live
    // oscillator clicks. Nothing is played after this until the desk is unmuted again.
    if (next) {
      player.silence()
    }

    setMuted(next)
  }, [muted, player])

  const control = useMemo<SoundControl>(
    () => ({ muted, toggleMuted, play }),
    [muted, toggleMuted, play],
  )

  return <SoundContext value={control}>{children}</SoundContext>
}
