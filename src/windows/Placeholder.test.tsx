import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Placeholder } from '#windows/Placeholder'
import { WINDOW_BODIES } from '#windows/WindowBody'
import { windowIdSchema } from '#content/types'
import { WINDOWS } from '#content/windows'

/**
 * The body a window shows before its own feature lands: one entry per window id in the
 * registry, so a window id can never open a blank frame, and a body that names the window it
 * stands in for and says what will live there. Spec 0003, AC-8.
 */

/** Every window id the content names. */
const WINDOW_IDS = windowIdSchema.options

describe('the window body registry', () => {
  // covers: AC-8
  it('holds a body for every window the content names, and nothing else', () => {
    expect(Object.keys(WINDOW_BODIES).sort()).toEqual([...WINDOW_IDS].sort())
  })

  // covers: AC-13
  it('hands every entry something the window layer can render', () => {
    for (const windowId of WINDOW_IDS) {
      expect(typeof WINDOW_BODIES[windowId].Body, windowId).toBe('function')
    }
  })
})

describe('the placeholder body', () => {
  // covers: AC-8
  it('names the window it stands in for, and says what will live there', () => {
    for (const windowId of WINDOW_IDS) {
      const { unmount } = render(<Placeholder windowId={windowId} />)
      const title = WINDOWS[windowId].title
      const lines = screen.getAllByRole('paragraph')

      expect(lines, windowId).toHaveLength(2)
      expect(lines[0], windowId).toHaveTextContent(title)
      expect(lines[1]?.textContent?.trim().length ?? 0, windowId).toBeGreaterThan(0)

      unmount()
    }
  })

  // covers: AC-8
  it('keeps the app icon out of the text, so the window is read once', () => {
    const { container } = render(<Placeholder windowId="projects" />)

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
    expect(screen.queryByRole('img')).toBeNull()
  })

  // covers: AC-8
  it('stands in for the window it was asked for rather than a fixed one', () => {
    const { unmount } = render(<Placeholder windowId="skills" />)

    expect(screen.getByText(WINDOWS.skills.title)).toBeInTheDocument()
    expect(screen.queryByText(WINDOWS.projects.title)).toBeNull()

    unmount()
  })
})
