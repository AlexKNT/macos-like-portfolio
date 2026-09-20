import { WINDOWS } from '#content/windows'
import type { DockApp } from '#content/types'

/** What one dock button needs: its app, whether its window is open, and what activating it does. */
export type DockButtonProps = {
  readonly app: DockApp
  readonly isOpen: boolean
  readonly isMinimised: boolean
  readonly onActivate: () => void
}

/**
 * One dock app. The button takes its accessible name from `DockApp.name` and its image from
 * the window registry, so the dock announces "Portfolio" while the window it opens titles
 * itself "Projects", which is deliberate: `DOCK_APPS` carries the name a visitor reads on
 * the panel. The same name shows as a tooltip under the pointer and on keyboard focus.
 *
 * A window that is open shows a dot under the icon, and one that is minimised shows the same
 * dot quieter, so the panel says what is waiting without a second mark. The lift is a
 * transform on the button, which is why it never changes the panel's layout, and the magnify
 * writes to the image, so the two never fight over one transform. Spec 0003, AC-6, AC-9.
 */
export function DockButton({ app, isOpen, isMinimised, onActivate }: DockButtonProps) {
  return (
    <li className="group relative flex items-end">
      <button
        type="button"
        aria-label={app.name}
        onClick={onActivate}
        className="rounded-panel focus-visible:interactive-focus hover:-translate-y-[var(--dock-hover-lift)] cursor-pointer p-1 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] interactive-hover interactive-active"
      >
        <img
          src={WINDOWS[app.windowId].icon}
          alt=""
          className="3xl:size-20 block size-14 origin-bottom select-none"
        />
      </button>
      <span
        aria-hidden="true"
        className="bg-scrim text-desktop-text rounded-control pointer-events-none absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 px-3 py-1 text-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {app.name}
      </span>
      <span
        aria-hidden="true"
        className={`bg-text absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${
          isOpen ? (isMinimised ? 'opacity-40' : 'opacity-100') : 'opacity-0'
        }`}
      />
    </li>
  )
}
