import { z } from 'zod'

/*
 * The content model. Every shape is described once, by a schema, and its TypeScript
 * type is read back out of that schema, so a wrong entry fails at build time instead
 * of turning up as an empty window. Ids are literal unions, so a reference to a
 * window, a location or an entry that does not exist cannot compile.
 *
 * The objects are strict, so a field a shape does not use is rejected by the parse
 * rather than quietly dropped. Spec 0001.
 */

/* -------------------------------------------------------------------------- ids */

/** Every window the desktop can open. A name outside this set cannot compile. */
export const windowIdSchema = z.enum([
  'projects',
  'articles',
  'gallery',
  'skills',
  'resume',
  'contact',
  'archive',
  'textFile',
  'imageFile',
])
/** A window the desktop can open. */
export type WindowId = z.infer<typeof windowIdSchema>

/** The menu bar links, in the order the bar shows them. */
export const navLinkIdSchema = z.enum(['projects', 'contact', 'resume'])
/** A menu bar link. */
export type NavLinkId = z.infer<typeof navLinkIdSchema>

/** The menu bar status icons. */
export const navIconIdSchema = z.enum(['wifi', 'search', 'profile', 'appearance'])
/** A menu bar status icon. */
export type NavIconId = z.infer<typeof navIconIdSchema>

/** The dock apps, in the order the dock shows them. */
export const dockAppIdSchema = z.enum([
  'portfolio',
  'articles',
  'gallery',
  'contact',
  'skills',
  'archive',
])
/** A dock app. */
export type DockAppId = z.infer<typeof dockAppIdSchema>

/** The Finder sidebar locations. */
export const locationIdSchema = z.enum(['work', 'about', 'resume', 'trash'])
/** A Finder location. */
export type LocationId = z.infer<typeof locationIdSchema>

/** The project folders inside the work location. */
export const projectIdSchema = z.enum(['nike-ecommerce', 'ai-resume-analyzer', 'food-delivery-app'])
/** A project folder. */
export type ProjectId = z.infer<typeof projectIdSchema>

/** Every file in the whole tree. The ids are global, so a lookup is never ambiguous. */
export const fileIdSchema = z.enum([
  'nike-about',
  'nike-live',
  'nike-source',
  'nike-screenshot',
  'ai-resume-about',
  'ai-resume-live',
  'ai-resume-source',
  'ai-resume-screenshot',
  'food-delivery-about',
  'food-delivery-live',
  'food-delivery-source',
  'food-delivery-screenshot',
  'about-photo',
  'about-photo-casual',
  'about-photo-conference',
  'about-bio',
  'resume-pdf',
  'trash-one',
  'trash-two',
])
/** A file in the tree, unique across the whole tree. */
export type FileId = z.infer<typeof fileIdSchema>

/** The socials the contact window shows. */
export const socialIdSchema = z.enum(['github', 'platform', 'twitter', 'linkedin'])
/** A social entry. */
export type SocialId = z.infer<typeof socialIdSchema>

/** The articles the articles window links out to. */
export const articleIdSchema = z.enum(['typescript-explained', 'three-js-guide', 'gsap-animations'])
/** An article entry. */
export type ArticleId = z.infer<typeof articleIdSchema>

/** The stack areas the skills window prints. */
export const techGroupIdSchema = z.enum([
  'frontend',
  'mobile',
  'styling',
  'backend',
  'database',
  'tools',
])
/** A stack area. */
export type TechGroupId = z.infer<typeof techGroupIdSchema>

/** The gallery albums. */
export const albumIdSchema = z.enum(['library', 'memories', 'places', 'people', 'favorites'])
/** A gallery album. */
export type AlbumId = z.infer<typeof albumIdSchema>

/** The photos. Each id is prefixed with its album, so it stays unique on its own. */
export const photoIdSchema = z.enum(['library-1', 'library-2', 'library-3', 'library-4'])
/** A photo in an album. */
export type PhotoId = z.infer<typeof photoIdSchema>

/** The items the desktop shows on the wallpaper: the three project folders and the resume. */
export const desktopItemIdSchema = z.enum([
  'nike-ecommerce',
  'ai-resume-analyzer',
  'food-delivery-app',
  'resume',
])
/** A desktop item. */
export type DesktopItemId = z.infer<typeof desktopItemIdSchema>

