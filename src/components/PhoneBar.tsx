import { Clock } from '#components/Clock'
import { MenuBarIcon } from '#components/MenuBarIcon'
import { NAV_ICONS } from '#content/shell'
import { useWindowManager } from '#store/useWindowManager'

/**
 * The phone's slim bar: the mark, the appearance control, the sound switch and the live clock,
 * which is what the desktop's menu bar still has to say once its three window links have gone (on
 * a phone the home surface opens windows) and its other status icons are no longer wanted.
 *
 * It paints the menu bar's own translucent chrome, which the stylesheet already swaps for a solid
 * surface below the breakpoint, so a phone gets a readable bar with no blur. It is a plain element
 * rather than a landmark of its own: it holds three controls and a reading, and the shell invents no
 * second name for them.
 *
 * The appearance control and the sound switch are the menu bar's own content entries, so a phone
 * shows the same two controls, with the same accessible names, doing the same things to the same
 * document. The sound switch travels here for the same reason it exists at all: a phone is the
 * surface a visitor is most likely to meet in public. Spec 0009, AC-1, AC-7, AC-14; spec 0013, AC-8.
 */
export function PhoneBar() {
  const { open } = useWindowManager()
  const appearance = NAV_ICONS.find((icon) => icon.action.kind === 'appearance')
  const sound = NAV_ICONS.find((icon) => icon.action.kind === 'sound')

  return (
    <div className="glass-chrome text-text flex min-h-touch shrink-0 items-center justify-between gap-5 px-4 py-1.5 select-none">
      <span aria-hidden="true" className="menu-logo bg-text block h-[17px] w-[14px]" />
      <div className="flex items-center gap-4">
        {appearance === undefined ? null : <MenuBarIcon icon={appearance} onOpen={open} />}
        {sound === undefined ? null : <MenuBarIcon icon={sound} onOpen={open} />}
        <Clock />
      </div>
    </div>
  )
}
