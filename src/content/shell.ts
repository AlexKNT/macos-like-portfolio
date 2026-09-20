import type { DockApp, NavIcon, NavLink } from '#content/types'

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
