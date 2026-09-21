import { useEffect, useRef } from 'react'

import { applyFocusHop } from '#components/windowFocus'
import { focusHopAfter } from '#store/windowManager'
import { useWindowElements } from '#store/useWindowElements'
import { useWindowManager } from '#store/useWindowManager'

/*
 * The phone's own entry in the browser's history. A back gesture is how a phone visitor leaves a
 * screen, so while a window is on screen the shell holds one entry it can take back, and while the
 * phone is home it holds none: a back press closes what is on screen, and with nothing open it
 * leaves the site exactly as it did before the phone shell existed.
 *
 * The entry carries no state and leaves the URL as it is, so a copied link is unaffected and nothing
 * is ever read back out of it. The hook is gated on the compact layout, which is what keeps the
 * desktop's own bar and dock from writing history at all.
 * Spec 0009, AC-11.
 */

/** What the shell must do to history for one transition: take an entry, give one back, or nothing. */
export type HistoryStep = 'push' | 'pop' | 'none'

/**
 * The entry the shell owes, worked out from where it is now: a phone showing a window owes one, a
 * phone that is home owes none, and a desktop owes none whatever it is showing. Pure, so the rule
 * is checked without a browser. Spec 0009, AC-11.
 */
export function historyStepFor(
  owned: boolean,
  windowOnScreen: boolean,
  compact: boolean,
): HistoryStep {
  if (windowOnScreen && compact) {
    return owned ? 'none' : 'push'
  }

  return owned ? 'pop' : 'none'
}

/**
 * Keeps the phone's one history entry in step with the manager, whatever moved it: an open, a
 * close, an open that closed the window it replaced, or a resize across the breakpoint. A back
 * press closes the window on screen through the same action Close calls, and hands the keyboard on
 * the way Close would, so leaving a screen is one path rather than two.
 *
 * Returns nothing: this is the shell's own business, and no component reads it.
 * Spec 0009, AC-8, AC-11.
 */
export function useShellHistory(): void {
  const { instances, focusedKey, compact, close } = useWindowManager()
  const elements = useWindowElements()
  const owned = useRef(false)
  const takingBack = useRef(false)
  const windowOnScreen = focusedKey !== null

  useEffect(() => {
    const step = historyStepFor(owned.current, windowOnScreen, compact)

    if (step === 'none') {
      return
    }

    if (step === 'push') {
      window.history.pushState(null, '', window.location.href)
      owned.current = true
      return
    }

    // The window left the screen by some other route (Close, or an open that replaced it), so the
    // entry is handed straight back rather than left behind: one press of back does the same thing
    // whichever way the window went.
    owned.current = false
    takingBack.current = true
    window.history.back()
  }, [compact, windowOnScreen])

  useEffect(() => {
    if (!compact) {
      return
    }

    const handlePop = () => {
      // The press the hook itself asked for is not the visitor leaving a screen.
      if (takingBack.current) {
        takingBack.current = false
        return
      }

      owned.current = false

      if (focusedKey === null) {
        return
      }

      close(focusedKey)
      applyFocusHop(focusHopAfter(instances, focusedKey, compact), elements)
    }

    window.addEventListener('popstate', handlePop)

    return () => {
      window.removeEventListener('popstate', handlePop)
    }
  }, [compact, close, elements, focusedKey, instances])
}
