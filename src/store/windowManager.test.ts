import { describe, expect, it } from 'vitest'

import { placeName } from '#content/reads'
import { WINDOWS } from '#content/windows'
import {
  EMPTY_WINDOW_MANAGER,
  WINDOW_LAYOUT,
  clampPosition,
  createWindowManagerState,
  focusHopAfter,
  focusedKeyOf,
  hasDockButton,
  hasHomeTile,
  reduceWindowManager,
  resolveOpenTarget,
  windowGeometry,
} from '#store/windowManager'
import type { FileId, OpenTarget, Place, WindowId } from '#content/types'
import type {
  WindowKey,
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
 * The same state with one window put away in the dock, through the action the frame calls when
 * its yellow light is pressed.
 */
function withMinimised(state: WindowManagerState, key: WindowKey): WindowManagerState {
  return dispatch(state, { type: 'minimise', key })
}

/** Opens one plain window, which is the state most of the movement checks start from. */
function openProjects(): WindowManagerState {
  return open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' })
}

/** One open window, by default the only one, for the checks with a known set of them. */
function only(state: WindowManagerState, key: WindowKey = 'projects') {
  const instance = state.instances.find((open) => open.key === key)

  if (instance === undefined) {
    throw new Error(`expected an open window under ${key}`)
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
      // A bare Projects open lands on the work location (spec 0005, AC-2), so the title bar
      // reads the place the window shows rather than the name of the app that shows it.
      title: 'Work',
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

    expect(only(opened, 'articles').opener).toEqual({ kind: 'window', key: 'projects' })
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

  it('sends a location and a project to the Projects window, titled by the place', () => {
    const targets: readonly Place[] = [
      { kind: 'location', locationId: 'about' },
      { kind: 'project', projectId: 'ai-resume-analyzer' },
    ]

    for (const target of targets) {
      const resolved = resolveOpenTarget(target)

      expect(resolved.ok && resolved.value).toMatchObject({
        windowId: 'projects',
        key: 'projects',
        title: placeName(target),
      })
    }
  })

  it('answers a bare Projects open with the work location, so its title is never the app name', () => {
    const resolved = resolveOpenTarget({ kind: 'window', windowId: 'projects' })

    expect(resolved.ok && resolved.value).toMatchObject({
      windowId: 'projects',
      key: 'projects',
      title: 'Work',
      target: { kind: 'location', locationId: 'work' },
    })
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

  it('shrinks a window to fit a smaller work area, never below its layout floor', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const shrunk = dispatch(measured, { type: 'setWorkArea', size: { width: 600, height: 400 } })

    expect(only(shrunk).size).toEqual({ width: 600, height: 400 })
    expect(only(shrunk).position).toEqual({ x: 0, y: 0 })
  })

  it('lets the layout floor win when the work area is smaller than the window may become', () => {
    const floor = WINDOW_LAYOUT.projects.minSize
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const crushed = dispatch(measured, { type: 'setWorkArea', size: { width: 200, height: 120 } })

    // The window overflows a container that cannot hold it, pinned to the corner so its title
    // bar stays reachable.
    expect(only(crushed).size).toEqual(floor)
    expect(only(crushed).position).toEqual({ x: 0, y: 0 })
  })
})

describe('the green light', () => {
  const AREA = { width: 1600, height: 900 }

  it('fills a window to the whole work area, at its top left corner', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const filled = dispatch(measured, { type: 'zoom', key: 'projects' })

    expect(only(filled)).toMatchObject({ filled: true, size: AREA, position: { x: 0, y: 0 } })
  })

  it('unfills it to the layout size, anchored at that same corner', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const filled = dispatch(measured, { type: 'zoom', key: 'projects' })
    const unfilled = dispatch(filled, { type: 'zoom', key: 'projects' })

    expect(only(unfilled)).toMatchObject({
      filled: false,
      size: WINDOW_LAYOUT.projects.defaultSize,
      position: { x: 0, y: 0 },
    })
  })

  it('keeps a filled window at the whole work area when the container changes', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const filled = dispatch(measured, { type: 'zoom', key: 'projects' })
    const resized = dispatch(filled, { type: 'setWorkArea', size: { width: 900, height: 700 } })

    expect(only(resized).size).toEqual({ width: 900, height: 700 })
  })

  it('ignores the green light for a key that is not open', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })

    expect(dispatch(measured, { type: 'zoom', key: 'gallery' })).toBe(measured)
  })
})

