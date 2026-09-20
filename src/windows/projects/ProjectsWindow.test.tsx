import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

import { WindowLayer } from '#components/WindowLayer'
import { LOCATIONS } from '#content/locations'
import { PROJECT_FOLDERS, findFile, findPlace, targetForPlace } from '#content/reads'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import { resolveOpenTarget } from '#store/windowManager'
import type { FileId, OpenTarget, Place } from '#content/types'

/**
 * The Finder, driven through the window manager the way the desktop drives it: the sidebar, the
 * items of the place showing, the project detail view, the history behind the Back control and
 * the keyboard path through all of them.
 * Spec 0005, AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-10, AC-11.
 */

const WORK: Place = { kind: 'location', locationId: 'work' }
const ABOUT: Place = { kind: 'location', locationId: 'about' }
const RESUME: Place = { kind: 'location', locationId: 'resume' }
const NIKE: Place = { kind: 'project', projectId: 'nike-ecommerce' }
const FOOD: Place = { kind: 'project', projectId: 'food-delivery-app' }

/** What a dock button, a menu bar link and the Portfolio icon ask for. */
const BARE_PROJECTS: OpenTarget = { kind: 'window', windowId: 'projects' }

/** The name a place shows under, which is also the row and item it appears as. */
function nameOf(place: Place): string {
  return findPlace(place).name
}

/** The href one file in the tree carries, which is what its anchor has to render. */
function hrefOf(fileId: FileId): string {
  const found = findFile(fileId)

  return found.ok && (found.value.kind === 'link' || found.value.kind === 'pdf')
    ? found.value.href
    : ''
}

/** A stand in for the wallpaper: a button that opens a target from outside the window. */
function WallpaperIcon({ target }: { readonly target: OpenTarget }) {
  const { open } = useWindowManager()

  return (
    <button type="button" onClick={() => open(target, { kind: 'desktop' })}>
      A project on the wallpaper
    </button>
  )
}

/** A stand in desktop: it opens one target on mount, and holds an outside entry when asked. */
function Shell({
  target,
  outside,
}: {
  readonly target: OpenTarget
  readonly outside?: OpenTarget
}) {
  const { open } = useWindowManager()

  useEffect(() => {
    open(target, { kind: 'dock' })
  }, [open, target])

  return (
    <>
      <WindowLayer />
      {outside === undefined ? null : <WallpaperIcon target={outside} />}
    </>
  )
}

/** The frame the manager opened for a target, found by the title the resolver gives it. */
function frameFor(target: OpenTarget): HTMLElement {
  const resolved = resolveOpenTarget(target)

  if (!resolved.ok) {
    throw new Error('expected the target to open a window')
  }

  return screen.getByRole('region', { name: resolved.value.title })
}

/** The sidebar of a frame, which is the one named navigation inside it. */
function sidebarOf(frame: HTMLElement): HTMLElement {
  return within(frame).getByRole('navigation', { name: 'Favourites' })
}

/** The content area of a frame, which is the group named after the place showing. */
function regionOf(frame: HTMLElement, place: Place): HTMLElement {
  return within(frame).getByRole('group', { name: nameOf(place) })
}

/** Renders the shell with the Finder open, and hands back the frame it opened. */
function setup(target: OpenTarget = BARE_PROJECTS, outside?: OpenTarget): HTMLElement {
  render(
    <WindowManagerProvider>
      <Shell target={target} outside={outside} />
    </WindowManagerProvider>,
  )

  return frameFor(target)
}

