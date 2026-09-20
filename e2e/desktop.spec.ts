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
