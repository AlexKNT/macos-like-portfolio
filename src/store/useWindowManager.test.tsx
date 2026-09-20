import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'

/**
 * Reading the manager: the hook every shell module and every window frame calls, and the
 * wiring mistake it refuses to paper over. Spec 0003, AC-11.
 */

/** The smallest reader there is, so only the hook's own contract shows. */
function Reader() {
  const { instances, focusedKey, workArea } = useWindowManager()

  const area = workArea === null ? 'unmeasured' : `${workArea.width}x${workArea.height}`

  return <p data-testid="readout">{`${instances.length}|${focusedKey ?? 'none'}|${area}`}</p>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWindowManager', () => {
  // covers: AC-1
  it('hands a reader the manager its provider holds, empty until something opens', () => {
    render(
      <WindowManagerProvider>
        <Reader />
      </WindowManagerProvider>,
    )

    expect(screen.getByTestId('readout')).toHaveTextContent('0|none|unmeasured')
  })

  // covers: AC-11
  it('throws outside a provider, since that is a wiring mistake rather than a state to paper over', () => {
    // React reports a failed render on the console as well as throwing; the check is the throw.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Reader />)).toThrow(
      'useWindowManager needs a WindowManagerProvider above it',
    )
  })
})
