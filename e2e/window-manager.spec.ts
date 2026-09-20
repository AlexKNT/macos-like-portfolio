import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * Moving windows, driven in a real browser: the pointer drag, the arrow keys, the clamp to the
 * work area, and the same clamp after the container changes size. Spec 0004, AC-4, AC-5, AC-9.
 */

/** Opens the Projects window from the dock, which is the way in a visitor uses. */
async function openProjects(page: Page): Promise<Locator> {
  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: 'Portfolio' }).click()

  const projects = page.getByRole('region', { name: 'Projects' })

  await expect(projects).toBeVisible()

  return projects
}

/** The frame's box on screen, rounded, since a box reports fractional pixels. */
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

/** Drags from one point to another with a real pointer, in steps a handler can follow. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
}

/** The middle of an element, which is where a pointer press lands. */
async function centreOf(element: Locator) {
  const box = await boxOf(element)

  return { x: box.x + Math.round(box.width / 2), y: box.y + Math.round(box.height / 2) }
}

/** One measure token as the browser resolves it, so the check follows the token layer. */
async function measure(page: Page, name: string): Promise<number> {
  return page.evaluate(
    (token) =>
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(token)),
    name,
  )
}

test('moves a window by its title bar, and leaves it where it was released', async ({ page }) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const handle = projects.locator('header')
  const before = await boxOf(projects)
  const from = await centreOf(handle)

  await drag(page, from, { x: from.x + 120, y: from.y + 80 })

  const moved = await boxOf(projects)

  expect(moved.x - before.x).toBe(120)
  expect(moved.y - before.y).toBe(80)

  // A second drag from there starts where the first one ended, and no text was selected.
  await drag(page, { x: from.x + 120, y: from.y + 80 }, { x: from.x + 160, y: from.y + 80 })

  const again = await boxOf(projects)

  expect(again.x - moved.x).toBe(40)
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('')
})

test('stops a window at the work area, with the whole window still inside it', async ({ page }) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const area = await boxOf(page.getByRole('region', { name: 'Desktop' }))
  const from = await centreOf(projects.locator('header'))

  await drag(page, from, { x: area.x + area.width + 200, y: area.y + area.height + 200 })

  const parked = await boxOf(projects)

  expect(parked.x + parked.width).toBeLessThanOrEqual(area.x + area.width)
  expect(parked.y + parked.height).toBeLessThanOrEqual(area.y + area.height)
  expect(parked.x).toBeGreaterThanOrEqual(area.x)
  expect(parked.y).toBeGreaterThanOrEqual(area.y)
})

test('steps a window along the arrows once it holds the keyboard', async ({ page }) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const step = await measure(page, '--window-nudge-step')
  const large = await measure(page, '--window-nudge-step-large')

  // A press on the body hands the window the keyboard; only the title bar starts a drag.
  await projects.click({ position: { x: 40, y: 80 } })

  const before = await boxOf(projects)
  const scrolled = await page.evaluate(() => window.scrollY)

  await page.keyboard.press('ArrowRight')

  expect((await boxOf(projects)).x - before.x).toBe(step)

  await page.keyboard.press('Shift+ArrowDown')

  expect((await boxOf(projects)).y - before.y).toBe(large)
  expect(large).toBeGreaterThan(step)
  // The page never scrolls as a side effect of moving a window.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled)
})

test('keeps a window still when the press lands on its body, not on its title bar', async ({
  page,
}) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const before = await boxOf(projects)
  const from = await centreOf(projects)
  const seat = await projects.locator('header').boundingBox()

  await drag(page, from, { x: from.x + 140, y: from.y + 100 })

  expect(await boxOf(projects)).toEqual(before)

  // And the lights in the title bar are controls, not a second drag handle. The pointer is
  // carried away from the light before it is released, so the press never becomes a click.
  const light = await centreOf(projects.getByRole('button', { name: 'Minimise Projects' }))

  await drag(page, light, { x: light.x + 160, y: light.y + 120 })

  await expect(projects).toBeVisible()
  expect(await boxOf(projects)).toEqual(before)
  expect(seat?.height).toBeGreaterThan(0)
})

test('pulls a window back inside the work area when the container shrinks', async ({ page }) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const area = await boxOf(page.getByRole('region', { name: 'Desktop' }))
  const from = await centreOf(projects.locator('header'))

  await drag(page, from, { x: area.x + area.width, y: area.y + area.height })

  await page.setViewportSize({ width: 1100, height: 700 })

  const shrunk = await boxOf(page.getByRole('region', { name: 'Desktop' }))
  const parked = await boxOf(projects)

  expect(shrunk.width).toBeLessThan(area.width)
  expect(parked.x + parked.width).toBeLessThanOrEqual(shrunk.x + shrunk.width)
  expect(parked.y + parked.height).toBeLessThanOrEqual(shrunk.y + shrunk.height)
  expect(parked.x).toBeGreaterThanOrEqual(shrunk.x)
  expect(parked.y).toBeGreaterThanOrEqual(shrunk.y)
})
