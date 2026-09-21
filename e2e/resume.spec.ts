import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Resume window, driven in a real browser: the two ways in, the file row over the document, what
 * the download control carries, the two ways the file can be missing, the ring on the page, the
 * window at 360px, and the Finder's own resume file rechecked since this feature must leave it
 * exactly as the earlier specifications shipped it.
 *
 * The names are written out here rather than read from the content layer, because a Playwright spec
 * compiles on its own and cannot resolve the app's import aliases. `Resume.pdf`, its path and the
 * words a failure shows are what `src/content/locations.ts` and
 * `src/windows/resume/resumeLines.ts` hold.
 *
 * A headless Chromium has no inline PDF viewer, so what the document paints cannot be asserted: the
 * durable evidence is the embed element, its path, its accessible name and the anchors. The embed's
 * fallback content is in the document either way, which is why two download anchors exist and every
 * query below says which one it means.
 * Spec 0007, AC-1, AC-2, AC-4, AC-5, AC-6, AC-9, AC-10.
 */

const RESUME = 'Resume'
const FILE_NAME = 'Resume.pdf'
const FILE_PATH = '/files/resume.pdf'
const DOWNLOAD_LABEL = `Download ${FILE_NAME}`
const NOT_SERVED = `The file ${FILE_NAME} is not on the site.`
const REQUEST_FAILED = 'The resume could not be fetched just now.'

/** The frame the desktop names after the window. */
function frameOf(page: Page): Locator {
  return page.getByRole('region', { name: RESUME })
}

/** The content area inside that frame, which the stage names after the same window. */
function contentOf(page: Page): Locator {
  return frameOf(page).getByRole('group', { name: RESUME })
}

/** The row's download control, which is the first of the two anchors in the document. */
function rowDownloadOf(page: Page): Locator {
  return contentOf(page).getByRole('link', { name: DOWNLOAD_LABEL }).first()
}

