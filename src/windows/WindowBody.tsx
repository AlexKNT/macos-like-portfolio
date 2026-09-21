import { Placeholder } from '#windows/Placeholder'
import { ArticlesWindow } from '#windows/articles/ArticlesWindow'
import { ContactWindow } from '#windows/contact/ContactWindow'
import { GalleryWindow } from '#windows/gallery/GalleryWindow'
import { ImageFileBody } from '#windows/projects/ImageFileBody'
import { ProjectBackButton } from '#windows/projects/ProjectBackButton'
import { ProjectHistoryScope } from '#windows/projects/ProjectHistoryScope'
import { ProjectsWindow } from '#windows/projects/ProjectsWindow'
import { TextFileBody } from '#windows/projects/TextFileBody'
import { ResumeWindow } from '#windows/resume/ResumeWindow'
import { SkillsWindow } from '#windows/skills/SkillsWindow'
import type { OpenTarget, WindowId } from '#content/types'
import type { WindowKey } from '#store/windowManager'
import type { ComponentType, ReactNode } from 'react'

/**
 * What a window body is given: which window it is, which instance of that window it is, and
 * what it shows.
 *
 * The key travels with the props so a body can ask the manager for something under the same
 * instance it was opened as, which is what the Finder's Back control does. It is named
 * `windowKey` rather than `key` because React keeps `key` for itself and never hands it to a
 * component. Spec 0005, AC-13.
 */
export type WindowBodyProps = {
  readonly windowId: WindowId
  readonly windowKey: WindowKey
  readonly target: OpenTarget
}

/** What a window's own scope is given: the body's props, plus the frame it wraps. */
export type WindowBodyScopeProps = WindowBodyProps & { readonly children: ReactNode }

/**
 * The parts a window can register: its body, a control for the title bar's leading slot, and
 * its own scope. Only the parts a window needs are named, so a body with no chrome of its own
 * is still one short line, and every window is read the same way. Spec 0005, AC-13.
 */
export type WindowBodyEntry = {
  readonly Body: ComponentType<WindowBodyProps>
  /** A control for the title bar, beside the three lights. The Finder's Back arrow is one. */
  readonly Lead?: ComponentType<WindowBodyProps>
  /** The window's own state, wrapped around its frame so the title bar can read it too. */
  readonly Scope?: ComponentType<WindowBodyScopeProps>
}

/**
 * The one place a window id becomes a body. Each window feature replaces its own line and
 * nothing else, so no window feature has to touch the desktop surface. The `Record` over the
 * union is what makes a window id without a body a typecheck failure rather than a blank
 * window. Spec 0003, AC-8; spec 0005, AC-13.
 */
export const WINDOW_BODIES: Record<WindowId, WindowBodyEntry> = {
  projects: { Body: ProjectsWindow, Lead: ProjectBackButton, Scope: ProjectHistoryScope },
  articles: { Body: ArticlesWindow },
  gallery: { Body: GalleryWindow },
  skills: { Body: SkillsWindow },
  resume: { Body: ResumeWindow },
  contact: { Body: ContactWindow },
  archive: { Body: Placeholder },
  textFile: { Body: TextFileBody },
  imageFile: { Body: ImageFileBody },
}
