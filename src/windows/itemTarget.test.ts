import { describe, expect, it } from 'vitest'

import { PROJECT_FOLDERS, findPlace, openTargetFor } from '#content/reads'
import { itemTarget } from '#windows/itemTarget'
import type { FileEntry, PdfFile, Place } from '#content/types'

/**
 * Where a press on one entry of the file tree leads, which is the rule the Finder's grid and the
 * Archive's own block both read. It is one module so the two windows cannot drift apart.
 * Spec 0005, AC-3; spec 0012, AC-2.
 */

const WORK: Place = { kind: 'location', locationId: 'work' }
const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }

describe('where a press on one entry of the file tree leads', () => {
  // covers: AC-2
  it('opens a project folder as the place it stands for, rather than as a file', () => {
    expect(itemTarget(PROJECT_FOLDERS['nike-ecommerce'])).toEqual({
      kind: 'project',
      projectId: 'nike-ecommerce',
    })
  })

  // covers: AC-2
  it('sends every file where its own kind says, exactly as the content layer answers it', () => {
    const files = findPlace(NIKE).items.filter((item): item is FileEntry => item.kind !== 'folder')

    // The shipped project holds a text file, two links and an image, so the four kinds a file can
    // be are all in front of the rule here.
    expect(new Set(files.map((file) => file.kind))).toEqual(new Set(['text', 'link', 'image']))

    for (const file of files) {
      expect(itemTarget(file), file.id).toEqual(openTargetFor(file))
    }
  })

  // covers: AC-2
  it('opens a folder the way the work location lists it, not only through the folder record', () => {
    const folder = findPlace(WORK).items[0]

    expect(itemTarget(folder)).toEqual({ kind: 'project', projectId: 'nike-ecommerce' })
  })

  // covers: AC-2
  it('sends the resume file out of the page, the way its own kind says', () => {
    const found = findPlace({ kind: 'location', locationId: 'resume' }).items.filter(
      (item): item is PdfFile => item.kind === 'pdf',
    )

    // The Finder's resume location draws this one through the shared face too, so the anchor path
    // is the same for a pdf as for a project's live link.
    expect(found).toHaveLength(1)
    expect(found.map(itemTarget)).toEqual(found.map(openTargetFor))
  })
})
