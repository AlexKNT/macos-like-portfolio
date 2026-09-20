import type { WindowEntry, WindowId } from '#content/types'

/**
 * Every window the desktop can open, keyed by its own id.
 * The `Record` annotation is what makes a missing entry a typecheck failure rather
 * than something a test has to look for. Spec 0001, AC-3.
 */
export const WINDOWS: Record<WindowId, WindowEntry> = {
  projects: { id: 'projects', title: 'Projects', icon: '/images/finder.png' },
  articles: { id: 'articles', title: 'Articles', icon: '/images/safari.png' },
  gallery: { id: 'gallery', title: 'Gallery', icon: '/images/photos.png' },
  skills: { id: 'skills', title: 'Skills', icon: '/images/terminal.png' },
  resume: { id: 'resume', title: 'Resume', icon: '/images/pdf.png' },
  contact: { id: 'contact', title: 'Contact', icon: '/images/contact.png' },
  archive: { id: 'archive', title: 'Archive', icon: '/images/trash.png' },
  textFile: { id: 'textFile', title: 'Text File', icon: '/images/txt.png' },
  imageFile: { id: 'imageFile', title: 'Preview', icon: '/images/image.png' },
}
