import { describe, expect, it } from 'vitest'

import { TREE_FILES } from '#content/reads'
import { imageFileFrom, textFileFrom } from '#windows/projects/fileFromTarget'
import type { FileEntry, FileId, OpenTarget } from '#content/types'

/**
 * Reading the file a file window was opened for. A file window's target names the file rather
 * than carrying it, so both readers have to answer the same question the same way: the file when
 * the kind matches, and a quiet `null` for everything else, which is the state both windows turn
 * into their unreadable line rather than into an empty frame.
 * Spec 0005, AC-6.
 */

/** The first file of a kind the tree holds, so a check reads the content layer's own truth. */
function fileOfKind(kind: FileEntry['kind']): FileEntry {
  const file = TREE_FILES.find((entry) => entry.kind === kind)

  if (file === undefined) {
    throw new Error(`expected the tree to hold a ${kind} file`)
  }

  return file
}

/** The target that names a file, which is how a file window is opened. */
function targetFor(file: FileEntry): OpenTarget {
  return { kind: 'file', fileId: file.id }
}

/** Targets that name no file at all. */
const NOT_A_FILE: readonly OpenTarget[] = [
  { kind: 'window', windowId: 'projects' },
  { kind: 'location', locationId: 'work' },
  { kind: 'project', projectId: 'nike-ecommerce' },
  { kind: 'external', href: 'https://example.com' },
]

/** A file id no entry in the tree carries. */
const ABSENT: FileId = 'nope' as FileId

describe('textFileFrom', () => {
  // covers: AC-6
  it('hands back the text file its target names', () => {
    const file = fileOfKind('text')

    expect(textFileFrom(targetFor(file))).toBe(file)
  })

  // covers: AC-6
  it('answers null for a file of another kind, including the two that leave the page', () => {
    for (const kind of ['image', 'link', 'pdf'] as const) {
      expect(textFileFrom(targetFor(fileOfKind(kind))), kind).toBeNull()
    }
  })

  // covers: AC-6
  it('answers null for a file the tree does not hold', () => {
    expect(textFileFrom({ kind: 'file', fileId: ABSENT })).toBeNull()
  })

  // covers: AC-6
  it('answers null for a target that names no file', () => {
    for (const target of NOT_A_FILE) {
      expect(textFileFrom(target), target.kind).toBeNull()
    }
  })
})

describe('imageFileFrom', () => {
  // covers: AC-6
  it('hands back the image file its target names', () => {
    const file = fileOfKind('image')

    expect(imageFileFrom(targetFor(file))).toBe(file)
  })

  // covers: AC-6
  it('answers null for a file of another kind, including the two that leave the page', () => {
    for (const kind of ['text', 'link', 'pdf'] as const) {
      expect(imageFileFrom(targetFor(fileOfKind(kind))), kind).toBeNull()
    }
  })

  // covers: AC-6
  it('answers null for a file the tree does not hold', () => {
    expect(imageFileFrom({ kind: 'file', fileId: ABSENT })).toBeNull()
  })

  // covers: AC-6
  it('answers null for a target that names no file', () => {
    for (const target of NOT_A_FILE) {
      expect(imageFileFrom(target), target.kind).toBeNull()
    }
  })
})
