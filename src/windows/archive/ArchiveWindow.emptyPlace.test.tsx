import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { ArchiveEmptyButton } from '#windows/archive/ArchiveEmptyButton'
import { ArchiveScope } from '#windows/archive/ArchiveScope'
import { ArchiveWindow } from '#windows/archive/ArchiveWindow'
import { countLine, emptyControlLabel, emptyLine } from '#windows/archive/archiveLines'
import type { OpenTarget } from '#content/types'

/*
 * The Archive in a build whose Trash place holds nothing, which is the case the window has to show
 * from its first paint rather than discover partway through: one quiet line, no list, no count, and
 * a control that reports itself as having nothing to answer while still taking the keyboard.
 *
 * The content layer is stood in for here because the shipped place holds two leftovers, and a place
 * with none is a valid build rather than a broken window. Spec 0012, AC-3, AC-4, AC-6, AC-11.
 */
vi.mock('#content/reads', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#content/reads')>()

  return { ...actual, findPlace: () => ({ name: 'Trash', items: [], pitch: null }) }
})

const TARGET: OpenTarget = { kind: 'window', windowId: 'archive' }

/** The window on its own: the scope, the body and the control the title bar would carry. */
function setup() {
  return render(
    <WindowManagerProvider>
      <ArchiveScope windowId="archive" windowKey="archive" target={TARGET}>
        <ArchiveEmptyButton />
        <ArchiveWindow windowId="archive" windowKey="archive" target={TARGET} />
      </ArchiveScope>
    </WindowManagerProvider>,
  )
}

/** The stage's live region, which is the one way this window says anything out loud. */
function liveRegion(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[aria-live="polite"]')

  if (found === null) {
    throw new Error('the stage renders no live region')
  }

  return found
}

describe('the Archive on a place that holds nothing', () => {
  // covers: AC-3, AC-6
  it('shows the shared quiet line from the first paint, with no list and no count', () => {
    setup()

    const content = screen.getByRole('group', { name: 'Archive' })

    expect(within(content).getByText(emptyLine())).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
    expect(within(content).queryByText(countLine(0))).toBeNull()
  })

  // covers: AC-4, AC-6
  it('reports from the first paint that the control has nothing to answer, while it still reaches it', () => {
    setup()

    const control = screen.getByRole('button', { name: emptyControlLabel() })

    expect(control).toHaveAttribute('aria-disabled', 'true')

    // Not the native `disabled`: the control keeps its place in the tab order rather than dropping
    // the keyboard back to the top of the page.
    expect(control).toBeEnabled()
  })

  // covers: AC-11
  it('says nothing out loud, because it opened empty rather than becoming empty', async () => {
    const user = userEvent.setup()

    setup()

    expect(liveRegion()).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: emptyControlLabel() }))

    // A press with nothing behind it is a no op, so there is no change to announce either.
    expect(liveRegion()).toBeEmptyDOMElement()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
