import { useCallback } from 'react'

import { WINDOWS } from '#content/windows'
import { useWindowElements } from '#store/useWindowElements'
import type { HomeApp } from '#content/types'

/** What one home tile needs: its app, whether its window is on screen or parked, and what a press does. */
export type HomeTileProps = {
  readonly app: HomeApp
  readonly isOpen: boolean
  readonly isMinimised: boolean
  readonly onActivate: () => void
}

/**
 * One window on the phone's home surface: the window's own icon and name on a scrim wash, tall
 * enough for a thumb, with the dock's own mark under it saying what the window is doing (filled
 * while it is on screen, the same mark quieter while it is parked, nothing when it is not open).
 *
 * The wash is the scrim, and the pointer lifts it to the hover wash rather than to a surface: the
 * name is painted in the desktop ink, which is the ink that sits on the wallpaper, so a step up the
 * surface ladder would leave white on white. The mark is painted in that same ink, on the same wash.
 * It is decorative, so a screen reader hears the tile's name and nothing else.
 *
 * The tile registers itself under its window id, which is how a window finds the element it grows
 * from and shrinks back into on a phone, in place of the dock button it has no phone for.
 * Spec 0009, AC-2, AC-3, AC-6, AC-12.
 */
export function HomeTile({ app, isOpen, isMinimised, onActivate }: HomeTileProps) {
  const { registerHomeTile } = useWindowElements()

  const attach = useCallback(
    (element: HTMLButtonElement | null) => {
      registerHomeTile(app.windowId, element)
    },
    [app.windowId, registerHomeTile],
  )

  return (
    <li className="flex">
      <button
        ref={attach}
        type="button"
        onClick={onActivate}
        className="rounded-panel bg-scrim text-desktop-text focus-visible:interactive-focus relative flex min-h-touch w-full cursor-pointer flex-col items-center justify-center gap-1 px-3 py-2 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-glass-hover active:opacity-80"
      >
        <img src={WINDOWS[app.windowId].icon} alt="" className="size-10 select-none" />
        <span className="text-sm font-medium">{app.name}</span>
        <span
          aria-hidden="true"
          className={`bg-desktop-text absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${
            isOpen ? (isMinimised ? 'opacity-40' : 'opacity-100') : 'opacity-0'
          }`}
        />
      </button>
    </li>
  )
}
