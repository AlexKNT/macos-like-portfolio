import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { findPlace } from '#content/reads'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { ProjectHistoryScope } from '#windows/projects/ProjectHistoryScope'
import { useProjectHistory } from '#windows/projects/useProjectHistory'
import type { OpenTarget, Place } from '#content/types'

/**
 * The history the Finder keeps: the places a visitor has read, the place showing, and the way
 * back. The pure rules are pinned in `projectHistory.test.ts`; this file pins the scope that
 * holds them and reads the place out of the window's own target, so a change from outside the
 * window is the same event as a change from inside it.
 * Spec 0005, AC-5.
 */

const WORK: Place = { kind: 'location', locationId: 'work' }
const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }

/** What the scope hands a reader: the place, its name, and where Back would go. */
function Reader() {
  const { place, name, canGoBack, backLabel } = useProjectHistory()

  return (
    <p data-testid="readout">
      {`${place.kind}|${name}|${canGoBack ? (backLabel ?? 'no label') : 'nothing behind'}`}
    </p>
  )
}

/** Renders the window's own scope around a reader, with the target the manager holds. */
function setup(target: OpenTarget) {
  render(
    <WindowManagerProvider>
      <ProjectHistoryScope windowId="projects" windowKey="projects" target={target}>
        <Reader />
      </ProjectHistoryScope>
    </WindowManagerProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the projects history scope', () => {
  // covers: AC-5
  it('names the place the bare open lands on, with nowhere to go back to', () => {
    setup({ kind: 'window', windowId: 'projects' })

    expect(screen.getByTestId('readout')).toHaveTextContent(
      `location|${findPlace(WORK).name}|nothing behind`,
    )
  })

  // covers: AC-5
  it('offers the way back to work when the window opens straight at a project', () => {
    setup(NIKE)

    // A desktop icon opens the window at a project, and the stack is seeded with the place a
    // bare open would have shown, so Back is there from the first render.
    expect(screen.getByTestId('readout')).toHaveTextContent(
      `project|${findPlace(NIKE).name}|Back to ${findPlace(WORK).name}`,
    )
  })

  // covers: AC-5
  it('throws outside a scope, since that is a wiring mistake rather than a state to paper over', () => {
    // React reports a failed render on the console as well as throwing; the check is the throw.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Reader />)).toThrow(
      'useProjectHistory needs a ProjectHistoryScope above it',
    )
  })
})
