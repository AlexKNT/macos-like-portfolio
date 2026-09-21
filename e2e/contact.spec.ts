import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/*
 * The Contact window, driven in a real browser: the two ways in, the address as the one mail link
 * and what it carries, the Copy control and its confirmation, the keyboard walk, the four tiles and
 * the window at 360px.
 *
 * The address is never pressed here. A press hands the message to the operating system's mail
 * handler, which a test cannot read and should not start, so the durable evidence is the href the
 * anchor carries: the address, then the subject and the body, each percent encoded.
 *
 * The values are written out rather than read from the content layer, because a Playwright spec
 * compiles on its own and cannot resolve the app's import aliases. They are what `src/content/profile.ts`
 * and `src/windows/contact/contactLines.ts` hold.
 * Spec 0008, AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-8, AC-11.
 */

const CONTACT = 'Contact'
const ADDRESS = 'adrian@example.com'
const HEADING = "Let's work together"
const INVITATION = 'Press the address to open a message, or take it with Copy.'
const SUBJECT = 'Hello from your portfolio'
const BODY = 'Hi, I found your portfolio and wanted to reach out.'
const COPY = 'Copy'
const COPY_NAME = `Copy ${ADDRESS}`
const COPIED = `Copied ${ADDRESS}.`

/** The four socials in the order the content layer declares them, with the colours their tiles carry. */
const SOCIALS: readonly { readonly label: string; readonly colour: string }[] = [
  { label: 'GitHub', colour: 'rgb(244, 101, 107)' },
  { label: 'Website', colour: 'rgb(75, 203, 99)' },
  { label: 'Twitter/X', colour: 'rgb(255, 134, 107)' },
  { label: 'LinkedIn', colour: 'rgb(5, 182, 246)' },
]

/** The one href the address carries: the address itself, then the two words, each encoded. */
const MAIL_HREF = `mailto:${ADDRESS}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`

/** The placeholder line this feature retires, which the window must no longer show. */
const RETIRED_PLACEHOLDER = 'How to reach you: the address, a copy button and every social link.'

/** The frame the desktop names after the window. */
function frameOf(page: Page): Locator {
  return page.getByRole('region', { name: CONTACT })
}

/** The content area inside that frame, which the stage names after the same window. */
function contentOf(page: Page): Locator {
  return frameOf(page).getByRole('group', { name: CONTACT })
}

/** Opens the window from the dock, which is the way in at every width the dock is shown at. */
async function openFromDock(page: Page): Promise<void> {
  const dock = page.getByRole('region', { name: 'Dock' })

  await expect(dock).toBeVisible()
  await dock.getByRole('button', { name: CONTACT }).click()
  await expect(frameOf(page)).toBeVisible()
}

/** Opens the window from the menu bar link, which is the way in once the dock is hidden. */
async function openFromBar(page: Page): Promise<void> {
  const bar = page.getByRole('navigation', { name: 'Desktop menu bar' })

  await expect(bar).toBeVisible()
  await bar.getByRole('button', { name: CONTACT, exact: true }).click()
  await expect(frameOf(page)).toBeVisible()
}

test('opens from the dock and sets the heading, the invitation, the address and the four tiles', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const content = contentOf(page)

  await expect(content.getByRole('heading', { name: HEADING })).toBeVisible()
  await expect(content.getByText(INVITATION)).toBeVisible()

  // The body of its own replaces the stand in that was registered before it.
  await expect(content.getByText(RETIRED_PLACEHOLDER)).toHaveCount(0)

  // The address first, then one link per social, in the order the content layer declares them and
  // with nothing retyped in the window.
  const printed = await content
    .getByRole('link')
    .evaluateAll((links) => links.map((link) => link.textContent?.trim() ?? ''))

  expect(printed).toEqual([ADDRESS, ...SOCIALS.map((social) => social.label)])
})

test('opens from the menu bar link, and a second press focuses rather than opening another', async ({
  page,
}) => {
  await page.goto('/')
  await openFromBar(page)

  const bar = page.getByRole('navigation', { name: 'Desktop menu bar' })

  await bar.getByRole('button', { name: CONTACT, exact: true }).click()
  await expect(frameOf(page)).toHaveCount(1)
})

test('makes the address the only mail link, carrying the two words percent encoded', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const content = contentOf(page)
  const address = content.getByRole('link', { name: ADDRESS })

  await expect(address).toHaveAttribute('href', MAIL_HREF)

  // Nothing else in the window starts a message, so the visitor is offered one way to write.
  const mailLinks = await content
    .getByRole('link')
    .evaluateAll(
      (links) =>
        links.filter((link) => (link.getAttribute('href') ?? '').startsWith('mailto:')).length,
    )

  expect(mailLinks).toBe(1)

  // The encoding is in the href itself rather than applied by the browser, so the query cannot be
  // ended early and no second header can be smuggled into the message.
  const href = (await address.getAttribute('href')) ?? ''

  expect(href).toContain(`subject=${encodeURIComponent(SUBJECT)}`)
  expect(href).toContain(`body=${encodeURIComponent(BODY)}`)
  expect(href).not.toContain('&subject=')
  // The address itself is carried as it is, so a mail client that decodes the query finds it.
  expect(href.startsWith(`mailto:${ADDRESS}?`)).toBe(true)
})