/** Whether `first` comes before `second` in the document, which is the order a reader meets them. */
function comesBefore(first: Node, second: Node): boolean {
  return (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
}

describe('the Finder', () => {
  // covers: AC-1
  it('opens on the work location, with the sidebar and the items of that place', () => {
    const frame = setup()
    const sidebar = sidebarOf(frame)
    const grid = within(regionOf(frame, WORK)).getByRole('list')

    // The four locations in the order the id union declares them, with the projects inside Work.
    expect(
      within(sidebar)
        .getAllByRole('button')
        .map((row) => row.textContent?.trim()),
    ).toEqual([
      LOCATIONS.work.name,
      ...Object.values(PROJECT_FOLDERS).map((project) => project.name),
      LOCATIONS.about.name,
      LOCATIONS.resume.name,
      LOCATIONS.trash.name,
    ])

    expect(
      within(grid)
        .getAllByRole('button')
        .map((item) => item.textContent?.trim()),
    ).toEqual(findPlace(WORK).items.map((item) => item.name))
  })

  // covers: AC-1
  it('shows the place a sidebar row names', async () => {
    const user = userEvent.setup()
    const frame = setup()

    await user.click(within(sidebarOf(frame)).getByRole('button', { name: LOCATIONS.about.name }))

    const about = frameFor(targetForPlace(ABOUT))
    const grid = within(regionOf(about, ABOUT)).getByRole('list')

    expect(within(about).getByRole('heading', { level: 2 })).toHaveTextContent(LOCATIONS.about.name)
    expect(within(grid).getAllByRole('listitem')).toHaveLength(findPlace(ABOUT).items.length)
  })

  // covers: AC-2
  it('re-targets the one window on a folder press, and titles it with the project', async () => {
    const user = userEvent.setup()
    const frame = setup()

    await user.click(within(regionOf(frame, WORK)).getByRole('button', { name: nameOf(NIKE) }))

    expect(screen.getAllByRole('region')).toHaveLength(1)
    expect(frameFor(targetForPlace(NIKE))).toBe(frame)
    expect(within(frame).getByRole('heading', { level: 2 })).toHaveTextContent(nameOf(NIKE))
  })

  // covers: AC-3
  it('walks the items in reading order from the region, each announced with its own name', async () => {
    const user = userEvent.setup()
    const frame = setup()

    act(() => regionOf(frame, WORK).focus())

    const walked: string[] = []

    for (let step = 0; step < findPlace(WORK).items.length; step += 1) {
      await user.tab()

      walked.push(document.activeElement?.textContent?.trim() ?? '')
    }

    expect(walked).toEqual(findPlace(WORK).items.map((item) => item.name))
  })

  // covers: AC-4
  it('shows a project as its name, then its pitch, then its files', async () => {
    const user = userEvent.setup()
    const frame = setup()

    await user.click(within(regionOf(frame, WORK)).getByRole('button', { name: nameOf(NIKE) }))

    const detail = frameFor(targetForPlace(NIKE))
    const pitch = findPlace(NIKE).pitch
    const paragraph = pitch?.description[0] ?? ''
    const heading = within(detail).getByRole('heading', { level: 2, name: nameOf(NIKE) })
    const firstParagraph = within(detail).getByText(paragraph)
    const liveLink = within(detail).getByRole('link', { name: 'nike.com' })

    expect(comesBefore(heading, firstParagraph)).toBe(true)
    expect(comesBefore(firstParagraph, liveLink)).toBe(true)
  })

  // covers: AC-5
  it('offers Back only when there is a place to return to, named for that place', async () => {
    const user = userEvent.setup()
    const frame = setup()

    expect(within(frame).queryByRole('button', { name: /^Back to/ })).toBeNull()

    await user.click(within(sidebarOf(frame)).getByRole('button', { name: nameOf(NIKE) }))

    const back = within(frame).getByRole('button', { name: `Back to ${nameOf(WORK)}` })

    await user.click(back)

    expect(within(frame).getByRole('heading', { level: 2 })).toHaveTextContent(nameOf(WORK))
    expect(within(frame).queryByRole('button', { name: /^Back to/ })).toBeNull()
  })

  // covers: AC-5
  it('pushes a step for a place change from outside the window, so Back returns there', async () => {
    const user = userEvent.setup()

    setup(BARE_PROJECTS, targetForPlace(FOOD))
    await user.click(screen.getByRole('button', { name: 'A project on the wallpaper' }))

    const frame = frameFor(targetForPlace(FOOD))

    expect(
      within(frame).getByRole('button', { name: `Back to ${nameOf(WORK)}` }),
    ).toBeInTheDocument()
  })

  // covers: AC-5
  it('pushes nothing when a press names the place already showing, so one Back still leaves', async () => {
    const user = userEvent.setup()
    const frame = setup()

    await user.click(within(sidebarOf(frame)).getByRole('button', { name: nameOf(NIKE) }))
    await user.click(within(sidebarOf(frame)).getByRole('button', { name: nameOf(NIKE) }))

    // A second step for the same place would leave the project showing after one Back.
    await user.click(
      within(frameFor(targetForPlace(NIKE))).getByRole('button', {
        name: `Back to ${nameOf(WORK)}`,
      }),
    )

    const work = frameFor(targetForPlace(WORK))

    expect(within(work).getByRole('heading', { level: 2 })).toHaveTextContent(nameOf(WORK))
    expect(within(work).queryByRole('button', { name: /^Back to/ })).toBeNull()
  })

  // covers: AC-7
  it('renders a link file as a real anchor, and the resume the same way', async () => {
    const user = userEvent.setup()
    const frame = setup()

    await user.click(within(sidebarOf(frame)).getByRole('button', { name: nameOf(NIKE) }))

    const live = within(frameFor(targetForPlace(NIKE))).getByRole('link', { name: 'nike.com' })

    expect(live).toHaveAttribute('href', hrefOf('nike-live'))
    expect(live).toHaveAttribute('target', '_blank')
    expect(live).toHaveAttribute('rel', 'noopener noreferrer')

    await user.click(within(sidebarOf(frame)).getByRole('button', { name: LOCATIONS.resume.name }))

    const resume = within(frameFor(targetForPlace(RESUME))).getByRole('link', {
      name: 'Resume.pdf',
    })

    expect(resume).toHaveAttribute('href', hrefOf('resume-pdf'))
    expect(resume).toHaveAttribute('target', '_blank')
    expect(resume).toHaveAttribute('rel', 'noopener noreferrer')
  })

  // covers: AC-10
  it('marks exactly the row of the place showing, one at a time', async () => {
    const user = userEvent.setup()
    const frame = setup()
    const sidebar = sidebarOf(frame)
    const marked = () => within(sidebar).getAllByRole('button', { current: true })

    expect(marked()).toHaveLength(1)
    expect(marked()[0]).toHaveAccessibleName(LOCATIONS.work.name)

    await user.click(within(sidebar).getByRole('button', { name: nameOf(NIKE) }))

    expect(marked()).toHaveLength(1)
    expect(marked()[0]).toHaveAccessibleName(nameOf(NIKE))
  })

  // covers: AC-11
  it('moves the keyboard into the region on a place change, and never on the first render', async () => {
    const user = userEvent.setup()
    const frame = setup()

    expect(document.activeElement).toBe(document.body)

    await user.click(within(regionOf(frame, WORK)).getByRole('button', { name: nameOf(NIKE) }))

    expect(regionOf(frame, NIKE)).toHaveFocus()
  })
})
