import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCopyText } from '#windows/useCopyText'
import type { CopyState } from '#windows/copyState'

/**
 * The copy pair's hook: what a press produces when the clipboard takes the name, when it refuses
 * it, and when there is no clipboard at all, plus the one case that must change nothing, a second
 * press on a name that is already confirmed.
 * Spec 0006, umbrella AC-2; skills AC-3, AC-4.
 */

/** What one probe needs: where to report each state it settles on. */
type ProbeProps = { readonly onState: (state: CopyState) => void }

/**
 * Two names in two rows, each one press away. Every state the hook settles on is handed to
 * `onState` from an effect keyed on that state, so a state that is the same object as the last one
 * is not reported again, which is exactly what "nothing changed" means here.
 */
function Probe({ onState }: ProbeProps) {
  const { state, copy } = useCopyText()

  useEffect(() => {
    onState(state)
  }, [onState, state])

  return (
    <>
      <p data-testid="state">
        {state.kind === 'idle' ? 'idle' : `${state.kind} ${state.key.row} ${state.key.name}`}
      </p>
      <button type="button" onClick={() => copy({ row: 'frontend', name: 'React.js' }, 'React.js')}>
        React.js
      </button>
      <button
        type="button"
        onClick={() => copy({ row: 'database', name: 'PostgreSQL' }, 'PostgreSQL')}
      >
        PostgreSQL
      </button>
    </>
  )
}

/** Renders the probe and hands back what it reported, which is one call per settled state. */
function setup() {
  const onState = vi.fn()

  render(<Probe onState={onState} />)

  return onState
}

/** Puts a clipboard on the environment for one check, since jsdom does not carry one. */
function withClipboard(value: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('useCopyText', () => {
  // covers: skills AC-3
  it('starts idle, and confirms the row a name was taken from', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    withClipboard({ writeText })

    setup()

    expect(screen.getByTestId('state')).toHaveTextContent('idle')

    await user.click(screen.getByRole('button', { name: 'React.js' }))

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('copied frontend React.js'),
    )
    expect(writeText).toHaveBeenCalledWith('React.js')
  })

  // covers: skills AC-3
  it('moves the confirmation to the row of the second press, leaving the first alone', async () => {
    const user = userEvent.setup()
    withClipboard({ writeText: () => Promise.resolve() })

    setup()

    await user.click(screen.getByRole('button', { name: 'React.js' }))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('React.js'))

    await user.click(screen.getByRole('button', { name: 'PostgreSQL' }))

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('copied database PostgreSQL'),
    )
  })

  // covers: skills AC-3
  it('changes nothing at all when a name already confirmed is pressed again', async () => {
    const user = userEvent.setup()
    withClipboard({ writeText: () => Promise.resolve() })

    const onState = setup()

    await user.click(screen.getByRole('button', { name: 'React.js' }))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('copied'))

    const settled = onState.mock.calls.length
    const lastState = onState.mock.lastCall?.[0]

    await user.click(screen.getByRole('button', { name: 'React.js' }))
    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('copied frontend React.js'),
    )

    // No new state was reported, and the one in hand is the same object: nothing re-rendered
    // from the state, so the confirmation stays put and the live region has no new word.
    expect(onState.mock.calls.length).toBe(settled)
    expect(onState.mock.lastCall?.[0]).toBe(lastState)
  })

  // covers: skills AC-4
  it('refuses as a value when the write is rejected, and never throws', async () => {
    const user = userEvent.setup()
    withClipboard({ writeText: () => Promise.reject(new Error('denied')) })

    setup()

    await user.click(screen.getByRole('button', { name: 'React.js' }))

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('failed frontend React.js'),
    )
  })

  // covers: skills AC-4
  it('refuses as a value when the browser offers no clipboard', async () => {
    const user = userEvent.setup()

    Reflect.deleteProperty(navigator, 'clipboard')

    setup()

    await user.click(screen.getByRole('button', { name: 'PostgreSQL' }))

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('failed database PostgreSQL'),
    )
  })
})
