import { z } from 'zod'
import { describe, expect, it } from 'vitest'

import { ARTICLES } from '#content/articles'
import { DESKTOP_ITEMS } from '#content/desktop'
import { ALBUMS } from '#content/gallery'
import { LOCATIONS } from '#content/locations'
import { PROFILE, SOCIALS } from '#content/profile'
import { findById, openTargetFor } from '#content/reads'
import {
  PROJECT_FOLDERS,
  findPlace,
  findResumeFile,
  placeName,
  placeOfTarget,
  resumeFileAmong,
  targetForPlace,
} from '#content/reads'
import { DOCK_APPS, NAV_ICONS, NAV_LINKS } from '#content/shell'
import { TECH_GROUPS } from '#content/techStack'
import {
  albumIdSchema,
  albumSchema,
  articleIdSchema,
  desktopItemIdSchema,
  desktopItemSchema,
  dockAppIdSchema,
  fileIdSchema,
  imageFileSchema,
  linkFileSchema,
  locationIdSchema,
  navIconIdSchema,
  navLinkIdSchema,
  photoIdSchema,
  projectFolderSchema,
  projectIdSchema,
  socialIdSchema,
  techGroupIdSchema,
  textFileSchema,
  windowIdSchema,
} from '#content/types'
import type { FileEntry, Place, TextFile } from '#content/types'
import { assertCollectionIsValid, assertContentIsValid } from '#content/validate'
import { WINDOWS } from '#content/windows'

/** Every file in the tree, whichever location holds it. */
function treeFileEntries(): readonly FileEntry[] {
  return Object.values(LOCATIONS).flatMap((location) =>
    location.children.flatMap((child) => (child.kind === 'folder' ? child.children : [child])),
  )
}

/** One entry of any collection, which is all these checks need to read. */
type Identified = { readonly id: string }

/** The array shaped collections, each with the id union it has to cover exactly. */
const ARRAY_COLLECTIONS: readonly {
  readonly name: string
  readonly ids: readonly string[]
  readonly entries: readonly Identified[]
}[] = [
  { name: 'nav links', ids: navLinkIdSchema.options, entries: NAV_LINKS },
  { name: 'nav icons', ids: navIconIdSchema.options, entries: NAV_ICONS },
  { name: 'dock apps', ids: dockAppIdSchema.options, entries: DOCK_APPS },
  { name: 'desktop items', ids: desktopItemIdSchema.options, entries: DESKTOP_ITEMS },
  { name: 'socials', ids: socialIdSchema.options, entries: SOCIALS },
  { name: 'articles', ids: articleIdSchema.options, entries: ARTICLES },
  { name: 'tech groups', ids: techGroupIdSchema.options, entries: TECH_GROUPS },
  { name: 'albums', ids: albumIdSchema.options, entries: ALBUMS },
  { name: 'photos', ids: photoIdSchema.options, entries: ALBUMS.flatMap((album) => album.photos) },
  { name: 'files', ids: fileIdSchema.options, entries: treeFileEntries() },
]

