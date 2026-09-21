import { findFile, placeName, targetForPlace } from '#content/reads'
import { DOCK_APPS, HOME_APPS } from '#content/shell'
import { WINDOWS } from '#content/windows'
import { err, ok } from '#lib/result'
import type { Result } from '#lib/result'
import type { LookupFailure, OpenTarget, Place, WindowId } from '#content/types'

/*
 * The window manager's model: what is open, what it shows, where it sits and which one has
 * the keyboard. Plain immutable data with pure rules over it, so every rule is tested
 * without a render and without a browser.
 *
 * Spec 0003 opens the store with the three actions the shell needs (open, focus, close);
 * spec 0004 extends the same module with dragging, minimising, zooming and the work area;
 * spec 0009 adds the phone's own rule, that an open leaves one window on screen.
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
  | { readonly kind: 'home' }
  | { readonly kind: 'window'; readonly key: WindowKey }

/** A spot inside the work area, in pixels from its top left corner. */
export type WindowPosition = { readonly x: number; readonly y: number }

/** A width and a height in pixels. */
export type WindowSize = { readonly width: number; readonly height: number }

/**
 * The box windows are placed inside: the desktop container's measured content box, with the
 * dock band already taken out by the container. `null` until the first observation arrives,
 * which is why a window is never clamped before the container has been measured.
 */
export type WorkArea = WindowSize | null

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

/** How many steps the cascade walks before it starts again, so it never walks off the surface. */
const CASCADE_STEPS = 4

/** The work area's top left corner: where a filled window sits, and where an unfilled one is anchored. */
const WORK_AREA_CORNER: WindowPosition = { x: 0, y: 0 }

/**
 * Whether a window id has a button on the dock panel. A window without one cannot be
 * minimised, since there would be no way back to it, and it is the last hop the focus
 * handoff can offer. Spec 0004, AC-6.
 */
export function hasDockButton(windowId: WindowId): boolean {
  return DOCK_APPS.some((app) => app.windowId === windowId)
}

/**
 * Whether a window has a tile on the phone's home surface. It is what decides whether that window
 * offers Minimise on a phone, for the same reason `hasDockButton` decides it above the breakpoint:
 * a window with no tile could be put away with no way back to it. The two lists answer the same
 * question differently, which is the point: the home surface reaches Resume, and the dock does not.
 * Spec 0009, AC-7.
 */
export function hasHomeTile(windowId: WindowId): boolean {
  return HOME_APPS.some((app) => app.windowId === windowId)
}

/** The stacking number a new arrival takes: one above everything already open. */
function nextStackingNumber(instances: readonly WindowInstance[]): number {
  return instances.reduce((highest, instance) => Math.max(highest, instance.z), 0) + 1
}

/** A number kept between a floor and a ceiling. */
function clampBetween(value: number, smallest: number, largest: number): number {
  return Math.min(Math.max(value, smallest), largest)
}

/**
 * The spot a window is allowed to take: the whole window inside the work area, so no window
 * can be dragged out of sight. A work area that is still `null` clamps nothing, and a window
 * larger than the work area is pinned to the work area's top left corner so its title bar
 * stays reachable. The one place geometry is bounded, so a drag and an arrow key cannot
 * disagree. Spec 0004, AC-4, AC-9.
 */
export function clampPosition(
  position: WindowPosition,
  size: WindowSize,
  workArea: WorkArea,
): WindowPosition {
  if (workArea === null) {
    return position
  }

  return {
    x: clampBetween(position.x, 0, Math.max(0, workArea.width - size.width)),
    y: clampBetween(position.y, 0, Math.max(0, workArea.height - size.height)),
  }
}

/**
 * The focused window: the highest stacking number among the windows that are not minimised.
 * Derived rather than stored, so closing or minimising a window can never leave focus
 * pointing at something that has gone. Returns null while nothing is open.
 */
export function focusedKeyOf(instances: readonly WindowInstance[]): WindowKey | null {
  return topOnDesktop(instances)?.key ?? null
}

/**
 * The window that sits on top of the desk: the largest stacking number among the ones that are
 * not minimised, or null while nothing is on the desk. The one reading of stacking order, so
 * focus and the handoff chain can never disagree. Spec 0004, AC-3, AC-8.
 */
