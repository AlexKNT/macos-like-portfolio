import type { TextFile } from '#content/types'

/** What the pitch needs: the text file to set. */
export type PitchContentProps = { readonly file: TextFile }

/**
 * A text file set for reading: its subtitle when it carries one, then its paragraphs, in the
 * order the file lists them. It is shared by the project detail view and by the text file
 * window, so a project's own words are written down once and read the same in both places, and
 * the measure is held to a comfortable line length rather than the window's full width.
 * Spec 0005, AC-4, AC-6.
 */
export function PitchContent({ file }: PitchContentProps) {
  return (
    <div className="flex flex-col gap-3">
      {file.subtitle === undefined ? null : (
        <p className="text-text text-base font-medium">{file.subtitle}</p>
      )}
      {file.description.map((paragraph, index) => (
        <p key={index} className="text-text max-w-prose text-base leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  )
}
