import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Skills window, driven in a real browser: the way in from the dock, the six areas it prints,
 * a copy confirmed on its own row, the second copy moving the confirmation, the stack at 360px and
 * the window under reduced motion.
 *
 * The names are written out here rather than read from the content layer, because a Playwright spec
 * compiles on its own and cannot resolve the app's import aliases. The stack below is what
 * `src/content/techStack.ts` holds, area by area, in that order.
 * Spec 0006, AC-1, AC-3, AC-5, AC-8, AC-12.
 */

const STACK: Readonly<Record<string, readonly string[]>> = {
  Frontend: ['React.js', 'Next.js', 'TypeScript'],
  Mobile: ['React Native', 'Expo'],
  Styling: ['Tailwind CSS', 'Sass', 'CSS'],
  Backend: ['Node.js', 'Express', 'NestJS', 'Hono'],
  Database: ['MongoDB', 'PostgreSQL'],
  'Dev Tools': ['Git', 'GitHub', 'Docker'],
}

const AREAS = Object.keys(STACK)

const PROMPT_LINE = 'guest@portfolio:~$ cat skills.txt'
const COPY_HINT = 'Press a name to copy it.'

/** Opens the Skills window from the dock and hands back its frame. */
async function openSkills(page: Page): Promise<Locator> {
  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: 'Skills' }).click()

  const frame = page.getByRole('region', { name: 'Skills' })

  await expect(frame).toBeVisible()

  return frame
}

/** The content area of the window, which is the one group the stage renders. */
function contentOf(frame: Locator): Locator {
  return frame.getByRole('group', { name: 'Skills' })
}

/** The row one area prints, which is the list item holding the heading that names it. */
function rowOf(frame: Locator, area: string): Locator {
  return frame.getByRole('heading', { level: 2, name: area, exact: true }).locator('xpath=..')
}

/**
 * Waits until the reveal has cleared every mask. With motion reduced there is nothing to wait for,
 * and the count is 0 on the first look.
 */
async function revealSettled(frame: Locator): Promise<void> {
  await expect
    .poll(async () =>
      frame
        .locator('[data-line]')
        .evaluateAll(
          (lines) => lines.filter((line) => (line as HTMLElement).style.clipPath !== '').length,
        ),
    )
    .toBe(0)
}

/** The accessible names of every control the window offers, in the order they are printed. */
async function copyLabels(frame: Locator): Promise<readonly (string | null)[]> {
  return contentOf(frame)
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
}

test('opens from the dock and prints the prompt line, the six areas and the hint', async ({
  page,
}) => {
  await page.goto('/')

  const frame = await openSkills(page)
  const content = contentOf(frame)

  await expect(content).toContainText(PROMPT_LINE)
  await expect(content).toContainText(COPY_HINT)

  // Every area is a heading, so the six are navigable without stepping through every name.
  for (const area of AREAS) {
    await expect(content.getByRole('heading', { level: 2, name: area, exact: true })).toBeVisible()
  }

  // The rows in the order the content layer declares them: the category it prints, then the
  // names it holds, one row per area and nothing retyped in the window.
  const printed = await content
    .locator('li:has(h2)')
    .evaluateAll((rows) =>
      rows.map((row) => [
        row.querySelector('h2')?.textContent ?? '',
        ...[...row.querySelectorAll('li')].map((item) => item.textContent ?? ''),
      ]),
    )

  expect(printed).toEqual(AREAS.map((area) => [`✓${area}`, ...(STACK[area] ?? [])]))

  expect(await copyLabels(frame)).toEqual(
    AREAS.flatMap((area) => (STACK[area] ?? []).map((item) => `Copy ${item}`)),
  )
})

test.describe('copying a name', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('confirms the name on its own row, and puts it on the clipboard', async ({ page }) => {
    await page.goto('/')

    const frame = await openSkills(page)
    const content = contentOf(frame)

    await revealSettled(frame)

    await content.getByRole('button', { name: 'Copy React.js' }).click()

    await expect(rowOf(frame, 'Frontend').getByText('Copied React.js.')).toBeVisible()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('React.js')
  })

  test('moves the one confirmation to the row of the second copy', async ({ page }) => {
    await page.goto('/')

    const frame = await openSkills(page)
    const content = contentOf(frame)

    await revealSettled(frame)

    await content.getByRole('button', { name: 'Copy React.js' }).click()
    await expect(rowOf(frame, 'Frontend').getByText('Copied React.js.')).toBeVisible()

    await content.getByRole('button', { name: 'Copy Docker' }).click()

    await expect(rowOf(frame, 'Dev Tools').getByText('Copied Docker.')).toBeVisible()
    await expect(frame.getByText('Copied React.js.')).toHaveCount(0)
  })
})

test.describe('the stack under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('is open at once, with nothing masked and nothing moving', async ({ page }) => {
    await page.goto('/')

    const frame = await openSkills(page)
    const content = contentOf(frame)

    // Every line is open, and the whole stack is readable without waiting for anything.
    await expect
      .poll(() =>
        frame
          .locator('[data-line]')
          .evaluateAll(
            (lines) => lines.filter((line) => (line as HTMLElement).style.clipPath).length,
          ),
      )
      .toBe(0)

    await expect(content.getByRole('button')).toHaveCount(
      AREAS.reduce((count, area) => count + (STACK[area]?.length ?? 0), 0),
    )
    await expect(content).toContainText('Dev Tools')
  })
})

test('keeps the stack inside a 360px window, with the areas stacked and touch sized names', async ({
  page,
}) => {
  await page.goto('/')

  const frame = await openSkills(page)
  await revealSettled(frame)

  await page.setViewportSize({ width: 360, height: 720 })

  const content = contentOf(frame)

  await expect(rowOf(frame, 'Frontend')).toBeVisible()

  // The category takes its own line, with the names under it.
  expect(
    await rowOf(frame, 'Frontend').evaluate((row) => getComputedStyle(row).flexDirection),
  ).toBe('column')

  const heights = await content
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height))

  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)

  // Nothing scrolls sideways, and no name overflows the button it is printed in.
  expect(await content.evaluate((area) => area.scrollWidth - area.clientWidth)).toBe(0)
  expect(await frame.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  expect(
    await content
      .getByRole('button')
      .evaluateAll(
        (buttons) => buttons.filter((button) => button.scrollWidth > button.clientWidth).length,
      ),
  ).toBe(0)
})
