import { LOCATIONS } from '#content/locations'
import { err, ok } from '#lib/result'
import type { Result } from '#lib/result'
import type {
  FileEntry,
  FileId,
  LookupFailure,
  OpenTarget,
  PdfFile,
  Place,
  ProjectFolder,
  ProjectId,
  TextFile,
} from '#content/types'

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

/* --------------------------------------------------------------- the resume file */

/**
 * The id the resume file carries in the tree. It is typed as a `FileId` so a rename in the id
 * union breaks the build rather than turning the window into a quiet line at runtime.
 * Spec 0007, AC-1.
 */
const RESUME_FILE_ID: FileId = 'resume-pdf'

/**
 * The resume file among the entries a location holds, or a `notFound` failure under `files`
 * carrying the id it looked for. It is split out of `findResumeFile` so both failure branches can
 * be driven with a tree the suite makes up rather than only with the one the app ships, the way
 * `findById` takes its collection as an argument. Spec 0007, AC-1, AC-4.
 */
export function resumeFileAmong(entries: readonly TreeEntry[]): Result<PdfFile, LookupFailure> {
  const found = findById(entries, RESUME_FILE_ID, 'files')

  if (!found.ok) {
    return err(found.error)
  }

  return found.value.kind === 'pdf'
    ? ok(found.value)
    : err({ kind: 'notFound', collection: 'files', id: RESUME_FILE_ID })
}

/**
 * The resume file, which is the one entry the Resume window reads. It hands the entry back, or a
 * `notFound` failure when the resume location holds no entry under that id, or holds one that is
 * not a pdf. It never throws, so the window shows the `absent` state instead of a broken frame,
 * and no body walks the tree itself. Spec 0007, AC-1, AC-4.
 */
export function findResumeFile(): Result<PdfFile, LookupFailure> {
  return resumeFileAmong(LOCATIONS.resume.children)
}

/* ------------------------------------------------------------------- the places */

/** Anything a place can hold: the locations hold project folders and files, a project holds files. */
export type TreeEntry = ProjectFolder | FileEntry

/** The project folders the work location holds, in the order the tree lists them. */
const PROJECT_FOLDER_LIST: readonly ProjectFolder[] = LOCATIONS.work.children.filter(
  (child): child is ProjectFolder => child.kind === 'folder',
)

/**
 * Every project folder, keyed by its own id, so a project place always resolves and no
 * caller has to walk the tree for one. `Object.fromEntries` cannot carry the key union, so
 * the assertion here is doing the work the `Record` annotation does elsewhere; what makes
 * it safe is that a folder keys its own id and the content suite checks that against the
 * union. Spec 0005, AC-2.
 */
export const PROJECT_FOLDERS: Record<ProjectId, ProjectFolder> = Object.fromEntries(
  PROJECT_FOLDER_LIST.map((folder): [ProjectId, ProjectFolder] => [folder.id, folder]),
) as Record<ProjectId, ProjectFolder>

/**
 * What a place shows: its own name, the items inside it in the order the tree lists them
 * (which is the reading order the window walks), and the pitch text file a project carries.
 * A location has no pitch, so that field is `null` there.
 */
export type PlaceView = {
  readonly name: string
  readonly items: readonly TreeEntry[]
  readonly pitch: TextFile | null
}

/**
 * Reads what a place shows. Both registries are annotated records, so an id the union allows
 * always resolves and there is no failure branch a caller has to handle. Spec 0005, AC-2.
 */
export function findPlace(place: Place): PlaceView {
  if (place.kind === 'project') {
    const project = PROJECT_FOLDERS[place.projectId]

    return {
      name: project.name,
      items: project.children,
      pitch: project.children.find((file): file is TextFile => file.kind === 'text') ?? null,
    }
  }

  const location = LOCATIONS[place.locationId]

  return { name: location.name, items: location.children, pitch: null }
}

/** The name of a place, which is both its window title and the name its region reads. AC-2. */
export function placeName(place: Place): string {
  return findPlace(place).name
}

/**
 * The place a target shows, or `null` for a target that names no place. A location and a
 * project target are places already, since `openTargetSchema` is built from `placeSchema`,
 * so this only narrows. Spec 0005, AC-2.
 */
export function placeOfTarget(target: OpenTarget): Place | null {
  switch (target.kind) {
    case 'location':
    case 'project':
      return target
    case 'file':
    case 'window':
    case 'external':
      return null
  }
}

/**
 * The target that shows a place, so a caller can ask for a place without naming its window,
 * and so going back to one writes the same target shape the entry points write. Spec 0005, AC-5.
 */
export function targetForPlace(place: Place): OpenTarget {
  return place
}
