import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Gallery window, driven in a real browser: the two ways in, the album sidebar and its one
 * mark, the grid of the album showing, the viewer a photo opens into, the keyboard that steps and
 * leaves it, and the window at 360px.
 *
 * The names and the descriptions are written out here rather than read from the content layer,
 * because a Playwright spec compiles on its own and cannot resolve the app's import aliases. They
 * are what `src/content/gallery.ts` and `src/windows/gallery/galleryLines.ts` hold.
 * Spec 0010, AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, AC-8, AC-11.
 */

const GALLERY = 'Gallery'
const NAV = 'Albums'
const DOCK = 'Dock'
const HOME = 'Home'
const CLOSE_PHOTO = 'Close photo'
const PHONE = { width: 360, height: 740 }

/*
 * The line a photo shows when its asset never loads, and a photograph that really is in the repo.
 * The four the content names (`gal1.png` to `gal4.png`) are not there yet, so one check stands this
 * file in for them and another forces a 404: the window's own behaviour is what is being proved
 * either way, and neither check has to change when the real photographs land.
 */
const MISSING_PHOTO = 'This photo did not load.'
const STAND_IN_PHOTO = resolve('public/images/photo.jpg')

/** The five albums in the order the content layer declares them, the first one holding photos. */
const ALBUMS: readonly string[] = ['Library', 'Memories', 'Places', 'People', 'Favorites']

/** The descriptions of the four photos the first album carries, which are also the tile names. */
const PHOTOS: readonly string[] = [
  'Placeholder gallery photo one',
  'Placeholder gallery photo two',
  'Placeholder gallery photo three',
  'Placeholder gallery photo four',
]

/** The line an empty album shows, naming itself. */
const EMPTY_MEMORIES = 'Nothing in Memories yet.'

/** The frame the desktop names after the window. */
function frameOf(page: Page): Locator {
  return page.getByRole('region', { name: GALLERY })
}

/** The content area inside that frame, which the stage names after the album showing. */
function contentOf(page: Page, album: string): Locator {
  return frameOf(page).getByRole('group', { name: album })
}

/** The album sidebar. */
function sidebarOf(page: Page): Locator {
  return frameOf(page).getByRole('navigation', { name: NAV })
}

/** Opens the window from the dock, which is the way in at every width the dock is shown at. */
async function openFromDock(page: Page): Promise<void> {
  await page.goto('/')

  const dock = page.getByRole('region', { name: DOCK })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: GALLERY }).click()
  await expect(frameOf(page)).toBeVisible()
}

/** Opens the window from the phone's own tile, which is the way in below the breakpoint. */
async function openFromTile(page: Page): Promise<void> {
  await page.setViewportSize(PHONE)
  await page.goto('/')

  const tiles = page.getByRole('region', { name: HOME }).getByRole('list', { name: HOME })

  await expect(tiles).toBeVisible()
  await tiles.getByRole('button', { name: GALLERY, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

/** One tile of the grid, found by the description that names it. */
function tileOf(page: Page, alt: string): Locator {
  return contentOf(page, ALBUMS[0]).getByRole('button', { name: alt, exact: true })
}

/** The viewer's panel, which is a figure named by the photo it shows. */
function panelOf(page: Page, alt: string): Locator {
  return frameOf(page).getByRole('figure', { name: alt })
}

/** The stage's one live region, which is how the window says the announcement out loud. */
function announcementOf(page: Page): Locator {
  return frameOf(page).locator('[aria-live="polite"]')
}

/** What the focused element is called, and how thick the ring around it is. */
async function focused(page: Page): Promise<{ readonly name: string; readonly outline: string }> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement

    return {
      name: element.getAttribute('aria-label') ?? element.innerText.trim(),
      outline: getComputedStyle(element).outlineWidth,
    }
  })
}

test('opens from the dock on the first album, with the sidebar, the heading and the grid', async ({
  page,
}) => {
  await openFromDock(page)

  const content = contentOf(page, ALBUMS[0])

  await expect(content.getByRole('heading', { name: ALBUMS[0] })).toBeVisible()
  await expect(content.getByRole('list', { name: ALBUMS[0] }).getByRole('listitem')).toHaveCount(
    PHOTOS.length,
  )

  // Every album, in the order the content declares them, with exactly one of them marked.
  const rows = sidebarOf(page).getByRole('button')

  await expect(rows).toHaveCount(ALBUMS.length)

  for (const [index, album] of ALBUMS.entries()) {
    await expect(rows.nth(index)).toHaveText(album)
  }

  await expect(sidebarOf(page).locator('[aria-current="true"]')).toHaveCount(1)
  await expect(sidebarOf(page).locator('[aria-current="true"]')).toHaveText(ALBUMS[0])
})

