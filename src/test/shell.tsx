import type { ReactNode } from 'react'

import { SoundProvider } from '#sound/SoundProvider'
import { WindowManagerProvider } from '#store/WindowManagerProvider'

/**
 * The two providers the shell's own modules read: the window manager, and the desk's sound
 * nested inside it, which is the order `App` mounts them in. A suite that renders a control
 * reading either hook wraps its tree in this rather than naming the pair itself, so the nesting
 * is written once. Spec 0013, AC-3, AC-8.
 */
export function ShellProviders({ children }: { readonly children: ReactNode }) {
  return (
    <WindowManagerProvider>
      <SoundProvider>{children}</SoundProvider>
    </WindowManagerProvider>
  )
}
