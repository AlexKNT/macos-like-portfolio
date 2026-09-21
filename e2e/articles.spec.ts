import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Articles window, driven in a real browser: the two ways in, the posts in the order their
 * dates give, the row's cover, date and title, the link that leaves the page, a cover the server
 * does not have, the keyboard walk, the reveal on every open, reduced motion, and the window at
 * 360px.
 *
 * The names and the dates are written out here rather than read from the content layer, because a
 * Playwright spec compiles on its own and cannot resolve the app's import aliases. They are what
 * `src/content/articles.ts` and `src/windows/articles/articlesLines.ts` hold.
 * Spec 0011, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10, AC-11.
 */

const ARTICLES = 'Articles'
const DOCK = 'Dock'
const HOME = 'Home'
const HEADING = 'My Developer Blog'
const PHONE = { width: 360, height: 740 }

/** One post as the content layer holds it: its title, the words its date prints as, and its link. */
type Post = {
  readonly title: string
  readonly date: string
  readonly dateTime: string
  readonly alt: string
  readonly cover: string
  readonly href: string
}

/** The three posts in the order the window shows them, which is newest first by their dates. */
const POSTS: readonly Post[] = [
  {
    title: 'TypeScript Explained: What It Is, Why It Matters, and How to Master It',
    date: 'Sep 2, 2025',
    dateTime: '2025-09-02',
    alt: 'Cover image for the article TypeScript Explained',
    cover: '/images/blog1.png',
    href: 'https://jsmastery.com/blog/typescript-explained-what-it-is-why-it-matters-and-how-to-master-it',
  },
  {
    title: 'The Ultimate Guide to Mastering Three.js for 3D Development',
    date: 'Aug 28, 2025',
    dateTime: '2025-08-28',
    alt: 'Cover image for the guide to mastering Three.js',
    cover: '/images/blog2.png',
    href: 'https://jsmastery.com/blog/the-ultimate-guide-to-mastering-three-js-for-3d-development',
  },
  {
    title: 'The Ultimate Guide to Mastering GSAP Animations',
    date: 'Aug 15, 2025',
    dateTime: '2025-08-15',
    alt: 'Cover image for the guide to mastering GSAP animations',
    cover: '/images/blog3.png',
    href: 'https://jsmastery.com/blog/the-ultimate-guide-to-mastering-gsap-animations',
  },
]

const TITLES: readonly string[] = POSTS.map((post) => post.title)

/** The frame the desktop names after the window. */
function frameOf(page: Page): Locator {
  return page.getByRole('region', { name: ARTICLES })
}

/** The content area inside that frame, which the stage names after the window too. */
function contentOf(page: Page): Locator {
  return frameOf(page).getByRole('group', { name: ARTICLES })
}

/** The row of one post, found by the link that names it. */
function rowOf(page: Page, title: string): Locator {
  return contentOf(page)
    .getByRole('link', { name: title, exact: true })
    .locator('xpath=ancestor::li[1]')
}

/** The cover of one row. */
function coverOf(page: Page, alt: string): Locator {
  return frameOf(page).getByRole('img', { name: alt, exact: true })
}

