import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TECH_GROUPS } from '#content/techStack'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { copiedLine, copyFailedLine } from '#windows/copyLines'
import { SkillsWindow } from '#windows/skills/SkillsWindow'
import { COPY_HINT, PROMPT_LINE } from '#windows/skills/skillsLines'
import type { OpenTarget } from '#content/types'

/**
 * The Skills window driven the way the desktop drives it, one bare target at a time. The window
 * prints what the content layer holds, in the order it holds it, names its content area after the
 * window, and copies a name through the shared pair.
 * Spec 0006, AC-1, AC-2, AC-3, AC-4, AC-6, AC-11.
 */

/** The window as the manager opens it: a bare `window` target for its own id. */
function setup() {
  const windowId = 'skills'
  const target: OpenTarget = { kind: 'window', windowId }

  return render(
    <WindowManagerProvider>
      <SkillsWindow windowId={windowId} windowKey={windowId} target={target} />
    </WindowManagerProvider>,
  )
}

/** Puts a clipboard on the environment for one check, since jsdom does not carry one. */
function withClipboard(writeText: () => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
})

/** The stage's live region, which is the one way this window says anything out loud. */
function liveRegion(container: HTMLElement): HTMLElement {
  const found = container.querySelector<HTMLElement>('[aria-live="polite"]')

  if (found === null) {
    throw new Error('the stage renders no live region')
  }

  return found
}

/** The row one area prints, found by the heading that names it. */
function rowOf(category: string): HTMLElement {
  return screen.getByRole('heading', { level: 2, name: category }).closest('li') as HTMLElement
}

/**
 * The rows showing a confirmation. The live region carries the same words, so this counts the
 * rows rather than the page: one confirmation at a time is the rule, wherever it has moved to.
 */
function confirmingRows(): readonly HTMLElement[] {
  return screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.closest('li') as HTMLElement)
    .filter((row) => within(row).queryByText(/^Copied /) !== null)
}

describe('the Skills window', () => {
  // covers: AC-1, AC-6
  it('prints the prompt line, the six areas in the order the content layer declares them, and the hint', () => {
    setup()

    expect(screen.getByText(PROMPT_LINE)).toBeInTheDocument()
    expect(screen.getByText(COPY_HINT)).toBeInTheDocument()

    const headings = screen.getAllByRole('heading', { level: 2 })

    // One heading per area, in the declared order, each named by its category alone: the mark
    // beside it is decorative, so it is not part of what a screen reader announces.
    expect(headings).toHaveLength(TECH_GROUPS.length)

    TECH_GROUPS.forEach((group, index) => {
      expect(headings[index]).toHaveAccessibleName(group.category)
    })
  })

  // covers: AC-1
  it('prints every name the content layer holds, with nothing retyped in the window', () => {
    setup()

    for (const group of TECH_GROUPS) {
      for (const item of group.items) {
        expect(screen.getByText(item)).toBeInTheDocument()
      }
    }
  })

  // covers: AC-2
  it('makes every name a button whose accessible name says what the press does, in reading order', async () => {
    const user = userEvent.setup()

    setup()

    const buttons = screen.getAllByRole('button')

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(
      TECH_GROUPS.flatMap((group) => group.items.map((item) => `Copy ${item}`)),
    )

    for (const button of buttons) {
      expect(button).toHaveClass('focus-visible:interactive-focus')
    }

    await user.tab()

    expect(screen.getByRole('button', { name: 'Copy React.js' })).toHaveFocus()
  })

  // covers: AC-3
  it('copies a name, confirms it on its own row and announces it once', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    withClipboard(writeText)

    const { container } = setup()

    await user.click(screen.getByRole('button', { name: 'Copy React.js' }))

    await waitFor(() =>
      expect(within(rowOf('Frontend')).getByText(copiedLine('React.js'))).toBeInTheDocument(),
    )

    expect(writeText).toHaveBeenCalledWith('React.js')
    expect(confirmingRows()).toEqual([rowOf('Frontend')])
    expect(liveRegion(container)).toHaveTextContent(copiedLine('React.js'))
  })

  // covers: AC-3
  it('moves the confirmation to the second row pressed, leaving one confirmation in the window', async () => {
    const user = userEvent.setup()
    withClipboard(() => Promise.resolve())

    const { container } = setup()

    await user.click(screen.getByRole('button', { name: 'Copy React.js' }))
    await waitFor(() =>
      expect(within(rowOf('Frontend')).getByText(copiedLine('React.js'))).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Copy Docker' }))

    await waitFor(() =>
      expect(within(rowOf('Dev Tools')).getByText(copiedLine('Docker'))).toBeInTheDocument(),
    )

    expect(within(rowOf('Frontend')).queryByText(/^Copied /)).toBeNull()
    expect(confirmingRows()).toEqual([rowOf('Dev Tools')])
    expect(liveRegion(container)).toHaveTextContent(copiedLine('Docker'))
  })

  // covers: AC-3
  it('keeps one confirmation, unchanged, when the same name is pressed twice', async () => {
    const user = userEvent.setup()
    withClipboard(() => Promise.resolve())

    const { container } = setup()

    await user.click(screen.getByRole('button', { name: 'Copy React.js' }))
    await waitFor(() =>
      expect(within(rowOf('Frontend')).getByText(copiedLine('React.js'))).toBeInTheDocument(),
    )

    const announced = liveRegion(container).textContent

    await user.click(screen.getByRole('button', { name: 'Copy React.js' }))

    expect(confirmingRows()).toEqual([rowOf('Frontend')])
    expect(liveRegion(container).textContent).toBe(announced)
  })

  // covers: AC-4
  it('shows the shared quiet line, naming the item, when the browser has no clipboard', async () => {
    const user = userEvent.setup()

    Reflect.deleteProperty(navigator, 'clipboard')

    const { container } = setup()

    await user.click(screen.getByRole('button', { name: 'Copy PostgreSQL' }))

    await waitFor(() =>
      expect(within(rowOf('Database')).getByText(copyFailedLine('PostgreSQL'))).toBeInTheDocument(),
    )

    // The refusal is announced through the same live region, and the name stays in the page.
    expect(liveRegion(container)).toHaveTextContent(copyFailedLine('PostgreSQL'))
    expect(screen.getByRole('button', { name: 'Copy PostgreSQL' })).toHaveTextContent('PostgreSQL')
  })

  // covers: AC-4
  it('shows the same quiet line when the write itself is refused', async () => {
    const user = userEvent.setup()
    withClipboard(() => Promise.reject(new Error('denied')))

    setup()

    await user.click(screen.getByRole('button', { name: 'Copy CSS' }))

    await waitFor(() =>
      expect(within(rowOf('Styling')).getByText(copyFailedLine('CSS'))).toBeInTheDocument(),
    )
  })

  // covers: AC-11
  it('keeps the prompt line, the areas and the hint inside the one content area that scrolls', () => {
    setup()

    const area = screen.getByRole('group', { name: WINDOWS.skills.title })

    expect(screen.getAllByRole('group')).toHaveLength(1)

    for (const content of [PROMPT_LINE, COPY_HINT, ...TECH_GROUPS.map((group) => group.category)]) {
      const found = screen.getByText(content, { exact: false })

      expect(area, content).toContainElement(found)
    }
  })

  // covers: AC-11
  it('stages its content in the content area named after the window', () => {
    const { container } = setup()

    expect(screen.getByRole('group', { name: WINDOWS.skills.title })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
  })
})
