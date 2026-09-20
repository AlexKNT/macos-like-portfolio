import { findFile } from '#content/reads'
import { WINDOWS } from '#content/windows'
import { err, ok } from '#lib/result'
import type { Result } from '#lib/result'
import type { LookupFailure, OpenTarget, WindowId } from '#content/types'

/*
 * The window manager's model: what is open, what it shows, where it sits and which one has
 * the keyboard. Plain immutable data with pure rules over it, so every rule is tested
 * without a render and without a browser.
 *
 * Spec 0003 opens the store with the three actions the shell needs (open, focus, close);
 * spec 0004 extends the same module with dragging, minimising, zooming and the work area.
 */

/* -------------------------------------------------------------------- the model */

/** The key a window is held under: an app id, or an app id and the item it is showing. */
export type WindowKey = WindowId | `${WindowId}:${string}`

/** Whether a window is on the desktop or put away in the dock. */
export type WindowStatus = 'normal' | 'minimised'

/** What asked for a window, so focus can be handed back to it when the window closes. */
export type WindowOpener =
  | { readonly kind: 'dock' }
  | { readonly kind: 'desktop' }
  | { readonly kind: 'bar' }
  | { readonly kind: 'window'; readonly key: WindowKey }

/** A spot inside the work area, in pixels from its top left corner. */
export type WindowPosition = { readonly x: number; readonly y: number }

/** A width and a height in pixels. */
export type WindowSize = { readonly width: number; readonly height: number }

/**
 * One open window. `filled` is kept while a window is minimised, so restoring it brings
 * back what left, and `opener` is the small union recorded at open time rather than a link
 * to another window, so a closed or minimised opener cannot break the focus handoff.
 * Spec 0004, AC-1.
 */
export type WindowInstance = {
  readonly key: WindowKey
  readonly windowId: WindowId
  readonly title: string
  readonly target: OpenTarget
  readonly position: WindowPosition
  readonly size: WindowSize
  readonly status: WindowStatus
  readonly filled: boolean
  readonly z: number
  readonly opener: WindowOpener
}

/** The size a window opens at, and the smallest it may ever become. */
export type WindowLayout = {
  readonly windowId: WindowId
  readonly defaultSize: WindowSize
  readonly minSize: WindowSize
}

/**
 * Every window's layout, keyed by the union so a missing entry fails the typecheck rather
 * than turning up as a window with no size. A window opens at its `defaultSize`; `minSize`
 * is the floor the shrink to fit rule of spec 0004 clamps against.
 */
export const WINDOW_LAYOUT: Record<WindowId, WindowLayout> = {
  projects: {
    windowId: 'projects',
    defaultSize: { width: 720, height: 460 },
    minSize: { width: 380, height: 240 },
  },
  articles: {
    windowId: 'articles',
    defaultSize: { width: 760, height: 480 },
    minSize: { width: 380, height: 260 },
  },
  gallery: {
    windowId: 'gallery',
    defaultSize: { width: 720, height: 480 },
    minSize: { width: 360, height: 260 },
  },
  skills: {
    windowId: 'skills',
    defaultSize: { width: 660, height: 420 },
    minSize: { width: 360, height: 240 },
  },
  resume: {
    windowId: 'resume',
    defaultSize: { width: 640, height: 560 },
    minSize: { width: 340, height: 300 },
  },
  contact: {
    windowId: 'contact',
    defaultSize: { width: 560, height: 420 },
    minSize: { width: 320, height: 260 },
  },
  archive: {
    windowId: 'archive',
    defaultSize: { width: 640, height: 420 },
    minSize: { width: 340, height: 240 },
  },
  textFile: {
    windowId: 'textFile',
    defaultSize: { width: 560, height: 400 },
    minSize: { width: 320, height: 240 },
  },
  imageFile: {
    windowId: 'imageFile',
    defaultSize: { width: 620, height: 460 },
    minSize: { width: 320, height: 240 },
  },
}

/** How far each newly opened window steps down and right from the one before, in pixels. */
const CASCADE_STEP = 32

/** How many steps the cascade walks before it starts again, so it never walks off the surface. */
const CASCADE_STEPS = 4

/** The stacking number a new arrival takes: one above everything already open. */
function nextStackingNumber(instances: readonly WindowInstance[]): number {
  return instances.reduce((highest, instance) => Math.max(highest, instance.z), 0) + 1
}

/**
 * The focused window: the highest stacking number among the windows that are not minimised.
 * Derived rather than stored, so closing or minimising a window can never leave focus
 * pointing at something that has gone. Returns null while nothing is open.
 */
export function focusedKeyOf(instances: readonly WindowInstance[]): WindowKey | null {
  const onDesktop = instances.filter((instance) => instance.status !== 'minimised')
  const top = onDesktop.reduce<WindowInstance | null>(
    (highest, instance) => (highest === null || instance.z > highest.z ? instance : highest),
    null,
  )

  return top === null ? null : top.key
}

/**
 * Where a newly opened window lands: half a step in from the work area's top left corner
 * for the first window, then one step each for the ones after it, wrapping after four
 * steps. Only the windows on the desktop count, so a window waiting in the dock never
 * pushes the next one along. Spec 0004, AC-2.
 */
function cascadeSpot(openCount: number): WindowPosition {
  const step =
    openCount === 0 ? CASCADE_STEP / 2 : CASCADE_STEP * (1 + ((openCount - 1) % CASCADE_STEPS))

  return { x: step, y: step }
}

/* ------------------------------------------------------------------ the resolver */