function topOnDesktop(instances: readonly WindowInstance[]): WindowInstance | null {
  return instances.reduce<WindowInstance | null>(
    (highest, instance) =>
      instance.status === 'minimised' || (highest !== null && highest.z >= instance.z)
        ? highest
        : instance,
    null,
  )
}

/**
 * A size raised to a layout's floor: the work area as it is, unless it is smaller than
 * `minSize`, which then wins and lets the window overflow its container rather than collapse.
 * Spec 0004, AC-9.
 */
function floorAtMinSize(size: WindowSize, minSize: WindowSize): WindowSize {
  return {
    width: Math.max(size.width, minSize.width),
    height: Math.max(size.height, minSize.height),
  }
}

/**
 * The size a window takes so it fits a work area that shrank: down to the work area, never
 * below its layout `minSize`. It only ever runs above the compact breakpoint: on a phone nothing
 * is fitted, because the box a window paints is the work area itself and its stored geometry is
 * left alone. Spec 0004, AC-9; spec 0009, AC-9.
 */
function shrinkToFit(size: WindowSize, minSize: WindowSize, workArea: WindowSize): WindowSize {
  const largest = floorAtMinSize(workArea, minSize)

  return {
    width: clampBetween(size.width, minSize.width, largest.width),
    height: clampBetween(size.height, minSize.height, largest.height),
  }
}

/**
 * The size a filled window takes: the whole work area, still floored by its layout `minSize`
 * above the compact breakpoint, and by nothing on a phone, where the work area is the floor and
 * the ceiling both. Spec 0004, AC-9; spec 0009, AC-9.
 */
function filledSize(layout: WindowLayout, workArea: WorkArea, compact: boolean): WindowSize {
  if (workArea === null) {
    return layout.defaultSize
  }

  return compact ? workArea : floorAtMinSize(workArea, layout.minSize)
}

/**
 * Where a window sits and how big it is on screen: its own geometry, except below the compact
 * breakpoint, where the focused window fills the work area and every other one keeps its box.
 * The stored geometry is left alone, so leaving the compact layout puts the desktop back as
 * the visitor arranged it. Spec 0004, AC-9; spec 0009, AC-9.
 */
export function windowGeometry(
  instance: WindowInstance,
  workArea: WorkArea,
  compact: boolean,
  isFocused: boolean,
): { readonly position: WindowPosition; readonly size: WindowSize } {
  if (compact && isFocused && workArea !== null) {
    return { position: WORK_AREA_CORNER, size: workArea }
  }

  return { position: instance.position, size: instance.size }
}

/**
 * Where the keyboard goes when a window leaves the desk: back to whatever opened it, else to
 * the window underneath, else to its own dock button, else to the desktop. A hop that has gone
 * or is minimised is skipped rather than followed, so focus never rests on something that is
 * not there. Pure, so the chain is tested without a DOM; the caller turns the hop into an
 * element. Spec 0004, AC-8.
 *
 * A phone has no dock on screen, so its chain stops one step earlier and ends at the container
 * the home surface lives in, which is focusable without being tabbable. Spec 0009, AC-8.
 */
export type FocusHop =
  | { readonly kind: 'window'; readonly key: WindowKey }
  | { readonly kind: 'dock'; readonly windowId: WindowId }
  | { readonly kind: 'desktop' }

/** Reads the hop the keyboard takes when `key` leaves the desk. */
export function focusHopAfter(
  instances: readonly WindowInstance[],
  key: WindowKey,
  compact: boolean,
): FocusHop {
  const leaving = instances.find((instance) => instance.key === key)
  const staying = instances.filter(
    (instance) => instance.key !== key && instance.status !== 'minimised',
  )
  const opener = leaving?.opener

  if (opener !== undefined && opener.kind === 'window') {
    const found = staying.find((instance) => instance.key === opener.key)

    if (found !== undefined) {
      return { kind: 'window', key: found.key }
    }
  }

  const underneath = topOnDesktop(staying)

  if (underneath !== null) {
    return { kind: 'window', key: underneath.key }
  }

  if (!compact && leaving !== undefined && hasDockButton(leaving.windowId)) {
    return { kind: 'dock', windowId: leaving.windowId }
  }

  return { kind: 'desktop' }
}

