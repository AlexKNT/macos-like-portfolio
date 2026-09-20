import type { CopyState } from '#windows/copyState'

/*
 * The few words every window says about a copy, written once for the whole app so a copy reads
 * the same way wherever it happens and no window invents its own confirmation. Spec 0006, AC-2.
 */

/** What a row says when its name reached the clipboard. */
export function copiedLine(name: string): string {
  return `Copied ${name}.`
}

/** What a row says when the clipboard was absent or refused the write. */
export function copyFailedLine(name: string): string {
  return `Could not copy ${name}. Select it and copy by hand.`
}

/**
 * What the stage's live region says after a press: the same words the row shows, so a screen
 * reader hears exactly once what a sighted visitor reads. Nothing has been copied in the idle
 * state, so it says nothing.
 */
export function copyAnnouncement(state: CopyState): string {
  if (state.kind === 'idle') {
    return ''
  }

  return state.kind === 'copied' ? copiedLine(state.key.name) : copyFailedLine(state.key.name)
}
