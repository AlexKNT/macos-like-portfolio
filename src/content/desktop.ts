import type { DesktopItem } from '#content/types'

/**
 * The four items the desktop shows on the wallpaper, before any window opens: the three
 * project folders and the resume, which a recruiter looks for first.
 *
 * The array order is the tab order, so it runs top to bottom down the left gutter. Every
 * spot is a top and a left pair, nothing is anchored to a right edge, so each icon stays
 * inside the gutter at 360px wide. The spots used to live on the folder entries in
 * `LOCATIONS`, which no longer carry one.
 *
 * Activating an item opens its target through the window manager's one open action, so a
 * project folder reaches the Projects window and the resume reaches the Resume window.
 * Spec 0003, AC-3.
 */
export const DESKTOP_ITEMS: readonly DesktopItem[] = [
  {
    id: 'nike-ecommerce',
    label: 'Nike Ecommerce Website Application',
    icon: '/images/folder.png',
    position: 'top-[5vh] left-5',
    target: { kind: 'project', projectId: 'nike-ecommerce' },
  },
  {
    id: 'ai-resume-analyzer',
    label: 'AI Resume Analyzer',
    icon: '/images/folder.png',
    position: 'top-[20vh] left-7',
    target: { kind: 'project', projectId: 'ai-resume-analyzer' },
  },
  {
    id: 'food-delivery-app',
    label: 'Food Delivery App',
    icon: '/images/folder.png',
    position: 'top-[33vh] left-7',
    target: { kind: 'project', projectId: 'food-delivery-app' },
  },
  {
    id: 'resume',
    label: 'Resume',
    icon: '/images/pdf.png',
    position: 'top-[46vh] left-7',
    target: { kind: 'window', windowId: 'resume' },
  },
]