/** Opens the window from the dock, which is the way in at every width the dock is shown at. */
async function openFromDock(page: Page): Promise<void> {
  const dock = page.getByRole('region', { name: DOCK })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: ARTICLES, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

/** Opens the window from the phone's own tile, which is the way in below the breakpoint. */
async function openFromTile(page: Page): Promise<void> {
  await page.setViewportSize(PHONE)
  await page.goto('/')

  const tiles = page.getByRole('region', { name: HOME }).getByRole('list', { name: HOME })

  await expect(tiles).toBeVisible()
  await tiles.getByRole('button', { name: ARTICLES, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

/** The visible words of every row, in the order they are printed. */
async function printedRows(page: Page): Promise<readonly string[]> {
  return contentOf(page)
    .getByRole('listitem')
    .evaluateAll((rows) => rows.map((row) => row.textContent ?? ''))
}

/**
 * Waits until the reveal has cleared every mask. With motion reduced there is nothing to wait for,
 * and the count is 0 on the first look.
 */
async function revealSettled(page: Page): Promise<void> {
  await expect
    .poll(async () =>
      frameOf(page)
        .locator('[data-line]')
        .evaluateAll(
          (lines) => lines.filter((line) => (line as HTMLElement).style.clipPath !== '').length,
        ),
    )
    .toBe(0)
}

test('opens from the dock with the heading and the posts newest first', async ({ page }) => {
  await page.goto('/')
  await openFromDock(page)

  await expect(contentOf(page).getByRole('heading', { name: HEADING })).toBeVisible()

  // Reading order is the order the dates give: a list authored in that order is one check, and the
  // dates printed beside every row are the evidence that the order came from them.
  expect(await printedRows(page)).toEqual(POSTS.map((post) => `${post.date}${post.title}`))
})

test('opens one instance, and a second press on the dock button focuses that one', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const dock = page.getByRole('region', { name: DOCK })

  await dock.getByRole('button', { name: ARTICLES, exact: true }).click()
  await dock.getByRole('button', { name: ARTICLES, exact: true }).click()

  await expect(page.getByRole('region', { name: ARTICLES })).toHaveCount(1)
  await expect(contentOf(page).getByRole('listitem')).toHaveCount(POSTS.length)
})

test('draws each row as the cover, the date and the title, and the title is the link', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  for (const post of POSTS) {
    const cover = coverOf(page, post.alt)
    const link = contentOf(page).getByRole('link', { name: post.title, exact: true })
    const row = rowOf(page, post.title)

    // The cover is a fixed square on every row, whether or not its file ever arrives.
    const box = await cover.boundingBox()

    expect(box?.width).toBeCloseTo(64, 0)
    expect(box?.height).toBeCloseTo(64, 0)

    // The date is the stored day in English words, and it stays the stored day.
    const shown = row.locator('time')

    await expect(shown).toHaveText(post.date)
    await expect(shown).toHaveAttribute('datetime', post.dateTime)

    // The title element is the anchor, so the words read and the words announced are one thing.
    await expect(link).toHaveAttribute('href', post.href)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }

  // One control a row, and the cover is not it.
  await expect(contentOf(page).getByRole('button')).toHaveCount(0)
})

test('opens a post outside the page, and the desktop stays exactly where it was', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  // The post itself is stood in for over the network, so the check proves the new tab without
  // depending on another site being reachable.
  await page.context().route('https://jsmastery.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body>post</body></html>',
    }),
  )

  const before = page.url()
  const [opened] = await Promise.all([
    page.waitForEvent('popup'),
    contentOf(page).getByRole('link', { name: TITLES[0], exact: true }).click(),
  ])

  await opened.waitForLoadState()

  expect(opened.url()).toBe(POSTS[0]?.href)
  expect(page.url()).toBe(before)

  await opened.close()
  await expect(frameOf(page)).toBeVisible()
})

