import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ArchiveEmptyButton } from '#windows/archive/ArchiveEmptyButton'
import { ArchiveScope } from '#windows/archive/ArchiveScope'
import { emptyControlLabel, emptyControlWord } from '#windows/archive/archiveLines'
import { useArchiveState } from '#windows/archive/useArchiveState'
import type { OpenTarget } from '#content/types'
import type { ArchiveView } from '#windows/archive/useArchiveState'

/**
 * The one control the Archive puts in its title bar, in every state it can be in: what it is
 * announced as, what it does while it has leftovers, and what it refuses to do once it has none.
 *
 * The scope is real and the body is left out, so the gesture stays where it is put and each state
 * can be read on its own: a press that lands, a press that changes nothing, and a landing called
 * by hand. Spec 0012, AC-4, AC-5, AC-10.
 */

const TARGET: OpenTarget = { kind: 'window', windowId: 'archive' }

/** Reports the window's own view every time the scope renders, which is how a no op is seen. */
function Probe({ onView }: { readonly onView: (view: ArchiveView) => void }) {
  const view = useArchiveState()

  useEffect(() => {
    onView(view)
  }, [onView, view])

  return null
}

/** The control and the scope around it, with a handle on the state the scope is holding. */
function setup() {
  const onView = vi.fn<(view: ArchiveView) => void>()

  render(
    <ArchiveScope windowId="archive" windowKey="archive" target={TARGET}>
      <ArchiveEmptyButton />
      <Probe onView={onView} />
    </ArchiveScope>,
  )

  /** The view the scope reported last, which is the state the window is in. */
  function lastView(): ArchiveView {
    const calls = onView.mock.calls
    const found = calls[calls.length - 1]

    if (found === undefined) {
      throw new Error('the scope never reported its view')
    }

    return found[0]
  }

  /** How many times the scope has rendered, which is what a repeated press must not change. */
  function renders(): number {
    return onView.mock.calls.length
  }

  return { control: screen.getByRole('button', { name: emptyControlLabel() }), lastView, renders }
}

describe('the Archive Empty control', () => {
  // covers: AC-4
  it('is announced by the window it empties, with its visible word inside the name', () => {
    const { control } = setup()

    expect(control).toHaveTextContent(emptyControlWord())
    expect(control).toHaveAttribute('aria-label', emptyControlLabel())

    // It keeps the visible word rather than taking a native `disabled`, so a press can still reach
    // the window's own state and be answered there.
    expect(control).not.toHaveAttribute('disabled')
  })

  // covers: AC-4
  it('reaches the keyboard in order and keeps it through the press', async () => {
    const user = userEvent.setup()
    const { control, lastView } = setup()

    await user.tab()
    expect(document.activeElement).toBe(control)

    await user.click(control)

    // The press starts the gesture and leaves the visitor where they were, so the next Tab carries
    // on into the window rather than restarting at the top of the page.
    expect(lastView().state).toBe('clearing')
    expect(document.activeElement).toBe(control)
    expect(control).toHaveAttribute('aria-disabled', 'true')
  })

  // covers: AC-10
  it('changes nothing at all when it is pressed while it has nothing to answer', async () => {
    const user = userEvent.setup()
    const { control, lastView, renders } = setup()

    await user.click(control)
    expect(lastView().state).toBe('clearing')

    const started = renders()
    await user.click(control)

    // The machine hands the very same value back, so React bails out: nothing re-renders, nothing
    // re-announces, and the press is indistinguishable from not pressing at all.
    expect(lastView().state).toBe('clearing')
    expect(renders()).toBe(started)

    // Now the other half of "nothing to answer": an empty already taken.
    act(() => {
      lastView().landed()
    })

    expect(lastView().state).toBe('emptied')

    const emptied = renders()
    await user.click(control)

    expect(lastView().state).toBe('emptied')
    expect(renders()).toBe(emptied)
    expect(control).toHaveAttribute('aria-disabled', 'true')
    expect(control).toBeEnabled()
  })
})
