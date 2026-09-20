import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'

import { WindowStage } from '#windows/WindowStage'

/**
 * The shared stage: the one content area a body renders, its name, its heading, the fact that it
 * takes the keyboard only when a body asks for it, and the single polite live region a window
 * announces through. Spec 0006, umbrella AC-1, AC-2.
 */

/** A stage whose region element is handed out, which is what the Finder's focus move needs. */
function StageWithHandle() {
  const region = useRef<HTMLDivElement>(null)

  return (
    <WindowStage name="Skills" regionRef={region}>
      <button type="button" onClick={() => region.current?.focus()}>
        Focus the content area
      </button>
    </WindowStage>
  )
}

/** The stage's live region, which is the only one a window has. */
function liveRegion(container: HTMLElement): HTMLElement {
  const found = container.querySelector<HTMLElement>('[aria-live="polite"]')

  if (found === null) {
    throw new Error('the stage renders no live region')
  }

  return found
}

describe('the window stage', () => {
  // covers: umbrella AC-1
  it('renders one named content area, and hands its element back when a body asks', async () => {
    const user = userEvent.setup()

    const { container } = render(<StageWithHandle />)

    expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
    expect(screen.getByRole('group', { name: 'Skills' })).toHaveAttribute('tabindex', '-1')

    await user.click(screen.getByRole('button', { name: 'Focus the content area' }))

    expect(screen.getByRole('group', { name: 'Skills' })).toHaveFocus()
  })

  // covers: umbrella AC-1
  it('keeps the content area out of the tab order, so Tab walks the body’s own controls', async () => {
    const user = userEvent.setup()

    render(
      <WindowStage name="Skills">
        <button type="button">React.js</button>
      </WindowStage>,
    )

    await user.tab()

    expect(screen.getByRole('button', { name: 'React.js' })).toHaveFocus()
  })

  // covers: umbrella AC-1
  it('prints a heading only when the thing it stages has a name of its own', () => {
    const { rerender, container } = render(
      <WindowStage name="Skills">
        <p>content</p>
      </WindowStage>,
    )

    expect(container.querySelector('h2')).toBeNull()

    rerender(
      <WindowStage name="Work" heading="Work">
        <p>content</p>
      </WindowStage>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Work' })).toBeInTheDocument()
  })

  // covers: umbrella AC-2
  it('announces what the window last said, once, through its one live region', () => {
    const { container, rerender } = render(
      <WindowStage name="Skills">
        <p>content</p>
      </WindowStage>,
    )

    expect(liveRegion(container)).toHaveTextContent('')

    rerender(
      <WindowStage name="Skills" status="Copied React.js.">
        <p>content</p>
      </WindowStage>,
    )

    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1)
    expect(liveRegion(container)).toHaveTextContent('Copied React.js.')
  })

  // covers: umbrella AC-1
  it('puts the sidebar beside the content above the compact breakpoint', () => {
    const { container } = render(
      <WindowStage name="Work" side={<nav aria-label="Favourites" />}>
        <p>content</p>
      </WindowStage>,
    )

    const sidebar = container.querySelector('nav')
    const area = screen.getByRole('group', { name: 'Work' })

    expect(sidebar).not.toBeNull()
    expect(
      (sidebar as HTMLElement).compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
