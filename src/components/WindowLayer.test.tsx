import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

import { WindowLayer } from '#components/WindowLayer'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import type { WindowId } from '#content/types'

/**
 * The layer every open window sits on: one bound window per instance the manager holds, in
 * the order the manager lists them, and nothing at all while none is open. Spec 0003, AC-1,
 * AC-11.
 */

/** The windows a check opens, held as constants so the effect never sees a fresh array. */
const NONE: readonly WindowId[] = []
const TWO: readonly WindowId[] = ['projects', 'contact']

/** A stand in desktop that opens the windows it was handed. */
function Shell({ windowIds }: { readonly windowIds: readonly WindowId[] }) {
  const { open } = useWindowManager()

  useEffect(() => {
    for (const windowId of windowIds) {
      open({ kind: 'window', windowId }, { kind: 'dock' })
    }
  }, [open, windowIds])

  return <WindowLayer />
}

/** Renders the layer with the given windows open. */
function setup(windowIds: readonly WindowId[]): void {
  render(
    <WindowManagerProvider>
      <Shell windowIds={windowIds} />
    </WindowManagerProvider>,
  )
}

describe('the window layer', () => {
  // covers: AC-1
  it('renders nothing at all while the manager holds no window', () => {
    setup(NONE)

    expect(screen.queryAllByRole('region')).toHaveLength(0)
  })

  // covers: AC-1, AC-2
  it('renders one frame per open window, in the order the manager holds them', () => {
    setup(TWO)

    const frames = screen.getAllByRole('region')

    expect(frames).toHaveLength(2)
    // A bare Projects open lands on the work location, so that frame is named for the place.
    expect(frames[0]).toHaveAccessibleName('Work')
    expect(frames[1]).toHaveAccessibleName('Contact')
  })
})
