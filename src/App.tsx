import { Desktop } from '#components/Desktop'
import { Dock } from '#components/Dock'
import { Navbar } from '#components/Navbar'
import { PhoneBar } from '#components/PhoneBar'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useShellHistory } from '#store/useShellHistory'
import { useWindowManager } from '#store/useWindowManager'

/**
 * The app: the window manager, and inside it the shell that reads it. Splitting the two is what
 * lets the shell ask which layout the page is in, since that answer lives in the manager.
 */
export function App() {
  return (
    <WindowManagerProvider>
      <Shell />
    </WindowManagerProvider>
  )
}

/**
 * The shell: one container that owns the work area and holds the window layer, and the chrome
 * that changes around it.
 *
 * Above the compact breakpoint that chrome is the menu bar and the dock. Below it they are not
 * mounted at all rather than hidden, so a phone carries no dock buttons, no menu bar links, no
 * greeting and no desktop items to reach by accident: the slim bar and the home surface stand in
 * their place, and the container between them is the same box, which is what keeps the measured
 * work area with one owner.
 *
 * It is also where the phone's history entry is kept, because one entry is owed while a window is
 * on screen and the shell is what knows the page is a phone.
 * Spec 0003, AC-1, AC-8, AC-11; spec 0009, AC-1, AC-11, AC-13.
 */
function Shell() {
  const { compact } = useWindowManager()

  useShellHistory()

  return (
    <main className="flex flex-col">
      {compact ? <PhoneBar /> : <Navbar />}
      <Desktop />
      {compact ? null : <Dock />}
    </main>
  )
}
