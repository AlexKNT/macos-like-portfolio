import { LOCATIONS } from '#content/locations'
import { err, ok } from '#lib/result'
import type { Result } from '#lib/result'
import type { FileEntry, LookupFailure, OpenTarget } from '#content/types'

/**
 * Finds one entry by id in a collection of entries.
 * Returns the entry, or a `notFound` failure naming the collection and the id it
 * looked for, so two missing entries can tell themselves apart in a log.
 * It never throws, and the caller switches on `result.ok`.
 *
 * The collection name is passed in because a plain array cannot know what it is called.
 * Spec 0001, AC-4.
 */
export function findById<T extends { readonly id: string }>(
  collection: readonly T[],
  id: string,
  collectionName: string,
): Result<T, LookupFailure> {
  const entry = collection.find((candidate) => candidate.id === id)

  if (entry === undefined) {
    const failure: LookupFailure = { kind: 'notFound', collection: collectionName, id }
    return err(failure)
  }

  return ok(entry)
}

/**
 * Where opening a file entry goes: a file window for text and images, or out of the app
 * for a link and for the resume. The target names the item rather than a window, so the
 * window manager in a later feature owns what actually opens.
 * Spec 0001, AC-6.
 */
export function openTargetFor(entry: FileEntry): OpenTarget {
  switch (entry.kind) {
    case 'text':
    case 'image':
      return { kind: 'file', fileId: entry.id }
    case 'link':
    case 'pdf':
      return { kind: 'external', href: entry.href }
  }
}

/**
 * Every file in the tree, whichever location holds it. The ids are global, so one flat
 * list is enough to look one up, and it is built once at module load rather than walked
 * again per lookup. Spec 0003, AC-3.
 */
export const TREE_FILES: readonly FileEntry[] = Object.values(LOCATIONS).flatMap((location) =>
  location.children.flatMap((child) => (child.kind === 'folder' ? child.children : [child])),
)

/**
 * Finds one file anywhere in the tree by its id, so a target that names a file can be
 * resolved to the entry behind it. Returns the entry, or a `notFound` failure carrying
 * the id it looked for, the same shape `findById` returns. Spec 0003, AC-8.
 */
export function findFile(fileId: string): Result<FileEntry, LookupFailure> {
  return findById(TREE_FILES, fileId, 'files')
}