/* ---------------------------------------------------------------------- shared */

/** A link that leaves the app: absolute, and https. */
export const outboundLinkSchema = z
  .string()
  .regex(/^https:\/\/\S+$/, { error: 'must be an absolute link that starts with https://' })

/** A same origin file path under `/files/`, which is where the resume lives. */
export const localFilePathSchema = z
  .string()
  .regex(/^\/files\/\S+$/, { error: 'must be a same origin path under /files/' })

/** An image and the text a screen reader announces for it. */
export const imageSchema = z
  .strictObject({
    imageUrl: z.string().min(1),
    alt: z.string().min(1),
  })
  .readonly()
/** An image and its alternative text. */
export type ContentImage = z.infer<typeof imageSchema>

/* ---------------------------------------------------------------------- window */

/** A window: the title its titlebar shows, and the icon the dock reads for it. */
export const windowEntrySchema = z
  .strictObject({
    id: windowIdSchema,
    title: z.string().min(1),
    icon: z.string().min(1),
  })
  .readonly()
/** A window entry, keyed in `WINDOWS` by its own id. */
export type WindowEntry = z.infer<typeof windowEntrySchema>

/** The window registry, keyed by the union so a missing window fails to typecheck. */
export const windowsSchema = z.record(windowIdSchema, windowEntrySchema)

/* ---------------------------------------------------------------------- theme */

/** The wallpapers the desktop paints: one per mode, plus the crop a narrow screen uses. */
export const wallpaperIdSchema = z.enum(['light', 'dark', 'compact'])
/** A wallpaper. */
export type WallpaperId = z.infer<typeof wallpaperIdSchema>

/** A wallpaper image, keyed by the id it is stored under. */
export const wallpaperSchema = z
  .strictObject({
    id: wallpaperIdSchema,
    imageUrl: z.string().min(1),
  })
  .readonly()
/** A wallpaper. */
export type Wallpaper = z.infer<typeof wallpaperSchema>

/** The wallpaper registry, keyed by the union so a missing mode fails to typecheck. */
export const wallpapersSchema = z.record(wallpaperIdSchema, wallpaperSchema)

/* ----------------------------------------------------------------------- shell */

/** A menu bar link: the label it shows, and the window it opens. */
export const navLinkSchema = z
  .strictObject({
    id: navLinkIdSchema,
    label: z.string().min(1),
    windowId: windowIdSchema,
  })
  .readonly()
/** A menu bar link. */
export type NavLink = z.infer<typeof navLinkSchema>

/** An icon that only decorates the bar, so it carries no label. */
const decorationActionSchema = z.strictObject({ kind: z.literal('decoration') }).readonly()

/** An icon that opens a Finder location, so it must carry a label. */
const openLocationActionSchema = z
  .strictObject({
    kind: z.literal('openLocation'),
    locationId: locationIdSchema,
  })
  .readonly()

/** The appearance control the light and dark row will wire, so it must carry a label. */
const appearanceActionSchema = z.strictObject({ kind: z.literal('appearance') }).readonly()

/**
 * A menu bar icon. An icon that acts carries a `label` and an action that does
 * something, and an icon that only decorates carries no label, so the accessible
 * name rule is held by the type rather than by a test.
 */
export const navIconSchema = z.union([
  z
    .strictObject({
      id: navIconIdSchema,
      icon: z.string().min(1),
      action: decorationActionSchema,
    })
    .readonly(),
  z
    .strictObject({
      id: navIconIdSchema,
      icon: z.string().min(1),
      label: z.string().min(1),
      action: z.union([openLocationActionSchema, appearanceActionSchema]),
    })
    .readonly(),
])
/** A menu bar status icon. */
export type NavIcon = z.infer<typeof navIconSchema>

/** A dock app: the name the dock announces, and the window it opens. Its icon comes from `WINDOWS`. */
export const dockAppSchema = z
  .strictObject({
    id: dockAppIdSchema,
    name: z.string().min(1),
    windowId: windowIdSchema,
  })
  .readonly()
/** A dock app. */
export type DockApp = z.infer<typeof dockAppSchema>

/* ----------------------------------------------------------------- open target */

