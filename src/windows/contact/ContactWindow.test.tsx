import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PROFILE, SOCIALS } from '#content/profile'
import { WINDOWS } from '#content/windows'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { copiedLine, copyFailedLine } from '#windows/copyLines'
import { ContactWindow } from '#windows/contact/ContactWindow'
import {
  addressCopyName,
  copyControlLabel,
  headingLine,
  invitationLine,
  mailBody,
  mailSubject,
} from '#windows/contact/contactLines'
import { mailLinkHref } from '#windows/contact/mailLink'
import type { OpenTarget } from '#content/types'

/**
 * The Contact window driven the way the desktop drives it: the stage it is built in, the address as
 * the one mail link, the Copy control on its own row, the four tiles and the words each of them
 * prints.
 * Spec 0008, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10, AC-12.
 */

/** The window as the manager opens it: a bare `window` target for its own id. */
const TARGET: OpenTarget = { kind: 'window', windowId: 'contact' }

function setup() {
  return render(
    <WindowManagerProvider>
      <ContactWindow windowId="contact" windowKey="contact" target={TARGET} />
    </WindowManagerProvider>,
  )
}

/** Puts a clipboard on the environment for one check, since jsdom does not carry one. */
function withClipboard(value: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
  vi.doUnmock('#content/profile')
  vi.resetModules()
})

/** The stage's live region, which is the one way this window says anything out loud. */
function liveRegion(container: HTMLElement): HTMLElement {
  const found = container.querySelector<HTMLElement>('[aria-live="polite"]')

  if (found === null) {
    throw new Error('the stage renders no live region')
  }

  return found
}

/**
 * The address row: the block holding the address link, which is the one row a confirmation is
 * allowed to land in. Scoping a query to it is what proves the confirmation went to the right place
 * rather than merely somewhere on the page.
 */
function addressRow(): HTMLElement {
  const row = screen.getByRole('link', { name: PROFILE.email }).parentElement?.parentElement

  if (row === undefined || row === null) {
    throw new Error('the address link is not inside a row')
  }

  return row
}

/** Every piece of text in a container, trimmed, with the empties dropped. */
function printedWords(container: HTMLElement): readonly string[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const found: string[] = []
  let node = walker.nextNode()

  while (node !== null) {
    const text = node.textContent?.trim() ?? ''

    if (text !== '') {
      found.push(text)
    }

    node = walker.nextNode()
  }

  return found
}

