import { describe, expect, it } from 'vitest'

import { WINDOWS } from '#content/windows'
import {
  EMPTY_WINDOW_MANAGER,
  WINDOW_LAYOUT,
  clampPosition,
  focusedKeyOf,
  reduceWindowManager,
  resolveOpenTarget,
} from '#store/windowManager'
import type { FileId, OpenTarget, WindowId } from '#content/types'
import type {
  WindowInstance,
  WindowManagerAction,
  WindowManagerState,
  WindowOpener,
} from '#store/windowManager'

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
  opener: WindowOpener = { kind: 'dock' },
): WindowManagerState {
  return dispatch(state, { type: 'open', target, opener, cascadeStep: STEP })
}

/**
 * The same state with one window put away in the dock. The minimise action that will do this
 * belongs to a later strand, so the check builds the state the model already describes, out of
 * an instance the reducer really produced.
 */
function withMinimised(state: WindowManagerState, key: string): WindowManagerState {
  return {
    ...state,
    instances: state.instances.map((instance): WindowInstance =>
      instance.key === key ? { ...instance, status: 'minimised' } : instance,
    ),
  }
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

  // covers: AC-2, AC-6
  it('brings a window back from the dock when its key is opened again', () => {
    const putAway = withMinimised(openProjects(), 'projects')
    const reopened = open(putAway, { kind: 'window', windowId: 'projects' })

    expect(reopened.instances).toHaveLength(1)
    expect(only(reopened).status).toBe('normal')
    expect(focusedKeyOf(reopened.instances)).toBe('projects')
  })

  // covers: AC-3, AC-6
  it('leaves a minimised window out of the focus, whichever one is put away', () => {
    const both = open(openProjects(), { kind: 'window', windowId: 'contact' })

    expect(focusedKeyOf(withMinimised(both, 'contact').instances)).toBe('projects')
    expect(focusedKeyOf(withMinimised(both, 'projects').instances)).toBe('contact')
  })

  // covers: AC-1
  it('reports no focused window while nothing is open', () => {
    expect(focusedKeyOf(EMPTY_WINDOW_MANAGER.instances)).toBeNull()
  })

  // covers: AC-3
  it('gives every arrival a stacking number nothing else holds, above the ones below it', () => {
    const three = open(openProjects(), { kind: 'window', windowId: 'contact' })
    const opened = open(three, { kind: 'window', windowId: 'gallery' })
    const numbers = opened.instances.map((instance) => instance.z)

    expect(new Set(numbers).size).toBe(numbers.length)
    expect(only(opened).z).toBeLessThan(Math.max(...numbers))
    expect(focusedKeyOf(opened.instances)).toBe('gallery')
  })

  // covers: AC-3
  it('leaves the state alone when the window asked for is already on top', () => {
    const both = open(openProjects(), { kind: 'window', windowId: 'contact' })

    expect(dispatch(both, { type: 'focus', key: 'contact' })).toBe(both)
  })

  // covers: AC-2
  it('wraps the cascade after four steps instead of walking off the surface', () => {
    const roomy = dispatch(EMPTY_WINDOW_MANAGER, {
      type: 'setWorkArea',
      size: { width: 4000, height: 4000 },
    })
    const targets: readonly OpenTarget[] = [
      { kind: 'window', windowId: 'projects' },
      { kind: 'window', windowId: 'articles' },
      { kind: 'window', windowId: 'gallery' },
      { kind: 'window', windowId: 'skills' },
      { kind: 'window', windowId: 'resume' },
      { kind: 'window', windowId: 'contact' },
    ]
    const opened = targets.reduce<WindowManagerState>((state, target) => open(state, target), roomy)

    // The first window sits half a step in, the sixth steps back onto the second one's spot.
    expect(opened.instances[0]?.position).toEqual({ x: STEP / 2, y: STEP / 2 })
    expect(opened.instances[5]?.position).toEqual(opened.instances[1]?.position)
  })

  // covers: AC-2
  it('counts only the windows on the desktop toward the cascade step', () => {
    const two = open(openProjects(), { kind: 'window', windowId: 'contact' })
    const third = open(withMinimised(two, 'projects'), { kind: 'window', windowId: 'gallery' })

    // One window is on the desktop, so this is the second spot, not the third.
    expect(third.instances.find((instance) => instance.key === 'gallery')?.position).toEqual({
      x: STEP,
      y: STEP,
    })
  })

  // covers: AC-8
  it('records the window that asked for a window, so focus can walk back to it', () => {
    const opened = open(
      EMPTY_WINDOW_MANAGER,
      { kind: 'window', windowId: 'articles' },
      { kind: 'window', key: 'projects' },
    )

    expect(only(opened).opener).toEqual({ kind: 'window', key: 'projects' })
  })
})

describe('the window layout', () => {
  // covers: AC-1
  it('has an entry for every window the content layer lists, with a floor below its default', () => {
    const ids = Object.keys(WINDOWS) as readonly WindowId[]

    expect(ids).toHaveLength(9)

    for (const id of ids) {
      const layout = WINDOW_LAYOUT[id]

      expect(layout.windowId, id).toBe(id)
      expect(layout.minSize.width, id).toBeGreaterThan(0)
      expect(layout.minSize.height, id).toBeGreaterThan(0)
      expect(layout.minSize.width, id).toBeLessThanOrEqual(layout.defaultSize.width)
      expect(layout.minSize.height, id).toBeLessThanOrEqual(layout.defaultSize.height)
    }
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

  // covers: AC-1, AC-2
  it('sends an image file to the preview window, keyed by the item and titled by the file', () => {
    const resolved = resolveOpenTarget({ kind: 'file', fileId: 'nike-screenshot' })

    expect(resolved.ok && resolved.value).toMatchObject({
      windowId: 'imageFile',
      key: 'imageFile:nike-screenshot',
      title: 'nike.png',
    })
  })

  // covers: AC-1
  it('sends a link and the resume out of the app, carrying where they go', () => {
    const link = resolveOpenTarget({ kind: 'file', fileId: 'nike-live' })
    const resume = resolveOpenTarget({ kind: 'file', fileId: 'resume-pdf' })

    expect(link.ok).toBe(false)
    expect(link.ok ? undefined : link.error).toEqual({
      kind: 'leavesApp',
      href: expect.stringContaining('youtu.be'),
    })
    expect(resume.ok ? undefined : resume.error).toEqual({
      kind: 'leavesApp',
      href: '/files/resume.pdf',
    })
  })

  // covers: AC-2
  it('hands the target it resolved back, so a re-open can re-target the same window', () => {
    const target: OpenTarget = { kind: 'location', locationId: 'about' }
    const resolved = resolveOpenTarget(target)

    expect(resolved.ok && resolved.value.target).toEqual(target)
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
