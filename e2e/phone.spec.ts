import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The phone shell, driven in a real browser at 360px: the home surface is the way in, one window
 * fills the screen, Close returns home, and nothing scrolls sideways.
 *
 * The names are written out here rather than read from the content layer, because a Playwright spec
 * compiles on its own and cannot resolve the app's import aliases. A window's frame is named after
 * what it shows, so a bare Projects open is the frame named `Work`.
 * Spec 0009, AC-1 to AC-13.
 */

const PHONE = { width: 360, height: 740 }
const SURFACE = 'Home'
const WORK = 'Work'

/** The tiles of the home surface, which is the list the surface names after itself. */
function tilesOf(page: Page): Locator {
  return page.getByRole('region', { name: SURFACE }).getByRole('list', { name: SURFACE })
}

/** The mark a tile is painting, which says what its window is doing. */
function markOf(page: Page, tile: string): Locator {
  return tilesOf(page)
    .getByRole('button', { name: tile, exact: true })
    .locator('span[aria-hidden="true"]')
}

/** A frame's box on screen, rounded, since a box reports fractional pixels. */
async function boxOf(element: Locator) {
  const box = await element.boundingBox()

  if (box === null) {
    throw new Error('expected a laid out box')
  }

  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
}

/** Brings the phone shell up at 360px, which is the width every check here runs at. */
async function phone(page: Page): Promise<void> {
  await page.setViewportSize(PHONE)
  await page.goto('/')
  await expect(page.getByRole('region', { name: SURFACE })).toBeVisible()
}

/** Opens one window from its tile and hands back its frame. */
async function openFromTile(page: Page, tile: string, frame: string = tile): Promise<Locator> {
  const button = tilesOf(page).getByRole('button', { name: tile, exact: true })

  await expect(button).toBeVisible()
  await button.click()

  const opened = page.getByRole('region', { name: frame })

  await expect(opened).toBeVisible()

  return opened
}

/**
 * Records the box of the frame on the desk on every frame, so a movement is observed as it happens
 * rather than guessed at from its end state. A frame that arrives from its tile is drawn small and
 * away from its own box, so the box is what the movement shows. The watch is started before the
 * press that opens a window, since the frame does not exist until then.
 */
async function watchFrames(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: string[] = []
    const watched = window as unknown as { __frames: string[] }

    watched.__frames = seen

    const tick = () => {
      const frame = document.querySelectorAll('main > section > div > section')[0]

      if (frame !== undefined) {
        const box = frame.getBoundingClientRect()

        seen.push(
          `${Math.round(box.width)}x${Math.round(box.height)}@${Math.round(box.left)},${Math.round(box.top)}`,
        )
      }

      requestAnimationFrame(tick)
    }

    tick()
  })
}

/** What the watch recorded. */
async function framesSeen(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => (window as unknown as { __frames?: string[] }).__frames ?? [])
}

/** A frame's box as the watch writes it, so two samples can be compared. */
function boxFrom(sample: string): string {
  return sample.split('@')[0] ?? ''
}

test('fills the phone with one window, and Close returns to the home surface', async ({ page }) => {
  await phone(page)

  const surface = page.getByRole('region', { name: SURFACE })
  const frame = await openFromTile(page, 'Projects', WORK)

  // The window lands on the work area's own box, so it is never wider or taller than the phone.
  // The box is waited for, since a window arriving from its tile is drawn small on the way in.
  await expect.poll(async () => boxOf(frame)).toEqual(await boxOf(surface))
  expect((await boxOf(frame)).width).toBeLessThanOrEqual(PHONE.width)

  // The keyboard lands inside the window, and the surface it came from is out of reach.
  await expect(frame).toBeFocused()

  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )

  expect(sideways).toBe(0)
  expect(await frame.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)

  await frame.getByRole('button', { name: `Close ${WORK}` }).click()

  await expect(page.getByRole('region', { name: WORK })).toHaveCount(0)
  await expect(surface).toBeVisible()
  // Close hands the keyboard to the surface rather than leaving it on the page body.
  await expect(surface).toBeFocused()
})

