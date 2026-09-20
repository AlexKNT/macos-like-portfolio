import { Desktop } from '#components/Desktop'
import { Dock } from '#components/Dock'
import { Navbar } from '#components/Navbar'
import { WindowManagerProvider } from '#store/WindowManagerProvider'

/**
 * The desktop, top to bottom: the menu bar, the desktop surface, and the dock band. Every
 * open window lives inside the desktop surface, which isolates its own stacking, so neither
 * the bar nor the dock can be painted over however many windows are open. The window manager
 * wraps all three, so the bar, the desktop icons and the dock all call one set of actions.
 * Spec 0003, AC-1, AC-8, AC-11.
 */
export function App() {
  return (
    <WindowManagerProvider>
      <main className="flex flex-col">
        <Navbar />
        <Desktop />
        <Dock />
      </main>
    </WindowManagerProvider>
  )
}
