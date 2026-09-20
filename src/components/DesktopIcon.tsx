import { useWindowManager } from '#store/useWindowManager'
import type { DesktopItem } from '#content/types'

/** What one desktop icon needs: the item it stands for. */
export type DesktopIconProps = { readonly item: DesktopItem }

/**
 * One item on the wallpaper: the icon and its label in a button, so it is reachable by Tab
 * and pressed with Enter or Space, and so its accessible name is the item's own label. The
 * label clamps to two lines while the text stays whole, which is what keeps the full name
 * announced even when the longest one is clipped.
 *
 * The label sits on the scrim at rest and on the hover wash under the pointer, so it never
 * sits directly on the photograph. Activating one opens the item's target through the window
 * manager's one open action, with the desktop recorded as the opener. Spec 0003, AC-3, AC-9.
 */
export function DesktopIcon({ item }: DesktopIconProps) {
  const { open } = useWindowManager()

  return (
    <button
      type="button"
      onClick={() => open(item.target, { kind: 'desktop' })}
      className="rounded-control focus-visible:interactive-focus group flex w-24 cursor-pointer flex-col items-center gap-1"
    >
      <img
        src={item.icon}
        alt=""
        className="rounded-control group-hover:bg-glass-hover size-12 p-1 select-none"
      />
      <span className="bg-scrim rounded-control group-hover:bg-glass-hover text-desktop-text line-clamp-2 max-w-full px-1.5 py-0.5 text-center text-xs break-words">
        {item.label}
      </span>
    </button>
  )
}