describe('content model', () => {
  it('parses every collection against its schema', () => {
    expect(() => assertContentIsValid()).not.toThrow()
  })

  it('gives every id union member exactly one entry', () => {
    for (const { name, ids, entries } of ARRAY_COLLECTIONS) {
      expect(entries.map((entry) => entry.id).sort(), name).toEqual([...ids].sort())
    }
  })

  it('keeps every id unique inside its collection', () => {
    for (const { name, entries } of ARRAY_COLLECTIONS) {
      const ids = entries.map((entry) => entry.id)
      expect(new Set(ids).size, name).toBe(ids.length)
    }
  })

  it('has an entry for every window and every location', () => {
    expect(Object.keys(WINDOWS).sort()).toEqual([...windowIdSchema.options].sort())
    expect(Object.keys(LOCATIONS).sort()).toEqual([...locationIdSchema.options].sort())
  })

  // covers: AC-1, AC-15
  it('declares the locations in the order the id union declares them, which is the sidebar order', () => {
    // The sidebar reads this order to lay its rows out, so the two have to agree in sequence and
    // not merely contain the same names: a drifted order would reorder the sidebar silently.
    expect(Object.keys(LOCATIONS)).toEqual([...locationIdSchema.options])
  })

  it('names a real window from every dock app and menu bar link', () => {
    for (const { windowId } of [...DOCK_APPS, ...NAV_LINKS]) {
      expect(WINDOWS[windowId], windowId).toBeDefined()
      expect(WINDOWS[windowId].id, windowId).toBe(windowId)
    }
  })

  it('finds an entry by its id, and reports a missing one as a value', () => {
    for (const { name, entries } of ARRAY_COLLECTIONS) {
      for (const entry of entries) {
        const found = findById(entries, entry.id, name)
        expect(found.ok, `${name}/${entry.id}`).toBe(true)
        expect(found.ok ? found.value : undefined, `${name}/${entry.id}`).toBe(entry)
      }
    }
  })

  it('carries the collection and the id on a failed lookup, and never throws', () => {
    const missing = findById(ARTICLES, 'no-such-article', 'articles')

    expect(missing.ok).toBe(false)
    expect(missing.ok ? undefined : missing.error).toEqual({
      kind: 'notFound',
      collection: 'articles',
      id: 'no-such-article',
    })

    expect(findById([], 'anything', 'an empty collection').ok).toBe(false)
  })

  it('sends a text or image file to a file target, and a link or the resume out of the app', () => {
    for (const entry of treeFileEntries()) {
      const target = openTargetFor(entry)

      if (entry.kind === 'link' || entry.kind === 'pdf') {
        expect(target, entry.id).toEqual({ kind: 'external', href: entry.href })
      } else {
        expect(target, entry.id).toEqual({ kind: 'file', fileId: entry.id })
      }
    }
  })

  it('gives the Resume window the pdf the resume location holds, and nothing else', () => {
    const found = findResumeFile()
    const held = LOCATIONS.resume.children.find((child) => child.kind === 'pdf')

    expect(found.ok).toBe(true)
    expect(found.ok ? found.value : undefined).toBe(held)
  })

  it('answers notFound, naming the collection and the id, when the tree holds no resume pdf', () => {
    const absent = { kind: 'notFound', collection: 'files', id: 'resume-pdf' } as const
    const textFile = treeFileEntries().find((file): file is TextFile => file.kind === 'text')

    expect(textFile).toBeDefined()
    expect(resumeFileAmong([])).toEqual({ ok: false, error: absent })
    expect(resumeFileAmong(LOCATIONS.work.children)).toEqual({ ok: false, error: absent })
    // The id is right and the kind is not: the reader still answers that it did not find the file.
    expect(resumeFileAmong([{ ...textFile!, id: 'resume-pdf' }])).toEqual({
      ok: false,
      error: absent,
    })
  })

  it('accepts an album with no photos', () => {
    const emptyAlbum = { id: 'places', title: 'Places', icon: '/icons/file.svg', photos: [] }

    expect(albumSchema.safeParse(emptyAlbum).success).toBe(true)
    expect(ALBUMS.some((album) => album.photos.length === 0)).toBe(true)
  })

  it('rejects a file entry carrying a field its kind does not use', () => {
    const textFileWithHref = {
      id: 'about-bio',
      kind: 'text',
      name: 'about-me.txt',
      icon: '/images/txt.png',
      description: ['One paragraph.'],
      href: 'https://example.com',
    }

    expect(textFileSchema.safeParse(textFileWithHref).success).toBe(false)
  })

  it('rejects an image entry with no alt text and a link that is not https', () => {
    const imageWithNoAlt = {
      id: 'about-photo',
      kind: 'image',
      name: 'me.png',
      icon: '/images/image.png',
      imageUrl: '/images/adrian.jpg',
    }
    const insecureLink = {
      id: 'nike-live',
      kind: 'link',
      name: 'nike.com',
      icon: '/images/safari.png',
      href: 'http://example.com',
    }

    expect(imageFileSchema.safeParse(imageWithNoAlt).success).toBe(false)
    expect(linkFileSchema.safeParse(insecureLink).success).toBe(false)
  })

  it('throws with the collection name and the failing path', () => {
    const insecureLink = {
      id: 'nike-live',
      kind: 'link',
      name: 'nike.com',
      icon: '/images/safari.png',
      href: 'http://example.com',
    }

    expect(() =>
      assertCollectionIsValid('test links', z.array(linkFileSchema), [insecureLink]),
    ).toThrow(/Invalid content in test links[\s\S]*0\.href/)
  })

  it('carries the text a screen reader announces for every image', () => {
    const images = [
      ...treeFileEntries().filter((entry) => entry.kind === 'image'),
      ...ARTICLES.map((article) => article.image),
      ...ALBUMS.flatMap((album) => album.photos),
      PROFILE.avatar,
    ]

    expect(images.length).toBeGreaterThan(0)
    for (const image of images) {
      expect(image.alt.trim().length, image.imageUrl).toBeGreaterThan(0)
    }
  })

  it('labels the menu bar icons that act, and leaves the decorative ones unlabelled', () => {
    for (const icon of NAV_ICONS) {
      if (icon.action.kind === 'decoration') {
        expect('label' in icon, icon.id).toBe(false)
      } else {
        expect('label' in icon ? icon.label.trim().length : 0, icon.id).toBeGreaterThan(0)
      }
    }
  })

  it('keeps every outbound link absolute and https', () => {
    const links = [
      ...treeFileEntries().flatMap((entry) => (entry.kind === 'link' ? [entry.href] : [])),
      ...ARTICLES.map((article) => article.href),
      ...SOCIALS.map((social) => social.href),
    ]

    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toMatch(/^https:\/\/\S+$/)
    }
  })

  it('keeps the resume on a path this origin serves', () => {
    const resume = LOCATIONS.resume.children.find((child) => child.kind === 'pdf')

    expect(resume?.kind === 'pdf' ? resume.href : '').toMatch(/^\/files\/\S+$/)
  })

  it('gives every project exactly one text, one image, one live link and one source link', () => {
    const projects = LOCATIONS.work.children.filter((child) => child.kind === 'folder')

    expect(projects.length).toBeGreaterThan(0)

    for (const project of projects) {
      const ofKind = (kind: FileEntry['kind']) =>
        project.children.filter((file) => file.kind === kind)
      const links = ofKind('link')

      expect(ofKind('text'), project.name).toHaveLength(1)
      expect(ofKind('image'), project.name).toHaveLength(1)
      expect(
        links.filter((link) => link.id.endsWith('-source')),
        project.name,
      ).toHaveLength(1)
      expect(
        links.filter((link) => !link.id.endsWith('-source')),
        project.name,
      ).toHaveLength(1)
    }
  })

  it('carries no spot on a tree entry, since the Finder lays its own items out', () => {
    const folder = LOCATIONS.work.children.find((child) => child.kind === 'folder')
    const textFileWithSpot = {
      id: 'nike-about',
      kind: 'text',
      name: 'Nike Project.txt',
      icon: '/images/txt.png',
      position: 'top-5 left-10',
      description: ['One paragraph.'],
    }

    expect(folder).toBeDefined()
    expect(textFileSchema.safeParse(textFileWithSpot).success).toBe(false)
    expect(projectFolderSchema.safeParse({ ...folder, position: 'top-5 left-10' }).success).toBe(
      false,
    )
  })

  it('gives every desktop item a spot in the left gutter, with nothing anchored right', () => {
    for (const item of DESKTOP_ITEMS) {
      expect(item.position, item.id).toMatch(/\btop-\S+/)
      expect(item.position, item.id).toMatch(/\bleft-\S+/)
      expect(item.position, item.id).not.toMatch(/\bright-/)
    }
  })

  it('names a real project, location or window from every desktop item', () => {
    for (const { id, target } of DESKTOP_ITEMS) {
      switch (target.kind) {
        case 'project':
          expect(
            LOCATIONS.work.children.some((child) => child.id === target.projectId),
            id,
          ).toBe(true)
          break
        case 'window':
          expect(WINDOWS[target.windowId], id).toBeDefined()
          break
        case 'location':
          expect(LOCATIONS[target.locationId], id).toBeDefined()
          break
        case 'file':
        case 'external':
          throw new Error(`desktop item ${id} carries a ${target.kind} target`)
      }
    }
  })

  it('rejects a desktop item whose window target names a window that does not exist', () => {
    const unknownWindow = {
      id: 'resume',
      label: 'Resume',
      icon: '/images/pdf.png',
      position: 'top-[46vh] left-7',
      target: { kind: 'window', windowId: 'nowhere' },
    }

    expect(desktopItemSchema.safeParse(unknownWindow).success).toBe(false)
  })

  it('rejects a desktop item carrying a field the shape does not use', () => {
    const withExtraField = {
      id: 'resume',
      label: 'Resume',
      icon: '/images/pdf.png',
      position: 'top-[46vh] left-7',
      target: { kind: 'window', windowId: 'resume' },
      windowPosition: 'top-[46vh] left-7',
    }

    expect(desktopItemSchema.safeParse(withExtraField).success).toBe(false)
  })

  it('carries both lines of the desktop greeting', () => {
    expect(PROFILE.greeting.lead.trim().length).toBeGreaterThan(0)
    expect(PROFILE.greeting.display.trim().length).toBeGreaterThan(0)
  })
})

