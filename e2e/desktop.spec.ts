import { expect, test } from '@playwright/test'

/** The menu bar the desktop shell will build on, checked in a real browser. */
test('shows the menu bar with its links and a live clock', async ({ page }) => {
  await page.goto('/')

  const bar = page.getByRole('navigation', { name: 'Desktop menu bar' })

  await expect(bar).toBeVisible()
  for (const label of ['Projects', 'Contact', 'Resume']) {
    await expect(bar.getByRole('button', { name: label })).toBeVisible()
  }
  await expect(bar.locator('time')).toHaveText(/\d{1,2}:\d{2}/)
})

/** Keyboard reach and a visible focus ring are the baseline every control must meet. */
test('reaches the first menu bar control by keyboard and draws its focus ring', async ({
  page,
}) => {
  await page.goto('/')

  // The desktop renders after the content check resolves, so wait for the bar before
  // driving the keyboard: a tab into an empty document focuses nothing.
  await expect(page.getByRole('navigation', { name: 'Desktop menu bar' })).toBeVisible()
  await page.keyboard.press('Tab')

  const focused = page.locator(':focus')

  await expect(focused).toBeVisible()
  await expect(focused).toHaveText('Projects')

  const outline = await focused.evaluate((element) => {
    const style = getComputedStyle(element)
    return { style: style.outlineStyle, width: style.outlineWidth }
  })

  expect(outline.style).not.toBe('none')
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2)
})

/** One open action for every entry point: a second press focuses rather than opens again. */
test('opens a window from the dock, and focuses it instead of opening a second', async ({
  page,
}) => {
  await page.goto('/')

  const dock = page.getByRole('region', { name: 'Dock' })
  const portfolio = dock.getByRole('button', { name: 'Portfolio' })

  await expect(dock).toBeVisible()
  await portfolio.click()

  // A bare Projects open lands on the work location (spec 0005, AC-2), and a second press on
  // the same button focuses that window rather than adding one.
  const projects = page.getByRole('region', { name: 'Work' })

  await expect(projects).toBeVisible()

  await portfolio.click()
  await expect(page.getByRole('region', { name: 'Work' })).toHaveCount(1)
})

/** The desktop items are the way in at a narrow width, where the dock is not shown. */
test('opens the Projects window from a desktop item', async ({ page }) => {
  await page.goto('/')

  const items = page.getByRole('list', { name: 'Desktop items' })

  await expect(items).toBeVisible()
  await items.getByRole('button', { name: 'Nike Ecommerce Website Application' }).click()
  await expect(
    page.getByRole('region', { name: 'Nike Ecommerce Website Application' }),
  ).toBeVisible()
})

/** The dock magnify is the one movement on the page, so it is measured as painted size. */
test.describe('the dock magnify', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('scales the icon under the pointer, with the neighbours falling away', async ({ page }) => {
    await page.goto('/')

    const dock = page.getByRole('region', { name: 'Dock' })
    const icon = (name: string) => dock.getByRole('button', { name }).locator('img')
    const widthOf = (name: string) =>
      icon(name).evaluate((element) => Math.round(element.getBoundingClientRect().width))

    const resting = await widthOf('Portfolio')
    const neighbourAtRest = await widthOf('Articles')
    const farAtRest = await widthOf('Archive')
    const box = await icon('Portfolio').boundingBox()

    expect(box).not.toBeNull()
    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    )

    await expect.poll(() => widthOf('Portfolio')).toBeGreaterThan(resting * 1.1)
    await expect.poll(() => widthOf('Articles')).toBeGreaterThan(neighbourAtRest)

    // The icon under the pointer is the largest, the two beside it fall away in a straight
    // line, and the ones beyond them keep their own size. Spec 0003, AC-7.
    expect(await widthOf('Portfolio')).toBeGreaterThan(await widthOf('Articles'))
    expect(await widthOf('Archive')).toBe(farAtRest)

    await page.mouse.move(10, 10)
    await expect.poll(() => widthOf('Portfolio')).toBeLessThan(resting * 1.02)
  })
})

