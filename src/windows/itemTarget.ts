import { openTargetFor } from '#content/reads'
import type { TreeEntry } from '#content/reads'
import type { OpenTarget } from '#content/types'

/**
 * Where a press on one entry of the file tree leads: a project folder opens the place it stands
 * for, and a file goes wherever its own kind says, which is a file window for text and images and
 * out of the page for a link and for the resume.
 *
 * It is the Finder's own rule, lifted out of its grid, so every window that draws a tree entry
 * leads where the Finder leads and no two windows can drift apart. Spec 0005, AC-3; spec 0012,
 * AC-2.
 */
export function itemTarget(entry: TreeEntry): OpenTarget {
  return entry.kind === 'folder' ? { kind: 'project', projectId: entry.id } : openTargetFor(entry)
}
