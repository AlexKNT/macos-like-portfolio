import { useCallback, useMemo, useState } from 'react'

import { copyText } from '#lib/clipboard'
import { IDLE_COPY } from '#windows/copyState'
import type { CopyKey, CopyState } from '#windows/copyState'

/** What a window gets from the copy pair: the state a row reads, and the press that makes it. */
export type UseCopyText = {
  readonly state: CopyState
  readonly copy: (key: CopyKey, text: string) => void
}

/**
 * Whether the state already carries the answer this press has just produced. Pressing the same
 * name twice therefore changes nothing at all: the row keeps its confirmation, nothing flickers,
 * and the window's live region is not announced a second time for the same word.
 */
function alreadyHolds(state: CopyState, key: CopyKey, copied: boolean): boolean {
  if (state.kind === 'idle') {
    return false
  }

  return (
    state.key.row === key.row && state.key.name === key.name && (state.kind === 'copied') === copied
  )
}

/**
 * One window's copy state, held beside the body that shows it: `copy` writes the text through
 * `copyText` and records what happened, and `state` says which row confirms and what the
 * window's live region announces. The state never leaves the window, so closing it clears
 * everything, and a refusal is a value that lands in the state rather than a throw.
 * Spec 0006, AC-2, AC-3, AC-4.
 */
export function useCopyText(): UseCopyText {
  const [state, setState] = useState<CopyState>(IDLE_COPY)

  const copy = useCallback((key: CopyKey, text: string) => {
    void copyText(text).then((result) => {
      setState((previous) => {
        if (alreadyHolds(previous, key, result.ok)) {
          return previous
        }

        if (result.ok) {
          return { kind: 'copied', key }
        }

        return { kind: 'failed', key, reason: result.error }
      })
    })
  }, [])

  return useMemo(() => ({ state, copy }), [state, copy])
}