/**
 * Where a Finder style window is showing: one location, or one project folder. The kind
 * chooses the id, so a place that names a location cannot hold a project and the other way
 * round, which is what makes an impossible place unwritable. A place is never stored: it is
 * read back out of the target a window already carries. Spec 0005, AC-2.
 */
export const placeSchema = z.union([
  z.strictObject({ kind: z.literal('location'), locationId: locationIdSchema }).readonly(),
  z.strictObject({ kind: z.literal('project'), projectId: projectIdSchema }).readonly(),
])
/** A place a Finder style window shows. */
export type Place = z.infer<typeof placeSchema>

/**
 * Where opening an item goes: a Finder location, one project, one file, a window named
 * outright, or a link out of the page. Naming the item rather than a window keeps window
 * state in the window manager, so this model stays free of any view state. Spec 0001, AC-6.
 *
 * The `window` kind is what the resume icon on the desktop needs, since the resume is a
 * window rather than a file in the tree. Spec 0003, AC-3.
 *
 * A location and a project target are the two members of `placeSchema`, so a place is a
 * target already and the two can never drift apart. Spec 0005, AC-2.
 */
export const openTargetSchema = z.union([
  placeSchema,
  z.strictObject({ kind: z.literal('file'), fileId: fileIdSchema }).readonly(),
  z.strictObject({ kind: z.literal('window'), windowId: windowIdSchema }).readonly(),
  z.strictObject({ kind: z.literal('external'), href: outboundLinkSchema }).readonly(),
])
/** Where opening an item goes. */
export type OpenTarget = z.infer<typeof openTargetSchema>

/* --------------------------------------------------------------- desktop items */

/**
 * An item the desktop shows before any window opens: the label it carries, the icon it
 * paints, the spot it sits at, and what activating it opens. The spot is a top and a left
 * pair, so no icon depends on a right edge that a narrow screen does not have.
 * Spec 0003, AC-3.
 */
export const desktopItemSchema = z
  .strictObject({
    id: desktopItemIdSchema,
    label: z.string().min(1),
    icon: z.string().min(1),
    position: z.string().min(1),
    target: openTargetSchema,
  })
  .readonly()
/** A desktop item. */
export type DesktopItem = z.infer<typeof desktopItemSchema>

/* ------------------------------------------------------------------------ tree */

/*
 * No tree entry carries a spot any more: the Finder lays its items out in a flowing
 * grid, so a position would be a second, unused truth about where a file sits. The
 * desktop keeps its own spots in `DESKTOP_ITEMS`, which is a different surface.
 * Spec 0005, AC-15.
 */

/** A text file, with the paragraphs it shows and an optional subtitle above them. */
export const textFileSchema = z
  .strictObject({
    id: fileIdSchema,
    kind: z.literal('text'),
    name: z.string().min(1),
    icon: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    description: z.array(z.string().min(1)).readonly(),
  })
  .readonly()
/** A text file. */
export type TextFile = z.infer<typeof textFileSchema>

/** An image file, which always carries the text a screen reader announces. */
export const imageFileSchema = z
  .strictObject({
    id: fileIdSchema,
    kind: z.literal('image'),
    name: z.string().min(1),
    icon: z.string().min(1),
    imageUrl: z.string().min(1),
    alt: z.string().min(1),
  })
  .readonly()
/** An image file. */
export type ImageFile = z.infer<typeof imageFileSchema>

/** A link file, which opens outside the app. */
export const linkFileSchema = z
  .strictObject({
    id: fileIdSchema,
    kind: z.literal('link'),
    name: z.string().min(1),
    icon: z.string().min(1),
    href: outboundLinkSchema,
  })
  .readonly()
/** A link file. */
export type LinkFile = z.infer<typeof linkFileSchema>

/** A PDF file, which is served from this origin so it can open and download in place. */
export const pdfFileSchema = z
  .strictObject({
    id: fileIdSchema,
    kind: z.literal('pdf'),
    name: z.string().min(1),
    icon: z.string().min(1),
    href: localFilePathSchema,
  })
  .readonly()
/** A PDF file. */
export type PdfFile = z.infer<typeof pdfFileSchema>

/**
 * A file in the tree, one of four kinds. A text file cannot carry an `href`,
 * an image file cannot omit its `alt`, and a link file cannot hold a local path,
 * so the fields a kind does not use are impossible to write.
 */
