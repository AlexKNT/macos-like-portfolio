import { render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WINDOWS } from '#content/windows'
import { WindowLayer } from '#components/WindowLayer'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import {
  DOWNLOAD_WORD,
  downloadLabel,
  fileNotServedLine,
  noResumeFileLine,
  requestFailedLine,
  undrawableDocumentLine,
} from '#windows/resume/resumeLines'

/**
 * The Resume window, opened the way the desktop opens it. The whole body is exercised here: the
 * file row and the document drawn from the entry's own path, the fallback an undrawable file lands
 * on, and the four states that are not the happy path.
 *
 * The reader is mocked in one place only, its `notFound` answer, because the `absent` state cannot
 * be reached through the content the app ships: everything else reads the real tree. The check is
 * stubbed because jsdom has no server to answer for a relative path. Spec 0007, AC-1 to AC-6.
 */

/** The reader stands the real one aside in one check, so the window can be shown its `notFound`. */
const reader = vi.hoisted(() => ({ missing: false }))

vi.mock('#content/reads', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#content/reads')>()

  return {
    ...actual,
    findResumeFile: () =>
      reader.missing
        ? {
            ok: false as const,
            error: { kind: 'notFound' as const, collection: 'files', id: 'resume-pdf' },
          }
        : actual.findResumeFile(),
  }
})

/** The real `fetch`, so every check puts it back and the environment is left as it was found. */
const REAL_FETCH = globalThis.fetch

/** Puts a `fetch` on the environment for one check. */
function withFetch(value: unknown): void {
  Object.defineProperty(globalThis, 'fetch', { value, configurable: true, writable: true })
}

/** The file the content layer holds, which is what the window should be showing. */
const HELD = { name: 'Resume.pdf', href: '/files/resume.pdf' }

/** A desktop that opens the Resume window, so the check drives the real shell. */
function Shell() {
  const { open } = useWindowManager()

  useEffect(() => {
    open({ kind: 'window', windowId: 'resume' }, { kind: 'dock' })
  }, [open])

  return <WindowLayer />
}

/** Opens the window and hands back its frame, which the window's own title names. */
function openResume(): HTMLElement {
  render(
    <WindowManagerProvider>
      <Shell />
    </WindowManagerProvider>,
  )

  return screen.getByRole('region', { name: WINDOWS.resume.title })
}

/** The window's content area, which is the one named group inside its frame. */
function contentOf(frame: HTMLElement): HTMLElement {
  return within(frame).getByRole('group', { name: WINDOWS.resume.title })
}

beforeEach(() => {
  reader.missing = false
  withFetch(vi.fn(() => Promise.resolve({ ok: true, status: 200 })))
})

afterEach(() => {
  withFetch(REAL_FETCH)
})

