/*
 * The window's own state: one value naming where the gesture stands, and the only things that
 * build one are the transitions below. Nothing here is stored and nothing here is read from
 * outside the page: the state is born when the window opens and dies with it, which is why a
 * reopened window holds its leftovers again. Spec 0012, AC-7, AC-8.
 */

/** Where the Archive's gesture stands: holding its leftovers, clearing them, or emptied. */
export type ArchiveState = 'holding' | 'clearing' | 'emptied'

/** The state a window opens in: holding its leftovers. */
export function seededArchive(): ArchiveState {
  return 'holding'
}

/**
 * The state after Empty is pressed. Only a window that is `holding` can start the gesture, and a
 * press in any other state hands the very same value back, so React bails out rather than
 * re-rendering and a repeated press is a genuine no op (spec 0012, AC-10).
 */
export function emptyRequested(state: ArchiveState): ArchiveState {
  return state === 'holding' ? 'clearing' : state
}

/**
 * The state the movement lands in. Asked outside `clearing` it hands the same value back, which is
 * what makes the landing safe to call twice: called once, twice or never, it produces one state
 * (spec 0012, AC-10).
 */
export function archiveCleared(state: ArchiveState): ArchiveState {
  return state === 'clearing' ? 'emptied' : state
}

/**
 * Whether the window still answers a press on its leftovers: only while it is `holding` them, so
 * they stop answering in the same frame the gesture starts. Spec 0012, AC-5.
 */
export function archiveAnswers(state: ArchiveState): boolean {
  return state === 'holding'
}

/**
 * Whether the Empty control has anything to answer. The state alone would still read `holding` for
 * a window whose place holds nothing, which must never offer an empty, so the count is part of the
 * question. Spec 0012, AC-4, AC-6.
 */
export function canEmpty(state: ArchiveState, count: number): boolean {
  return archiveAnswers(state) && count > 0
}
