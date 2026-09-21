import { useState } from 'react'

import { findResumeFile } from '#content/reads'
import { WINDOWS } from '#content/windows'
import { QuietLine } from '#windows/QuietLine'
import { WindowStage } from '#windows/WindowStage'
import { useResumeFile } from '#windows/resume/useResumeFile'
import {
  DOWNLOAD_WORD,
  downloadLabel,
  fileNotServedLine,
  noResumeFileLine,
  requestFailedLine,
  undrawableDocumentLine,
} from '#windows/resume/resumeLines'
import type { PdfFile } from '#content/types'
import type { WindowBodyProps } from '#windows/WindowBody'
import type { ResumeFileState } from '#windows/resume/useResumeFile'

/*
 * The face both download anchors wear. They are the only controls this window has, and they sit on
 * a page rather than on a window surface, so every colour comes from the page set: the action
 * colour for the link, the page ink for the pointer state, and the ring written for the page
 * instead of the app wide one, whose dark value would wash out on white. The 44px target is the
 * smallest a control may be, on any width. Spec 0007, AC-2, AC-8, AC-9.
 *
 * The row's control shows one word and is announced as the whole instruction (`Download
 * Resume.pdf`), which is the visible word inside the name assistive tech reads rather than a
 * second wording. There is no page hover token, so the pointer state is the page ink rather than a
 * wash: the design system gap is a surface for the page, which is a `/architect` question rather
 * than something to invent here. The shared state utilities are all built from tokens that flip.
 */
const DOWNLOAD_FACE =
  'page-focus text-link-on-paper hover:text-text-on-paper focus-visible:page-focus inline-flex min-h-touch shrink-0 items-center rounded-control px-2 text-sm font-medium underline underline-offset-2'

/** The line the window is showing, which is also what its one live region announces. */
function announcementFor(state: ResumeFileState): string | undefined {
  switch (state.kind) {
    case 'checking':
    case 'ready':
      return undefined
    case 'missing':
      return fileNotServedLine(state.fileName)
    case 'unreachable':
      return requestFailedLine()
    case 'absent':
      return noResumeFileLine()
  }
}

/**
 * The page: the file row over the document, both on the paper. The row carries the file's own name
 * and the one download control, and the document is drawn by the browser's own viewer from the same
 * path the control points at.
 *
 * The embed is an `object` rather than an `iframe` because `object` is the one of the two that
 * renders its own children when the browser cannot draw the file, which is where the fallback
 * lives: a line for that case and a second download anchor, since the row's own anchor cannot be in
 * two places at once. Both anchors stay in the document either way, so a test queries the row's.
 * The embed is named by `aria-label` alone, so nothing repeats the file's name twice.
 * Spec 0007, AC-2, AC-5, AC-6, AC-9.
 */
function ResumePage({ file }: { readonly file: PdfFile }) {
  return (
    <div className="bg-surface-paper rounded-panel flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="border-divider-on-paper flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-3">
        <p className="flex min-w-0 items-center gap-2">
          {/* The icon decorates the row: the file's name beside it is what a reader hears. */}
          <img src={file.icon} alt="" className="size-5 shrink-0 object-contain" />
          <span className="text-text-on-paper min-w-0 truncate text-sm font-medium">
            {file.name}
          </span>
        </p>
        <a
          href={file.href}
          download={file.name}
          aria-label={downloadLabel(file.name)}
          className={DOWNLOAD_FACE}
        >
          {DOWNLOAD_WORD}
        </a>
      </div>
      <object
        data={file.href}
        type="application/pdf"
        aria-label={file.name}
        className="border-divider-on-paper rounded-control min-h-0 w-full flex-1 border"
      >
        <div className="col-center h-full gap-3 p-6 text-center">
          <p className="text-text-on-paper text-sm">{undrawableDocumentLine()}</p>
          <a href={file.href} download={file.name} className={DOWNLOAD_FACE}>
            {downloadLabel(file.name)}
          </a>
        </div>
      </object>
    </div>
  )
}

/** What the body draws for the state it is in: the page, nothing at all, or one quiet line. */
function ResumeBody({ state }: { readonly state: ResumeFileState }) {
  switch (state.kind) {
    case 'checking':
      return null
    case 'ready':
      return <ResumePage file={state.file} />
    case 'missing':
      return <QuietLine>{fileNotServedLine(state.fileName)}</QuietLine>
    case 'unreachable':
      return <QuietLine>{requestFailedLine()}</QuietLine>
    case 'absent':
      return <QuietLine>{noResumeFileLine()}</QuietLine>
  }
}

/**
 * The resume, read in place and downloadable: the file the content layer already holds, drawn by
 * the browser's own PDF viewer, with one download control beside its name.
 *
 * The body reads the file once, when the window opens, and hands it to the hook that asks whether
 * the site is serving it. Until that answer arrives the window draws nothing, so a download is
 * never offered for a file nobody has confirmed, and each way of failing lands on its own line
 * rather than on a broken frame. Nothing animates here and nothing is stored: reopening the window
 * is the way to ask again. Spec 0007, AC-1, AC-3, AC-4.
 */
export function ResumeWindow({ windowId }: WindowBodyProps) {
  const [found] = useState(() => findResumeFile())
  const state = useResumeFile(found)

  return (
    <WindowStage name={WINDOWS[windowId].title} status={announcementFor(state)}>
      <ResumeBody state={state} />
    </WindowStage>
  )
}