test('keeps the row, the box and the description of a cover the server does not have', async ({
  page,
}) => {
  // A cover is forced to a 404 rather than renamed on disk: renaming makes Vite reload the page
  // and starves the specs running beside this one.
  await page.route('**/images/blog1.png', (route) => route.fulfill({ status: 404 }))
  await page.goto('/')
  await openFromDock(page)

  const post = POSTS[0] as Post

  // The row keeps its place and its count: a missing picture never drops a post.
  await expect(contentOf(page).getByRole('listitem')).toHaveCount(POSTS.length)
  expect((await printedRows(page))[0]).toBe(`${post.date}${post.title}`)

  // The image element stays exactly where it was, carrying its own description, and no state of
  // the window's own replaces it.
  const cover = coverOf(page, post.alt)
  const box = await cover.boundingBox()

  expect(box?.width).toBeCloseTo(64, 0)
  expect(box?.height).toBeCloseTo(64, 0)
  expect(await cover.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(0)
  await expect(contentOf(page)).not.toContainText(/did not load|could not be|cannot be shown/i)

  // The other two covers are untouched, so the check is about one missing file and not the row.
  await expect(coverOf(page, POSTS[1]?.alt ?? '')).toHaveAttribute('src', POSTS[1]?.cover ?? '')
})

test('walks the links in reading order, each with the ring and the touch target height', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)
  await revealSettled(page)

  // The walk starts from the top of the document, the way a keyboard visitor arrives, and collects
  // the three posts as it passes them: what is asserted is that they come in reading order and that
  // each one is a stop of its own, not where the first stop happens to be.
  const walked: { readonly name: string; readonly outline: string }[] = []

  for (let step = 0; step < 40 && walked.length < POSTS.length; step += 1) {
    await page.keyboard.press('Tab')

    const stop = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement

      return {
        name: element.innerText?.trim() ?? '',
        outline: getComputedStyle(element).outlineWidth,
      }
    })

    if (TITLES.includes(stop.name)) {
      walked.push(stop)
    }
  }

  expect(walked.map((stop) => stop.name)).toEqual([...TITLES])

  // Every stop is the desktop's own ring rather than the browser's default or nothing at all.
  for (const stop of walked) {
    expect(Number.parseFloat(stop.outline)).toBeGreaterThan(0)
  }

  // A title short enough for one line is still an easy press: the link's own box is at least the
  // height of a touch target.
  for (const title of TITLES) {
    const box = await contentOf(page).getByRole('link', { name: title, exact: true }).boundingBox()

    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
})

test('uncovers the rows on every open, because the body mounts again with the window', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  await expect(frameOf(page).locator('[data-line]')).toHaveCount(POSTS.length)
  await revealSettled(page)

  // Closed from the light a visitor would press, which leaves the page with no window in it.
  await frameOf(page)
    .getByRole('button', { name: `Close ${ARTICLES}` })
    .click()
  await expect(frameOf(page)).toHaveCount(0)

  // The second open mounts the body again, so the reveal runs again. The mask is watched for from
  // before the press, since it is gone a third of a second later.
  const masked = page.waitForFunction(
    () => document.querySelectorAll('[data-line][style*="inset"]').length > 0,
    undefined,
    { timeout: 10_000 },
  )

  const dock = page.getByRole('region', { name: DOCK })

  await dock.getByRole('button', { name: ARTICLES, exact: true }).click()
  await masked

  await revealSettled(page)
  await expect(contentOf(page).getByRole('listitem')).toHaveCount(POSTS.length)
})

test('is the finished list at once under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await openFromDock(page)

  // No mask is ever drawn, so nothing is withheld and nothing waits.
  await expect(frameOf(page).locator('[data-line]')).toHaveCount(POSTS.length)
  expect(
    await frameOf(page)
      .locator('[data-line]')
      .evaluateAll(
        (lines) => lines.filter((line) => (line as HTMLElement).style.clipPath !== '').length,
      ),
  ).toBe(0)

  expect(await printedRows(page)).toEqual(POSTS.map((post) => `${post.date}${post.title}`))
})

test('opens the same list from the phone tile at 360px, with no sideways scroll', async ({
  page,
}) => {
  await openFromTile(page)

  await expect(contentOf(page).getByRole('listitem')).toHaveCount(POSTS.length)

  // The row keeps its shape: the cover stays beside the words rather than above or below them.
  const cover = await coverOf(page, POSTS[0]?.alt ?? '').boundingBox()
  const link = await contentOf(page)
    .getByRole('link', { name: TITLES[0] ?? '', exact: true })
    .boundingBox()

  expect(cover).not.toBeNull()
  expect(link).not.toBeNull()

  if (cover !== null && link !== null) {
    expect(link.x).toBeGreaterThanOrEqual(cover.x + cover.width)
    expect(link.y).toBeLessThan(cover.y + cover.height)
  }

  // The title takes as many lines as it needs rather than hanging out of the window: the first
  // title is far longer than one line at this width.
  expect(link?.height ?? 0).toBeGreaterThan(44)

  // Nothing scrolls sideways, at the page or inside the frame.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    PHONE.width,
  )
  expect(
    await frameOf(page).evaluate((frame) => frame.scrollWidth - frame.clientWidth),
  ).toBeLessThanOrEqual(0)
})
