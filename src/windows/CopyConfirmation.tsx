import { QuietLine } from '#windows/QuietLine'
import { copiedLine, copyFailedLine } from '#windows/copyLines'
import type { CopyOutcome } from '#windows/copyState'

/** What a confirmation needs: what the last press produced, or `null` for a row that had none. */
export type CopyConfirmationProps = { readonly outcome: CopyOutcome | null }

/**
 * What the row a press was made in says afterwards: the confirmation when the name reached the
 * clipboard, and the shared quiet line when it did not, since a refusal is a small thing that
 * names the item rather than an error treatment. Every other row says nothing, which is what
 * makes one confirmation appear at a time and move rather than accumulate.
 * Spec 0006, AC-2, AC-3, AC-4.
 */
export function CopyConfirmation({ outcome }: CopyConfirmationProps) {
  if (outcome === null) {
    return null
  }

  if (outcome.kind === 'failed') {
    return <QuietLine>{copyFailedLine(outcome.name)}</QuietLine>
  }

  return <span className="text-text-muted text-xs">{copiedLine(outcome.name)}</span>
}
