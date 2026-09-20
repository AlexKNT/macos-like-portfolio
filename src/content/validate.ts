import { z } from 'zod'

import { ARTICLES } from '#content/articles'
import { ALBUMS } from '#content/gallery'
import { LOCATIONS } from '#content/locations'
import { PROFILE, SOCIALS } from '#content/profile'
import { DOCK_APPS, NAV_ICONS, NAV_LINKS } from '#content/shell'
import { TECH_GROUPS } from '#content/techStack'
import { WALLPAPER } from '#content/theme'
import {
  albumSchema,
  articleSchema,
  dockAppSchema,
  locationsSchema,
  navIconSchema,
  navLinkSchema,
  profileSchema,
  socialSchema,
  techGroupSchema,
  wallpapersSchema,
  windowsSchema,
} from '#content/types'
import { WINDOWS } from '#content/windows'

/** One collection, the schema for its shape, and the name a failure reports. */
type ContentCheck = {
  readonly collection: string
  readonly schema: z.ZodType
  readonly value: unknown
}

/** Reads the failing path out of a parse failure, so the message names the entry. */
function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('; ')
}

/**
 * Parses one collection against its shape and throws when it does not match, naming the
 * collection and the failing path inside it. It throws on purpose: content that does not
 * match its schema is a programmer error rather than an expected failure, so this is the
 * one documented exception to the return a value rule. Spec 0001, AC-7.
 */
export function assertCollectionIsValid(
  collection: string,
  schema: z.ZodType,
  value: unknown,
): void {
  const parsed = schema.safeParse(value)

  if (!parsed.success) {
    throw new Error(`Invalid content in ${collection}: ${describeIssues(parsed.error)}`)
  }
}

/** Every collection, with the name it reports and the schema it must match. */
const CONTENT_CHECKS: readonly ContentCheck[] = [
  { collection: 'windows', schema: windowsSchema, value: WINDOWS },
  { collection: 'nav links', schema: z.array(navLinkSchema), value: NAV_LINKS },
  { collection: 'nav icons', schema: z.array(navIconSchema), value: NAV_ICONS },
  { collection: 'dock apps', schema: z.array(dockAppSchema), value: DOCK_APPS },
  { collection: 'locations', schema: locationsSchema, value: LOCATIONS },
  { collection: 'profile', schema: profileSchema, value: PROFILE },
  { collection: 'socials', schema: z.array(socialSchema), value: SOCIALS },
  { collection: 'articles', schema: z.array(articleSchema), value: ARTICLES },
  { collection: 'tech groups', schema: z.array(techGroupSchema), value: TECH_GROUPS },
  { collection: 'albums', schema: z.array(albumSchema), value: ALBUMS },
  { collection: 'wallpapers', schema: wallpapersSchema, value: WALLPAPER },
]

/**
 * Checks every collection against its schema. Called once in development, before the
 * desktop renders, so an invalid entry fails early and says where it went wrong.
 * The production build never reaches this module. Spec 0001, AC-7.
 */
export function assertContentIsValid(): void {
  for (const { collection, schema, value } of CONTENT_CHECKS) {
    assertCollectionIsValid(collection, schema, value)
  }
}
