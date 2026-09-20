import { describe, expect, it } from 'vitest'

import {
  EMPTY_WINDOW_MANAGER,
  WINDOW_LAYOUT,
  clampPosition,
  focusedKeyOf,
  reduceWindowManager,
  resolveOpenTarget,
} from '#store/windowManager'
import type { FileId, OpenTarget } from '#content/types'
import type { WindowManagerAction, WindowManagerState } from '#store/windowManager'

/**
 * The window manager's rules, tested without a render and without a browser, which is the
 * point of keeping them pure. Spec 0003 opens the store; spec 0004 extends the same module.
 */

/** The cascade step the caller passes in the built app, read from its measure token. */
const STEP = 32

/** Runs one action over a state. */
function dispatch(state: WindowManagerState, action: WindowManagerAction): WindowManagerState {
  return reduceWindowManager(state, action)
}

/** Opens a target, which is the action most of these checks need. */
function open(
  state: WindowManagerState,
  target: OpenTarget,
  opener: 'dock' | 'desktop' | 'bar' = 'dock',
): WindowManagerState {
  return dispatch(state, { type: 'open', target, opener: { kind: opener }, cascadeStep: STEP })
}

/** Opens one plain window, which is the state most of the movement checks start from. */
function openProjects(): WindowManagerState {
  return open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' })
}

/** The single instance of a state, for the checks that only ever open one window. */
function only(state: WindowManagerState) {
  const instance = state.instances[0]

  if (instance === undefined) {
    throw new Error('expected one open window')
  }

  return instance
}

describe('the window manager', () => {
  it('opens a window at its layout size, on top, with the opener it was given', () => {
    const after = open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' })

    expect(after.instances).toHaveLength(1)
    expect(after.instances[0]).toMatchObject({
      key: 'projects',
      windowId: 'projects',
      title: 'Projects',
      size: WINDOW_LAYOUT.projects.defaultSize,
      status: 'normal',
      filled: false,
      opener: { kind: 'dock' },
    })
    expect(focusedKeyOf(after.instances)).toBe('projects')
  })

  it('focuses the window a key already has, and re-targets it, instead of opening a second', () => {
    const first = open(EMPTY_WINDOW_MANAGER, {
      kind: 'project',
      projectId: 'nike-ecommerce',
    })
    const second = open(first, { kind: 'project', projectId: 'food-delivery-app' })

    expect(second.instances).toHaveLength(1)
    expect(second.instances[0]?.target).toEqual({
      kind: 'project',
      projectId: 'food-delivery-app',
    })
  })

  it('steps each new window along the cascade, so two windows never share a spot', () => {
    const after = open(open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' }), {
      kind: 'window',
      windowId: 'contact',
    })

    const [first, second] = after.instances

    expect(first?.position).not.toEqual(second?.position)
    expect(second?.z).toBeGreaterThan(first?.z ?? 0)
  })

  it('takes the cascade step it is given, so the token layer owns the distance', () => {
    const roomy = dispatch(EMPTY_WINDOW_MANAGER, {
      type: 'setWorkArea',
      size: { width: 1600, height: 900 },
    })
    const opened = dispatch(roomy, {
      type: 'open',
      target: { kind: 'window', windowId: 'projects' },
      opener: { kind: 'dock' },
      cascadeStep: 40,
    })

    expect(opened.instances[0]?.position).toEqual({ x: 20, y: 20 })
  })

  it('raises the window it is asked to focus, and leaves an unknown key alone', () => {
    const opened = open(open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' }), {
      kind: 'window',
      windowId: 'contact',
    })

    expect(focusedKeyOf(opened.instances)).toBe('contact')
    expect(focusedKeyOf(dispatch(opened, { type: 'focus', key: 'projects' }).instances)).toBe(
      'projects',
    )
    expect(dispatch(opened, { type: 'focus', key: 'gallery' })).toBe(opened)
  })

  it('closes a window and hands the focus to the next one down, and ignores an unknown key', () => {
    const opened = open(open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' }), {
      kind: 'window',
      windowId: 'contact',
    })

    const closed = dispatch(opened, { type: 'close', key: 'contact' })

    expect(closed.instances.map((instance) => instance.key)).toEqual(['projects'])
    expect(focusedKeyOf(closed.instances)).toBe('projects')
    expect(dispatch(closed, { type: 'close', key: 'gallery' })).toBe(closed)
  })

  it('opens nothing for a target that leaves the page', () => {
    const external: OpenTarget = { kind: 'external', href: 'https://example.com' }

    expect(resolveOpenTarget(external).ok).toBe(false)
    expect(open(EMPTY_WINDOW_MANAGER, external)).toBe(EMPTY_WINDOW_MANAGER)
  })
})

