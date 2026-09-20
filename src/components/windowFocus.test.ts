import { afterEach, describe, expect, it } from 'vitest'

import { applyFocusHop, hopElement } from '#components/windowFocus'
import type { WindowId } from '#content/types'
import type { WindowKey } from '#store/windowManager'
import type { WindowElements } from '#store/windowElements'

/**
 * The DOM end of the focus handoff: the manager decides where the keyboard goes, and this turns
 * that decision into an element. The registry is stubbed rather than rendered, so every case runs
 * without a tree: the hop finds its element, a hop whose element has gone falls back to the
 * desktop, and the keyboard never rests on nothing.
 * Spec 0004, AC-8.
 */

type Registry = {
  readonly frames?: readonly (readonly [WindowKey, HTMLElement])[]
  readonly dockButtons?: readonly (readonly [WindowId, HTMLElement])[]
  readonly desktop?: HTMLElement | null
}

/** A stand in registry, holding exactly the elements a case registers. */
function registry({ frames = [], dockButtons = [], desktop = null }: Registry): WindowElements {
  const frameMap = new Map<WindowKey, HTMLElement>(frames)
  const buttonMap = new Map<WindowId, HTMLElement>(dockButtons)
  const held = { desktop }

  return {
    registerDockButton: (windowId, element) => {
      if (element === null) {
        buttonMap.delete(windowId)
        return
      }

      buttonMap.set(windowId, element)
    },
    dockButtonFor: (windowId) => buttonMap.get(windowId) ?? null,
    registerFrame: (key, element) => {
      if (element === null) {
        frameMap.delete(key)
        return
      }

      frameMap.set(key, element)
    },
    frameFor: (key) => frameMap.get(key) ?? null,
    registerDesktop: (element) => {
      held.desktop = element
    },
    desktop: () => held.desktop,
  }
}

/** An element that can take focus, the way a frame with `tabIndex={-1}` or the desktop does. */
function focusable(label: string): HTMLElement {
  const element = document.createElement('section')

  element.setAttribute('aria-label', label)
  element.tabIndex = -1
  document.body.append(element)

  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the element a hop names', () => {
  // covers: AC-8
  it('is the frame the window hop names', () => {
    const frame = focusable('Projects')
    const elements = registry({ frames: [['projects', frame]] })

    expect(hopElement({ kind: 'window', key: 'projects' }, elements)).toBe(frame)
  })

  // covers: AC-8
  it('is the dock button the dock hop names', () => {
    const button = focusable('Portfolio')
    const elements = registry({ dockButtons: [['projects', button]] })

    expect(hopElement({ kind: 'dock', windowId: 'projects' }, elements)).toBe(button)
  })

  // covers: AC-8
  it('is the desktop for the desktop hop', () => {
    const desktop = focusable('Desktop')
    const elements = registry({ desktop })

    expect(hopElement({ kind: 'desktop' }, elements)).toBe(desktop)
  })

  // covers: AC-8
  it('is nothing when the window it names has gone', () => {
    expect(hopElement({ kind: 'window', key: 'projects' }, registry({}))).toBeNull()
  })

  // covers: AC-8
  it('is nothing for an item window whose app is open under another key', () => {
    const frame = focusable('Projects')
    const elements = registry({ frames: [['projects', frame]] })

    // A window that has gone, and a key that was never registered, both resolve to nothing
    // rather than to the frame of the app that shares their prefix.
    expect(hopElement({ kind: 'window', key: 'projects:contact' }, elements)).toBeNull()
    expect(hopElement({ kind: 'window', key: 'textFile:nike-about' }, elements)).toBeNull()
  })

  // covers: AC-8
  it('is nothing when the dock button it names has gone', () => {
    const other = focusable('Archive')
    const elements = registry({ dockButtons: [['archive', other]] })

    expect(hopElement({ kind: 'dock', windowId: 'projects' }, elements)).toBeNull()
  })

  // covers: AC-8
  it('is nothing when no desktop has registered', () => {
    expect(hopElement({ kind: 'desktop' }, registry({}))).toBeNull()
  })
})

describe('moving the keyboard to a hop', () => {
  // covers: AC-8
  it('lands on the frame the hop names', () => {
    const frame = focusable('Projects')
    const elements = registry({ frames: [['projects', frame]] })

    applyFocusHop({ kind: 'window', key: 'projects' }, elements)

    expect(document.activeElement).toBe(frame)
  })

  // covers: AC-8
  it('lands on the dock button the hop names', () => {
    const button = focusable('Portfolio')
    const elements = registry({ dockButtons: [['projects', button]] })

    applyFocusHop({ kind: 'dock', windowId: 'projects' }, elements)

    expect(document.activeElement).toBe(button)
  })

  // covers: AC-8
  it('lands on the desktop when the hop itself names it', () => {
    const desktop = focusable('Desktop')
    const elements = registry({ desktop })

    applyFocusHop({ kind: 'desktop' }, elements)

    expect(document.activeElement).toBe(desktop)
  })

  // covers: AC-8
  it('falls back to the desktop when the window a hop names has already gone', () => {
    const desktop = focusable('Desktop')
    const elements = registry({ desktop })

    applyFocusHop({ kind: 'window', key: 'projects' }, elements)

    expect(document.activeElement).toBe(desktop)
  })

  // covers: AC-8
  it('falls back to the desktop when the dock button a hop names has gone', () => {
    const desktop = focusable('Desktop')
    const elements = registry({ desktop })

    applyFocusHop({ kind: 'dock', windowId: 'projects' }, elements)

    expect(document.activeElement).toBe(desktop)
  })

  // covers: AC-8
  it('leaves the keyboard where it was, and throws nothing, when even the desktop has gone', () => {
    const before = document.activeElement

    expect(() => applyFocusHop({ kind: 'window', key: 'projects' }, registry({}))).not.toThrow()
    expect(document.activeElement).toBe(before)
  })
})
