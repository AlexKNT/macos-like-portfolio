import { WINDOWS } from '#content/windows'
import { QuietLine } from '#windows/QuietLine'
import { WindowStage } from '#windows/WindowStage'
import { PitchContent } from '#windows/projects/PitchContent'
import { textFileFrom } from '#windows/projects/fileFromTarget'
import { unreadableFileLine } from '#windows/projects/quietLines'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * A text file shown on its own: its subtitle when it has one, then its paragraphs, set by the
 * same component the project detail view reads a pitch with. The file is read from the target
 * the manager holds, so the window shows what it was asked for and the title bar already names
 * it. A target that is not a text file at all is a quiet line rather than an empty frame.
 * Spec 0005, AC-6; spec 0006, AC-1.
 */
export function TextFileBody({ windowId, target }: WindowBodyProps) {
  const file = textFileFrom(target)

  if (file === null) {
    return (
      <WindowStage name={WINDOWS[windowId].title}>
        <QuietLine>{unreadableFileLine()}</QuietLine>
      </WindowStage>
    )
  }

  return (
    <WindowStage name={WINDOWS[windowId].title}>
      <article className="flex flex-col">
        <PitchContent file={file} />
      </article>
    </WindowStage>
  )
}