/** Reduced motion removes the magnify without taking the dock's actions with it. */
test.describe('the dock under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('leaves the icons at rest and still opens a window', async ({ page }) => {
    await page.goto('/')

    const dock = page.getByRole('region', { name: 'Dock' })
    const portfolio = dock.getByRole('button', { name: 'Portfolio' })
    const icon = portfolio.locator('img')
    const widthOf = () =>
      icon.evaluate((element) => Math.round(element.getBoundingClientRect().width))

    const resting = await widthOf()
    const box = await icon.boundingBox()

    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    )
    await page.waitForTimeout(300)

    expect(await widthOf()).toBe(resting)

    await portfolio.click()
    await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()
  })
})

/** The appearance press is for this session only: it flips the mode and stores nothing. */
test('switches the mode for the session without storing a preference', async ({ page }) => {
  await page.goto('/')

  const appearance = page
    .getByRole('navigation', { name: 'Desktop menu bar' })
    .getByRole('button', { name: 'Switch appearance' })

  await expect(appearance).toBeVisible()

  const mode = await page.evaluate(() => document.documentElement.dataset.theme)

  await appearance.click()

  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe(mode === 'dark' ? 'light' : 'dark')
  expect(await page.evaluate(() => localStorage.getItem('portfolio.appearance'))).toBeNull()
})

/** Keyboard reach through the whole desktop, and the dock's own ring on its glass panel. */
test('reaches the dock by keyboard and opens its window with Enter', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: 'Desktop menu bar' })).toBeVisible()

  const portfolio = page
    .getByRole('region', { name: 'Dock' })
    .getByRole('button', { name: 'Portfolio' })

  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press('Tab')

    if (await portfolio.evaluate((element) => element === document.activeElement)) {
      break
    }
  }

  await expect(portfolio).toBeFocused()

  const outline = await portfolio.evaluate((element) => {
    const style = getComputedStyle(element)

    return { style: style.outlineStyle, width: style.outlineWidth }
  })

  expect(outline.style).not.toBe('none')
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2)

  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()
})

/** Below the compact breakpoint the dock is not shown and nothing scrolls sideways. */
test('keeps the shell usable at 360px wide, with no dock and no sideways scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 720 })
  await page.goto('/')

  await expect(page.getByRole('region', { name: 'Desktop' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Dock' })).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Desktop items' })).toBeVisible()

  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )

  expect(sideways).toBe(0)
})

/**
 * The surface holds its windows: however far a frame is stacked and however far it is stretched,
 * the bar and the dock are still the elements under the pointer. Spec 0003, AC-1.
 */
test('keeps the menu bar and the dock above a window, however that window is stacked', async ({
  page,
}) => {
  await page.goto('/')

  const bar = page.getByRole('navigation', { name: 'Desktop menu bar' })
  const dock = page.getByRole('region', { name: 'Dock' })
  const portfolio = dock.getByRole('button', { name: 'Portfolio' })

  await expect(dock).toBeVisible()
  await portfolio.click()

  const projects = page.getByRole('region', { name: 'Work' })

  await expect(projects).toBeVisible()

  // The strongest attack a window can make: a stacking number far above anything the shell
  // uses, and a box stretched over the whole viewport and pushed up under the menu bar.
  await projects.evaluate((element) => {
    const frame = element as HTMLElement

    frame.style.zIndex = '9999'
    frame.style.top = '-40px'
    frame.style.left = '0px'
    frame.style.width = '100vw'
    frame.style.height = '100vh'
  })

  /** Whether the element is still what the pointer meets at the middle of its own box. */
  function meetsItself(this: void, element: Element): boolean {
    const box = element.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)

    return hit !== null && element.contains(hit)
  }

  const barLink = bar.getByRole('button', { name: 'Projects' })

  expect(await barLink.evaluate(meetsItself)).toBe(true)
  expect(await portfolio.evaluate(meetsItself)).toBe(true)

  // The frame is still the thing on the desk, so the two checks above mean something.
  expect(await projects.evaluate(meetsItself)).toBe(true)
})
