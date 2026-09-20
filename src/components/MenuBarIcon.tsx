import { toggleAppearance } from '#lib/appearance'
import type { NavIcon, OpenTarget } from '#content/types'
import type { WindowOpener } from '#store/windowManager'

/** What one menu bar icon needs: its content entry, and the action that opens a window. */
export type MenuBarIconProps = {
  readonly icon: NavIcon
  readonly onOpen: (target: OpenTarget, opener: WindowOpener) => void
}

/**
 * One control in the menu bar's right hand group. Every icon that acts renders a button whose
 * accessible name comes from the content entry, and the two that only decorate render a bare
 * image with no control around it, so nothing in the bar is pressable without an effect.
 *
 * The About icon opens the About location through the window manager's one open action, and
 * the appearance icon switches the mode for this session: it reads the mode the document is
 * showing and applies its inverse, leaving the stored preference alone, because the menu that
 * owns the preference joins in a later feature. Spec 0003, AC-4, AC-5.
 */
export function MenuBarIcon({ icon, onOpen }: MenuBarIconProps) {
  // An icon that only decorates carries no label, which is the rule the content type holds,
  // so that is what decides whether the bar renders a control here.
  if (!('label' in icon)) {
    return <img src={icon.icon} alt="" className="size-4" />
  }

  const action = icon.action

  return (
    <button
      type="button"
      aria-label={icon.label}
      onClick={() => {
        if (action.kind === 'appearance') {
          toggleAppearance()
          return
        }

        onOpen({ kind: 'location', locationId: action.locationId }, { kind: 'bar' })
      }}
      className="rounded-control interactive-hover interactive-active focus-visible:interactive-focus cursor-pointer p-1.5"
    >
      <img src={icon.icon} alt="" className="size-4" />
    </button>
  )
}
