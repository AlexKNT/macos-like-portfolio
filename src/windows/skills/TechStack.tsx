import { TechGroupRow } from '#windows/skills/TechGroupRow'
import { outcomeForRow } from '#windows/skills/outcomeForRow'
import type { CopyKey, CopyState } from '#windows/copyState'
import type { TechGroup } from '#content/types'

/** What the stack needs: the areas to print, what has been copied, and how a press copies. */
export type TechStackProps = {
  readonly groups: readonly TechGroup[]
  readonly state: CopyState
  readonly onCopy: (key: CopyKey, text: string) => void
}

/**
 * The stack itself, one row per area, in the order the content layer declares them rather than
 * sorted or grouped again here: the content layer is the one place that decides what this person
 * works with. Each row is handed the outcome that belongs to it, so the copy state stays in one
 * place and only one row ever confirms. Spec 0006, AC-1, AC-3.
 */
export function TechStack({ groups, state, onCopy }: TechStackProps) {
  return (
    <ul className="flex min-w-0 flex-col gap-6">
      {groups.map((group) => (
        <TechGroupRow
          key={group.id}
          group={group}
          outcome={outcomeForRow(state, group.id)}
          onCopy={onCopy}
        />
      ))}
    </ul>
  )
}
