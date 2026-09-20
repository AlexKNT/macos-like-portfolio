import { z } from 'zod'
import { describe, expect, it } from 'vitest'

import { ARTICLES } from '#content/articles'
import { ALBUMS } from '#content/gallery'
import { LOCATIONS } from '#content/locations'
import { PROFILE, SOCIALS } from '#content/profile'
import { findById, openTargetFor } from '#content/reads'
import { DOCK_APPS, NAV_ICONS, NAV_LINKS } from '#content/shell'
import { TECH_GROUPS } from '#content/techStack'
import {
  albumIdSchema,
  albumSchema,
  articleIdSchema,
  dockAppIdSchema,
  fileIdSchema,
  imageFileSchema,
  linkFileSchema,
  locationIdSchema,
  navIconIdSchema,
  navLinkIdSchema,
  photoIdSchema,
  socialIdSchema,
  techGroupIdSchema,
  textFileSchema,
  windowIdSchema,
} from '#content/types'
import type { FileEntry } from '#content/types'
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

    expect(() => assertCollectionIsValid('test links', z.array(linkFileSchema), [insecureLink])).toThrow(
      /Invalid content in test links[\s\S]*0\.href/,
    )
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
})