test('presses the dock button again and focuses the same window, leaving its album alone', async ({
  page,
}) => {
  await openFromDock(page)
  await sidebarOf(page).getByRole('button', { name: ALBUMS[1], exact: true }).click()
  await expect(contentOf(page, ALBUMS[1])).toBeVisible()

  await page.getByRole('region', { name: DOCK }).getByRole('button', { name: GALLERY }).click()

  await expect(frameOf(page)).toHaveCount(1)
  await expect(contentOf(page, ALBUMS[1])).toBeVisible()
})

test('moves the mark as an album is pressed, and names an empty album instead of drawing a grid', async ({
  page,
}) => {
  await openFromDock(page)

  await sidebarOf(page).getByRole('button', { name: ALBUMS[1], exact: true }).click()

  const marked = sidebarOf(page).locator('[aria-current="true"]')

  await expect(marked).toHaveCount(1)
  await expect(marked).toHaveText(ALBUMS[1])
  await expect(contentOf(page, ALBUMS[1]).getByRole('heading', { name: ALBUMS[1] })).toBeVisible()

  // The quiet line names the album, and no grid stands in for the photos it does not have.
  await expect(contentOf(page, ALBUMS[1]).getByText(`Nothing in ${ALBUMS[1]} yet.`)).toBeVisible()
  await expect(contentOf(page, ALBUMS[1]).getByRole('list')).toHaveCount(0)
  await expect(contentOf(page, ALBUMS[1]).getByText(EMPTY_MEMORIES)).toBeVisible()
})

test('opens a photo into a panel that takes the keyboard, and announces it through the live region', async ({
  page,
}) => {
  await page.route(/\/images\/gal\d\.png$/, (route) => route.fulfill({ path: STAND_IN_PHOTO }))
  await openFromDock(page)
  await tileOf(page, PHOTOS[0]).click()

  const panel = panelOf(page, PHOTOS[0])

  await expect(panel).toBeFocused()
  await expect(panel.locator('img')).toHaveAttribute('src', '/images/gal1.png')
  await expect(panel.locator('img')).toHaveAttribute('loading', 'eager')

  // The description is written twice for two audiences: the panel is named by it, and the caption
  // repeats it for the eye only.
  await expect(panel.locator('[aria-hidden="true"]')).toHaveText(PHOTOS[0])
  await expect(announcementOf(page)).toHaveText(`Photo 1 of 4. ${PHOTOS[0]}`)

  // The grid is not on screen beside it: the viewer is what the content area shows.
  await expect(contentOf(page, ALBUMS[0]).getByRole('list')).toHaveCount(0)
})

test('shows the quiet line instead of a photo whose asset never loads, in the tile and in the viewer', async ({
  page,
}) => {
  await page.route(/\/images\/gal\d\.png$/, (route) => route.fulfill({ status: 404 }))
  await openFromDock(page)

  const content = contentOf(page, ALBUMS[0])

  // The tile keeps its place, its name and its own state, and the tiles beside it keep drawing.
  await expect(content.getByRole('listitem')).toHaveCount(PHOTOS.length)
  await expect(tileOf(page, PHOTOS[0])).toContainText(MISSING_PHOTO)
  await expect(tileOf(page, PHOTOS[1])).toContainText(MISSING_PHOTO)
  await expect(tileOf(page, PHOTOS[0])).toHaveAccessibleName(PHOTOS[0])

  await tileOf(page, PHOTOS[0]).click()

  const panel = panelOf(page, PHOTOS[0])

  // No broken frame: the line takes the picture's place, and the description is never lost.
  await expect(panel.getByText(MISSING_PHOTO)).toBeVisible()
  await expect(panel.locator('img')).toHaveCount(0)
  await expect(panel.locator('[aria-hidden="true"]')).toHaveText(PHOTOS[0])
})

