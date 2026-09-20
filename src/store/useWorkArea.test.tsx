import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import { useWorkArea } from '#store/useWorkArea'

/**
 * Watching the box windows are placed inside: the desktop container's own content box,
 * reported to the manager on the first measurement and on every change after it, and let go
 * when the container goes away. Spec 0004, AC-9.
 */

/** The environment's own observer, put back after each check. */
const REAL_OBSERVER = globalThis.ResizeObserver

/**
 * An observer that records what it was asked to watch and can report a box on demand, which
 * is how a resize reaches the hook without a browser laying anything out.
 */
class TestResizeObserver implements ResizeObserver {
  static created: TestResizeObserver[] = []

  readonly elements: Element[] = []
  disconnected = false
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    TestResizeObserver.created.push(this)
  }

  observe(element: Element): void {
    this.elements.push(element)
  }

  unobserve(): void {}

  disconnect(): void {
    this.disconnected = true
  }

  /** Reports a content box the way the browser would. */
  report(size: { readonly width: number; readonly height: number }): void {
    const entry = { target: this.elements[0], contentRect: size } as unknown as ResizeObserverEntry

    this.callback([entry], this)
  }
}

/** The container under test, and a readout of the work area the manager is holding. */
function Host({ withContainer = true }: { readonly withContainer?: boolean }) {
  const ref = useRef<HTMLElement | null>(null)
  const { workArea } = useWindowManager()

  useWorkArea(ref)

  return (
    <>
      {withContainer ? <section ref={ref} aria-label="Desktop" /> : null}
      <p data-testid="area">
        {workArea === null ? 'unmeasured' : `${workArea.width}x${workArea.height}`}
      </p>
    </>
  )
}

/** Renders the host inside the provider, and hands back the parts a check reaches for. */
function setup(withContainer = true) {
  const view = render(
    <WindowManagerProvider>
      <Host withContainer={withContainer} />
    </WindowManagerProvider>,
  )

  return { area: screen.getByTestId('area'), unmount: view.unmount }
}

/** The observer the hook created, which each check drives by hand. */
function observer(): TestResizeObserver {
  const created = TestResizeObserver.created[0]

  if (created === undefined) {
    throw new Error('expected the hook to observe the container')
  }

  return created
}

beforeEach(() => {
  TestResizeObserver.created = []
  globalThis.ResizeObserver = TestResizeObserver
})

afterEach(() => {
  globalThis.ResizeObserver = REAL_OBSERVER
})

describe('the work area watcher', () => {
  // covers: AC-9
  it('watches the container it is given and reports its measured box to the manager', () => {
    const { area } = setup()

    expect(observer().elements).toEqual([screen.getByRole('region', { name: 'Desktop' })])
    expect(area).toHaveTextContent('unmeasured')

    act(() => observer().report({ width: 1280, height: 720 }))

    expect(area).toHaveTextContent('1280x720')
  })

  // covers: AC-9
  it('reports a later measurement, so a resize reaches every window', () => {
    const { area } = setup()

    act(() => observer().report({ width: 1280, height: 720 }))
    act(() => observer().report({ width: 700, height: 480 }))

    expect(area).toHaveTextContent('700x480')
  })

  // covers: AC-9
  it('drops a measurement of zero, so an unmeasured container changes nothing', () => {
    const { area } = setup()

    act(() => observer().report({ width: 0, height: 0 }))
    act(() => observer().report({ width: 1280, height: 0 }))

    expect(area).toHaveTextContent('unmeasured')
  })

  // covers: AC-9, AC-10
  it('lets the container go when the desktop unmounts, leaving nothing observing', () => {
    const { unmount } = setup()

    act(() => observer().report({ width: 1280, height: 720 }))
    unmount()

    expect(observer().disconnected).toBe(true)
    expect(screen.queryByTestId('area')).toBeNull()
  })

  // covers: AC-9
  it('starts no observer when there is no container to watch', () => {
    setup(false)

    expect(TestResizeObserver.created).toHaveLength(0)
  })
})