describe('the target resolver', () => {
  it('sends a window target to its own window, keeping the id as the key', () => {
    const resolved = resolveOpenTarget({ kind: 'window', windowId: 'resume' })

    expect(resolved.ok && resolved.value).toMatchObject({
      windowId: 'resume',
      key: 'resume',
      title: 'Resume',
    })
  })

  it('sends a location and a project to the Projects window', () => {
    const targets: readonly OpenTarget[] = [
      { kind: 'location', locationId: 'about' },
      { kind: 'project', projectId: 'ai-resume-analyzer' },
    ]

    for (const target of targets) {
      const resolved = resolveOpenTarget(target)

      expect(resolved.ok && resolved.value).toMatchObject({ windowId: 'projects', key: 'projects' })
    }
  })

  it('sends a text file to the text window, keyed by the item, and titles it after the file', () => {
    const resolved = resolveOpenTarget({ kind: 'file', fileId: 'nike-about' })

    expect(resolved.ok && resolved.value).toMatchObject({
      windowId: 'textFile',
      key: 'textFile:nike-about',
      title: 'Nike Project.txt',
    })
  })

  it('reports a file target the tree does not hold as a value, not as a throw', () => {
    const missing = 'nope' as FileId
    const resolved = resolveOpenTarget({ kind: 'file', fileId: missing })

    expect(resolved.ok).toBe(false)
    expect(resolved.ok ? undefined : resolved.error).toEqual({
      kind: 'notFound',
      collection: 'files',
      id: 'nope',
    })
  })
})

describe('the work area', () => {
  /** A work area the Projects window fits in twice over, so both edges are reachable. */
  const AREA = { width: 1600, height: 900 }

  it('clamps nothing until the container has been measured', () => {
    const opened = openProjects()
    const moved = dispatch(opened, {
      type: 'move',
      key: 'projects',
      position: { x: 99_999, y: -500 },
    })

    expect(opened.workArea).toBeNull()
    expect(only(moved).position).toEqual({ x: 99_999, y: -500 })
  })

  it('keeps a window inside the work area, whichever edge it is pushed against', () => {
    const projects = WINDOW_LAYOUT.projects.defaultSize
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })

    const bottomRight = dispatch(measured, {
      type: 'move',
      key: 'projects',
      position: { x: AREA.width, y: AREA.height },
    })
    const topLeft = dispatch(bottomRight, {
      type: 'move',
      key: 'projects',
      position: { x: -40, y: -40 },
    })

    expect(only(bottomRight).position).toEqual({
      x: AREA.width - projects.width,
      y: AREA.height - projects.height,
    })
    expect(only(topLeft).position).toEqual({ x: 0, y: 0 })
  })

  it('pins a window bigger than the work area to its top left corner, so the title bar stays reachable', () => {
    const tiny = { width: 200, height: 120 }
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: tiny })

    expect(clampPosition({ x: 400, y: 300 }, WINDOW_LAYOUT.projects.defaultSize, tiny)).toEqual({
      x: 0,
      y: 0,
    })
    expect(only(measured).position).toEqual({ x: 0, y: 0 })
  })

  it('spawns a new window clamped into the work area rather than off it', () => {
    const projects = WINDOW_LAYOUT.projects.defaultSize
    // Room for the window and eight pixels to spare, so the cascade's first step overshoots.
    const snug = { width: projects.width + 8, height: projects.height + 8 }
    const measured = dispatch(EMPTY_WINDOW_MANAGER, { type: 'setWorkArea', size: snug })
    const opened = open(measured, { kind: 'window', windowId: 'projects' })

    expect(only(opened).position).toEqual({ x: 8, y: 8 })
  })

  it('pulls every window back in when the work area shrinks, and ignores an unmeasured one', () => {
    const projects = WINDOW_LAYOUT.projects.defaultSize
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const far = dispatch(measured, {
      type: 'move',
      key: 'projects',
      position: { x: AREA.width - projects.width, y: 400 },
    })
    const shrunk = dispatch(far, { type: 'setWorkArea', size: { width: 800, height: 600 } })

    expect(only(shrunk).position).toEqual({ x: 800 - projects.width, y: 600 - projects.height })
    expect(dispatch(shrunk, { type: 'setWorkArea', size: { width: 0, height: 0 } })).toBe(shrunk)
    expect(dispatch(shrunk, { type: 'setWorkArea', size: { width: 800, height: 600 } })).toBe(
      shrunk,
    )
  })

  it('leaves the state untouched when a move lands where the window already sits', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const here = only(measured).position

    expect(dispatch(measured, { type: 'move', key: 'projects', position: here })).toBe(measured)
    expect(dispatch(measured, { type: 'move', key: 'gallery', position: { x: 10, y: 10 } })).toBe(
      measured,
    )
  })
})
