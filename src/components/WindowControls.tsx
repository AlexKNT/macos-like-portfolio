/** What a window controls needs to render its three lights. */
export type WindowControlsProps = {
  readonly title: string
  readonly onClose?: () => void
  readonly onMinimise?: () => void
  readonly onZoom?: () => void
  /** Whether the window is the quiet one, which dims the lights rather than recolouring them. */
  readonly quiet?: boolean
}

/**
 * The three lights that sit at the left of a window's title bar, each a button whose
 * accessible name is built from the window title (`Close Projects`). A light with no
 * handler renders `disabled`, so the desktop never presents a control that does nothing
 * and the accessible tree says as much. The colour is the same whether or not a light is
 * disabled: it pictures a window, it is not a statement of state. A quiet window dims all
 * three through `window-quiet` and keeps their colours, so the mark still says "window"
 * while the title bar says it is not the one you are working in. Spec 0002, AC-5;
 * spec 0004, AC-3.
 */
export function WindowControls({
  title,
  onClose,
  onMinimise,
  onZoom,
  quiet = false,
}: WindowControlsProps) {
  const lights = [
    { id: 'close', label: `Close ${title}`, tone: 'bg-traffic-close', handler: onClose },
    {
      id: 'minimise',
      label: `Minimise ${title}`,
      tone: 'bg-traffic-minimise',
      handler: onMinimise,
    },
    { id: 'zoom', label: `Zoom ${title}`, tone: 'bg-traffic-zoom', handler: onZoom },
  ]

  return (
    <div className={`flex items-center gap-2.5 ${quiet ? 'window-quiet' : ''}`}>
      {lights.map(({ id, label, tone, handler }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          disabled={!handler}
          onClick={handler}
          className={`${tone} size-6 cursor-pointer rounded-full interactive-hover interactive-active interactive-disabled focus-visible:interactive-focus`}
        >
          {/*
            The visible light is the dot this button paints; the button itself is 24px so
            the target clears the minimum size the guidance asks for.
          */}
          <span aria-hidden="true" className={`${tone} block size-3.5 rounded-full`} />
        </button>
      ))}
    </div>
  )
}
