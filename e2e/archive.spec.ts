import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Archive window, driven in a real browser: the way in from the dock and from a phone's tile,
 * the count and the leftovers it holds, a press on one opening above it, the one press that empties
 * it and what is left on screen afterwards, where the keyboard ends up, the window that holds again
 * once it has been closed, and the box the control offers a finger.
 *
 * The words are written out here rather than read from the content layer, because a Playwright spec
 * compiles on its own and cannot resolve the app's import aliases. The two leftovers are the
 * reference build's own screenshots, which is what `src/content/locations.ts` holds under `trash`.
 * Spec 0012, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-11, AC-12.
 */

const ARCHIVE = 'Archive'
const EMPTY_WORD = 'Empty'
const EMPTY_NAME = 'Empty Archive'
const COUNT = '2 items'
const EMPTIED = 'The Archive is empty.'
const FIRST = 'trash1.png'
const SECOND = 'trash2.png'
const ICON = '/images/image.png'
const HOME = 'Home'
const PHONE = { width: 360, height: 740 }

/** The frame the desktop names after the window. */
function frameOf(page: Page): Locator {
  return page.getByRole('region', { name: ARCHIVE })
}

/** The content area inside that frame, which the stage names after the same window. */
function contentOf(page: Page): Locator {
  return frameOf(page).getByRole('group', { name: ARCHIVE })
}

/** The one control the window puts in its title bar. */
function controlOf(page: Page): Locator {
  return frameOf(page).getByRole('button', { name: EMPTY_NAME })
}

/** The stage's one live region, which is the way this window says anything out loud. */
function liveRegionOf(page: Page): Locator {
  return page.locator('[aria-live="polite"]')
}

/** A box on screen, rounded, since a box reports fractional pixels. */
async function boxOf(element: Locator) {
  const box = await element.boundingBox()

  if (box === null) {
    throw new Error('expected a laid out box')
  }

  return { width: Math.round(box.width), height: Math.round(box.height) }
}

/** The ring a control is painting, as the browser paints it rather than as the markup asks. */
function ringOn(control: Locator): Promise<string> {
  return control.evaluate((element) => {
    const style = getComputedStyle(element)

    return `${style.outlineWidth} ${style.outlineStyle}`
  })
}

/** Opens the window from the dock, which is the way in at every width the dock is shown at. */
async function openFromDock(page: Page): Promise<void> {
  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: ARCHIVE, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

/** Brings the phone shell up at 360px and opens the window from its own tile. */
async function openOnPhone(page: Page): Promise<void> {
  await page.setViewportSize(PHONE)
  await page.goto('/')

  const tiles = page.getByRole('region', { name: HOME }).getByRole('list', { name: HOME })

  await expect(tiles).toBeVisible()
  await tiles.getByRole('button', { name: ARCHIVE, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

test('opens from the dock on the leftovers the Trash place holds, counted and drawn', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const content = contentOf(page)

  await expect(content.getByText(COUNT)).toBeVisible()
  await expect(content.getByRole('listitem')).toHaveCount(2)

  // One tile per leftover, in the order the content lists them, each with its own name and the
  // icon its own entry carries rather than one the window chose.
  const tiles = content.getByRole('button')

  await expect(tiles).toHaveCount(2)
  await expect(content.getByRole('button', { name: FIRST, exact: true })).toBeVisible()
  await expect(content.getByRole('button', { name: SECOND, exact: true })).toBeVisible()
  await expect(
    content.getByRole('button', { name: FIRST, exact: true }).locator('img'),
  ).toHaveAttribute('src', ICON)
})

test('opens a leftover above itself, and stays open behind the window that arrives', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  await contentOf(page).getByRole('button', { name: FIRST, exact: true }).click()

  const opened = page.getByRole('region', { name: FIRST })

  await expect(opened).toBeVisible()

  // The image window is the one on top, and the Archive is still behind it rather than replaced.
  const stacking = await Promise.all([
    frameOf(page).evaluate((element) => Number((element as HTMLElement).style.zIndex)),
    opened.evaluate((element) => Number((element as HTMLElement).style.zIndex)),
  ])

  expect(stacking[0]).toBeLessThan(stacking[1])
  await expect(contentOf(page).getByRole('listitem')).toHaveCount(2)
})

test('leaves the leftovers behind in one press, says so once, and has nothing left to do', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const content = contentOf(page)
  const control = controlOf(page)

  await expect(liveRegionOf(page)).toBeEmpty()

  await control.click()

  // The block goes and the line takes its place: no list, no count, and no empty list left in the
  // accessibility tree.
  await expect(content.getByText(EMPTIED)).toBeVisible()
  await expect(content.getByRole('listitem')).toHaveCount(0)
  await expect(content.getByRole('list')).toHaveCount(0)
  await expect(content.getByText(COUNT)).toHaveCount(0)

  // One announcement, in the same words the line shows.
  await expect(liveRegionOf(page)).toHaveText(EMPTIED)

  // The control stays in the title bar with its own word, reports itself as unavailable, and keeps
  // the keyboard: the native `disabled` is what would take it away, so it is the one thing that
  // must not be there. Playwright reads `aria-disabled` as disabled, which is exactly the report
  // the spec asks for, so the enabled state is read off the attribute itself.
  await expect(control).toHaveText(EMPTY_WORD)
  await expect(control).toHaveAttribute('aria-disabled', 'true')
  expect(await control.getAttribute('disabled')).toBeNull()
  await expect(control).toBeFocused()
})

test('empties once and changes nothing on a second press, which keeps the keyboard where it was', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const control = controlOf(page)

  await control.click()
  await expect(contentOf(page).getByText(EMPTIED)).toHaveCount(1)
  await expect(control).toBeFocused()

  /*
   * The second press is dispatched rather than clicked: Playwright refuses to press a control that
   * reports itself as unavailable, which is the report the spec asks the control to make, while a
   * browser dispatches the press and hands it to the window's own guard. That guard is what makes
   * it a no op, not the attribute.
   */
  await control.evaluate((element) => (element as HTMLElement).click())

  // Nothing was emptied twice and the visitor was not moved: their next Tab carries on into the
  // window rather than restarting at the top.
  await expect(contentOf(page).getByText(EMPTIED)).toHaveCount(1)
  await expect(liveRegionOf(page)).toHaveText(EMPTIED)
  await expect(control).toBeFocused()
})