test.describe('the Copy control', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('takes the address exactly and confirms it on its own row, announced once', async ({
    page,
  }) => {
    await page.goto('/')
    await openFromDock(page)

    const content = contentOf(page)

    await content.getByRole('button', { name: COPY_NAME }).click()

    // The confirmation lands in the address row, which is the block holding the address link.
    await expect(content.getByText(COPIED)).toBeVisible()
    await expect(content.getByRole('button', { name: COPY_NAME })).toHaveText(COPY)

    // The address and nothing else: no name, no prefix and no punctuation travel with it.
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ADDRESS)

    // The window's one live region says the same words, so a screen reader hears exactly once what
    // a sighted visitor reads.
    await expect(page.locator('[aria-live="polite"]')).toHaveText(COPIED)
  })

  test('changes nothing at all when the same address is pressed a second time', async ({
    page,
  }) => {
    await page.goto('/')
    await openFromDock(page)

    const content = contentOf(page)
    const control = content.getByRole('button', { name: COPY_NAME })

    await control.click()
    await expect(content.getByText(COPIED)).toBeVisible()

    await control.click()

    // One confirmation, still the same one, and the live region is not told the same word twice.
    await expect(content.getByText(COPIED)).toHaveCount(1)
    await expect(page.locator('[aria-live="polite"]')).toHaveText(COPIED)
  })
})

test('reaches the address, the Copy control and the four tiles in reading order, each with the ring', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  const content = contentOf(page)

  // The content area takes the keyboard when a body asks for it, so this is where a visitor who
  // pressed the dock button and then tabbed into the window arrives.
  await content.focus()

  await page.keyboard.press('Tab')
  await expect(content.getByRole('link', { name: ADDRESS })).toBeFocused()
  expect(await ringOn(content.getByRole('link', { name: ADDRESS }))).toBe('2px solid')

  await page.keyboard.press('Tab')
  await expect(content.getByRole('button', { name: COPY_NAME })).toBeFocused()
  expect(await ringOn(content.getByRole('button', { name: COPY_NAME }))).toBe('2px solid')

  for (const social of SOCIALS) {
    await page.keyboard.press('Tab')

    const tile = content.getByRole('link', { name: social.label })

    await expect(tile).toBeFocused()
    // The ring is drawn outside the tile, on the window body, so it reads on a brand colour too.
    expect(await ringOn(tile), social.label).toBe('2px solid')
  }
})

test('keeps the tile ink and the brand surface fixed while the mode swaps', async ({ browser }) => {
  const light = await browser.newContext({ colorScheme: 'light' })
  const lightPage = await light.newPage()

  await lightPage.goto('/')
  await openFromDock(lightPage)

  const tileOf = (page: Page, label: string): Locator =>
    contentOf(page).getByRole('link', { name: label })

  const labelInk = (page: Page, label: string): Promise<string> =>
    contentOf(page)
      .getByText(label, { exact: true })
      .evaluate((element) => getComputedStyle(element).color)

  const surface = (page: Page, label: string): Promise<string> =>
    tileOf(page, label).evaluate((element) => getComputedStyle(element).backgroundColor)

  const githubLight = await surface(lightPage, 'GitHub')
  const inkLight = await labelInk(lightPage, 'GitHub')

  // The ink is the fixed brand ink, not the text token: it is the same in both modes, because the
  // brand colour under it does not follow the mode either.
  expect(inkLight).toBe('rgb(31, 41, 55)')
  expect(githubLight).toBe(SOCIALS[0].colour)

  await light.close()

  const dark = await browser.newContext({ colorScheme: 'dark' })
  const darkPage = await dark.newPage()

  await darkPage.goto('/')
  await openFromDock(darkPage)

  expect(await darkPage.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  expect(await labelInk(darkPage, 'GitHub')).toBe('rgb(31, 41, 55)')
  expect(await surface(darkPage, 'GitHub')).toBe(githubLight)

  await dark.close()
})

test('keeps the window inside 360px, with the Copy control on its own line and every tile touch sized', async ({
  page,
}) => {
  await page.goto('/')
  await openFromDock(page)

  /*
   * The window is opened first and the frame narrowed after it, so what this asserts is what a
   * window does when the width it has shrinks rather than how it is opened at that width.
   */
  await page.setViewportSize({ width: 360, height: 720 })

  const frame = frameOf(page)
  const content = contentOf(page)
  const addressLink = content.getByRole('link', { name: ADDRESS })

  await expect(addressLink).toBeVisible()
  await expect.poll(async () => (await frame.boundingBox())?.width ?? 0).toBeLessThanOrEqual(360)

  const address = await addressLink.boundingBox()
  const copy = await content.getByRole('button', { name: COPY_NAME }).boundingBox()

  // One column: the Copy control takes a line of its own under the address rather than being
  // clipped beside it, which is what the narrow width has room for.
  expect(copy?.y ?? 0).toBeGreaterThanOrEqual((address?.y ?? 0) + (address?.height ?? 0) - 2)

  const tiles = await Promise.all(SOCIALS.map(async (social) => tileBox(content, social.label)))

  // Still one column, every tile at least a touch target tall, and the tiles line up.
  for (const tile of tiles) {
    expect(tile?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(Math.abs((tile?.x ?? 0) - (tiles[0]?.x ?? 0))).toBeLessThan(1)
  }

  expect(tiles[1]?.y ?? 0).toBeGreaterThan(tiles[0]?.y ?? 0)

  // Nothing scrolls sideways, in the frame or in the content area.
  expect(await frame.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  expect(await content.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
})

/** One tile's box, found by the label that names it. */
function tileBox(content: Locator, label: string) {
  return content.getByRole('link', { name: label }).boundingBox()
}

/** The ring a control draws once the keyboard is on it, which is the half a unit test cannot judge. */
async function ringOn(control: Locator): Promise<string> {
  return control.evaluate((element) => {
    const style = getComputedStyle(element)

    return `${style.outlineWidth} ${style.outlineStyle}`
  })
}