/**
 * Where a newly opened window lands: half a step in from the work area's top left corner
 * for the first window, then one step each for the ones after it, wrapping after four
 * steps. Only the windows on the desktop count, so a window waiting in the dock never
 * pushes the next one along. The step itself comes from the token layer, read at the edge
 * and passed in, so no geometry value is written here as a literal. Spec 0004, AC-2.
 */
function cascadeSpot(openCount: number, step: number): WindowPosition {
  const distance = openCount === 0 ? step / 2 : step * (1 + ((openCount - 1) % CASCADE_STEPS))

  return { x: distance, y: distance }
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
 * The place a bare Projects open lands on. It is the same place `DEFAULT_PLACE` seeds the
 * projects window's history with, and the two are pinned together by that window's own test.
 * Spec 0005, AC-2.
 */
const PROJECTS_HOME: Place = { kind: 'location', locationId: 'work' }

/**
 * Maps an `OpenTarget` to the window it opens: the one place a target becomes a window.
 * A dock button, a menu bar link, the About icon and a desktop icon all arrive here, so an
 * entry point whose window is already open resolves to the same key and is focused rather
 * than opened twice. A target naming something absent comes back as a failure rather than
 * as an empty window. Pure. Spec 0004, AC-1.
 *
 * A `location` or a `project` target is titled with the entry's own `name`, so the window a
 * place shows is named by the place rather than by the app that shows it. A bare `window`
 * target for Projects is answered with the work location instead: the instance's target then
 * stays a place for as long as the window is open, and re-opening from the dock or the menu
 * bar lands on Work rather than resetting the title. Spec 0005, AC-1, AC-2.
 */
export function resolveOpenTarget(target: OpenTarget): Result<ResolvedWindow, TargetFailure> {
  switch (target.kind) {
    case 'window':
      return target.windowId === 'projects'
        ? ok(windowFor('projects', placeName(PROJECTS_HOME), targetForPlace(PROJECTS_HOME)))
        : ok(windowFor(target.windowId, WINDOWS[target.windowId].title, target))
    case 'location':
    case 'project':
      return ok(windowFor('projects', placeName(target), target))
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

/** Everything the manager holds: the open windows, the box they are placed inside, and whether
 *  the desktop is in its compact layout. */
export type WindowManagerState = {
  readonly instances: readonly WindowInstance[]
  readonly workArea: WorkArea
  readonly compact: boolean
}

/**
 * The manager before its first render, told which layout the page is in. The layout is read once
 * from the one media query at the provider's edge and passed in here, so the reducer itself never
 * asks the browser anything and a phone's very first render is already the phone shell.
 * Spec 0009, AC-1.
 */
export function createWindowManagerState(compact: boolean): WindowManagerState {
  return { instances: [], workArea: null, compact }
}

/** The manager before the first window opens and before the container is measured. */
export const EMPTY_WINDOW_MANAGER: WindowManagerState = createWindowManagerState(false)

/** Every action the manager answers. Spec 0004 extends this union as its strands land. */
export type WindowManagerAction =
  | {
      readonly type: 'open'
      readonly target: OpenTarget
      readonly opener: WindowOpener
      readonly cascadeStep: number
    }
  | { readonly type: 'focus'; readonly key: WindowKey }
  | { readonly type: 'close'; readonly key: WindowKey }
  | { readonly type: 'move'; readonly key: WindowKey; readonly position: WindowPosition }
  | { readonly type: 'minimise'; readonly key: WindowKey }
  | { readonly type: 'restore'; readonly key: WindowKey }
  | { readonly type: 'zoom'; readonly key: WindowKey }
  | { readonly type: 'setWorkArea'; readonly size: WindowSize }
  | { readonly type: 'setCompact'; readonly compact: boolean }

/**
 * What a phone paints: one window takes the screen, so an open closes every instance that is
 * neither parked nor the window the new one came from. A file opened from the Finder therefore
 * keeps its Finder alive underneath it, a parked window keeps its mark and comes back when its
 * tile is pressed, and the close and the open are one transition. It lives in the reducer rather
 * than in a component, so the rule is proved with no DOM. Spec 0009, AC-5, AC-10.
 */
function oneWindowOnScreen(
  instances: readonly WindowInstance[],
  key: WindowKey,
  opener: WindowOpener,
): readonly WindowInstance[] {
  const comingFrom = opener.kind === 'window' ? opener.key : null

  return instances.filter(
    (instance) =>
      instance.status === 'minimised' ||
      instance.key === key ||
      (comingFrom !== null && instance.key === comingFrom),
  )
}

/**
 * Opens a target, or focuses the window that key already has. A key that is already open
 * takes a fresh stacking number, un-minimises and takes the newly requested target, so a
 * second click on another project moves the Projects window rather than doing nothing. It
 * never adds a second window for one key. A target that opens no window leaves the state
 * alone. On a phone both of these branches also close what the new window covers.
 * Spec 0004, AC-2; spec 0009, AC-5.
 */
function openWindow(
  state: WindowManagerState,
  target: OpenTarget,
  opener: WindowOpener,
  cascadeStep: number,
): WindowManagerState {
  const resolved = resolveOpenTarget(target)

  if (!resolved.ok) {
    return state
  }

  const { windowId, key, title } = resolved.value
  const z = nextStackingNumber(state.instances)

  if (state.instances.some((instance) => instance.key === key)) {
    const revived = state.instances.map((instance): WindowInstance =>
      instance.key === key ? { ...instance, title, target, status: 'normal', z } : instance,
    )

    return {
      ...state,
      instances: state.compact ? oneWindowOnScreen(revived, key, opener) : revived,
    }
  }

  const layout = WINDOW_LAYOUT[windowId]
  const spot = cascadeSpot(
    state.instances.filter((open) => open.status !== 'minimised').length,
    cascadeStep,
  )
  const instance: WindowInstance = {
    key,
    windowId,
    title,
    target,
    position: clampPosition(spot, layout.defaultSize, state.workArea),
    size: layout.defaultSize,
    status: 'normal',
    filled: false,
    z,
    opener,
  }
  const opened = [...state.instances, instance]

  return { ...state, instances: state.compact ? oneWindowOnScreen(opened, key, opener) : opened }
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

  return instances.some((instance) => instance.key === key) ? { ...state, instances } : state
}

/**
 * Removes a window. The state's own focus needs no handoff here: it is derived as the highest
 * stacking number that is left, so removing the top window hands the keyboard to the next one
 * down by itself. Where the keyboard goes in the document is the caller's business, and
 * `focusHopAfter` answers it. An unknown key is a no-op. Spec 0004, AC-8.
 */
function closeWindow(state: WindowManagerState, key: WindowKey): WindowManagerState {
  if (!state.instances.some((instance) => instance.key === key)) {
    return state
  }

  return { ...state, instances: state.instances.filter((instance) => instance.key !== key) }
}

/**
 * Puts a window at a spot, clamped into the work area. This is the one writer for a window's
 * position, so a drag and an arrow key both end up here and cannot disagree. An unknown key,
 * and a spot the window already sits at, both leave the state as it was, which is what keeps
 * a drag that ends where it started from re-rendering anything. Spec 0004, AC-4, AC-5.
 */
function moveWindow(
  state: WindowManagerState,
  key: WindowKey,
  position: WindowPosition,
): WindowManagerState {
  const instance = state.instances.find((open) => open.key === key)

  if (instance === undefined) {
    return state
  }

  const clamped = clampPosition(position, instance.size, state.workArea)

  if (clamped.x === instance.position.x && clamped.y === instance.position.y) {
    return state
  }

  return {
    ...state,
    instances: state.instances.map((open): WindowInstance =>
      open.key === key ? { ...open, position: clamped } : open,
    ),
  }
}

/**
 * Takes the container's measured size as the work area and pulls every window back inside it:
 * each one shrinks to fit if it no longer fits, never below its layout `minSize`, and its spot
 * is clamped against the box it now has. A filled window takes the whole work area again, so it
 * follows the container instead of floating over the edge. A measurement of zero is ignored, so
 * the first unmeasured render, and a container that is momentarily hidden, change nothing.
 * A phone keeps every window's stored geometry and derives its box from the work area instead.
 * Spec 0004, AC-7, AC-9; spec 0009, AC-9.
 */
function setWorkArea(state: WindowManagerState, size: WindowSize): WindowManagerState {
  if (size.width <= 0 || size.height <= 0) {
    return state
  }

  const same =
    state.workArea !== null &&
    state.workArea.width === size.width &&
    state.workArea.height === size.height

  if (same) {
    return state
  }

  return {
    ...state,
    workArea: size,
    instances: state.instances.map((instance) => fitInto(instance, size, state.compact)),
  }
}

/**
 * One window fitted to a work area that changed: the size rule, then the clamp against it. On a
 * phone it is handed back exactly as it was: the box it paints is the work area, derived at
 * render, so its stored size and spot are what the desktop comes back to.
 * Spec 0004, AC-9; spec 0009, AC-9.
 */
function fitInto(instance: WindowInstance, workArea: WindowSize, compact: boolean): WindowInstance {
  if (compact) {
    return instance
  }

  const layout = WINDOW_LAYOUT[instance.windowId]
  const size = instance.filled
    ? filledSize(layout, workArea, false)
    : shrinkToFit(instance.size, layout.minSize, workArea)

  return { ...instance, size, position: clampPosition(instance.position, size, workArea) }
}

/**
 * Records whether the desktop is below the compact breakpoint, where the focused window fills
 * the work area and no window is dragged. Kept as state rather than read by each frame, so every
 * window answers the same question in the same render. Spec 0004, AC-9.
 */
function setCompact(state: WindowManagerState, compact: boolean): WindowManagerState {
  return state.compact === compact ? state : { ...state, compact }
}

/**
 * Puts a window away in the dock: its status changes, and nothing else does. Its geometry and
 * its `filled` flag stay, so restoring it brings back what left, and its stacking number stays
 * too, since a window in the dock is out of the stacking order rather than at the bottom of it.
 * An unknown key, and one that is already minimised, both leave the state as it was.
 * Spec 0004, AC-6.
 */
function minimiseWindow(state: WindowManagerState, key: WindowKey): WindowManagerState {
  const instance = state.instances.find((open) => open.key === key)

  if (instance === undefined || instance.status === 'minimised') {
    return state
  }

  return {
    ...state,
    instances: state.instances.map((open): WindowInstance =>
      open.key === key ? { ...open, status: 'minimised' } : open,
    ),
  }
}

/**
 * Brings a window back from the dock at the geometry it left with, with a fresh stacking number
 * so it comes back on top of the desk. A window that is not minimised, and an unknown key, both
 * leave the state as it was. Spec 0004, AC-6.
 */
function restoreWindow(state: WindowManagerState, key: WindowKey): WindowManagerState {
  const instance = state.instances.find((open) => open.key === key)

  if (instance === undefined || instance.status !== 'minimised') {
    return state
  }

  const z = nextStackingNumber(state.instances)

  return {
    ...state,
    instances: state.instances.map((open): WindowInstance =>
      open.key === key ? { ...open, status: 'normal', z } : open,
    ),
  }
}

/**
 * The green light: a window toggles between the whole work area and the layout size its app
 * opens at, anchored at the work area's top left corner both ways. Nothing about the spot it
 * had before is remembered, which is the one place the desktop this imitates differs, and it
 * keeps `filled` through a minimise so a restored window comes back as it left.
 * Spec 0004, AC-7.
 */
function zoomWindow(state: WindowManagerState, key: WindowKey): WindowManagerState {
  const instance = state.instances.find((open) => open.key === key)

  if (instance === undefined) {
    return state
  }

  const layout = WINDOW_LAYOUT[instance.windowId]
  const size = instance.filled
    ? layout.defaultSize
    : filledSize(layout, state.workArea, state.compact)

  return {
    ...state,
    instances: state.instances.map((open): WindowInstance =>
      open.key === key ? { ...open, filled: !open.filled, size, position: WORK_AREA_CORNER } : open,
    ),
  }
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
      return openWindow(state, action.target, action.opener, action.cascadeStep)
    case 'focus':
      return focusWindow(state, action.key)
    case 'close':
      return closeWindow(state, action.key)
    case 'move':
      return moveWindow(state, action.key, action.position)
    case 'minimise':
      return minimiseWindow(state, action.key)
    case 'restore':
      return restoreWindow(state, action.key)
    case 'zoom':
      return zoomWindow(state, action.key)
    case 'setWorkArea':
      return setWorkArea(state, action.size)
    case 'setCompact':
      return setCompact(state, action.compact)
  }
}
