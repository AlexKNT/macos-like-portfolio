import type { ReactNode } from 'react'

/** What a quiet line needs: the words it shows. */
export type QuietLineProps = { readonly children: ReactNode }

/**
 * The line a window shows where content is missing rather than broken. It sits on a surface of
 * its own rather than floating on the body, so a missing state reads as a place in the layout
 * instead of a hole in it. Spec 0005, AC-8, AC-9.
 */
export function QuietLine({ children }: QuietLineProps) {
  return (
    <p className="bg-surface-sunken text-text-muted rounded-panel w-fit max-w-full px-4 py-3 text-sm">
      {children}
    </p>
  )
}
