import { PROFILE, SOCIALS } from '#content/profile'
import { WINDOWS } from '#content/windows'
import { CopyConfirmation } from '#windows/CopyConfirmation'
import { WindowStage } from '#windows/WindowStage'
import { copyAnnouncement } from '#windows/copyLines'
import { SocialTile } from '#windows/contact/SocialTile'
import {
  addressCopyName,
  copyControlLabel,
  headingLine,
  invitationLine,
  mailBody,
  mailSubject,
} from '#windows/contact/contactLines'
import { mailLinkHref } from '#windows/contact/mailLink'
import { useCopyText } from '#windows/useCopyText'
import type { CopyOutcome, CopyState } from '#windows/copyState'
import type { WindowBodyProps } from '#windows/WindowBody'

/*
 * The row the Copy control belongs to, and the one row this window ever confirms in. It is a plain
 * word rather than a name read from the content, because it keys a state rather than naming a thing
 * on screen: nothing a visitor reads comes from here.
 */
const ADDRESS_ROW = 'address'

/*
 * The Copy control's face: a control on the window body, at least a touch target tall, with the
 * ladder's hover and press steps and the shared focus ring. It carries no boundary of its own, the
 * same treatment the terminal window's copy buttons use, so the word and the ring are what mark it
 * as something you can press.
 */
const COPY_FACE =
  'interactive-hover interactive-active focus-visible:interactive-focus text-text rounded-control inline-flex min-h-touch shrink-0 items-center px-3 text-sm font-medium'

/*
 * The address itself, which is also the mail link. It wraps rather than overflowing the frame: a
 * long address has no space to break at, so `break-all` is what lets it fold onto a second line
 * instead of pushing the frame wider, and `min-w-0` is what lets it be narrower than its own
 * longest run. It carries the shared ring, so the one ring treatment holds here too.
 */
const ADDRESS_FACE =
  'text-link focus-visible:interactive-focus rounded-control min-w-0 max-w-full break-all text-base font-medium underline underline-offset-2'

/**
 * What the address row shows after a press: nothing until one is made, then the outcome. Only this
 * row ever confirms, so a state left over from anywhere else produces nothing rather than a
 * confirmation in the wrong place.
 */
function addressOutcome(state: CopyState): CopyOutcome | null {
  if (state.kind === 'idle' || state.key.row !== ADDRESS_ROW) {
    return null
  }

  return state.kind === 'copied'
    ? { kind: 'copied', name: state.key.name }
    : { kind: 'failed', name: state.key.name }
}

/**
 * The Contact window: the profile's address, printed and taken in one press, and the four social
 * profiles beside it.
 *
 * The address has one home. It is what the window prints, what the Copy control writes, and what the
 * mail link is addressed to, because all three read `PROFILE.email` and none of them holds a copy of
 * it. The subject and the body the link carries come from this window's own words module, and the
 * href that joins them is built by one pure function, so the encoding has one home and one test.
 *
 * The tiles are the content layer's own list, in the order it declares them, and each one paints its
 * own entry's colour. Nothing here animates, nothing is stored, and no request is made: the
 * clipboard is the only browser API this window reaches, and it reaches it through the shared copy
 * pair, so a refusal is a line on the row rather than a fault.
 *
 * The whole window is one stage of the shared standard: one named content area, one live region, and
 * no padding, heading or quiet state of its own.
 * Spec 0008, AC-1, AC-2, AC-3, AC-4, AC-6, AC-9, AC-11, AC-12.
 */
export function ContactWindow({ windowId }: WindowBodyProps) {
  const { state, copy } = useCopyText()
  const address = PROFILE.email
  const availability = PROFILE.availability

  return (
    <WindowStage
      name={WINDOWS[windowId].title}
      heading={headingLine()}
      status={copyAnnouncement(state)}
    >
      <p className="text-text-muted text-sm">{invitationLine()}</p>

      {/*
        The availability line is a state of the profile rather than a shape of the window: when the
        field is unset nothing renders at all, so the window leaves no empty element and no gap
        behind it. It reads as a status chip rather than as quiet text, because taking work is news
        rather than an absence. Spec 0008, AC-9.
      */}
      {availability === undefined ? null : (
        <p className="bg-accent-quiet-bg text-accent-quiet-fg rounded-panel w-fit max-w-full px-3 py-2 text-sm font-medium">
          {availability}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-start gap-2 @min-[28rem]:flex-row @min-[28rem]:flex-wrap @min-[28rem]:items-center @min-[28rem]:gap-x-4">
          <a href={mailLinkHref(address, mailSubject(), mailBody())} className={ADDRESS_FACE}>
            {address}
          </a>
          <button
            type="button"
            aria-label={addressCopyName(address)}
            onClick={() => copy({ row: ADDRESS_ROW, name: address }, address)}
            className={COPY_FACE}
          >
            {copyControlLabel()}
          </button>
        </div>
        <CopyConfirmation outcome={addressOutcome(state)} />
      </div>

      {/*
        A hairline rather than a card: the addresses are the thing you act on and the profiles are
        where else you can find this person, so one rule is enough to separate them. It carries no
        padding, because the stage already pads the content area.
      */}
      <hr className="border-divider border-t" />

      {/*
        One column while the window is narrow and two once it has the room, which is what keeps all
        four tiles visible in the window's own default size rather than pushing the last one below
        the fold. The threshold is the window's own box through the stage's container query, never
        the viewport, so the tiles turn with the frame rather than with the screen.
      */}
      <ul className="grid grid-cols-1 gap-2 @min-[28rem]:grid-cols-2">
        {SOCIALS.map((social) => (
          <li key={social.id} className="flex min-w-0">
            <SocialTile social={social} />
          </li>
        ))}
      </ul>
    </WindowStage>
  )
}
