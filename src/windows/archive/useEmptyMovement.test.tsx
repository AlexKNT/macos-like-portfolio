import { render } from '@testing-library/react'
import gsap from 'gsap'
import { StrictMode, useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import { useEmptyMovement } from '#windows/archive/useEmptyMovement'
import type { ArchiveState } from '#windows/archive/archiveState'

/**
 * The one movement the Archive makes, driven the way its body drives it: one block on screen and a
 * state that moves. gsap is stood in for at this boundary, because a timeline is the library's and
 * jsdom does not paint, so what is checked is when a timeline is built, what it is built with, and
 * what is left running when the window goes. Spec 0012, AC-5, AC-9, AC-10.
 */

/** The gesture as the body hands it over: the state, the block, and where the landing goes. */
function Gesture({ state, landed }: { readonly state: ArchiveState; readonly landed: () => void }) {
  const block = useRef<HTMLDivElement>(null)

  useEmptyMovement(state, block, landed)

  return <div ref={block}>the block</div>
}

/** Puts the motion tokens on the document, which is where the hook reads them. */
function declareMotion(duration: string, ease?: string): void {
  document.documentElement.style.setProperty('--duration-fast', duration)

  if (ease !== undefined) {
    document.documentElement.style.setProperty('--ease-out', ease)
  }
}

/** Every context a spy built, so a check can say how many are still running. */
function contextSpy(): { readonly revert: Mock }[] {
  const contexts: { readonly revert: Mock }[] = []

  vi.spyOn(gsap, 'context').mockImplementation(((run: () => void) => {
    run()

    const revert = vi.fn()

    contexts.push({ revert })

    return { revert }
  }) as never)

  return contexts
}

afterEach(() => {
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})

describe('the movement that empties the Archive', () => {
  // covers: AC-5
  it('moves the block on the token duration and easing, and lands when the movement ends', () => {
    const landed = vi.fn()
    const built: gsap.TweenVars[] = []

    vi.spyOn(gsap, 'to').mockImplementation(((_targets: unknown, vars: gsap.TweenVars) => {
      built.push(vars)

      return {}
    }) as never)

    declareMotion('120ms', 'cubic-bezier(0.25, 0.1, 0.25, 1)')

    render(<Gesture state="clearing" landed={landed} />)

    const [vars] = built

    expect(built).toHaveLength(1)
    expect(vars?.duration).toBe(0.12)
    expect(vars?.ease).toBe('cubic-bezier(0.25, 0.1, 0.25, 1)')
    expect(vars?.opacity).toBe(0)
    expect(landed).not.toHaveBeenCalled()

    vars?.onComplete?.()

    expect(landed).toHaveBeenCalledTimes(1)
  })

  // covers: AC-9
  it('starts no timeline at all under reduced motion, and lands the window at once', () => {
    const landed = vi.fn()
    const to = vi.spyOn(gsap, 'to')

    declareMotion('0ms')

    render(<Gesture state="clearing" landed={landed} />)

    // The state is reached the same way it is with motion on, so there is no second code path and
    // nothing waits on a movement that will never run.
    expect(to).not.toHaveBeenCalled()
    expect(landed).toHaveBeenCalledTimes(1)
  })

  // covers: AC-5
  it('does nothing while the window is holding its leftovers or already emptied', () => {
    const landed = vi.fn()
    const to = vi.spyOn(gsap, 'to')

    declareMotion('120ms')

    const { rerender } = render(<Gesture state="holding" landed={landed} />)

    expect(to).not.toHaveBeenCalled()
    expect(landed).not.toHaveBeenCalled()

    rerender(<Gesture state="emptied" landed={landed} />)

    expect(to).not.toHaveBeenCalled()
    expect(landed).not.toHaveBeenCalled()
  })

  // covers: AC-10
  it('reverts its context and lands nothing when the window goes mid gesture', () => {
    const landed = vi.fn()

    vi.spyOn(gsap, 'to').mockImplementation((() => ({})) as never)

    const contexts = contextSpy()

    declareMotion('120ms')

    const { unmount } = render(<Gesture state="clearing" landed={landed} />)

    unmount()

    // Nothing runs on over a block that has left the page, and no state is set afterwards.
    expect(contexts).toHaveLength(1)
    expect(contexts[0].revert).toHaveBeenCalledTimes(1)
    expect(landed).not.toHaveBeenCalled()
  })

  // covers: AC-10
  it('leaves at most one movement running when the effect runs twice in development', () => {
    const landed = vi.fn()

    vi.spyOn(gsap, 'to').mockImplementation((() => ({})) as never)

    const contexts = contextSpy()

    declareMotion('120ms')

    // StrictMode mounts every effect twice, which is what a window meets on every open in
    // development: the first movement is reverted before the second is built.
    render(
      <StrictMode>
        <Gesture state="clearing" landed={landed} />
      </StrictMode>,
    )

    expect(contexts.length).toBeGreaterThan(0)
    expect(contexts.filter((context) => context.revert.mock.calls.length === 0)).toHaveLength(1)
  })
})
