import { useId } from 'react'
import type { ReactNode } from 'react'

import { WindowControls } from '#components/WindowControls'

/** What a window needs to render its frame. */
export type WindowProps = {
  readonly title: string
  readonly children: ReactNode
  readonly leading?: ReactNode
  readonly trailing?: ReactNode
  readonly onClose?: () => void
  readonly onMinimise?: () => void
  readonly onZoom?: () => void
  readonly className?: string
}

/**
 * The frame every window is built in: the rounded shell, the window shadow, the title bar
 * holding the three lights plus the `leading` and `trailing` slots, and the body the
 * caller fills. The title names the region, so assistive tech announces the window rather
 * than an unnamed group.
 *
 * It sets neither `position` nor `z-index`: placing a window and deciding what sits on
 * top is the window manager's business, not the frame's. Spec 0002, AC-5.
 */
export function Window({
  title,
  children,
  leading,
  trailing,
  onClose,
  onMinimise,
  onZoom,
  className = '',
}: WindowProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className={`window-frame bg-surface rounded-window shadow-window flex flex-col overflow-hidden ${className}`}
    >
      <header className="bg-surface-sunken border-border flex items-center gap-3 border-b px-3 py-1.5 select-none">
        <WindowControls title={title} onClose={onClose} onMinimise={onMinimise} onZoom={onZoom} />
        {leading}
        <span
          id={titleId}
          className="text-text-muted flex-1 truncate text-center text-sm font-medium"
        >
          {title}
        </span>
        {trailing}
      </header>
      <div className="text-text flex-1 overflow-auto">{children}</div>
    </section>
  )
}
