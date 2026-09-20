import { FinderGrid } from '#windows/projects/FinderGrid'
import { PitchContent } from '#windows/projects/PitchContent'
import type { OpenTarget, ProjectFolder, TextFile } from '#content/types'

/** What the detail view needs: the project, its pitch text file, and where its files lead. */
export type ProjectDetailProps = {
  readonly project: ProjectFolder
  readonly pitch: TextFile | null
  readonly onOpen: (target: OpenTarget) => void
}

/**
 * A project's own words, then its files: the pitch above, the files as icons below, in the order
 * the folder lists them. The heading above it all is the content region's, which names the place
 * showing, so the project's name, its pitch and its files read in that order on screen and in
 * the accessibility tree. Spec 0005, AC-4.
 */
export function ProjectDetail({ project, pitch, onOpen }: ProjectDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      {pitch === null ? null : <PitchContent file={pitch} />}
      <FinderGrid items={project.children} placeName={project.name} onOpen={onOpen} />
    </div>
  )
}