/** Which window a target opens, under which key, with which title. */
export type ResolvedWindow = {
  readonly windowId: WindowId
  readonly key: WindowKey
  readonly title: string
  readonly target: OpenTarget
}

/**
 * Why a target opened no window: it leaves the page, or it named something that is not in
 * the content layer. An expected failure returned as a value, so a caller switches on
 * `result.ok` rather than catching a throw.
 */
export type TargetFailure = { readonly kind: 'leavesApp'; readonly href: string } | LookupFailure

/** Builds the resolution for a target that opens one of the nine windows. */
function windowFor(windowId: WindowId, title: string, target: OpenTarget): ResolvedWindow {
  return { windowId, key: windowId, title, target }
}

/**
 * Maps an `OpenTarget` to the window it opens: the one place a target becomes a window.
 * A dock button, a menu bar link, the About icon and a desktop icon all arrive here, so an
 * entry point whose window is already open resolves to the same key and is focused rather
 * than opened twice. A target naming something absent comes back as a failure rather than
 * as an empty window. Pure. Spec 0004, AC-1.
 */
export function resolveOpenTarget(target: OpenTarget): Result<ResolvedWindow, TargetFailure> {
  switch (target.kind) {
    case 'window':
      return ok(windowFor(target.windowId, WINDOWS[target.windowId].title, target))
    case 'location':
    case 'project':
      return ok(windowFor('projects', WINDOWS.projects.title, target))
    case 'external':
      return err({ kind: 'leavesApp', href: target.href })
    case 'file': {
      const found = findFile(target.fileId)

      if (!found.ok) {
        return found
      }

      const entry = found.value

      // A file target naming a link or the resume leaves the page rather than opening a window.
      if (entry.kind === 'link' || entry.kind === 'pdf') {
        return err({ kind: 'leavesApp', href: entry.href })
      }

      const windowId: WindowId = entry.kind === 'text' ? 'textFile' : 'imageFile'

      return ok({ windowId, key: `${windowId}:${entry.id}`, title: entry.name, target })
    }
  }
}

/* ------------------------------------------------------------------- the reducer */

/** Everything the manager holds. One field, since the focus is derived from it. */
export type WindowManagerState = { readonly instances: readonly WindowInstance[] }

/** The manager before the first window opens. */
export const EMPTY_WINDOW_MANAGER: WindowManagerState = { instances: [] }

/** Every action the manager answers. Spec 0004 extends this union with the rest. */
export type WindowManagerAction =
  | { readonly type: 'open'; readonly target: OpenTarget; readonly opener: WindowOpener }
  | { readonly type: 'focus'; readonly key: WindowKey }
  | { readonly type: 'close'; readonly key: WindowKey }

/**
 * Opens a target, or focuses the window that key already has. A key that is already open
 * takes a fresh stacking number, un-minimises and takes the newly requested target, so a
 * second click on another project moves the Projects window rather than doing nothing. It
 * never adds a second window for one key. A target that opens no window leaves the state
 * alone. Spec 0004, AC-2.
 */
function openWindow(
  state: WindowManagerState,
  target: OpenTarget,
  opener: WindowOpener,
): WindowManagerState {
  const resolved = resolveOpenTarget(target)

  if (!resolved.ok) {
    return state
  }

  const { windowId, key, title } = resolved.value
  const z = nextStackingNumber(state.instances)

  if (state.instances.some((instance) => instance.key === key)) {
    return {
      instances: state.instances.map((instance): WindowInstance =>
        instance.key === key ? { ...instance, title, target, status: 'normal', z } : instance,
      ),
    }
  }

  const layout = WINDOW_LAYOUT[windowId]
  const instance: WindowInstance = {
    key,
    windowId,
    title,
    target,
    position: cascadeSpot(state.instances.filter((open) => open.status !== 'minimised').length),
    size: layout.defaultSize,
    status: 'normal',
    filled: false,
    z,
    opener,
  }

  return { instances: [...state.instances, instance] }
}

/**
 * Brings a window to the top, which is what makes it the focused one. An unknown key, and a
 * key that is already on top, both leave the state as it was.
 */
function focusWindow(state: WindowManagerState, key: WindowKey): WindowManagerState {
  if (focusedKeyOf(state.instances) === key) {
    return state
  }

  const z = nextStackingNumber(state.instances)
  const instances = state.instances.map((instance): WindowInstance =>
    instance.key === key ? { ...instance, z } : instance,
  )

  return instances.some((instance) => instance.key === key) ? { instances } : state
}

/**
 * Removes a window. The focus needs no handoff here: it is derived as the highest stacking
 * number that is left, so removing the top window hands the keyboard to the next one down by
 * itself. The handoff to a control outside the window (its opener, its dock button, the
 * desktop) belongs to the caller and to spec 0004. An unknown key is a no-op.
 */
function closeWindow(state: WindowManagerState, key: WindowKey): WindowManagerState {
  if (!state.instances.some((instance) => instance.key === key)) {
    return state
  }

  return { instances: state.instances.filter((instance) => instance.key !== key) }
}

/**
 * The manager's one rule: the old state and an action give the new state. Pure, so no DOM,
 * no timer and no storage lives in here. Spec 0004, AC-1.
 */
export function reduceWindowManager(
  state: WindowManagerState,
  action: WindowManagerAction,
): WindowManagerState {
  switch (action.type) {
    case 'open':
      return openWindow(state, action.target, action.opener)
    case 'focus':
      return focusWindow(state, action.key)
    case 'close':
      return closeWindow(state, action.key)
  }
}
