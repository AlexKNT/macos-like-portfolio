import { describe, expect, it } from 'vitest'

import { targetForPlace } from '#content/reads'
import { resolveOpenTarget } from '#store/windowManager'
import { DEFAULT_PLACE, placeOnTop, popPlace, pushPlace } from '#windows/projects/projectHistory'
import type { Place } from '#content/types'

/**
 * The projects window's own history: the places read before the one showing, with the two rules
 * that keep Back honest. It is pure, so the push once rule and the pop rule are checked without
 * a render, without a manager and without a browser. Spec 0005, AC-5.
 */

const WORK: Place = { kind: 'location', locationId: 'work' }
const ABOUT: Place = { kind: 'location', locationId: 'about' }
const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }

describe('the place history', () => {
  // covers: AC-2, AC-5
  it('seeds the stack with the place a bare Projects open lands on', () => {
    const resolved = resolveOpenTarget({ kind: 'window', windowId: 'projects' })

    expect(DEFAULT_PLACE).toEqual(WORK)
    expect(resolved.ok && resolved.value.target).toEqual(targetForPlace(DEFAULT_PLACE))
  })

  // covers: AC-5
  it('pushes a new place on top, and leaves the stack alone when it is already there', () => {
    const first = pushPlace([WORK], ABOUT)
    const second = pushPlace(first, NIKE)

    expect(second).toEqual([WORK, ABOUT, NIKE])

    // The place showing is already on top, so a change naming it pushes nothing: that is what
    // stops Back from writing a target that would push a step again.
    expect(pushPlace(second, NIKE)).toBe(second)

    // Coming back to a place it has left behind is a real step, and pushes one.
    expect(pushPlace(second, ABOUT)).toEqual([WORK, ABOUT, NIKE, ABOUT])
  })

  // covers: AC-5
  it('pops one step, and leaves a stack of one entry as it is', () => {
    const trail = [WORK, ABOUT, NIKE]
    const one = [WORK]

    expect(popPlace(trail)).toEqual([WORK, ABOUT])
    expect(popPlace(one)).toBe(one)
  })

  // covers: AC-5
  it('reads the place on top of the stack, which is the place showing', () => {
    expect(placeOnTop([WORK, ABOUT])).toEqual(ABOUT)
    expect(placeOnTop([])).toBeNull()
  })
})
