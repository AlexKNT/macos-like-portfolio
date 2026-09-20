import type { ReactNode, Ref } from 'react'

/**
 * What a stage needs: the name of the thing it stages, and how that thing is arranged around it.
 */
export type WindowStageProps = {
  /**
   * The body's own subject, which names the content area: the window's title from
   * `WINDOWS[id].title`, or the thing the body shows. Required, because a stage with no name
   * is a body assistive tech cannot announce and the type should refuse it.
   */
  readonly name: string
  /** The heading the staged thing carries, when it has a name of its own. */
  readonly heading?: string
  /** The body's own sidebar, which sits beside the content above the compact breakpoint. */
  readonly side?: ReactNode
  /** What the window last said, announced once through the stage's one live region. */
  readonly status?: string
  /** The content area's element, for the one body that moves focus on a content change. */
  readonly regionRef?: Ref<HTMLDivElement>
  readonly children: ReactNode
}

/**
 * The shape every window body is built in: one container that is also the container query
 * context (`@container`), an optional sidebar, and the one content area that scrolls, holds the
 * optional heading and takes the keyboard when a body asks for it. The status is announced
 * through the stage's single polite live region, so a window never invents its own.
 *
 * The content area is a named `group` rather than a second `region`: the window frame is already
 * a region named by the window, and two nested regions carrying one name read as a stutter to a
 * screen reader's landmark list and break every role and name query. The `data-window-stage`
 * marker is what the registry baseline test counts, so "every body renders exactly one stage" is
 * a mechanical check rather than a matter of review.
 *
 * Spec 0006, AC-1, AC-2.
 */
export function WindowStage({
  name,
  heading,
  side,
  status,
  regionRef,
  children,
}: WindowStageProps) {
  return (
    <div data-window-stage="" className="@container h-full min-h-0">
      <div className="flex h-full flex-col @min-[40rem]:flex-row">
        {side}
        <div
          ref={regionRef}
          role="group"
          tabIndex={-1}
          aria-label={name}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5 @min-[40rem]:p-6"
        >
          {heading === undefined ? null : (
            <h2 className="text-text text-lg font-semibold">{heading}</h2>
          )}
          {children}
        </div>
      </div>
      {/*
        The one live region a window has. It is a `div` rather than a `p` on purpose: a body
        counts its own paragraphs in tests, and a stage that added one would make every such
        count a lie. It stays in the DOM empty, so a change to it is what gets announced.
      */}
      <div aria-live="polite" className="sr-only">
        {status ?? ''}
      </div>
    </div>
  )
}
