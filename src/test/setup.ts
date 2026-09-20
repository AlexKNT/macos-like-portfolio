import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/*
 * Runs before every test file. `@testing-library/jest-dom` adds the DOM matchers,
 * and the cleanup keeps one test's rendered components out of the next one's DOM.
 */
afterEach(() => {
  cleanup()
})

/*
 * jsdom has no `ResizeObserver`, and the desktop's work area watcher (spec 0004) needs one to
 * exist before it can observe anything. `??=` keeps a real implementation wherever the
 * environment provides one, and this stand in observes nothing: a test that needs a
 * measurement puts its own observer in place.
 */
class SilentResizeObserver implements ResizeObserver {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

globalThis.ResizeObserver ??= SilentResizeObserver