test('shows one window at a time, with a parked window kept for its tile', async ({ page }) => {
  await phone(page)

  const skills = await openFromTile(page, 'Skills')

  // Minimise parks it and returns home, where its tile keeps the quieter mark.
  await skills.getByRole('button', { name: 'Minimise Skills' }).click()

  await expect(page.getByRole('region', { name: SURFACE })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Skills' })).toBeHidden()
  await expect(markOf(page, 'Skills')).toHaveCSS('opacity', '0.4')

  // Another window opens, and the parked one is still there when that window closes.
  const gallery = await openFromTile(page, 'Gallery')

  await gallery.getByRole('button', { name: 'Close Gallery' }).click()

  await expect(page.getByRole('region', { name: SURFACE })).toBeVisible()
  await expect(markOf(page, 'Skills')).toHaveCSS('opacity', '0.4')
  await expect(markOf(page, 'Gallery')).toHaveCSS('opacity', '0')

  // Its tile brings it back at the work area's own box, through the one open action.
  const back = await openFromTile(page, 'Skills')

  await expect
    .poll(async () => boxOf(back))
    .toEqual(await boxOf(page.getByRole('region', { name: SURFACE })))
})

test('reaches Resume, offers it Minimise, and offers no Zoom on a phone', async ({ page }) => {
  await phone(page)

  const frame = await openFromTile(page, 'Resume')

  // Resume has a tile and no dock button, so the home surface is what reaches it on a phone.
  await expect(frame.getByRole('button', { name: 'Minimise Resume' })).toBeEnabled()
  // The green light has nothing to fill: the window already holds the work area.
  await expect(frame.getByRole('button', { name: 'Zoom Resume' })).toBeDisabled()
})

test('opens a file over the Finder, and reveals the Finder when the file closes', async ({
  page,
}) => {
  await phone(page)
  await openFromTile(page, 'Projects', WORK)

  // Read a place, then a text file inside it, the way the Finder is walked.
  const finder = page.getByRole('region', { name: WORK })

  await finder
    .getByRole('navigation', { name: 'Favourites' })
    .getByRole('button', { name: 'About me' })
    .click()
  await page
    .getByRole('group', { name: 'About me' })
    .getByRole('button', { name: 'about-me.txt' })
    .click()

  const file = page.getByRole('region', { name: 'about-me.txt' })

  await expect(file).toBeVisible()
  // The Finder is alive underneath rather than closed, and the file covers it.
  await expect(page.getByRole('region', { name: 'About me' })).toBeHidden()

  await file.getByRole('button', { name: 'Close about-me.txt' }).click()

  // The Finder comes back showing the place it was showing, not the one it started on.
  await expect(page.getByRole('region', { name: 'About me' })).toBeVisible()
  await expect(
    page.getByRole('group', { name: 'About me' }).getByRole('heading', { level: 2 }),
  ).toHaveText('About me')
})

test('reads the tiles in the content order, each with the visible focus ring', async ({ page }) => {
  await phone(page)

  const reached: string[] = []

  // The bar's appearance control is the first stop, then the seven tiles in reading order.
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('Tab')
    reached.push(await page.evaluate(() => document.activeElement?.textContent ?? ''))
  }

  expect(reached.slice(1)).toEqual([
    'Projects',
    'Resume',
    'Contact',
    'Skills',
    'Articles',
    'Gallery',
    'Archive',
  ])

  const outline = await page.locator(':focus').evaluate((element) => {
    const style = getComputedStyle(element)

    return { width: style.outlineWidth, style: style.outlineStyle }
  })

  expect(outline.style).not.toBe('none')
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2)
})

test('paints the compact crop of the wallpaper, with no greeting over it', async ({ page }) => {
  await phone(page)

  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toContain(
    'wallpaper-compact',
  )
  // The greeting is not rendered: the surface's own heading is the page's only first level one.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(SURFACE)
})