export const fileEntrySchema = z.union([
  textFileSchema,
  imageFileSchema,
  linkFileSchema,
  pdfFileSchema,
])
/** A file in the tree. */
export type FileEntry = z.infer<typeof fileEntrySchema>

/** A project folder. It holds files only, never another folder. */
export const projectFolderSchema = z
  .strictObject({
    id: projectIdSchema,
    kind: z.literal('folder'),
    name: z.string().min(1),
    icon: z.string().min(1),
    children: z.array(fileEntrySchema).readonly(),
  })
  .readonly()
/** A project folder. */
export type ProjectFolder = z.infer<typeof projectFolderSchema>

/** A Finder location: the project folders and the loose files it holds. */
export const locationSchema = z
  .strictObject({
    id: locationIdSchema,
    name: z.string().min(1),
    icon: z.string().min(1),
    children: z.array(z.union([projectFolderSchema, fileEntrySchema])).readonly(),
  })
  .readonly()
/** A Finder location. */
export type Location = z.infer<typeof locationSchema>

/** The location registry, keyed by the union so a missing location fails to typecheck. */
export const locationsSchema = z.record(locationIdSchema, locationSchema)

/* ----------------------------------------------------------- profile, socials */

/**
 * The two lines the desktop greets a visitor with. Two fields rather than one, because the
 * second line is set in the display face and the first one is not. Spec 0003, AC-2.
 */
export const greetingSchema = z
  .strictObject({
    lead: z.string().min(1),
    display: z.string().min(1),
  })
  .readonly()
/** The desktop greeting. */
export type Greeting = z.infer<typeof greetingSchema>

/** The profile the About window and the contact window read. */
export const profileSchema = z
  .strictObject({
    id: z.literal('profile'),
    name: z.string().min(1),
    role: z.string().min(1),
    tagline: z.string().min(1).optional(),
    greeting: greetingSchema,
    bio: z.array(z.string().min(1)).readonly(),
    email: z.email(),
    avatar: imageSchema,
  })
  .readonly()
/** The profile of the person the portfolio belongs to. */
export type Profile = z.infer<typeof profileSchema>

/** A social link, with the brand colour of its tile. */
export const socialSchema = z
  .strictObject({
    id: socialIdSchema,
    label: z.string().min(1),
    icon: z.string().min(1),
    color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: 'must be a six digit hex colour' }),
    href: outboundLinkSchema,
  })
  .readonly()
/** A social entry. */
export type Social = z.infer<typeof socialSchema>

/* --------------------------------------------------- articles, stack, gallery */

/** An article written elsewhere. The date is ISO so the window owns the format. */
export const articleSchema = z
  .strictObject({
    id: articleIdSchema,
    title: z.string().min(1),
    date: z.iso.date(),
    image: imageSchema,
    href: outboundLinkSchema,
  })
  .readonly()
/** An article. */
export type Article = z.infer<typeof articleSchema>

/** One area of the stack and the names inside it. */
export const techGroupSchema = z
  .strictObject({
    id: techGroupIdSchema,
    category: z.string().min(1),
    items: z.array(z.string().min(1)).readonly(),
  })
  .readonly()
/** A stack area. */
export type TechGroup = z.infer<typeof techGroupSchema>

/** A photo in an album. */
export const photoSchema = z
  .strictObject({
    id: photoIdSchema,
    imageUrl: z.string().min(1),
    alt: z.string().min(1),
  })
  .readonly()
/** A photo in an album. */
export type Photo = z.infer<typeof photoSchema>

/** A gallery album and the photos it holds. An album with no photos is valid content. */
export const albumSchema = z
  .strictObject({
    id: albumIdSchema,
    title: z.string().min(1),
    icon: z.string().min(1),
    photos: z.array(photoSchema).readonly(),
  })
  .readonly()
/** A gallery album. */
export type Album = z.infer<typeof albumSchema>

/* ------------------------------------------------------------- lookup outcomes */

/** Why a lookup failed. A window switches on `kind` and owns its own wording. */
export type LookupFailure = {
  readonly kind: 'notFound'
  readonly collection: string
  readonly id: string
}

/* `OpenTarget`, the fifth outcome of opening something, is declared above the desktop
   items, which carry one each. */
