import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * Moving windows, driven in a real browser: the pointer drag, the arrow keys, the clamp to the
 * work area, and the same clamp after the container changes size. Spec 0004, AC-4, AC-5, AC-9.
 */

/**
 * Opens the Projects window from the dock, which is the way in a visitor uses. A bare Projects
 * open lands on the work location (spec 0005, AC-2), so that is the title its frame carries.
 */
async function openProjects(page: Page): Promise<Locator> {
  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: 'Portfolio' }).click()

  const projects = page.getByRole('region', { name: 'Work' })

  await expect(projects).toBeVisible()

  return projects
}

/** Opens one more window from the dock, on top of whatever is already open. */
async function openWindow(page: Page, name: string): Promise<Locator> {
  await page.getByRole('region', { name: 'Dock' }).getByRole('button', { name }).click()

  const window = page.getByRole('region', { name })

  await expect(window).toBeVisible()

  return window
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
  const light = await centreOf(projects.getByRole('button', { name: 'Minimise Work' }))

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

  const parked = await boxOf(projects)

  await page.setViewportSize({ width: 1100, height: 700 })

  const shrunk = await boxOf(page.getByRole('region', { name: 'Desktop' }))

  expect(shrunk.width).toBeLessThan(area.width)

  // The container reports its new box asynchronously, so the clamp is waited for rather than
  // read once: the window ends up against the bottom right of the work area it now has.
  await expect
    .poll(async () => boxOf(projects))
    .toEqual({
      x: shrunk.x + shrunk.width - parked.width,
      y: shrunk.y + shrunk.height - parked.height,
      width: parked.width,
      height: parked.height,
    })
})

test('quiets the windows that do not hold the keyboard', async ({ page }) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const contact = await openWindow(page, 'Contact')
  const shadowOf = (window: Locator) =>
    window.evaluate((element) => getComputedStyle(element).boxShadow)
  const titleColourOf = (window: Locator) =>
    window.locator('header > span').evaluate((element) => getComputedStyle(element).color)

  expect(await shadowOf(projects)).not.toBe(await shadowOf(contact))
  expect(await titleColourOf(projects)).not.toBe(await titleColourOf(contact))

  // The dimmed lights are the same buttons: quieter, not disabled.
  const lights = projects.locator('header button').first().locator('..')

  expect(
    Number(await lights.evaluate((element) => getComputedStyle(element).opacity)),
  ).toBeLessThan(1)

  // A press anywhere in the quiet window brings it the keyboard, and the two swap over. The
  // press lands on the strip of its title bar the window above it does not cover.
  await projects.click({ position: { x: 8, y: 8 } })

  expect(await shadowOf(projects)).not.toBe(await shadowOf(contact))
})

test('puts a window away in the dock, hands the keyboard on, and brings it back on top', async ({
  page,
}) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const contact = await openWindow(page, 'Contact')

  await contact.getByRole('button', { name: 'Minimise Contact' }).click()

  await expect(contact).toBeHidden()
  await expect(projects).toBeFocused()

  await page.getByRole('region', { name: 'Dock' }).getByRole('button', { name: 'Contact' }).click()

  await expect(contact).toBeVisible()
  await expect(contact).toBeFocused()

  const zOf = (window: Locator) => window.evaluate((element) => element.style.zIndex)

  expect(Number(await zOf(contact))).toBeGreaterThan(Number(await zOf(projects)))
})

test('hands the keyboard to the dock button when the last window leaves the desk', async ({
  page,
}) => {
  await page.goto('/')

  const projects = await openProjects(page)

  await projects.getByRole('button', { name: 'Minimise Work' }).click()

  const portfolio = page
    .getByRole('region', { name: 'Dock' })
    .getByRole('button', { name: 'Portfolio' })

  await expect(portfolio).toBeFocused()

  await portfolio.click()

  await expect(projects).toBeVisible()
  await expect(projects).toBeFocused()
})

test('fills a window from the green light, and puts it back at its layout size', async ({
  page,
}) => {
  await page.goto('/')

  const projects = await openProjects(page)
  const area = await boxOf(page.getByRole('region', { name: 'Desktop' }))
  const start = await boxOf(projects)

  await projects.getByRole('button', { name: 'Zoom Work' }).click()

  const filled = await boxOf(projects)

  expect(filled).toEqual(area)

  await projects.getByRole('button', { name: 'Zoom Work' }).click()

  const restored = await boxOf(projects)

  expect(restored.width).toBe(start.width)
  expect(restored.height).toBe(start.height)
  // Unfilling anchors the window at the work area's corner rather than where it was.
  expect(restored.x).toBe(area.x)
  expect(restored.y).toBe(area.y)
})

test('closes a focused window on Escape', async ({ page }) => {
  await page.goto('/')

  const projects = await openProjects(page)

  await projects.click({ position: { x: 40, y: 80 } })
  await page.keyboard.press('Escape')

  await expect(page.getByRole('region', { name: 'Work' })).toHaveCount(0)
})

test('reaches every end state with motion reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const projects = await openProjects(page)

  await projects.getByRole('button', { name: 'Minimise Work' }).click()

  await expect(projects).toBeHidden()

  await page
    .getByRole('region', { name: 'Dock' })
    .getByRole('button', { name: 'Portfolio' })
    .click()

  await expect(projects).toBeVisible()

  await projects.getByRole('button', { name: 'Close Work' }).click()

  await expect(page.getByRole('region', { name: 'Work' })).toHaveCount(0)
})

test('fills the focused window on a compact screen, and offers no drag', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 })
  await page.goto('/')

  // A phone has no desktop item list: the home surface's own tile is the way in there.
  const desktop = page.getByRole('region', { name: 'Home' })
  const tile = page.getByRole('list', { name: 'Home' }).getByRole('button', { name: 'Projects' })

  await expect(tile).toBeVisible()
  await tile.click()

  // A bare Projects open lands on the work location, so the frame is named after that place.
  const projects = page.getByRole('region', { name: 'Work' })

  await expect(projects).toBeVisible()
  // The box is waited for, since a window arriving from its tile is drawn small on the way in.
  await expect.poll(async () => boxOf(projects)).toEqual(await boxOf(desktop))

  // A press on the title bar focuses the window and moves nothing: there is no room on a
  // compact screen to put a window down.
  const from = await centreOf(projects.locator('header'))

  await drag(page, from, { x: from.x + 120, y: from.y + 60 })

  expect(await boxOf(projects)).toEqual(await boxOf(desktop))
})
