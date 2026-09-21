import { expect, test } from '@playwright/test'

import { WALLPAPER } from '../src/content/theme'

/*
 * The design system, checked in a real browser: the mode resolved before the first
 * paint, the wallpapers it paints, the two layer focus ring, the glass following the
 * mode, and the compact fallback. Spec 0002.
 */

/** The value of one custom property on the document element. */
async function readRootToken(page: import('@playwright/test').Page, name: string): Promise<string> {
  return page.evaluate(
    (token) => getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    name,
  )
}

test('always writes a mode before the first paint, and follows the system setting', async ({
  browser,
}) => {
  const darkSystem = await browser.newContext({ colorScheme: 'dark' })
  const darkPage = await darkSystem.newPage()
  await darkPage.goto('/')

  expect(await darkPage.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  await darkSystem.close()

  const lightSystem = await browser.newContext({ colorScheme: 'light' })
  const lightPage = await lightSystem.newPage()
  await lightPage.goto('/')

  expect(await lightPage.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
  await lightSystem.close()
})

test('lets a stored preference win over the system setting', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' })
  const page = await context.newPage()

  await page.addInitScript(() => window.localStorage.setItem('portfolio.appearance', 'light'))
  await page.goto('/')

  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
  await context.close()
})

test('paints the wallpaper the resolved mode names', async ({ browser }) => {
  for (const [mode, expected] of [
    ['dark', WALLPAPER.dark.imageUrl],
    ['light', WALLPAPER.light.imageUrl],
  ] as const) {
    const context = await browser.newContext({ colorScheme: mode })
    const page = await context.newPage()
    await page.goto('/')

    expect(await readRootToken(page, '--wallpaper-image')).toContain(expected)
    expect(await readRootToken(page, '--wallpaper-image-compact')).toContain(
      WALLPAPER.compact.imageUrl,
    )
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toContain(
      expected,
    )

    await context.close()
  }
})

test('serves every wallpaper the content layer names', async ({ page, request }) => {
  await page.goto('/')

  for (const { imageUrl } of Object.values(WALLPAPER)) {
    const response = await request.get(imageUrl)

    expect(response.status(), imageUrl).toBe(200)
    expect(response.headers()['content-type'], imageUrl).toContain('image/')
  }
})

test('follows the mode on the menu bar rather than a palette class', async ({ browser }) => {
  const lightContext = await browser.newContext({ colorScheme: 'light' })
  const lightPage = await lightContext.newPage()
  await lightPage.goto('/')
  const lightBar = await lightPage
    .getByRole('navigation', { name: 'Desktop menu bar' })
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  await lightContext.close()

  const darkContext = await browser.newContext({ colorScheme: 'dark' })
  const darkPage = await darkContext.newPage()
  await darkPage.goto('/')
  const darkBar = await darkPage
    .getByRole('navigation', { name: 'Desktop menu bar' })
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  await darkContext.close()

  expect(lightBar).not.toBe(darkBar)
  expect(lightBar).toContain('255, 255, 255')
})

test('draws the two layer focus ring on the first menu bar control', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: 'Desktop menu bar' })).toBeVisible()
  await page.keyboard.press('Tab')

  const ring = await page.locator(':focus').evaluate((element) => {
    const style = getComputedStyle(element)
    return { outline: style.outlineWidth, offset: style.outlineOffset, shadow: style.boxShadow }
  })

  expect(ring.outline).toBe('2px')
  expect(ring.offset).toBe('2px')
  expect(ring.shadow).toContain('2px')
  expect(ring.shadow).not.toBe('none')
})

test('reads a duration and an easing for a timeline, and zero under reduced motion', async ({
  page,
}) => {
  await page.goto('/')

  const moving = await page.evaluate(async () => {
    const motion = await import('/src/lib/motion.ts')
    return { base: motion.readMotionToken('base'), ease: motion.readEaseToken('out') }
  })

  expect(moving.base).toBeGreaterThan(0)
  expect(moving.ease).toContain('cubic-bezier')

  await page.emulateMedia({ reducedMotion: 'reduce' })

  const still = await page.evaluate(async () => {
    const motion = await import('/src/lib/motion.ts')
    return { base: motion.readMotionToken('base'), ease: motion.readEaseToken('out') }
  })

  expect(still.base).toBe(0)
  expect(still.ease).toContain('cubic-bezier')
})

test('falls back to a solid bar and keeps its width at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/')

  // Below the breakpoint the shell paints the phone's slim bar, which wears the same translucent
  // chrome as the menu bar: the stylesheet turns that into a solid surface there, because blur is
  // the expensive part on a phone. Spec 0002, AC-11; spec 0009, AC-1.
  const appearance = page.getByRole('button', { name: 'Switch appearance' })
  const bar = appearance.locator('xpath=../..')
  const surface = await readRootToken(page, '--color-surface')

  expect(await bar.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  )
  expect(surface).toBe('#ffffff')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
