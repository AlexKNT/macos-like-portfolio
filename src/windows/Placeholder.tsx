import { WINDOWS } from '#content/windows'
import type { WindowId } from '#content/types'

/**
 * One line per window, naming what will live there once that window's own feature lands.
 * Keyed by the union, so a window id cannot be added without its line, and thrown away
 * window by window as the window features arrive. Spec 0003, AC-8.
 */
const PLACEHOLDER_LINES: Record<WindowId, string> = {
  projects:
    'Your project folders here, each one opening into the case study, the screenshots and the live link.',
  articles: 'Your writing, listed by date, each entry opening in a new tab.',
  gallery: 'Your photos, with the album sidebar filtering the grid.',
  skills: 'Your stack, printed in a terminal and grouped by area.',
  resume: 'Your resume, readable here and downloadable as a file.',
  contact: 'How to reach you: the address, a copy button and every social link.',
  archive: 'The leftover files, and a way to empty them.',
  textFile: 'A text file, with its paragraphs set for reading.',
  imageFile: 'An image, shown whole and captioned.',
}

/** What the placeholder body needs: which window it stands in for. */
export type PlaceholderProps = { readonly windowId: WindowId }

/**
 * The body a window shows while it has no body of its own yet: the app's icon, the window
 * name, and one line naming what will live there. It is a normal body in every other
 * respect, so the frame around it behaves exactly as the real one will. Spec 0003, AC-8.
 */
export function Placeholder({ windowId }: PlaceholderProps) {
  const window = WINDOWS[windowId]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-10 text-center">
      <img src={window.icon} alt="" className="size-12 select-none" />
      <p className="text-text text-lg font-medium">{window.title}</p>
      <p className="text-text-muted max-w-72 text-sm">{PLACEHOLDER_LINES[windowId]}</p>
    </div>
  )
}