/** Every place the content can show, taken from the two id unions. */
const PLACES: readonly Place[] = [
  ...locationIdSchema.options.map((locationId): Place => ({ kind: 'location', locationId })),
  ...projectIdSchema.options.map((projectId): Place => ({ kind: 'project', projectId })),
]

describe('the place model', () => {
  // covers: AC-2
  it('keys every project folder by its own id, so a project place always resolves', () => {
    expect(Object.keys(PROJECT_FOLDERS).sort()).toEqual([...projectIdSchema.options].sort())

    for (const projectId of projectIdSchema.options) {
      expect(PROJECT_FOLDERS[projectId].id, projectId).toBe(projectId)
    }
  })

  // covers: AC-2
  it('reads a place back out of the target that names one, and nothing out of the rest', () => {
    expect(placeOfTarget({ kind: 'location', locationId: 'about' })).toEqual({
      kind: 'location',
      locationId: 'about',
    })
    expect(placeOfTarget({ kind: 'project', projectId: 'nike-ecommerce' })).toEqual({
      kind: 'project',
      projectId: 'nike-ecommerce',
    })
    expect(placeOfTarget({ kind: 'window', windowId: 'projects' })).toBeNull()
    expect(placeOfTarget({ kind: 'file', fileId: 'nike-about' })).toBeNull()
    expect(placeOfTarget({ kind: 'external', href: 'https://example.com' })).toBeNull()
  })

  // covers: AC-2
  it('shows a location its own children, and a project its files with its pitch', () => {
    const work = findPlace({ kind: 'location', locationId: 'work' })
    const project = findPlace({ kind: 'project', projectId: 'nike-ecommerce' })

    expect(work.name).toBe(LOCATIONS.work.name)
    expect(work.items).toBe(LOCATIONS.work.children)
    expect(work.pitch).toBeNull()

    expect(project.name).toBe(PROJECT_FOLDERS['nike-ecommerce'].name)
    expect(project.items).toBe(PROJECT_FOLDERS['nike-ecommerce'].children)
    expect(project.pitch?.kind).toBe('text')
  })

  // covers: AC-2
  it('names every place, and hands back the target that shows it', () => {
    for (const place of PLACES) {
      expect(placeName(place)).toBe(findPlace(place).name)
      expect(targetForPlace(place)).toEqual(place)
    }
  })
})
