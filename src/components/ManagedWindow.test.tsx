import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { WindowLayer } from '#components/WindowLayer'
import { WINDOW_LAYOUT } from '#store/windowManager'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import type { WindowId } from '#content/types'

/**
 * One window bound to the manager: it takes the spot and the size the manager holds, and both
 * the pointer and the keyboard write back through the manager's own action. Spec 0004, AC-4,
 * AC-5.
 *
 * The shell below stands in for the desktop: it hands the manager a work area, which the real
 * container measures, then opens a window.
 */

const AREA = { width: 1600, height: 900 }
const STEP = 32

type ShellProps = {
  readonly windowId?: WindowId
}

/** A stand in desktop: a work area, then one open window. */
function Shell({ windowId = 'projects' }: ShellProps) {
  const { open, setWorkArea } = useWindowManager()

  useEffect(() => {
    setWorkArea(AREA)
    open({ kind: 'window', windowId }, { kind: 'dock' })
  }, [open, setWorkArea, windowId])

  return <WindowLayer />
}

/** Renders the shell and returns the frame of the window it opened. */
function setup(windowId: WindowId = 'projects') {
  render(
    <WindowManagerProvider>
      <Shell windowId={windowId} />
    </WindowManagerProvider>,
  )

  return {
    frame: screen.getByRole('region', { name: 'Projects' }),
    handle: screen.getByRole('region', { name: 'Projects' }).querySelector('header') as HTMLElement,
  }
}

beforeEach(() => {
  document.documentElement.style.setProperty('--window-nudge-step', '16')
  document.documentElement.style.setProperty('--window-nudge-step-large', '64')
  document.documentElement.style.setProperty('--window-cascade-step', `${STEP}`)
})

afterEach(() => {
  document.documentElement.style.removeProperty('--window-nudge-step')
  document.documentElement.style.removeProperty('--window-nudge-step-large')
  document.documentElement.style.removeProperty('--window-cascade-step')
})

describe('a window the manager holds', () => {
  it('sits at the spot, size and stacking number the manager gives it', () => {
    const { frame } = setup()

    expect(frame.style.left).toBe(`${STEP / 2}px`)
    expect(frame.style.top).toBe(`${STEP / 2}px`)
    expect(frame.style.width).toBe(`${WINDOW_LAYOUT.projects.defaultSize.width}px`)
    expect(frame.style.height).toBe(`${WINDOW_LAYOUT.projects.defaultSize.height}px`)
    expect(frame.style.zIndex).toBe('1')
  })

  it('takes a drag of its title bar, and stays where it was released', () => {
    const { frame, handle } = setup()

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 200, clientY: 160 })

    expect(frame.style.transform).toBe('translate(100px, 60px)')

    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 200, clientY: 160 })

    expect(frame.style.left).toBe(`${STEP / 2 + 100}px`)
    expect(frame.style.top).toBe(`${STEP / 2 + 60}px`)
    expect(frame.style.transform).toBe('')
  })

  it('steps along the arrows from a control inside it', () => {
    const { frame } = setup()

    screen.getByRole('button', { name: 'Close Projects' }).focus()
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' })

    expect(frame.style.left).toBe(`${STEP / 2 + 16}px`)

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight', shiftKey: true })

    expect(frame.style.left).toBe(`${STEP / 2 + 16 + 64}px`)
  })
})
