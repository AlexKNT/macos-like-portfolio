import { CopyConfirmation } from '#windows/CopyConfirmation'
import { QuietLine } from '#windows/QuietLine'
import { MARK_GLYPH, emptyGroupLine } from '#windows/skills/skillsLines'
import type { CopyKey, CopyOutcome } from '#windows/copyState'
import type { TechGroup } from '#content/types'

/** What one area needs: what it prints, what its row is showing, and how a press copies. */
export type TechGroupRowProps = {
  readonly group: TechGroup
  readonly outcome: CopyOutcome | null
  readonly onCopy: (key: CopyKey, text: string) => void
}

/**
 * One area of the stack: a decorative mark, the category as its own heading, then a button per
 * name, in the order the content layer lists them.
 *
 * The mark is hidden from assistive tech and the category carries the meaning, so nothing about
 * the window depends on seeing a terminal. A name's visible label is the item itself and its
 * accessible name says what the press does, so a screen reader user hears `Copy React.js` rather
 * than a bare word. Above the compact breakpoint the heading and the names share one line; below
 * it the heading takes its own line and every name is at least a touch target tall, which is what
 * keeps a long stack readable at 360px.
 *
 * The confirmation sits at the end of the row rather than beside the button, so the names never
 * move under the pointer when one is pressed, and an area with nothing in it shows the shared
 * quiet line while still printing its category.
 * Spec 0006, AC-2, AC-3, AC-4, AC-6, AC-8, AC-9.
 */
export function TechGroupRow({ group, outcome, onCopy }: TechGroupRowProps) {
  return (
    <li
      data-line=""
      className="flex flex-col gap-2 @min-[40rem]:flex-row @min-[40rem]:items-baseline @min-[40rem]:gap-4"
    >
      <h2 className="text-text flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true" className="text-success">
          {MARK_GLYPH}
        </span>
        {group.category}
      </h2>
      {group.items.length === 0 ? (
        <QuietLine>{emptyGroupLine()}</QuietLine>
      ) : (
        <ul className="flex min-w-0 flex-wrap items-center gap-1">
          {group.items.map((item) => (
            <li key={item} className="flex max-w-full min-w-0">
              {/*
                The name is a block inside the button rather than the button's own text: a flex
                container's text is an anonymous item that refuses to shrink below its longest
                word, so a long name would sit there overflowed instead of wrapping. The two
                `min-w-0` classes are what let it be narrower than that word, which is the one
                thing a name may never do. Spec 0006, AC-8.
              */}
              <button
                type="button"
                aria-label={`Copy ${item}`}
                onClick={() => onCopy({ row: group.id, name: item }, item)}
                className="interactive-hover interactive-active focus-visible:interactive-focus rounded-control text-text flex min-h-[var(--spacing-touch)] max-w-full min-w-0 items-center px-2 py-1 text-left text-sm @min-[40rem]:min-h-0"
              >
                <span className="min-w-0 break-words">{item}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <CopyConfirmation outcome={outcome} />
    </li>
  )
}
