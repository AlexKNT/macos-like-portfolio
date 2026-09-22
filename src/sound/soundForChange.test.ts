import { describe, expect, it } from 'vitest'

import { soundForChange } from '#sound/soundForChange'
import { createWindowManagerState, reduceWindowManager } from '#store/windowManager'
import type { OpenTarget } from '#content/types'
import type { WindowManagerState } from '#store/windowManager'

/*
 * The one rule that decides what the desk sounds like, driven through the window manager's own
 * reducer rather than through hand built states, so what it is asked about is the manager's real
 * behaviour. Spec 0013, AC-4, AC-5, AC-7.
 */

/** The cascade step the provider reads off the token layer, written here as the manager sees it. */
const STEP = 32

const CONTACT: OpenTarget = { kind: 'window', windowId: 'contact' }
const RESUME: OpenTarget = { kind: 'window', windowId: 'resume' }

/** Opens a target the way the shell asks for one, on a desktop or on a phone. */
function opened(state: WindowManagerState, target: OpenTarget): WindowManagerState {
  return reduceWindowManager(state, {
    type: 'open',
    target,
    opener: { kind: 'dock' },
    cascadeStep: STEP,
  })
}

/** A manager holding one window, which is the state most of these checks start from. */
function withOne(target: OpenTarget, compact = false): WindowManagerState {
  return opened(createWindowManagerState(compact), target)
}

describe('a window arriving', () => {
  // covers: AC-4
  it('asks for the open sound', () => {
    expect(soundForChange(createWindowManagerState(false), withOne(CONTACT))).toBe('open')
  })

  // covers: AC-7
  it('asks for the open sound alone when a phone closes what the new window covers', () => {
    // One window on screen: the resume opens and the contact leaves in the same transition, and
    // one press is one sound, so the arrival is what is heard.
    const phone = opened(withOne(CONTACT, true), RESUME)

    expect(soundForChange(withOne(CONTACT, true), phone)).toBe('open')
    expect(phone.instances).toHaveLength(1)
  })

  // covers: AC-5
  it('asks for nothing when the window was already open and is only brought forward', () => {
    const first = withOne(CONTACT)

    expect(soundForChange(first, opened(first, CONTACT))).toBeUndefined()
  })
})

describe('a window leaving', () => {
  // covers: AC-4
  it('asks for the close sound', () => {
    const one = withOne(CONTACT)
    const gone = reduceWindowManager(one, { type: 'close', key: 'contact' })

    expect(soundForChange(one, gone)).toBe('close')
  })

  // covers: AC-4
  it('asks for the minimise sound when a window goes down to the dock', () => {
    const one = withOne(CONTACT)
    const away = reduceWindowManager(one, { type: 'minimise', key: 'contact' })

    expect(soundForChange(one, away)).toBe('minimise')
  })
})

describe('everything that is not a window arriving, leaving or going down to the dock', () => {
  // covers: AC-5
  it('asks for nothing when the state is handed back unchanged', () => {
    const one = withOne(CONTACT)

    expect(soundForChange(one, one)).toBeUndefined()
  })

  // covers: AC-5
  it('asks for nothing when another window is focused', () => {
    const two = opened(withOne(CONTACT), RESUME)
    const focused = reduceWindowManager(two, { type: 'focus', key: 'contact' })

    expect(soundForChange(two, focused)).toBeUndefined()
  })

  // covers: AC-5
  it('asks for nothing when a window comes back from the dock', () => {
    const one = withOne(CONTACT)
    const away = reduceWindowManager(one, { type: 'minimise', key: 'contact' })
    const back = reduceWindowManager(away, { type: 'restore', key: 'contact' })

    expect(soundForChange(away, back)).toBeUndefined()
  })

  // covers: AC-5
  it('asks for nothing when the work area is measured, or a window is zoomed', () => {
    const one = withOne(CONTACT)

    expect(
      soundForChange(one, reduceWindowManager(one, { type: 'zoom', key: 'contact' })),
    ).toBeUndefined()
    expect(
      soundForChange(
        one,
        reduceWindowManager(one, { type: 'setWorkArea', size: { width: 1280, height: 584 } }),
      ),
    ).toBeUndefined()
  })

  // covers: AC-5
  it('asks for nothing when the layout crosses the compact breakpoint, which changes no window', () => {
    const one = withOne(CONTACT)
    const narrowed = reduceWindowManager(one, { type: 'setCompact', compact: true })

    expect(narrowed.instances).toHaveLength(one.instances.length)
    expect(soundForChange(one, narrowed)).toBeUndefined()
  })
})
