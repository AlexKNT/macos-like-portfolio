import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { WINDOW_BODIES } from '#windows/WindowBody'
import type { OpenTarget, WindowId } from '#content/types'

/*
 * The baseline every window body clears before it reaches the desktop, over the registry itself
 * rather than over a list kept here: every entry of `WINDOW_BODIES` is rendered against a bare
 * `window` target for its own window id, so a body that throws, or that renders no stage or no
 * named content area, fails the suite the moment its line lands.
 *
 * The second half is the rule a render cannot see: a body's own modules carry no colour of their
 * own, so every colour it paints resolves to the token layer rather than to a palette value
 * written inside the window. Spec 0006, umbrella AC-1, AC-3.
 */

const WINDOWS_DIR = resolve(process.cwd(), 'src/windows')

/** The window id of every registered body, which is what the registry is keyed by. */
const WINDOW_IDS = Object.keys(WINDOW_BODIES) as readonly WindowId[]

/** One module of the window folder: where it is, and what it says. */
type Module = { readonly path: string; readonly text: string }

/** Every source module under `src/windows`, tests left out, in a stable order. */
function windowModules(): readonly Module[] {
  const found: Module[] = []

  const walk = (directory: string): void => {
    const entries = readdirSync(directory, { withFileTypes: true }).sort((one, other) =>
      one.name.localeCompare(other.name),
    )

    for (const entry of entries) {
      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        walk(path)
        continue
      }

      if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) {
        continue
      }

      found.push({ path, text: readFileSync(path, 'utf8') })
    }
  }

  walk(WINDOWS_DIR)

  return found
}

/** Source text with its comments taken out, so a colour named in prose is not a colour painted. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
}

/** A palette utility: a colour the token layer already has a semantic name for. */
const PALETTE_UTILITY =
  /(?:^|[\s"'`])(?:bg|text|border|ring|outline|divide|from|via|to|fill|stroke|shadow|accent|caret|placeholder|decoration)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/

/** A colour literal, however it is written. */
const HEX_COLOUR = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

describe('the window registry', () => {
  // covers: umbrella AC-1, umbrella AC-3
  it('gives every registered body exactly one stage with a name it can be announced by', () => {
    const failures: string[] = []

    for (const windowId of WINDOW_IDS) {
      const { Body } = WINDOW_BODIES[windowId]
      const target: OpenTarget = { kind: 'window', windowId }
      const view = render(
        <WindowManagerProvider>
          <Body windowId={windowId} windowKey={windowId} target={target} />
        </WindowManagerProvider>,
      )

      const stages = view.container.querySelectorAll('[data-window-stage]')
      const areas = view.container.querySelectorAll('[role="group"][aria-label]')
      const name = areas[0]?.getAttribute('aria-label') ?? ''

      if (stages.length !== 1) {
        failures.push(`${windowId} renders ${stages.length} stages`)
      }

      if (areas.length !== 1) {
        failures.push(`${windowId} renders ${areas.length} named content areas`)
      }

      if (name.trim() === '') {
        failures.push(`${windowId} names its content area with nothing`)
      }

      view.unmount()
    }

    expect(failures, 'bodies that cleared no baseline').toEqual([])
  })

  // covers: umbrella AC-3
  it('keeps every window module on the token layer, with no colour of its own', () => {
    const modules = windowModules()
    const offenders: string[] = []

    // A scan that walked no files would pass silently, so the folder is checked to be real.
    expect(modules.length).toBeGreaterThan(WINDOW_IDS.length)

    for (const { path, text } of modules) {
      const source = withoutComments(text)

      if (HEX_COLOUR.test(source)) {
        offenders.push(`${path} paints a colour literal`)
      }

      if (PALETTE_UTILITY.test(source)) {
        offenders.push(`${path} paints a palette utility`)
      }
    }

    expect(offenders, 'window modules carrying their own colour').toEqual([])
  })
})
