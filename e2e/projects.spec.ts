import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Finder, driven in a real browser: the way in, a project read, the way back, the two file
 * windows, a link followed and the window at 360px.
 *
 * The names are written out here rather than read from the content layer, because a Playwright
 * spec compiles on its own and cannot resolve the app's import aliases. The window frame is
 * named after the place it shows, so every locator below names the place it is looking in, and
 * a place change means asking for the frame again by its new name.
 * Spec 0005, AC-1, AC-5, AC-6, AC-7, AC-9, AC-12.
 */

const WORK = 'Work'
const ABOUT = 'About me'
const NIKE = 'Nike Ecommerce Website Application'
const AI_RESUME = 'AI Resume Analyzer'
const AI_PITCH = 'AI Resume Analyzer Project.txt'

/** Opens the Projects window from the dock, which lands on the work location. */
async function openFinder(page: Page): Promise<void> {
  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: 'Portfolio' }).click()

  await expect(page.getByRole('region', { name: WORK })).toBeVisible()
}

/** The frame showing a place, which is named after it. */
function frameOf(page: Page, place: string): Locator {
  return page.getByRole('region', { name: place })
}

/** The content area of the frame showing a place, which is the group named after it. */
function contentOf(page: Page, place: string): Locator {
  return frameOf(page, place).getByRole('group', { name: place })
}

/** The sidebar of the frame showing a place. */
function sidebarOf(page: Page, place: string): Locator {
  return frameOf(page, place).getByRole('navigation', { name: 'Favourites' })
}

/** A frame's box on screen, rounded, since a box reports fractional pixels. */
async function boxOf(element: Locator) {
  const box = await element.boundingBox()

  if (box === null) {
    throw new Error('expected a laid out box')
  }

  return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) }
}

test('opens on the work location, with the sidebar and that place in the content area', async ({
  page,
}) => {
  await page.goto('/')

  await openFinder(page)

  const sidebar = sidebarOf(page, WORK)

  // The row of the place showing is the one marked, and the projects sit inside Work.
  await expect(sidebar.getByRole('button', { name: WORK })).toHaveAttribute('aria-current', 'true')
  await expect(sidebar.getByRole('button', { name: NIKE })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: ABOUT })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: 'Trash' })).toBeVisible()

  // The content area holds the items of the place showing rather than of the whole tree.
  await expect(contentOf(page, WORK).getByRole('button', { name: NIKE })).toBeVisible()
  await expect(contentOf(page, WORK).getByRole('button', { name: 'me.png' })).toHaveCount(0)
})

test('reads a project and comes back with the Back arrow, without a second window', async ({
  page,
}) => {
  await page.goto('/')

  await openFinder(page)
  await contentOf(page, WORK).getByRole('button', { name: NIKE }).click()

  // The one window re-targets rather than opening a second one for the same place.
  await expect(frameOf(page, NIKE)).toHaveCount(1)
  await expect(contentOf(page, NIKE).getByRole('heading', { level: 2 })).toHaveText(NIKE)
  await expect(contentOf(page, NIKE)).toContainText('a sleek and modern platform')
  await expect(contentOf(page, NIKE).getByRole('link', { name: 'nike.com' })).toBeVisible()

  await page.getByRole('button', { name: `Back to ${WORK}` }).click()

  await expect(contentOf(page, WORK).getByRole('heading', { level: 2 })).toHaveText(WORK)
  await expect(page.getByRole('button', { name: /^Back to/ })).toHaveCount(0)
})

test('follows a link file in a new tab, adding no window', async ({ page }) => {
  // The link files point at real hosts, so the tab is cut off before it loads: what matters
  // here is that a press opens one, and that the desktop is left exactly as it was.
  await page.route('https://youtu.be/**', (route) => route.abort())

  await page.goto('/')

  await openFinder(page)
  await sidebarOf(page, WORK).getByRole('button', { name: AI_RESUME }).click()

  const link = contentOf(page, AI_RESUME).getByRole('link', { name: 'ai-resume-analyzer.com' })
  const popup = page.waitForEvent('popup')

  await link.press('Enter')

  expect((await popup).url()).toContain('youtu.be')
  await (await popup).close()

  await expect(frameOf(page, AI_RESUME)).toHaveCount(1)
  await expect(contentOf(page, AI_RESUME).getByRole('heading', { level: 2 })).toHaveText(AI_RESUME)
})

test('opens a text file in a window of its own, with its own name on the title bar', async ({
  page,
}) => {
  await page.goto('/')

  await openFinder(page)
  await sidebarOf(page, WORK).getByRole('button', { name: ABOUT }).click()
  await contentOf(page, ABOUT).getByRole('button', { name: 'about-me.txt' }).click()

  const file = frameOf(page, 'about-me.txt')

  await expect(file).toBeVisible()
  await expect(file).toContainText('Meet the Developer Behind the Code')
})

test('shows an image whose asset never loaded as a state, not as a broken frame', async ({
  page,
}) => {
  // The About portraits are not in the build yet, so this is the real missing asset path.
  await page.goto('/')

  await openFinder(page)
  await sidebarOf(page, WORK).getByRole('button', { name: ABOUT }).click()
  await contentOf(page, ABOUT).getByRole('button', { name: 'me.png', exact: true }).click()

  const image = frameOf(page, 'me.png')

  await expect(image.getByText('This image did not load.')).toBeVisible()
  await expect(
    image.getByText('Portrait of Adrian, the developer behind this portfolio'),
  ).toBeVisible()
})

test('keeps the Finder inside a 360px window, with the sidebar as one line of icons', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 720 })
  await page.goto('/')

  const items = page.getByRole('list', { name: 'Desktop items' })

  await expect(items).toBeVisible()
  await items.getByRole('button', { name: AI_RESUME }).click()

  const finder = frameOf(page, AI_RESUME)

  await expect(finder).toBeVisible()

  // The sidebar answers with its own width rather than the viewport's: it is one row of icons
  // above the content here, and the grid keeps the window's full width under it.
  const direction = await sidebarOf(page, AI_RESUME).evaluate(
    (element) => getComputedStyle(element).flexDirection,
  )

  expect(direction).toBe('row')
  expect((await boxOf(contentOf(page, AI_RESUME).getByRole('list'))).width).toBeGreaterThan(
    (await boxOf(finder)).width * 0.6,
  )

  // A long name wraps instead of clipping, and nothing inside the window scrolls sideways.
  const lines = await contentOf(page, AI_RESUME)
    .getByRole('button', { name: AI_PITCH })
    .locator('span')
    .evaluate((element) => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight)

      return Math.round(element.getBoundingClientRect().height / lineHeight)
    })

  expect(lines).toBeGreaterThan(1)

  expect(await finder.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
})