test('reaches the control by keyboard, with the ring, in a box a finger can hit', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const control = controlOf(page)

  // A press on the window's own name brings the frame the keyboard, which is where a visitor lands
  // after clicking into the window. Tab then walks what the title bar holds.
  await frameOf(page).click({ position: { x: 300, y: 18 } })

  const stops: string[] = []

  for (let press = 0; press < 6; press += 1) {
    await page.keyboard.press('Tab')

    const landed = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? '',
    )

    stops.push(landed)

    if (landed === EMPTY_NAME) {
      break
    }
  }

  expect(stops).toContain(EMPTY_NAME)
  await expect(control).toBeFocused()

  // The ring is the app's own, drawn with the outline rather than the browser's default.
  expect(await ringOn(control)).toBe('2px solid')

  // A control a finger can hit: the floor the web guidance sets is 24 by 24.
  const box = await boxOf(control)

  expect(box.width).toBeGreaterThanOrEqual(24)
  expect(box.height).toBeGreaterThanOrEqual(24)
})

test('holds its leftovers again once the window has been closed and opened', async ({ page }) => {
  await page.goto('/')
  await openFromDock(page)

  await controlOf(page).click()
  await expect(contentOf(page).getByText(EMPTIED)).toBeVisible()

  await page.getByRole('button', { name: `Close ${ARCHIVE}` }).click()
  await expect(frameOf(page)).toHaveCount(0)

  await openFromDock(page)

  // Nothing about the gesture was written anywhere, so the content layer hands the same two
  // leftovers back and the control offers to empty them again.
  await expect(contentOf(page).getByRole('listitem')).toHaveCount(2)
  await expect(contentOf(page).getByText(COUNT)).toBeVisible()
  await expect(controlOf(page)).toBeEnabled()
})

test.describe('with motion reduced', () => {
  test.use({ reducedMotion: 'reduce' })

  test('empties with no movement at all, the line arriving at once', async ({ page }) => {
    await page.goto('/')
    await openFromDock(page)

    await controlOf(page).click()

    // The same code path reaches the same state: the duration reads zero, so there is no movement
    // to watch and nothing to wait for.
    await expect(contentOf(page).getByText(EMPTIED)).toBeVisible()

    const fast = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--duration-fast').trim(),
    )

    expect(fast).toBe('0ms')
  })
})

test('fills a phone from its own tile, keeping the control and no sideways scroll', async ({
  page,
}) => {
  await openOnPhone(page)

  const frame = frameOf(page)
  const content = contentOf(page)

  // A window on a phone arrives from its tile, so the box is measured once it has landed.
  await expect.poll(async () => (await boxOf(frame)).width).toBe(PHONE.width)

  await expect(content.getByRole('listitem')).toHaveCount(2)
  await expect(content.getByText(COUNT)).toBeVisible()

  // The control keeps its word and its place in the bar at this width.
  await expect(controlOf(page)).toBeVisible()
  await expect(controlOf(page)).toHaveText(EMPTY_WORD)

  // The leftovers flow inside the window's own width, and nothing in the window or on the page
  // scrolls sideways.
  expect(
    await content.evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBeLessThanOrEqual(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0)
})
