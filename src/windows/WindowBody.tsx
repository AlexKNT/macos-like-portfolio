import { Placeholder } from '#windows/Placeholder'
import type { WindowId } from '#content/types'
import type { ComponentType } from 'react'

/** What a window body is given. A body reads its own content from `#content`. */
export type WindowBodyProps = { readonly windowId: WindowId }

/**
 * The one place a window id becomes a body. Every entry is the placeholder today, and each
 * window feature replaces its own line and nothing else, so no window feature has to touch
 * the desktop surface. The `Record` over the union is what makes a window id without a body
 * a typecheck failure rather than a blank window. Spec 0003, AC-8.
 */
export const WINDOW_BODIES: Record<WindowId, ComponentType<WindowBodyProps>> = {
  projects: Placeholder,
  articles: Placeholder,
  gallery: Placeholder,
  skills: Placeholder,
  resume: Placeholder,
  contact: Placeholder,
  archive: Placeholder,
  textFile: Placeholder,
  imageFile: Placeholder,
}
