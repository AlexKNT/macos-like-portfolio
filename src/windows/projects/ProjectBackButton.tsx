import { useProjectHistory } from '#windows/projects/useProjectHistory'

/**
 * The one control the Finder puts in the title bar: Back, which returns to the place before
 * this one. It is named for the place it returns to, so a screen reader hears where the press
 * leads rather than which way the arrow points, and it renders nothing at all while the history
 * holds a single entry, since there is nowhere to go back to then.
 *
 * The arrow is drawn inline rather than loaded as an image, because there is no arrow asset in
 * the project and a mark that follows the title bar's own ink works in both modes.
 * Spec 0005, AC-5.
 */
export function ProjectBackButton() {
  const { canGoBack, backLabel, back } = useProjectHistory()

  if (!canGoBack || backLabel === null) {
    return null
  }

  return (
    <button
      type="button"
      onClick={back}
      aria-label={backLabel}
      className="interactive-hover interactive-active focus-visible:interactive-focus rounded-control flex size-6 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3.5">
        <path
          d="M12.5 4 6.5 10l6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
