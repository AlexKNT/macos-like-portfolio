import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { WINDOW_LAYOUT } from '#store/windowManager'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import type { OpenTarget } from '#content/types'
import type { WindowManager } from '#store/useWindowManager'

/**
 * Holding the windows: the provider is the one place the manager's state lives, the one place
 * the actions are kept stable, and the one place a value the reducer must not know (the
 * cascade distance) is read from the token layer. Spec 0003, AC-8, AC-11; spec 0004, AC-1,
 * AC-2, AC-3, AC-9.
 */

/** The two targets the checks open, held as constants so nothing depends on object identity. */
const PROJECTS: OpenTarget = { kind: 'window', windowId: 'projects' }
const CONTACT: OpenTarget = { kind: 'window', windowId: 'contact' }

/** The manager the mounted provider is holding, refreshed after every render it makes. */
let held: WindowManager | null = null

/** Hands the test the manager, since the provider renders no surface of its own. */
function Capture() {
  const manager = useWindowManager()

  useEffect(() => {
    held = manager
  }, [manager])

  return null
}

/** The manager as it stands now, which is never a snapshot from before the last action. */
function manager(): WindowManager {
  if (held === null) {
    throw new Error('expected a mounted provider')
  }

  return held
}

/** Mounts the provider with the capture below it. */
function setup(): void {
  render(
    <WindowManagerProvider>
      <Capture />
    </WindowManagerProvider>,
  )
}

/** Declares the cascade token the way the stylesheet does. */
function declareStep(value: number): void {
  document.documentElement.style.setProperty('--window-cascade-step', `${value}`)
}

beforeEach(() => {
  held = null
})

afterEach(() => {
  document.documentElement.style.removeProperty('--window-cascade-step')
  held = null
})

describe('the window manager provider', () => {
  // covers: AC-1
  it('starts with nothing open and no work area, so nothing is clamped before a measurement', () => {
    setup()

    expect(manager().instances).toEqual([])
    expect(manager().focusedKey).toBeNull()
    expect(manager().workArea).toBeNull()
    expect(manager().open).toBeTypeOf('function')
  })

  // covers: AC-3
  it('derives the focused key as the top window, and moves it when another is asked for', () => {
    setup()

    act(() => manager().open(PROJECTS, { kind: 'dock' }))
    act(() => manager().open(CONTACT, { kind: 'bar' }))

    expect(manager().focusedKey).toBe('contact')

    act(() => manager().focus('projects'))

    expect(manager().focusedKey).toBe('projects')
  })

  // covers: AC-1, AC-4
  it('keeps the actions identical across a change, so a move does not re-render every window', () => {
    setup()

    const before = manager()

    act(() => before.open(PROJECTS, { kind: 'dock' }))

    expect(manager().open).toBe(before.open)
    expect(manager().focus).toBe(before.focus)
    expect(manager().close).toBe(before.close)
    expect(manager().move).toBe(before.move)
    expect(manager().setWorkArea).toBe(before.setWorkArea)
    // The list itself is a new one, which is what tells a reader something changed.
    expect(manager().instances).not.toBe(before.instances)
  })

  // covers: AC-9
  it('holds the work area it is given, and ignores a measurement of zero', () => {
    setup()

    act(() => manager().setWorkArea({ width: 1000, height: 700 }))

    expect(manager().workArea).toEqual({ width: 1000, height: 700 })

    act(() => manager().setWorkArea({ width: 0, height: 0 }))

    expect(manager().workArea).toEqual({ width: 1000, height: 700 })
  })

  // covers: AC-4, AC-5
  it('writes a move through to the geometry the frames are placed at, clamped by the work area', () => {
    const size = WINDOW_LAYOUT.projects.defaultSize

    setup()

    act(() => manager().setWorkArea({ width: 1000, height: 700 }))
    act(() => manager().open(PROJECTS, { kind: 'dock' }))
    act(() => manager().move('projects', { x: 99_999, y: 99_999 }))

    expect(manager().instances[0]?.position).toEqual({
      x: 1000 - size.width,
      y: 700 - size.height,
    })
  })

  // covers: AC-2
  it('reads the cascade step from the token layer on each open, not from the reducer', () => {
    setup()

    declareStep(40)
    act(() => manager().open(PROJECTS, { kind: 'dock' }))

    // The first window sits half a step in from the corner.
    expect(manager().instances[0]?.position).toEqual({ x: 20, y: 20 })

    declareStep(100)
    act(() => manager().open(CONTACT, { kind: 'bar' }))

    // The second steps by the token as it reads now, so the distance lives in the token layer.
    expect(manager().instances[1]?.position).toEqual({ x: 100, y: 100 })
  })
})
