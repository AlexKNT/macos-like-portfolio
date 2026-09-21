import { WINDOWS } from '#content/windows'
import type { DockApp, HomeApp, NavIcon, NavLink } from '#content/types'

/** The three menu bar links, each naming the window it opens. */
export const NAV_LINKS: readonly NavLink[] = [
  { id: 'projects', label: 'Projects', windowId: 'projects' },
  { id: 'contact', label: 'Contact', windowId: 'contact' },
  { id: 'resume', label: 'Resume', windowId: 'resume' },
]

/**
 * The four status icons. The wifi and search icons only decorate the bar, so they carry
 * no label. The other two act, so each carries the name a screen reader announces.
 */
export const NAV_ICONS: readonly NavIcon[] = [
  { id: 'wifi', icon: '/icons/wifi.svg', action: { kind: 'decoration' } },
  { id: 'search', icon: '/icons/search.svg', action: { kind: 'decoration' } },
  {
    id: 'profile',
    icon: '/icons/user.svg',
    label: 'About me',
    action: { kind: 'openLocation', locationId: 'about' },
  },
  {
    id: 'appearance',
    icon: '/icons/mode.svg',
    label: 'Switch appearance',
    action: { kind: 'appearance' },
  },
]

/**
 * The six dock apps. The name here is what the dock announces, and it is deliberately
 * not the same word as the window title in `WINDOWS`. The icon comes from `WINDOWS`
 * too, so each window's image is written down once.
 */
export const DOCK_APPS: readonly DockApp[] = [
  { id: 'portfolio', name: 'Portfolio', windowId: 'projects' },
  { id: 'articles', name: 'Articles', windowId: 'articles' },
  { id: 'gallery', name: 'Gallery', windowId: 'gallery' },
  { id: 'contact', name: 'Contact', windowId: 'contact' },
  { id: 'skills', name: 'Skills', windowId: 'skills' },
  { id: 'archive', name: 'Archive', windowId: 'archive' },
]

/**
 * The phone's home surface: one tile for every window the desktop opens by name, in the order a
 * recruiter meets them (the work first, then the resume and the way to reach you, then the rest).
 *
 * The name is the window's own title and the icon is read from `WINDOWS`, so neither is written a
 * second time. The two file windows have no tile on purpose: they arrive through the Finder, which
 * asks their body for a place to put them. Spec 0009, AC-2, AC-14.
 */
export const HOME_APPS: readonly HomeApp[] = [
  { id: 'projects', name: WINDOWS.projects.title, windowId: 'projects' },
  { id: 'resume', name: WINDOWS.resume.title, windowId: 'resume' },
  { id: 'contact', name: WINDOWS.contact.title, windowId: 'contact' },
  { id: 'skills', name: WINDOWS.skills.title, windowId: 'skills' },
  { id: 'articles', name: WINDOWS.articles.title, windowId: 'articles' },
  { id: 'gallery', name: WINDOWS.gallery.title, windowId: 'gallery' },
  { id: 'archive', name: WINDOWS.archive.title, windowId: 'archive' },
]
