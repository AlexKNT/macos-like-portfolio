import { describe, expect, it } from 'vitest'

import { exitTargetFor } from '#components/windowExit'
import { EMPTY_WINDOW_MANAGER, reduceWindowManager } from '#store/windowManager'
import { stubRegistry } from '../test/registry'
import type { OpenTarget } from '#content/types'
import type { WindowInstance, WindowManagerState, WindowOpener } from '#store/windowManager'

/**
 * The tile a window travels to on a phone: its own when it has one, and otherwise the tile of the
 * window that opened it, so a file opened from the Finder has somewhere to come from and go back to.
 * Spec 0009, AC-10, AC-12.
 */

/** The manager after one open, which is where a case reads its instance from. */
function opened(target: OpenTarget, opener: WindowOpener = { kind: 'home' }): WindowManagerState {
  return reduceWindowManager(EMPTY_WINDOW_MANAGER, {
    type: 'open',
    target,
    opener,
    cascadeStep: 32,
  })
}

/** One instance out of a state, by key. */
function instance(state: WindowManagerState, key: string): WindowInstance {
  const found = state.instances.find((open) => open.key === key)

  if (found === undefined) {
    throw new Error(`expected an open window under ${key}`)
  }

  return found
}

/** A stand in tile, which is all these lookups need. */
function tile(label: string): HTMLElement {
  const element = document.createElement('button')

  element.setAttribute('aria-label', label)

  return element
}

describe('the tile a window travels to', () => {
  // covers: AC-12
  it('finds the tile of the window itself', () => {
    const state = opened({ kind: 'window', windowId: 'skills' })
    const skills = tile('Skills')

    expect(
      exitTargetFor(
        instance(state, 'skills'),
        state.instances,
        stubRegistry({ homeTiles: [['skills', skills]] }),
      ),
    ).toBe(skills)
  })

  // covers: AC-10, AC-12
  it('falls back to the tile of the window it came from, so a file grows from the Finder', () => {
    const finder = opened({ kind: 'window', windowId: 'projects' })
    const note = reduceWindowManager(finder, {
      type: 'open',
      target: { kind: 'file', fileId: 'nike-about' },
      opener: { kind: 'window', key: 'projects' },
      cascadeStep: 32,
    })
    const projects = tile('Projects')

    expect(
      exitTargetFor(
        instance(note, 'textFile:nike-about'),
        note.instances,
        stubRegistry({ homeTiles: [['projects', projects]] }),
      ),
    ).toBe(projects)
  })

  // covers: AC-12
  it('hands back nothing when neither the window nor its opener has a tile', () => {
    const lone = opened({ kind: 'file', fileId: 'nike-about' })

    expect(
      exitTargetFor(instance(lone, 'textFile:nike-about'), lone.instances, stubRegistry({})),
    ).toBeNull()

    // The same window on the desktop: no tiles are registered there at all.
    const finder = opened({ kind: 'window', windowId: 'projects' })
    const note = reduceWindowManager(finder, {
      type: 'open',
      target: { kind: 'file', fileId: 'nike-about' },
      opener: { kind: 'window', key: 'projects' },
      cascadeStep: 32,
    })

    expect(
      exitTargetFor(instance(note, 'textFile:nike-about'), note.instances, stubRegistry({})),
    ).toBeNull()
  })
})
