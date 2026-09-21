import { describe, expect, it } from 'vitest'

import {
  DOWNLOAD_WORD,
  downloadLabel,
  fileNotServedLine,
  noResumeFileLine,
  requestFailedLine,
  undrawableDocumentLine,
} from '#windows/resume/resumeLines'

/**
 * The window's own words, which are the half of its accessibility a page of colour tokens cannot
 * hold: what each state says, that the download's visible word is inside the name a screen reader
 * reads, and that the one line with no file to name says so plainly.
 * Spec 0007, AC-2, AC-4, AC-5.
 */

describe('the resume window words', () => {
  // covers: AC-4, AC-5
  it('gives every state its own line, so two failures never read as the same one', () => {
    const lines = [
      fileNotServedLine('Resume.pdf'),
      requestFailedLine(),
      noResumeFileLine(),
      undrawableDocumentLine(),
    ]

    expect(new Set(lines).size).toBe(lines.length)
  })

  // covers: AC-4
  it('names the file it could not find, and names nothing where there is no file', () => {
    expect(fileNotServedLine('Resume.pdf')).toContain('Resume.pdf')
    expect(noResumeFileLine()).not.toContain('Resume.pdf')
    expect(noResumeFileLine()).not.toContain('.pdf')
  })

  // covers: AC-2
  it('reads the download as the whole instruction, with the visible word inside it', () => {
    expect(downloadLabel('Resume.pdf')).toBe(`${DOWNLOAD_WORD} Resume.pdf`)
    expect(downloadLabel('Resume.pdf')).toContain(DOWNLOAD_WORD)
  })
})