test('steps with the arrows and wraps, drawing no previous or next control', async ({ page }) => {
  await openFromDock(page)
  await tileOf(page, PHOTOS[0]).click()

  await page.keyboard.press('ArrowRight')
  await expect(panelOf(page, PHOTOS[1])).toBeFocused()
  await expect(announcementOf(page)).toHaveText(`Photo 2 of 4. ${PHOTOS[1]}`)

  await page.keyboard.press('ArrowLeft')
  await expect(panelOf(page, PHOTOS[0])).toBeVisible()

  // Backwards past the first photo lands on the last, and forwards past the last on the first.
  await page.keyboard.press('ArrowLeft')
  await expect(panelOf(page, PHOTOS[PHOTOS.length - 1])).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await expect(panelOf(page, PHOTOS[0])).toBeVisible()

  // Stepping belongs to the keyboard alone.
  await expect(frameOf(page).getByRole('button', { name: /previous|next/i })).toHaveCount(0)
})

test('closes the viewer on Escape and leaves the window to the second one', async ({ page }) => {
  await openFromDock(page)
  await tileOf(page, PHOTOS[2]).click()

  await page.keyboard.press('Escape')

  await expect(frameOf(page).getByRole('figure')).toHaveCount(0)
  await expect(frameOf(page)).toBeVisible()
  // The keyboard went back to the tile of the photo that was showing.
  await expect(tileOf(page, PHOTOS[2])).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(frameOf(page)).toBeHidden()
})

test('closes the viewer with its Close control and hands the keyboard back to that tile', async ({
  page,
}) => {
  await openFromDock(page)
  await tileOf(page, PHOTOS[1]).click()

  await panelOf(page, PHOTOS[1]).getByRole('button', { name: CLOSE_PHOTO }).click()

  await expect(frameOf(page).getByRole('figure')).toHaveCount(0)
  await expect(tileOf(page, PHOTOS[1])).toBeFocused()
})

test('chooses another album while the viewer is open, and the viewer closes with it', async ({
  page,
}) => {
  await openFromDock(page)
  await tileOf(page, PHOTOS[0]).click()
  await expect(panelOf(page, PHOTOS[0])).toBeVisible()

  await sidebarOf(page).getByRole('button', { name: ALBUMS[2], exact: true }).click()

  await expect(frameOf(page).getByRole('figure')).toHaveCount(0)
  await expect(contentOf(page, ALBUMS[2])).toBeVisible()
  await expect(announcementOf(page)).toHaveText('')
})

test('walks the album rows and then the tiles with Tab, every one carrying the visible ring', async ({
  page,
}) => {
  await openFromDock(page)

  // The walk starts from the top of the page, so the browser's own starting point is reset first.
  await page.evaluate(() => {
    document.body.tabIndex = -1
    document.body.focus()
    document.body.removeAttribute('tabindex')
  })

  const walked: { readonly name: string; readonly outline: string }[] = []

  for (let step = 0; step < 40; step += 1) {
    await page.keyboard.press('Tab')
    walked.push(await focused(page))
  }

  const albums = walked.filter((stop) => ALBUMS.includes(stop.name))
  const photos = walked.filter((stop) => PHOTOS.includes(stop.name))

  // Reading order: every album row, in the order the content declares them, then every tile.
  expect(albums.map((stop) => stop.name)).toEqual(ALBUMS)
  expect(photos.map((stop) => stop.name)).toEqual(PHOTOS)

  for (const stop of [...albums, ...photos]) {
    expect(stop.outline, `${stop.name} carries a ring`).toBe('2px')
  }
})

test('opens from the phone tile and holds its shape at 360px without scrolling sideways', async ({
  page,
}) => {
  await openFromTile(page)

  const rows = sidebarOf(page).getByRole('button')

  // The sidebar is one row of icons across the top, every control at least a touch target.
  const direction = await sidebarOf(page).evaluate(
    (element) => getComputedStyle(element).flexDirection,
  )

  expect(direction).toBe('row')

  for (let index = 0; index < ALBUMS.length; index += 1) {
    // The window arrived from its tile, so the box is measured once the movement has landed.
    await expect
      .poll(async () => (await rows.nth(index).boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(44)
    await expect
      .poll(async () => (await rows.nth(index).boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(44)
  }

  // The grid keeps the width it is given, and nothing in the window scrolls sideways.
  const overflow = await frameOf(page).evaluate((element) => ({
    scroll: element.scrollWidth,
    client: element.clientWidth,
  }))

  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1)

  await expect(contentOf(page, ALBUMS[0]).getByRole('listitem')).toHaveCount(PHOTOS.length)
})
