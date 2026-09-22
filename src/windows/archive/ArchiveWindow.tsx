import { useCallback, useRef } from 'react'

import { WINDOWS } from '#content/windows'
import { useWindowManager } from '#store/useWindowManager'
import { ItemTile } from '#windows/ItemTile'
import { WindowStage } from '#windows/WindowStage'
import { ArchiveEmptyLine } from '#windows/archive/ArchiveEmptyLine'
import { countLine, emptyLine } from '#windows/archive/archiveLines'
import { archiveAnswers } from '#windows/archive/archiveState'
import { useArchiveState } from '#windows/archive/useArchiveState'
import { useEmptyMovement } from '#windows/archive/useEmptyMovement'
import type { OpenTarget } from '#content/types'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * The Archive window: the desktop's bin, showing the leftovers the Trash place holds with a count
 * over them, and one press in the title bar leaves them behind.
 *
 * The window is its content and its own words on the stage the other windows already share. It
 * holds no target of its own and reads no place of its own: the leftovers and the state both
 * arrive from its scope, so the control in the title bar and the block below it always describe
 * the same window. Every item is drawn by the shared `ItemTile`, which is the one face the desktop
 * gives a file tree entry, and a press on one opens where its own kind says through the manager's
 * existing action, the same path the Finder's grid takes.
 *
 * What it renders follows the state and the count, in four cases: holding with items shows the
 * count and the list, holding with nothing shows the empty line from the first paint, clearing
 * shows the same block with its items inert while it leaves, and emptied shows the line with no
 * block at all, so no inert list and no empty list ever stays in the accessibility tree. The
 * stage's one live region carries the line when the state is `emptied` and nothing otherwise, so
 * a window that opened on an empty place never announces a change that did not happen.
 * Spec 0012, AC-1, AC-2, AC-3, AC-5, AC-6, AC-11, AC-12, AC-13.
 */
export function ArchiveWindow({ windowId, windowKey }: WindowBodyProps) {
  const { state, items, landed } = useArchiveState()
  const { open } = useWindowManager()
  const block = useRef<HTMLDivElement>(null)

  useEmptyMovement(state, block, landed)

  const openAt = useCallback(
    (target: OpenTarget) => {
      open(target, { kind: 'window', key: windowKey })
    },
    [open, windowKey],
  )

  const holding = state !== 'emptied' && items.length > 0

  return (
    <WindowStage name={WINDOWS[windowId].title} status={state === 'emptied' ? emptyLine() : ''}>
      {holding ? (
        <div ref={block} className="flex flex-col gap-4">
          <p className="text-text-muted text-sm">{countLine(items.length)}</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1">
            {items.map((item) => (
              <li key={item.id} className="flex min-w-0">
                <ItemTile entry={item} onOpen={openAt} disabled={!archiveAnswers(state)} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ArchiveEmptyLine />
      )}
    </WindowStage>
  )
}
