import { useRef } from 'react'

import { QuietLine } from '#windows/QuietLine'
import { emptyLine } from '#windows/archive/archiveLines'
import { useLineReveal } from '#windows/useLineReveal'

/**
 * The line the Archive shows when it holds nothing, whether that is because a gesture just
 * finished or because its place holds nothing at all.
 *
 * It owns its container rather than being a line inside the body, because the shared reveal arms
 * itself once per mount: at the moment the window opens the line is not in the page yet, so a
 * reveal owned by the body would have nothing to uncover and the line would simply appear.
 * Mounting with the line is what gives the reveal something to print. Spec 0012, AC-6, AC-9.
 */
export function ArchiveEmptyLine() {
  const container = useRef<HTMLDivElement>(null)

  useLineReveal(container)

  return (
    <div ref={container} className="flex flex-col">
      <div data-line="" className="w-fit max-w-full">
        <QuietLine>{emptyLine()}</QuietLine>
      </div>
    </div>
  )
}
