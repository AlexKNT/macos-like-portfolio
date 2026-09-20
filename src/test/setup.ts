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