describe('the Resume window', () => {
  // covers: AC-1, AC-2, AC-6
  it('draws the file the content layer holds, with one download control and the document named after it', async () => {
    const frame = openResume()
    const content = contentOf(frame)

    await waitFor(() => expect(content.querySelector('object')).not.toBeNull())

    const embed = content.querySelector('object') as HTMLElement
    const downloads = within(content).getAllByRole('link', { name: downloadLabel(HELD.name) })

    // Two anchors are in the document: the row's, and the one the embed keeps for a browser that
    // cannot draw the file. Only the first of them is the row's.
    expect(downloads).toHaveLength(2)

    const rowDownload = downloads[0] as HTMLElement

    expect(embed).not.toContainElement(rowDownload)
    expect(rowDownload).toHaveTextContent(DOWNLOAD_WORD)
    expect(rowDownload).toHaveAttribute('href', HELD.href)
    expect(rowDownload).toHaveAttribute('download', HELD.name)
    expect(within(content).getByText(HELD.name)).toBeVisible()

    expect(embed).toHaveAttribute('data', HELD.href)
    expect(embed).toHaveAttribute('type', 'application/pdf')
    // One mechanism names the embed: the label, with no title repeating it.
    expect(embed).toHaveAttribute('aria-label', HELD.name)
    expect(embed).not.toHaveAttribute('title')

    // The row comes before the document, which is the reading order a visitor walks.
    expect(
      rowDownload.compareDocumentPosition(embed) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  // covers: AC-5
  it('gives a browser that cannot draw the document its own line and its own download', async () => {
    const frame = openResume()
    const content = contentOf(frame)

    await waitFor(() => expect(content.querySelector('object')).not.toBeNull())

    const embed = content.querySelector('object') as HTMLElement
    const rowDownload = within(content).getAllByRole('link', {
      name: downloadLabel(HELD.name),
    })[0] as HTMLElement
    const fallbackDownload = within(embed).getByRole('link', { name: downloadLabel(HELD.name) })

    expect(fallbackDownload).not.toBe(rowDownload)
    expect(fallbackDownload).toHaveAttribute('href', HELD.href)
    expect(fallbackDownload).toHaveAttribute('download', HELD.name)
    expect(within(embed).getByText(undrawableDocumentLine())).toBeVisible()
  })

  // covers: AC-3
  it('draws nothing at all while the check is still in flight', () => {
    withFetch(vi.fn(() => new Promise(() => {})))

    const content = contentOf(openResume())

    expect(content.querySelectorAll('object')).toHaveLength(0)
    expect(within(content).queryAllByRole('link')).toHaveLength(0)
    expect(within(content).queryAllByRole('paragraph')).toHaveLength(0)
  })

  // covers: AC-4
  it('shows one quiet line naming the file, and no download, when the site answers without it', async () => {
    withFetch(vi.fn(() => Promise.resolve({ ok: false, status: 404 })))

    const frame = openResume()
    const content = contentOf(frame)
    const line = await within(content).findByText(fileNotServedLine(HELD.name))

    expect(within(content).getAllByRole('paragraph')).toEqual([line])
    expect(within(content).queryAllByRole('link')).toHaveLength(0)
    expect(content.querySelectorAll('object')).toHaveLength(0)
    // The one live region announces the same words, rather than a second wording of its own.
    expect(frame.querySelector('[aria-live="polite"]')).toHaveTextContent(
      fileNotServedLine(HELD.name),
    )
  })

  // covers: AC-4
  it('shows its own line when the request itself fails, distinct from the missing file line', async () => {
    withFetch(vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    const content = contentOf(openResume())
    const line = await within(content).findByText(requestFailedLine())

    expect(within(content).getAllByRole('paragraph')).toEqual([line])
    expect(requestFailedLine()).not.toBe(fileNotServedLine(HELD.name))
    expect(within(content).queryAllByRole('link')).toHaveLength(0)
  })

  // covers: AC-4
  it('shows the line that names no file when the content layer holds no resume at all', async () => {
    reader.missing = true

    const content = contentOf(openResume())
    const line = await within(content).findByText(noResumeFileLine())

    expect(within(content).getAllByRole('paragraph')).toEqual([line])
    expect(noResumeFileLine()).not.toContain('Resume.pdf')
    expect(within(content).queryAllByRole('link')).toHaveLength(0)
  })
})

/** The window's own modules, with their tests left out. */
function resumeModules(): readonly { readonly name: string; readonly text: string }[] {
  const folder = resolve(process.cwd(), 'src/windows/resume')

  return readdirSync(folder)
    .filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))
    .map((name) => ({ name, text: readFileSync(join(folder, name), 'utf8') }))
}

describe('the resume window sources', () => {
  // covers: AC-1
  it('holds no path of its own, makes no request itself and reaches no browser API', () => {
    const modules = resumeModules()

    // A scan that walked no files would pass silently, so the folder is checked to be real.
    expect(modules).toHaveLength(3)

    const offenders = modules.flatMap(({ name, text }) =>
      [
        ['a path written into the window', /\/files\//],
        ['a request of its own, rather than the one edge function', /\bfetch\s*\(/],
        ['a browser API', /navigator\.|localStorage|sessionStorage/],
        ['a link written out', /https?:\/\//],
      ]
        .filter(([, pattern]) => (pattern as RegExp).test(text))
        .map(([rule]) => `${name}: ${rule as string}`),
    )

    expect(offenders, 'window modules doing their own edge work').toEqual([])
  })
})
