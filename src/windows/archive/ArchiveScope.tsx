import { useCallback, useState } from 'react'

import { findPlace } from '#content/reads'
import {
  archiveCleared,
  canEmpty,
  emptyRequested,
  seededArchive,
} from '#windows/archive/archiveState'
import { ArchiveStateContext } from '#windows/archive/useArchiveState'
import type { Place } from '#content/types'
import type { TreeEntry } from '#content/reads'
import type { ArchiveState } from '#windows/archive/archiveState'
import type { WindowBodyScopeProps } from '#windows/WindowBody'

/*
 * The place this window shows. It is fixed: the Archive is the desktop's bin, so it names the
 * Trash place once and reads it once, the same call the Finder makes for the place it is showing.
 * Spec 0012, AC-1, AC-7.
 */
const TRASH_PLACE: Place = { kind: 'location', locationId: 'trash' }

/**
 * The leftovers the place holds, read once for the whole window rather than per render. The
 * content layer is a bundled constant that nothing writes to, so this is the same list every time
 * the window opens, which is what makes an emptied window a window that holds again.
 */
const TRASH_ITEMS: readonly TreeEntry[] = findPlace(TRASH_PLACE).items

/**
 * Holds the Archive window's own state and wraps its frame, so the body below it and the Empty
 * control in the title bar read one value through one hook and can never disagree. The movement
 * lands through the same value, which is why the control can never offer an empty that is already
 * under way, and the press itself is guarded by the same `canEmpty` the control reads, so a window
 * that opened on a place holding nothing answers nothing.
 *
 * The state is the window's own: nothing in the content layer, the window manager, the frame, any
 * other window or any storage changes when the gesture runs. Spec 0012, AC-4, AC-7, AC-8.
 */
export function ArchiveScope({ children }: WindowBodyScopeProps) {
  const [state, setState] = useState<ArchiveState>(seededArchive)
  const answers = canEmpty(state, TRASH_ITEMS.length)
  const requestEmpty = useCallback(() => {
    // `canEmpty` is the guard, not the moment alone: a window whose place holds nothing is still
    // `holding`, and a press there must change nothing rather than run a gesture over nothing.
    setState((current) =>
      canEmpty(current, TRASH_ITEMS.length) ? emptyRequested(current) : current,
    )
  }, [])
  const landed = useCallback(() => {
    setState(archiveCleared)
  }, [])

  return (
    <ArchiveStateContext.Provider
      value={{ state, items: TRASH_ITEMS, canEmpty: answers, requestEmpty, landed }}
    >
      {children}
    </ArchiveStateContext.Provider>
  )
}
