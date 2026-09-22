import { emptyControlLabel, emptyControlWord } from '#windows/archive/archiveLines'
import { useArchiveState } from '#windows/archive/useArchiveState'

/**
 * The one control the Archive puts in its title bar: Empty, which starts the gesture that leaves
 * the leftovers behind. It sits past the window's name, beside the three lights, and it reads the
 * window's own state through the same scope the body does, so the two can never disagree.
 *
 * It carries `aria-disabled` rather than the native `disabled` whenever it has nothing to answer,
 * which is an empty already taken and a window that opened on a place holding nothing. A natively
 * disabled control drops the keyboard to the body the moment it is disabled, which would send a
 * keyboard visitor back to the top of the page; keeping the attribute instead leaves the control
 * where it was and lets the state machine make the press a no op. Its word is one short word, so
 * it needs no second face on a phone, and it takes the muted ink while it has nothing to answer so
 * a sighted visitor can see the same thing a screen reader is told. Spec 0012, AC-4, AC-5.
 */
export function ArchiveEmptyButton() {
  const { canEmpty, requestEmpty } = useArchiveState()

  return (
    <button
      type="button"
      onClick={requestEmpty}
      aria-disabled={canEmpty ? undefined : true}
      aria-label={emptyControlLabel()}
      className={`interactive-hover interactive-active focus-visible:interactive-focus rounded-control flex h-6 min-w-6 shrink-0 items-center justify-center px-2 text-xs font-medium ${
        canEmpty ? 'text-text' : 'text-text-muted'
      }`}
    >
      {emptyControlWord()}
    </button>
  )
}
