import { useId } from 'react'
import type { CSSProperties, DOMAttributes, ReactNode, Ref } from 'react'

import { WindowControls } from '#components/WindowControls'

/**
 * The behaviour a caller wires onto a window: what a pointer and the keyboard do to it. It is
 * the frame's own element handlers and nothing else, so a window that is never moved passes
 * none of them and the frame stays inert. Spec 0004, AC-4, AC-5.
 */
export type WindowFrameProps = Pick<
  DOMAttributes<HTMLElement>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onKeyDown' | 'onFocus'
>

/** What a window needs to render its frame. */
export type WindowProps = {
  readonly title: string
  readonly children: ReactNode
  readonly leading?: ReactNode
  readonly trailing?: ReactNode
  readonly onClose?: () => void
  readonly onMinimise?: () => void
  readonly onZoom?: () => void
  /** Whether this window has the keyboard. A window that does not renders the quiet
   *  treatment: the softer shadow, the muted title and the dimmed lights. Spec 0004, AC-3. */
  readonly isFocused?: boolean
  readonly className?: string
  readonly style?: CSSProperties
  readonly frameProps?: WindowFrameProps
  /** The frame's own element, for whoever moves it, animates it or hands focus on. */
  readonly frameRef?: Ref<HTMLElement>
}

/**
 * The frame every window is built in: the rounded shell, the window shadow, the title bar
 * holding the three lights plus the `leading` and `trailing` slots, and the body the
 * caller fills. The title names the region, so assistive tech announces the window rather
 * than an unnamed group.
 *
 * It sets neither `position` nor `z-index` of its own: placing a window and deciding what
 * sits on top is the window manager's business, so the caller passes them in through
 * `className` and `style`. Spec 0002, AC-5.
 *
 * The title bar is the window's drag handle for whoever moves it, and it says so with
 * `data-window-handle`, so a move can tell a press on the bar from a press on the three
 * lights or on the body. Spec 0004, AC-4.
 *
 * The frame itself is focusable but not tabbable (`tabIndex={-1}`): a press on the body brings
 * it the keyboard, so the arrow keys move the window afterwards, while Tab still walks the
 * lights and the body's own controls and never lands on the frame. Spec 0004, AC-5.
 *
 * It reads one thing about the manager (whether it has the keyboard) and derives the rest of
 * the quiet treatment from it here, so a window feature composes the frame without knowing the
 * manager exists. Spec 0004, AC-3.
 */
export function Window({
  title,
  children,
  leading,
  trailing,
  onClose,
  onMinimise,
  onZoom,
  isFocused = true,
  className = '',
  style,
  frameProps,
  frameRef,
}: WindowProps) {
  const titleId = useId()

  return (
    <section
      {...frameProps}
      ref={frameRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      style={style}
      className={`window-frame bg-surface rounded-window flex flex-col overflow-hidden ${
        isFocused ? 'shadow-window' : 'shadow-window-quiet'
      } ${className}`}
    >
      <header
        data-window-handle=""
        className="bg-surface-sunken border-border flex touch-none items-center gap-3 border-b px-3 py-1.5 select-none"
      >
        <WindowControls
          title={title}
          onClose={onClose}
          onMinimise={onMinimise}
          onZoom={onZoom}
          quiet={!isFocused}
        />
        {leading}
        <span
          id={titleId}
          className={`flex-1 truncate text-center text-sm font-medium ${
            isFocused ? 'text-text' : 'text-text-muted'
          }`}
        >
          {title}
        </span>
        {trailing}
      </header>
      <div className="text-text flex-1 overflow-auto">{children}</div>
    </section>
  )
}