describe('the dock', () => {
  const AREA = { width: 1600, height: 900 }

  it('puts a window away with its geometry, its filled flag and its stacking number kept', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })
    const filled = dispatch(measured, { type: 'zoom', key: 'projects' })
    const away = withMinimised(filled, 'projects')

    expect(only(away)).toMatchObject({
      status: 'minimised',
      size: only(filled).size,
      position: only(filled).position,
      filled: true,
      z: only(filled).z,
    })
  })

  it('brings a window back at the size it left with, on top of the desk', () => {
    const two = open(openProjects(), { kind: 'window', windowId: 'contact' })
    const away = withMinimised(two, 'projects')
    const back = dispatch(away, { type: 'restore', key: 'projects' })

    expect(only(back, 'projects')).toMatchObject({
      status: 'normal',
      size: only(two, 'projects').size,
    })
    expect(only(back, 'projects').z).toBeGreaterThan(only(back, 'contact').z)
    expect(focusedKeyOf(back.instances)).toBe('projects')
  })

  it('leaves a minimised window out of the stacking order while it waits', () => {
    const two = open(openProjects(), { kind: 'window', windowId: 'contact' })
    const away = withMinimised(two, 'contact')

    expect(focusedKeyOf(away.instances)).toBe('projects')
  })

  it('ignores a minimise of a key that is not open, or is already put away', () => {
    const away = withMinimised(openProjects(), 'projects')

    expect(dispatch(away, { type: 'minimise', key: 'projects' })).toBe(away)
    expect(dispatch(away, { type: 'minimise', key: 'gallery' })).toBe(away)
  })

  it('ignores a restore of a window that is not waiting in the dock', () => {
    const measured = dispatch(openProjects(), { type: 'setWorkArea', size: AREA })

    expect(dispatch(measured, { type: 'restore', key: 'projects' })).toBe(measured)
    expect(dispatch(measured, { type: 'restore', key: 'gallery' })).toBe(measured)
  })

  it('knows which windows have a button to come back from', () => {
    expect(hasDockButton('projects')).toBe(true)
    expect(hasDockButton('resume')).toBe(false)
    expect(hasDockButton('textFile')).toBe(false)
    expect(hasDockButton('imageFile')).toBe(false)
  })
})

describe('the focus handoff', () => {
  /** Two windows, where the second one was opened by the first. */
  function stacked(): WindowManagerState {
    const first = open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' })
    const second = open(
      first,
      { kind: 'window', windowId: 'contact' },
      {
        kind: 'window',
        key: 'projects',
      },
    )

    return second
  }

  it('hands the keyboard back to the window that opened it', () => {
    expect(focusHopAfter(stacked().instances, 'contact', false)).toEqual({
      kind: 'window',
      key: 'projects',
    })
  })

  it('hands it to the window underneath when the opener was not a window', () => {
    const two = open(openProjects(), { kind: 'window', windowId: 'contact' })

    expect(focusHopAfter(two.instances, 'contact', false)).toEqual({
      kind: 'window',
      key: 'projects',
    })
  })

  it('skips an opener that is waiting in the dock', () => {
    const away = withMinimised(stacked(), 'projects')

    expect(focusHopAfter(away.instances, 'contact', false)).toEqual({
      kind: 'dock',
      windowId: 'contact',
    })
  })

  it('skips an opener that has gone', () => {
    const closed = dispatch(stacked(), { type: 'close', key: 'projects' })

    expect(focusHopAfter(closed.instances, 'contact', false)).toEqual({
      kind: 'dock',
      windowId: 'contact',
    })
  })

  it('falls to the dock button the window itself owns when nothing else is left', () => {
    expect(focusHopAfter(openProjects().instances, 'projects', false)).toEqual({
      kind: 'dock',
      windowId: 'projects',
    })
  })

  it('falls to the desktop for a window that has no dock button', () => {
    const note = open(EMPTY_WINDOW_MANAGER, { kind: 'file', fileId: 'nike-about' })

    expect(focusHopAfter(note.instances, 'textFile:nike-about', false)).toEqual({
      kind: 'desktop',
    })
  })

  it('ends at the container on a phone, where there is no dock button to reach', () => {
    // The two layouts answer this differently: the desktop hands the keyboard to the window's own
    // dock button, and a phone hands it to the container the home surface lives in, since no dock
    // button is mounted there to hand it to. Spec 0009, AC-8.
    const opened = openProjects()

    expect(focusHopAfter(opened.instances, 'projects', false)).toEqual({
      kind: 'dock',
      windowId: 'projects',
    })
    expect(focusHopAfter(opened.instances, 'projects', true)).toEqual({ kind: 'desktop' })
  })
})