test('holds one history entry while a window is on screen, and closes it on a back press', async ({
  page,
}) => {
  await phone(page)

  const before = await page.evaluate(() => window.history.length)

  await openFromTile(page, 'Projects', WORK)

  expect(await page.evaluate(() => window.history.length)).toBe(before + 1)
  // The entry carries nothing and leaves the URL as it was, so a copied link is unaffected.
  expect(new URL(page.url()).pathname).toBe('/')

  await page.goBack()

  await expect(page.getByRole('region', { name: WORK })).toHaveCount(0)
  await expect(page.getByRole('region', { name: SURFACE })).toBeVisible()

  // Home owns no entry, so the next press leaves the site as it did before the shell existed.
  await page.goBack()

  await expect.poll(() => page.url()).toBe('about:blank')
})

test('gives its entry back when a window is closed, rather than on the next press', async ({
  page,
}) => {
  await phone(page)

  // Count what the browser reports, so the step the shell takes of its own can be waited for.
  await page.evaluate(() => {
    const held = window as unknown as { __pops: number }

    held.__pops = 0
    window.addEventListener('popstate', () => {
      held.__pops += 1
    })
  })

  const before = await page.evaluate(() => window.history.length)
  const frame = await openFromTile(page, 'Projects', WORK)

  expect(await page.evaluate(() => window.history.length)).toBe(before + 1)

  await frame.getByRole('button', { name: `Close ${WORK}` }).click()

  await expect(page.getByRole('region', { name: SURFACE })).toBeVisible()

  // The entry goes with the window, which the browser reports as one step back taken by the shell.
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __pops: number }).__pops))
    .toBe(1)

  // So one press now leaves the site, which is what a back press did before the phone shell.
  await page.goBack()

  await expect.poll(() => page.url()).toBe('about:blank')
})

test.describe('the movement', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('grows the window out of its tile, and shrinks it back into it', async ({ page }) => {
    await phone(page)
    await watchFrames(page)

    await tilesOf(page).getByRole('button', { name: 'Gallery', exact: true }).click()

    const frame = page.getByRole('region', { name: 'Gallery' })

    await expect(frame).toBeVisible()
    await page.waitForTimeout(260)

    const landed = await boxOf(page.getByRole('region', { name: 'Gallery' }))
    const arriving = await framesSeen(page)
    const widths = arriving.map((sample) => Number.parseInt(sample, 10))

    // It arrived from somewhere else, drawn at the tile's own scale, rather than appearing in place.
    expect(widths.length).toBeGreaterThan(0)
    expect(Math.min(...widths)).toBeLessThan(landed.width * 0.6)
    expect(boxFrom(arriving.at(-1) ?? '')).toBe(`${landed.width}x${landed.height}`)

    await page
      .getByRole('region', { name: 'Gallery' })
      .getByRole('button', { name: 'Close Gallery' })
      .click()
    await page.waitForTimeout(260)

    const leaving = (await framesSeen(page)).slice(-40).map((sample) => Number.parseInt(sample, 10))

    // It left the same way, shrinking away rather than fading where it stood, and then went.
    expect(Math.min(...leaving)).toBeLessThan(landed.width * 0.6)
    await expect(page.getByRole('region', { name: 'Gallery' })).toHaveCount(0)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('puts the window there with no movement and no wait', async ({ page }) => {
    await phone(page)
    await watchFrames(page)

    await tilesOf(page).getByRole('button', { name: 'Gallery', exact: true }).click()

    const frame = page.getByRole('region', { name: 'Gallery' })
    const surface = await boxOf(page.getByRole('region', { name: SURFACE }))

    await expect(frame).toBeVisible()
    expect(await boxOf(frame)).toEqual(surface)

    // Every duration resolves to zero, so the window was simply there from its first frame rather
    // than travelling from its tile.
    await page.waitForTimeout(120)

    const arrivedAt = `${surface.width}x${surface.height}`

    expect((await framesSeen(page)).every((sample) => boxFrom(sample) === arrivedAt)).toBe(true)
  })
})
