import { fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

import { WindowLayer } from '#components/WindowLayer'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import { resolveOpenTarget } from '#store/windowManager'
import { imageFileFrom, textFileFrom } from '#windows/projects/fileFromTarget'
import { missingImageLine, unreadableFileLine } from '#windows/projects/quietLines'
import type { FileId, OpenTarget } from '#content/types'

/**
 * The two file windows the Finder opens: a text file set for reading, and an image shown whole
 * with its alt text as a caption. Both read the file their target names out of the content
 * layer, and both have a state for an asset that is not there.
 * Spec 0005, AC-6, AC-9.
 */

/** A text file with a subtitle, and one without. */
const BIO: FileId = 'about-bio'
const PITCH: FileId = 'nike-about'

/** An image whose asset is absent from the build, so its missing state is a real one. */
const PORTRAIT: FileId = 'about-photo'

/** A stand in desktop that opens the file window a check asks for. */
function Shell({ target }: { readonly target: OpenTarget }) {
  const { open } = useWindowManager()

  useEffect(() => {
    open(target, { kind: 'dock' })
  }, [open, target])

  return <WindowLayer />
}

/** Opens one target and hands back its frame, found by the title the resolver gives it. */
function setupTarget(target: OpenTarget): HTMLElement {
  render(
    <WindowManagerProvider>
      <Shell target={target} />
    </WindowManagerProvider>,
  )

  const resolved = resolveOpenTarget(target)

  if (!resolved.ok) {
    throw new Error('expected the target to open a window')
  }

  return screen.getByRole('region', { name: resolved.value.title })
}

/** Opens one file window and hands back its frame, found by the file's own name. */
function setup(fileId: FileId): HTMLElement {
  return setupTarget({ kind: 'file', fileId })
}

describe('the text file window', () => {
  // covers: AC-6
  it('sets the paragraphs of the file its target names, with the subtitle above them', () => {
    const frame = setup(BIO)
    const file = textFileFrom({ kind: 'file', fileId: BIO })
    const subtitle = within(frame).getByText(file?.subtitle ?? '')
    const first = within(frame).getByText(file?.description[0] ?? '')

    expect(subtitle.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    for (const paragraph of file?.description ?? []) {
      expect(within(frame).getByText(paragraph)).toBeInTheDocument()
    }
  })

  // covers: AC-6
  it('shows no subtitle for a text file that carries none, and still sets every paragraph', () => {
    const frame = setup(PITCH)
    const file = textFileFrom({ kind: 'file', fileId: PITCH })

    expect(file?.subtitle).toBeUndefined()
    expect(within(frame).getAllByRole('paragraph')).toHaveLength(file?.description.length ?? 0)
  })

  // covers: AC-6
  it('says the file could not be read when the window was opened for something else', () => {
    // A bare text window carries a target that names no file at all, which is the one way this
    // body is asked to set words it has none of.
    const frame = setupTarget({ kind: 'window', windowId: 'textFile' })
    const body = within(frame).queryAllByRole('paragraph')

    // The notice is the whole body: no file's words are set behind it.
    expect(body).toHaveLength(1)
    expect(body[0]).toHaveTextContent(unreadableFileLine())
  })
})

describe('the image file window', () => {
  // covers: AC-6
  it('shows the image, and repeats its alt text as a visible caption', () => {
    const frame = setup(PORTRAIT)
    const file = imageFileFrom({ kind: 'file', fileId: PORTRAIT })
    const image = within(frame).getByRole('img', { name: file?.alt ?? '' })

    expect(image).toHaveAttribute('src', file?.imageUrl ?? '')
    expect(within(frame).getByText(file?.alt ?? '')).toBeInTheDocument()
  })

  // covers: AC-9
  it('keeps the file name, the alt text and a quiet line when the asset never loads', () => {
    const frame = setup(PORTRAIT)
    const file = imageFileFrom({ kind: 'file', fileId: PORTRAIT })

    fireEvent.error(within(frame).getByRole('img'))

    // The notice stands in for the picture, so it names the file, says what the picture was
    // and says what happened, in place of the image it could not show.
    const notice = within(frame).getByText(missingImageLine()).parentElement

    expect(within(frame).queryByRole('img')).toBeNull()
    expect(within(notice as HTMLElement).getByText(file?.name ?? '')).toBeInTheDocument()
    expect(within(notice as HTMLElement).getByText(file?.alt ?? '')).toBeInTheDocument()
  })

  // covers: AC-6
  it('says the file could not be read when the window was opened for something else', () => {
    const frame = setupTarget({ kind: 'window', windowId: 'imageFile' })

    expect(within(frame).getByText(unreadableFileLine())).toBeInTheDocument()
    expect(within(frame).queryByRole('img')).toBeNull()
  })
})
