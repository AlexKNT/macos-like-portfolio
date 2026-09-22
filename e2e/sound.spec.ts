import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { SOUNDS } from '../src/content/sounds'

/*
 * The desk's sound in a real browser. The audio engine is stood in for before the app loads, so
 * what a check reads back is the schedule the desk wrote rather than a sound it cannot hear: the
 * stub resolves each tone it is handed back to the id of the row that describes it, and pushes
 * that onto `window.__soundLog`.
 *
 * Nothing is asked for until the visitor touches the page, each event asks for its own sound, and
 * the choice outlives a reload. Spec 0013, AC-3, AC-4, AC-6, AC-9, AC-10, AC-13.
 */

/**
 * What a scheduled tone looks like, mapped back to the id the desk asked for. No two rows of the
 * table share a wave and both ends of their sweep, so the three together name one sound.
 */
const ROWS_BY_TONE: Record<string, string> = Object.fromEntries(
  Object.values(SOUNDS).map((row) => [`${row.wave}:${row.fromHz}:${row.toHz}`, row.id]),
)

/**
 * The engine the page loads with: it builds the handful of nodes the player asks for, and records
 * each tone by resolving it back to an id. It reports itself running, which is what a browser
 * answers once its own gesture has woken the engine.
 */
function installSoundStub(rows: Record<string, string>): void {
  const log: string[] = []
  const target = window as unknown as Record<string, unknown>

  target.__soundLog = log

  /** One value: the three methods the player calls, none of which this stub has to act on. */
  function value(): Record<string, unknown> {
    return {
      value: 0,
      setValueAtTime: () => undefined,
      linearRampToValueAtTime: () => undefined,
      cancelScheduledValues: () => undefined,
    }
  }

  /** One tone: the shape and the sweep it was given are what name the sound it belongs to. */
  function oscillator(): Record<string, unknown> {
    const tone = { type: 'sine', from: 0, to: 0 }

    return {
      get type() {
        return tone.type
      },
      set type(name: string) {
        tone.type = name
      },
      frequency: {
        value: 0,
        setValueAtTime: (at: number) => {
          tone.from = at
        },
        linearRampToValueAtTime: (at: number) => {
          tone.to = at
        },
        cancelScheduledValues: () => undefined,
      },
      connect: () => undefined,
      start: () => {
        const id = rows[`${tone.type}:${tone.from}:${tone.to}`]

        if (id !== undefined) {
          log.push(id)
        }
      },
      stop: () => undefined,
      onended: null,
    }
  }

  const engine = {
    state: 'running',
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume: () => Promise.resolve(),
    createOscillator: oscillator,
    createGain: () => ({ gain: value(), connect: () => undefined }),
    createBufferSource: () => ({
      buffer: null,
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(8) }),
  }

  const Constructor = function () {
    return engine
  } as unknown as typeof AudioContext

  target.AudioContext = Constructor
  target.webkitAudioContext = Constructor
}

/** Loads the desk with the engine stood in for, and waits for the chrome to render. */
async function start(page: Page): Promise<void> {
  await page.addInitScript(installSoundStub, ROWS_BY_TONE)
  await page.goto('/')

  // The desktop renders after the content check resolves, so nothing is driven before the bar is
  // there: a press into an empty document goes nowhere.
  await expect(page.getByRole('navigation', { name: 'Desktop menu bar' })).toBeVisible()
}

/** Every id the desk has asked for so far. */
async function soundLog(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => (window as unknown as { __soundLog?: string[] }).__soundLog ?? [])
}

/** The dock, which is the way in this desk is driven from. */
function dockOf(page: Page) {
  return page.getByRole('region', { name: 'Dock' })
}

test('asks for nothing until the visitor has touched the page', async ({ page }) => {
  await start(page)

  const dock = dockOf(page)

  await expect(dock).toBeVisible()

  // A pointer arriving is not a gesture to a browser, so the desk is still asleep and this first
  // hover is silent rather than queued up for later.
  await dock.getByRole('button', { name: 'Portfolio' }).hover()

  expect(await soundLog(page)).toEqual([])
})

test('asks for the open sound when a window opens from the dock', async ({ page }) => {
  await start(page)

  await dockOf(page).getByRole('button', { name: 'Portfolio' }).click()
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()

  await expect.poll(() => soundLog(page)).toEqual(['open'])
})

test('asks for the close sound when a window is closed', async ({ page }) => {
  await start(page)

  await dockOf(page).getByRole('button', { name: 'Portfolio' }).click()
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()

  // The frame reports the close when its movement lands, so the sound trails the press by one
  // movement and the check waits for it rather than reading a moment too early.
  await page.getByRole('button', { name: 'Close Work' }).click()

  await expect.poll(() => soundLog(page)).toEqual(['open', 'close'])
})

test('asks for its own sound when the pointer arrives on a dock icon', async ({ page }) => {
  await start(page)

  // A press first, since the audio only opens on a real gesture, and it opens a window whose
  // sound is the one already recorded.
  const dock = dockOf(page)

  await dock.getByRole('button', { name: 'Portfolio' }).click()
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()

  await dock.getByRole('button', { name: 'Articles' }).hover()

  await expect.poll(() => soundLog(page)).toEqual(['open', 'hover'])
})

test('asks for nothing while the desk is silenced, and remembers the choice across a reload', async ({
  page,
}) => {
  await start(page)

  await dockOf(page).getByRole('button', { name: 'Portfolio' }).click()
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible()

  const control = page.getByRole('switch', { name: 'Sound' })

  await control.click()
  await expect(control).toHaveAttribute('aria-checked', 'false')

  const quiet = await soundLog(page)

  // Every way into a window still works, and none of them asks for a sound.
  await dockOf(page).getByRole('button', { name: 'Articles' }).click()
  await expect(page.getByRole('region', { name: 'Articles' })).toBeVisible()

  expect(await soundLog(page)).toEqual(quiet)

  await page.reload()

  await expect(page.getByRole('switch', { name: 'Sound' })).toHaveAttribute('aria-checked', 'false')
  expect(await page.evaluate(() => localStorage.getItem('portfolio.sound'))).toBe('muted')
})

test('carries the same switch on a phone, where the dock is not on screen', async ({ page }) => {
  await start(page)

  await page.setViewportSize({ width: 360, height: 720 })

  const control = page.getByRole('switch', { name: 'Sound' })

  await expect(control).toBeVisible()

  await control.click()
  await expect(control).toHaveAttribute('aria-checked', 'false')
})
