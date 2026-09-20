import { PitchContent } from '#windows/projects/PitchContent'
import { QuietLine } from '#windows/projects/QuietLine'
import { textFileFrom } from '#windows/projects/fileFromTarget'
import { unreadableFileLine } from '#windows/projects/quietLines'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * A text file shown on its own: its subtitle when it has one, then its paragraphs, set by the
 * same component the project detail view reads a pitch with. The file is read from the target
 * the manager holds, so the window shows what it was asked for and the title bar already names
 * it. A target that is not a text file at all is a quiet line rather than an empty frame.
 * Spec 0005, AC-6.
 */
export function TextFileBody({ target }: WindowBodyProps) {
  const file = textFileFrom(target)

  if (file === null) {
    return (
      <div className="p-6">
        <QuietLine>{unreadableFileLine()}</QuietLine>
      </div>
    )
  }

  return (
    <article className="flex flex-col p-6">
      <PitchContent file={file} />
    </article>
  )
}