describe('the Contact window', () => {
  // covers: AC-1, AC-12
  it('is one stage with one named content area, holding the heading, the invitation and the address', () => {
    const { container } = setup()

    expect(container.querySelectorAll('[data-window-stage]')).toHaveLength(1)
    expect(screen.getByRole('group', { name: WINDOWS.contact.title })).toBeInTheDocument()

    // The heading arrives through the stage's own heading slot, so the window holds exactly one.
    const headings = screen.getAllByRole('heading')

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveAccessibleName(headingLine())

    expect(screen.getByText(invitationLine())).toBeInTheDocument()
    expect(screen.getByRole('link', { name: PROFILE.email })).toBeInTheDocument()
  })

  // covers: AC-2
  it('makes the address itself the mail link, and the only one in the window', () => {
    setup()

    const address = screen.getByRole('link', { name: PROFILE.email })

    expect(address).toHaveAttribute('href', mailLinkHref(PROFILE.email, mailSubject(), mailBody()))

    // Every link that leaves for a mail client: one, so the visitor is never offered a second way
    // to start the same message.
    const mailLinks = screen
      .getAllByRole('link')
      .filter((link) => (link.getAttribute('href') ?? '').startsWith('mailto:'))

    expect(mailLinks).toHaveLength(1)
  })

  // covers: AC-7
  it('shows all four socials in the order the content layer declares them', () => {
    setup()

    const links = screen.getAllByRole('link')

    // The address first, then one tile per social, which is the reading order the window asks for.
    expect(links).toHaveLength(SOCIALS.length + 1)

    SOCIALS.forEach((social, index) => {
      const tile = links[index + 1]

      expect(tile).toHaveAccessibleName(social.label)
      expect(tile).toHaveAttribute('href', social.href)
    })
  })

  // covers: AC-7, AC-11
  it('makes every social a link of its own with the shared ring and a touch target of height', () => {
    setup()

    for (const social of SOCIALS) {
      const tile = screen.getByRole('link', { name: social.label })

      expect(tile, social.label).toHaveClass('focus-visible:interactive-focus')
      expect(tile, social.label).toHaveClass('min-h-touch')
    }
  })

  // covers: AC-10
  it('prints only words the words module or the content layer supplies', () => {
    const { container } = setup()
    const allowed = new Set([
      headingLine(),
      invitationLine(),
      PROFILE.email,
      copyControlLabel(),
      ...SOCIALS.map((social) => social.label),
    ])

    // A word a component wrote for itself would show up here, which is what keeps every sentence
    // one module away from the markup.
    expect(printedWords(container).filter((word) => !allowed.has(word))).toEqual([])
  })

  // covers: AC-9
  it('leaves the availability line out entirely when the profile carries none', () => {
    const { container } = setup()

    // A field that is unset is a state, not a gap: the window renders no element for it at all, so
    // there is nothing left behind for the layout to hold open.
    expect(PROFILE.availability).toBeUndefined()
    expect(printedWords(container)).toContain(invitationLine())
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  // covers: AC-3, AC-4
  it('copies the address exactly, confirms it on the address row and announces it once', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    withClipboard({ writeText })

    const { container } = setup()

    await user.click(screen.getByRole('button', { name: addressCopyName(PROFILE.email) }))

    await waitFor(() =>
      expect(within(addressRow()).getByText(copiedLine(PROFILE.email))).toBeInTheDocument(),
    )

    // The address and nothing else: no prefix, no name and no punctuation travel with it.
    expect(writeText).toHaveBeenCalledWith(PROFILE.email)
    expect(liveRegion(container)).toHaveTextContent(copiedLine(PROFILE.email))
  })

  // covers: AC-5
  it('changes nothing at all when the same address is pressed a second time', async () => {
    const user = userEvent.setup()
    withClipboard({ writeText: () => Promise.resolve() })

    const { container } = setup()
    const control = screen.getByRole('button', { name: addressCopyName(PROFILE.email) })

    await user.click(control)
    await waitFor(() =>
      expect(within(addressRow()).getByText(copiedLine(PROFILE.email))).toBeInTheDocument(),
    )

    const confirmation = within(addressRow()).getByText(copiedLine(PROFILE.email))

    await user.click(control)
    await waitFor(() => expect(control).toBeEnabled())

    // The same element, so the row never re-rendered its confirmation and nothing flickered, and
    // the live region still carries the one word rather than a second copy of it.
    expect(within(addressRow()).getByText(copiedLine(PROFILE.email))).toBe(confirmation)
    expect(liveRegion(container)).toHaveTextContent(copiedLine(PROFILE.email))
  })

  // covers: AC-6
  it('shows the shared quiet line and keeps the address readable when there is no clipboard', async () => {
    const user = userEvent.setup()

    /*
     * The order matters. `userEvent.setup()` puts a working clipboard on the environment for its own
     * copy and paste emulation, so the stub has to come off after it, not before. Removing it is what
     * the browser looks like on an insecure origin, which is the state this check is about.
     */
    Reflect.deleteProperty(navigator, 'clipboard')

    const { container } = setup()

    await user.click(screen.getByRole('button', { name: addressCopyName(PROFILE.email) }))

    await waitFor(() =>
      expect(within(addressRow()).getByText(copyFailedLine(PROFILE.email))).toBeInTheDocument(),
    )

    // Nothing threw and nothing was taken away: the address is still the mail link it was.
    expect(screen.getByRole('link', { name: PROFILE.email })).toBeInTheDocument()
    expect(liveRegion(container)).toHaveTextContent(copyFailedLine(PROFILE.email))
  })

  // covers: AC-6
  it('shows the same quiet line when the clipboard refuses the write outright', async () => {
    const user = userEvent.setup()
    withClipboard({ writeText: () => Promise.reject(new Error('denied')) })

    setup()

    await user.click(screen.getByRole('button', { name: addressCopyName(PROFILE.email) }))

    await waitFor(() =>
      expect(within(addressRow()).getByText(copyFailedLine(PROFILE.email))).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: PROFILE.email })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /GitHub/ })).toHaveLength(1)
  })

  // covers: AC-9
  it('shows the availability line verbatim when the profile carries one', async () => {
    const line = 'Open to new work from October'

    // The line is a state of the content rather than of the window, so the content is what changes:
    // the profile is stood in for, and the same body is rendered against it.
    vi.resetModules()
    vi.doMock('#content/profile', () => ({
      PROFILE: { ...PROFILE, availability: line },
      SOCIALS,
    }))

    const module = await import('#windows/contact/ContactWindow')
    const view = render(
      <WindowManagerProvider>
        <module.ContactWindow windowId="contact" windowKey="contact" target={TARGET} />
      </WindowManagerProvider>,
    )

    expect(screen.getByText(line)).toBeInTheDocument()
    // The invitation line and the availability line, and nothing standing in for a third.
    expect(view.container.querySelectorAll('p')).toHaveLength(2)
  })
})