/** Opens the window from the desktop item, which is the way in at every width. */
async function openFromDesktop(page: Page): Promise<void> {
  const items = page.getByRole('list', { name: 'Desktop items' })

  await expect(items).toBeVisible()
  await items.getByRole('button', { name: RESUME, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

test('opens from the desktop and sets the file row over the document', async ({ page }) => {
  await page.goto('/')
  await openFromDesktop(page)

  const content = contentOf(page)

  await expect(content.getByText(FILE_NAME, { exact: true })).toBeVisible()

  // One control for the visitor, and one the embed keeps for a browser that cannot draw the file.
  await expect(content.getByRole('link', { name: DOWNLOAD_LABEL })).toHaveCount(2)

  const row = rowDownloadOf(page)

  await expect(row).toHaveText('Download')
  await expect(row).toHaveAttribute('href', FILE_PATH)
  await expect(row).toHaveAttribute('download', FILE_NAME)

  const embed = content.locator('object')

  await expect(embed).toHaveAttribute('data', FILE_PATH)
  await expect(embed).toHaveAttribute('type', 'application/pdf')
  await expect(embed).toHaveAttribute('aria-label', FILE_NAME)
  // One mechanism names the embed: the label, with no title repeating it.
  await expect(embed).not.toHaveAttribute('title')

  // The row comes before the document in the document, which is the reading order a visitor walks.
  expect(
    await row.evaluate((element) => {
      const embedElement = document.querySelector('object')

      return embedElement === null
        ? false
        : Boolean(element.compareDocumentPosition(embedElement) & Node.DOCUMENT_POSITION_FOLLOWING)
    }),
  ).toBe(true)
})

test('opens from the menu bar link, and a second press focuses rather than opening another', async ({
  page,
}) => {
  await page.goto('/')

  const bar = page.getByRole('navigation', { name: 'Desktop menu bar' })

  await expect(bar).toBeVisible()
  await bar.getByRole('button', { name: RESUME, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
  await bar.getByRole('button', { name: RESUME, exact: true }).click()
  await expect(frameOf(page)).toHaveCount(1)
})

test('saves the file under its own name when the download control is pressed', async ({ page }) => {
  await page.goto('/')
  await openFromDesktop(page)

  const [download] = await Promise.all([page.waitForEvent('download'), rowDownloadOf(page).click()])

  expect(download.suggestedFilename()).toBe(FILE_NAME)
  // The press downloads the file: the window it was pressed in stays where the visitor was.
  expect(new URL(page.url()).pathname).toBe('/')
})

test('reaches the download control by keyboard, with the page ring drawn on it', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDesktop(page)

  let reached = false

  for (let press = 0; press < 40 && !reached; press += 1) {
    await page.keyboard.press('Tab')
    reached = await page.evaluate(
      (label) => document.activeElement?.getAttribute('aria-label') === label,
      DOWNLOAD_LABEL,
    )
  }

  expect(reached).toBe(true)

  const ring = await page.locator(':focus').evaluate((element) => {
    const style = getComputedStyle(element)

    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor }
  })

  expect(ring.style).not.toBe('none')
  expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2)
  // The ring is the page's ink, read from the token rather than written out here, because the app
  // wide ring's dark value would wash out on a surface that stays white.
  expect(ring.color).toBe(
    await page.evaluate(() => {
      const probe = document.createElement('span')

      probe.style.color = 'var(--color-text-on-paper)'
      document.body.append(probe)

      const colour = getComputedStyle(probe).color

      probe.remove()

      return colour
    }),
  )
})

test('shows the line for a file the site does not serve, and offers no download', async ({
  page,
}) => {
  await page.route('**/files/resume.pdf', (route) => route.fulfill({ status: 404, body: '' }))
  await page.goto('/')
  await openFromDesktop(page)

  const content = contentOf(page)

  await expect(content.getByText(NOT_SERVED)).toBeVisible()
  await expect(content.getByRole('link')).toHaveCount(0)
  await expect(content.locator('object')).toHaveCount(0)
})

test('shows its own line when the request for the file fails outright', async ({ page }) => {
  await page.route('**/files/resume.pdf', (route) => route.abort())
  await page.goto('/')
  await openFromDesktop(page)

  await expect(contentOf(page).getByText(REQUEST_FAILED)).toBeVisible()
  await expect(contentOf(page).getByRole('link')).toHaveCount(0)
})

test('keeps the window inside 360px, with the download control touch sized', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 })
  await page.goto('/')
  await openFromDesktop(page)

  const frame = frameOf(page)
  const content = contentOf(page)

  await expect(content.getByText(FILE_NAME, { exact: true })).toBeVisible()

  const download = await rowDownloadOf(page).boundingBox()

  expect(download?.height ?? 0).toBeGreaterThanOrEqual(44)

  // Nothing scrolls sideways, and the content area holds the document rather than overflowing it,
  // so the document area keeps whatever height the frame has left instead of a fixed ratio.
  expect(await frame.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  expect(await content.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  expect(await content.evaluate((element) => element.scrollHeight - element.clientHeight)).toBe(0)

  const embed = await content.locator('object').boundingBox()

  expect(embed?.height ?? 0).toBeGreaterThan(60)
})

test('still sends the Finder resume file out of the app', async ({ page }) => {
  await page.goto('/')

  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: 'Portfolio' }).click()

  // Choosing the Resume location renames the Finder frame after it, so the frame is asked for again
  // by the name it carries now.
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()
  await page
    .getByRole('region', { name: 'Work' })
    .getByRole('navigation', { name: 'Favourites' })
    .getByRole('button', { name: RESUME, exact: true })
    .click()

  const item = page
    .getByRole('region', { name: RESUME })
    .getByRole('group', { name: RESUME })
    .getByRole('link', { name: FILE_NAME })

  await expect(item).toHaveAttribute('href', FILE_PATH)
  await expect(item).toHaveAttribute('target', '_blank')

  const [opened] = await Promise.all([page.waitForEvent('popup'), item.click()])

  expect(opened).toBeDefined()
  // The file left the app: no window opened for it, and the desktop still holds the one frame.
  await expect(page.getByRole('region', { name: RESUME })).toHaveCount(1)
})
