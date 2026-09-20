import { useRef } from 'react'

import { TECH_GROUPS } from '#content/techStack'
import { WINDOWS } from '#content/windows'
import { WindowStage } from '#windows/WindowStage'
import { copyAnnouncement } from '#windows/copyLines'
import { COPY_HINT, PROMPT_LINE } from '#windows/skills/skillsLines'
import { TechStack } from '#windows/skills/TechStack'
import { useCopyText } from '#windows/useCopyText'
import { useLineReveal } from '#windows/useLineReveal'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * The stack, printed the way a terminal prints it: a prompt line, one row per area with its names,
 * and a line saying that a name can be taken away. The whole stack is in the page from the first
 * paint, so a screen reader, a selection and a test read it all at once, and the reveal only ever
 * changes what is painted.
 *
 * The body holds nothing of its own: the groups come from the content layer, the stage names the
 * window after `WINDOWS.skills.title`, the prompt line and the hint are the window's own words,
 * and the copy state lives beside the body for as long as the window is open. The one announcement
 * the window makes goes through the stage's live region, so a copy and a refusal each arrive once.
 * Spec 0006, AC-1, AC-3, AC-4, AC-5, AC-10, AC-11.
 */
export function SkillsWindow({ windowId }: WindowBodyProps) {
  const { state, copy } = useCopyText()
  const panel = useRef<HTMLDivElement>(null)

  useLineReveal(panel)

  return (
    <WindowStage name={WINDOWS[windowId].title} status={copyAnnouncement(state)}>
      <div ref={panel} className="font-roboto text-text flex flex-col gap-6 text-sm">
        <p data-line="" className="text-text-muted">
          {PROMPT_LINE}
        </p>
        <TechStack groups={TECH_GROUPS} state={state} onCopy={copy} />
        <p data-line="" className="text-text-muted border-divider border-t border-dashed pt-4">
          {COPY_HINT}
        </p>
      </div>
    </WindowStage>
  )
}
