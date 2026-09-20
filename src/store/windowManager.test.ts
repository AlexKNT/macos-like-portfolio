import { describe, expect, it } from 'vitest'

import {
  EMPTY_WINDOW_MANAGER,
  WINDOW_LAYOUT,
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
  return dispatch(state, { type: 'open', target, opener: { kind: opener } })
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