describe('the compact layout', () => {
  const AREA = { width: 420, height: 700 }

  it('fills the focused window to the work area, and leaves the others where they are', () => {
    const two = open(openProjects(), { kind: 'window', windowId: 'contact' })
    const [projects, contact] = two.instances

    expect(windowGeometry(projects!, AREA, true, false)).toEqual({
      position: projects!.position,
      size: projects!.size,
    })
    expect(windowGeometry(contact!, AREA, true, true)).toEqual({
      position: { x: 0, y: 0 },
      size: AREA,
    })
  })

  it('fills nothing until the container has been measured', () => {
    const opened = openProjects()

    expect(windowGeometry(only(opened), null, true, true)).toEqual({
      position: only(opened).position,
      size: only(opened).size,
    })
  })

  it('leaves every window at its own geometry in the wide layout', () => {
    const opened = openProjects()

    expect(windowGeometry(only(opened), AREA, false, true)).toEqual({
      position: only(opened).position,
      size: only(opened).size,
    })
  })

  it('records the compact flag, and leaves the state alone when it has not changed', () => {
    const wide = openProjects()
    const compact = dispatch(wide, { type: 'setCompact', compact: true })

    expect(compact.compact).toBe(true)
    expect(compact.instances).toBe(wide.instances)
    expect(dispatch(compact, { type: 'setCompact', compact: true })).toBe(compact)
  })
})

