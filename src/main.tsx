import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

/**
 * Checks the content in development, then renders the desktop.
 * The check sits behind `import.meta.env.DEV` and behind a dynamic import, so the
 * production build drops both the check and the schema code with it. A bad entry
 * fails here, before the desktop appears. Spec 0001, AC-7.
 */
async function start(): Promise<void> {
  if (import.meta.env.DEV) {
    const { assertContentIsValid } = await import('#content/validate')
    assertContentIsValid()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
