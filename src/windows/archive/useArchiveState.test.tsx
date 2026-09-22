import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { findPlace } from '#content/reads'
import { ArchiveScope } from '#windows/archive/ArchiveScope'
import { useArchiveState } from '#windows/archive/useArchiveState'
import type { OpenTarget } from '#content/types'
import type { ArchiveView } from '#windows/archive/useArchiveState'

/**
 * The value the Archive's scope hands its body and its title bar: the leftovers the Trash place
 * holds, the moment the gesture is in, and whether the control has anything to answer.
 *
 * The pure transitions are pinned in `archiveState.test.ts` and the two consumers in the body's and
 * the control's own suites. This file pins the one thing they share: the scope reads the place once
 * and hands one value over, and reading it outside the window is a wiring mistake rather than a
 * state to paper over. Spec 0012, AC-4, AC-7, AC-13.
 */

const TARGET: OpenTarget = { kind: 'window', windowId: 'archive' }
const TRASH = findPlace({ kind: 'location', locationId: 'trash' })

/** Reports the window's own view every time the scope renders it, which is what a consumer reads. */
function Reader({ onView }: { readonly onView: (view: ArchiveView) => void }) {
  const view = useArchiveState()

  useEffect(() => {
    onView(view)
  }, [onView, view])

  return null
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('reading the Archive window state', () => {
  // covers: AC-4, AC-7
  it('hands a consumer the leftovers the place holds, the moment, and whether the control answers', () => {
    const onView = vi.fn<(view: ArchiveView) => void>()

    render(
      <ArchiveScope windowId="archive" windowKey="archive" target={TARGET}>
        <Reader onView={onView} />
      </ArchiveScope>,
    )

    const view = onView.mock.calls[0]?.[0]

    expect(view?.state).toBe('holding')
    expect(view?.items.map((item) => item.name)).toEqual(TRASH.items.map((item) => item.name))
    expect(view?.canEmpty).toBe(true)
  })

  // covers: AC-7
  it('throws outside a scope, since that is a wiring mistake rather than a state to paper over', () => {
    // React reports a failed render on the console as well as throwing; the check is the throw.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Reader onView={vi.fn()} />)).toThrow(
      'useArchiveState needs an ArchiveScope above it',
    )
  })
})
