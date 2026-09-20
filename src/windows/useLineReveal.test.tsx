import { render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useLineReveal } from '#windows/useLineReveal'

/**
 * The reveal: what it masks, the timing it takes from the tokens, the clip it clears when it ends,
 * and the two cases that must leave every line alone (reduced motion, and a panel with nothing
 * marked). gsap is stood in for at this boundary, because a timeline is the library's and jsdom
 * does not paint: the real mask is proved in the browser by `e2e/skills.spec.ts`.
 * Spec 0006, AC-5.
 */

/** A panel of three printed lines, which is the shape a window hands the hook. */
function Printing() {
  const panel = useRef<HTMLDivElement>(null)

  useLineReveal(panel)

  return (
    <div ref={panel}>
      {['one', 'two', 'three'].map((line) => (
        <p key={line} data-line="">
          {line}
        </p>
      ))}
    </div>
  )
}

/** A panel whose content is already open: nothing carries `data-line`, so nothing is masked. */
function Unmarked() {
  const panel = useRef<HTMLDivElement>(null)

  useLineReveal(panel)

  return (
    <div ref={panel}>
      <p>already open</p>
    </div>
  )
}

/** The vars a timeline was built with, captured so a check can read them and end the timeline. */
let tween: gsap.TweenVars | null = null

/** Puts the motion tokens on the document, which is where the hook reads them. */
function declareTokens(durations: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(durations)) {
    document.documentElement.style.setProperty(`--duration-${name}`, value)
  }
}

afterEach(() => {
  tween = null
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})

describe('useLineReveal', () => {
  // covers: AC-5
  it('masks every marked line and uncovers them with the token duration, stagger and ease', () => {
    const set = vi.spyOn(gsap, 'set')
    const to = vi.spyOn(gsap, 'to').mockImplementation(((
      _targets: unknown,
      vars: gsap.TweenVars,
    ) => {
      tween = vars

      return {}
    }) as never)

    declareTokens({ base: '200ms', stagger: '60ms' })

    render(<Printing />)

    const lines = screen.getAllByText(/^(one|two|three)$/)

    expect(set).toHaveBeenCalledWith(
      lines,
      expect.objectContaining({ clipPath: 'inset(0 100% 0 0)' }),
    )
    expect(tween?.duration).toBe(0.2)
    expect(tween?.stagger).toBe(0.06)
    expect(to).toHaveBeenCalled()
  })

  // covers: AC-5
  it('keeps every line in the page while the mask is on, so nothing is typed in', () => {
    vi.spyOn(gsap, 'set')
    vi.spyOn(gsap, 'to').mockImplementation((() => ({})) as never)

    declareTokens({ base: '200ms', stagger: '60ms' })

    render(<Printing />)

    for (const line of ['one', 'two', 'three']) {
      expect(screen.getByText(line)).toBeInTheDocument()
    }
  })

  // covers: AC-5
  it('clears the clip when the timeline ends, so no line keeps a mask', () => {
    const set = vi.spyOn(gsap, 'set')

    vi.spyOn(gsap, 'to').mockImplementation(((_targets: unknown, vars: gsap.TweenVars) => {
      tween = vars

      return {}
    }) as never)

    declareTokens({ base: '200ms', stagger: '60ms' })

    render(<Printing />)

    const lines = screen.getAllByText(/^(one|two|three)$/)

    tween?.onComplete?.()

    expect(set).toHaveBeenLastCalledWith(lines, expect.objectContaining({ clearProps: 'clipPath' }))
  })

  // covers: AC-5
  it('does nothing at all under reduced motion, leaving the lines open', () => {
    const set = vi.spyOn(gsap, 'set')
    const to = vi.spyOn(gsap, 'to')

    declareTokens({ base: '0ms', stagger: '0ms' })

    render(<Printing />)

    expect(set).not.toHaveBeenCalled()
    expect(to).not.toHaveBeenCalled()
    expect(screen.getByText('one')).toBeInTheDocument()
  })

  // covers: AC-5
  it('leaves a panel with nothing marked alone', () => {
    const set = vi.spyOn(gsap, 'set')

    declareTokens({ base: '200ms', stagger: '60ms' })

    render(<Unmarked />)

    expect(set).not.toHaveBeenCalled()
  })

  // covers: AC-5
  it('clears the clip when the panel goes away, so nothing is left masked', () => {
    const revert = vi.fn()

    vi.spyOn(gsap, 'set')
    vi.spyOn(gsap, 'to').mockImplementation((() => ({})) as never)
    vi.spyOn(gsap, 'context').mockImplementation(((run: () => void) => {
      run()

      return { revert }
    }) as unknown as never)

    declareTokens({ base: '200ms', stagger: '60ms' })

    const { unmount } = render(<Printing />)

    unmount()

    // A window that closes mid print must not leave a timeline running over a panel that is
    // no longer in the page, which is what reverting the context is for.
    expect(revert).toHaveBeenCalledTimes(1)
  })
})
