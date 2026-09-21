import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCallback, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { historyStepFor, useShellHistory } from '#store/useShellHistory'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowElements } from '#store/useWindowElements'
import { useWindowManager } from '#store/useWindowManager'
import { restoreLayout, usePhoneLayout } from '../test/layout'
import type { WindowInstance } from '#store/windowManager'

/**
 * The phone's own history entry: one while a window is on screen, none while the phone is home, so
 * a back press closes what is open and the next one leaves the site as it always did.
 * Spec 0009, AC-11.
 */

/** Reports what the manager holds, and offers the two transitions history has to follow. */
function Harness({ into }: { readonly into: (readonly WindowInstance[])[] }) {
  useShellHistory()

  const { instances, focusedKey, open, close } = useWindowManager()
  const { registerDesktop } = useWindowElements()

  useEffect(() => {
    into.push(instances)
  }, [instances, into])

  const attach = useCallback(
    (element: HTMLElement | null) => {
      registerDesktop(element)
    },
    [registerDesktop],
  )

  return (
    <>
      <section ref={attach} aria-label="Home" tabIndex={-1} />
      <button
        type="button"
        onClick={() => open({ kind: 'window', windowId: 'projects' }, { kind: 'home' })}
      >
        Open
      </button>
      <button
        type="button"
        onClick={() => {
          if (focusedKey !== null) {
            close(focusedKey)
          }
        }}
      >
        Close
      </button>
    </>
  )
}

/** Renders the shell and hands back the two controls it offers. */
function setup() {
  const history: (readonly WindowInstance[])[] = []

  render(
    <WindowManagerProvider>
      <Harness into={history} />
    </WindowManagerProvider>,
  )

  return {
    open: screen.getByRole('button', { name: 'Open' }),
    close: screen.getByRole('button', { name: 'Close' }),
    latest: () => history.at(-1) ?? [],
  }
}

/** A back press, which is what a phone's own gesture delivers. */
function pressBack(): void {
  act(() => {
    window.dispatchEvent(new Event('popstate'))
  })
}

describe('the entry the shell owes', () => {
  // covers: AC-11
  it('is one while a phone shows a window, none while it is home, and none on the desktop', () => {
    expect(historyStepFor(false, true, true)).toBe('push')
    expect(historyStepFor(true, true, true)).toBe('none')
    expect(historyStepFor(true, false, true)).toBe('pop')
    expect(historyStepFor(false, false, true)).toBe('none')

    // Above the breakpoint the shell never writes history, whatever is open.
    expect(historyStepFor(false, true, false)).toBe('none')
    expect(historyStepFor(false, false, false)).toBe('none')
    expect(historyStepFor(true, true, false)).toBe('pop')
  })
})

describe('the phone history entry', () => {
  beforeEach(() => {
    usePhoneLayout()
  })

  afterEach(() => {
    restoreLayout()
  })

  // covers: AC-11
  it('takes one entry when a window opens, and gives it back when that window leaves', async () => {
    const user = userEvent.setup()
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { open, close, latest } = setup()
    const before = window.history.length

    await user.click(open)

    expect(window.history.length).toBe(before + 1)
    expect(latest()).toHaveLength(1)

    await user.click(close)

    // The entry goes with the window rather than staying behind, so one press of back does the
    // same thing whichever way the window left.
    expect(back).toHaveBeenCalled()
    expect(latest()).toHaveLength(0)

    back.mockRestore()
  })

  // covers: AC-11
  it('closes the window on screen on a back press, and lands the keyboard on the surface', async () => {
    const user = userEvent.setup()
    const { open, latest } = setup()

    await user.click(open)

    expect(latest()).toHaveLength(1)

    pressBack()

    expect(latest()).toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Home' })).toHaveFocus()
  })

  // covers: AC-11, AC-15
  it('writes nothing above the breakpoint, so the desktop keeps no entry of its own', async () => {
    restoreLayout()

    const user = userEvent.setup()
    const { open, latest } = setup()
    const before = window.history.length

    await user.click(open)

    expect(latest()).toHaveLength(1)
    expect(window.history.length).toBe(before)

    // A back press with a window open is the browser's own business on the desktop, not the
    // shell's: nothing closes.
    pressBack()

    expect(latest()).toHaveLength(1)
  })
})
