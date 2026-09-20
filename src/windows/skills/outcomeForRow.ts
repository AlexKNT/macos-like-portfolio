import type { CopyOutcome, CopyState } from '#windows/copyState'

/**
 * What one row shows after a press: the outcome of the copy, but only on the row the press was
 * made in. Every other row gets `null`, which is what makes one confirmation appear at a time and
 * move to the new row rather than accumulate. Spec 0006, AC-3.
 */
export function outcomeForRow(state: CopyState, rowId: string): CopyOutcome | null {
  if (state.kind === 'idle' || state.key.row !== rowId) {
    return null
  }

  return state.kind === 'copied'
    ? { kind: 'copied', name: state.key.name }
    : { kind: 'failed', name: state.key.name }
}