describe('the phone shell', () => {
  /** A phone: the same manager, with the compact layout already recorded. */
  function phone(): WindowManagerState {
    return dispatch(EMPTY_WINDOW_MANAGER, { type: 'setCompact', compact: true })
  }

  /** A box smaller than every window's `minSize`, so a floor would show up in a comparison. */
  const SNUG = { width: 300, height: 200 }

  it('knows which windows have a tile to come back from', () => {
    expect(hasHomeTile('projects')).toBe(true)
    expect(hasHomeTile('resume')).toBe(true)
    expect(hasHomeTile('archive')).toBe(true)
    expect(hasHomeTile('textFile')).toBe(false)
    expect(hasHomeTile('imageFile')).toBe(false)
  })

  it('is already in the phone layout when it is created that way', () => {
    expect(createWindowManagerState(true)).toEqual({
      instances: [],
      workArea: null,
      compact: true,
    })
    expect(EMPTY_WINDOW_MANAGER.compact).toBe(false)
  })

  it('leaves one window on screen, closing what the new one covers', () => {
    const two = open(open(phone(), { kind: 'window', windowId: 'projects' }), {
      kind: 'window',
      windowId: 'skills',
    })

    expect(two.instances.map((instance) => instance.key)).toEqual(['skills'])
    expect(focusedKeyOf(two.instances)).toBe('skills')
  })

  it('applies that rule in both branches, including a key that is already open', () => {
    const two = open(open(phone(), { kind: 'window', windowId: 'projects' }), {
      kind: 'window',
      windowId: 'contact',
    })
    const again = open(two, { kind: 'window', windowId: 'projects' }, { kind: 'home' })

    expect(again.instances.map((instance) => instance.key)).toEqual(['projects'])
  })

  it('keeps the window an open came from, so a file opens over the Finder', () => {
    const finder = open(phone(), { kind: 'window', windowId: 'projects' })
    const note = open(
      finder,
      { kind: 'file', fileId: 'nike-about' },
      { kind: 'window', key: 'projects' },
    )

    expect(note.instances.map((instance) => instance.key)).toEqual([
      'projects',
      'textFile:nike-about',
    ])
    expect(focusedKeyOf(note.instances)).toBe('textFile:nike-about')

    // Closing the file leaves the Finder it came from, which is what Close lands back on.
    const closed = dispatch(note, { type: 'close', key: 'textFile:nike-about' })

    expect(focusedKeyOf(closed.instances)).toBe('projects')
  })

  it('never closes a parked window, and brings it back through the one open action', () => {
    const away = withMinimised(open(phone(), { kind: 'window', windowId: 'skills' }), 'skills')
    const gallery = open(away, { kind: 'window', windowId: 'gallery' })

    expect(gallery.instances.map((instance) => instance.key)).toEqual(['skills', 'gallery'])
    expect(only(gallery, 'skills').status).toBe('minimised')

    // A tile press is the open action, so a parked window comes back through the same rule rather
    // than around it: it returns at its stored geometry and the window it replaces goes.
    const back = open(gallery, { kind: 'window', windowId: 'skills' }, { kind: 'home' })

    expect(back.instances.map((instance) => instance.key)).toEqual(['skills'])
    expect(only(back, 'skills').status).toBe('normal')
    expect(only(back, 'skills').size).toEqual(WINDOW_LAYOUT.skills.defaultSize)
  })

  it('draws a window as the work area itself, with no floor from its own layout', () => {
    const opened = open(phone(), { kind: 'window', windowId: 'projects' })

    expect(windowGeometry(only(opened), SNUG, true, true)).toEqual({
      position: { x: 0, y: 0 },
      size: SNUG,
    })
    // The same box above the breakpoint leaves the window its own size, `minSize` and all.
    expect(windowGeometry(only(opened), SNUG, false, true)).toEqual({
      position: only(opened).position,
      size: only(opened).size,
    })
  })

  it('fills a window to a work area smaller than its layout, rather than to the floor', () => {
    const measured = dispatch(phone(), { type: 'setWorkArea', size: { width: 1200, height: 900 } })
    const opened = open(measured, { kind: 'window', windowId: 'projects' })
    const snug = dispatch(opened, { type: 'setWorkArea', size: SNUG })
    const filled = dispatch(snug, { type: 'zoom', key: 'projects' })

    expect(only(filled, 'projects').size).toEqual(SNUG)
  })

  it('never rewrites a stored size or spot while the compact layout holds', () => {
    const measured = dispatch(phone(), { type: 'setWorkArea', size: { width: 1200, height: 900 } })
    const opened = open(measured, { kind: 'window', windowId: 'projects' })
    const shrunk = dispatch(opened, { type: 'setWorkArea', size: SNUG })

    expect(only(shrunk, 'projects')).toEqual(only(opened, 'projects'))

    // Widening again puts the desktop back at exactly that geometry.
    const wide = dispatch(shrunk, { type: 'setCompact', compact: false })

    expect(only(wide, 'projects')).toEqual(only(opened, 'projects'))
  })

  it('changes nothing about the desktop above the breakpoint', () => {
    const wide = open(open(EMPTY_WINDOW_MANAGER, { kind: 'window', windowId: 'projects' }), {
      kind: 'window',
      windowId: 'contact',
    })

    expect(wide.instances).toHaveLength(2)
  })
})
