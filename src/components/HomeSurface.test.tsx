import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { HomeSurface } from '#components/HomeSurface'
import { WindowLayer } from '#components/WindowLayer'
import { HOME_APPS } from '#content/shell'
import { WindowManagerProvider } from '#store/WindowManagerProvider'
import { useWindowManager } from '#store/useWindowManager'
import { phoneLayout, restoreLayout } from '../test/layout'
import type { WindowInstance } from '#store/windowManager'

/**
 * The phone's home surface: one heading, one named list, the seven tiles in the content's own order,
 * and the manager's one open action behind a press. Spec 0009, AC-1, AC-2, AC-3, AC-5, AC-6.
 */

/** Records what the manager holds after every change, which is how a press is checked. */
function Probe({ into }: { readonly into: (readonly WindowInstance[])[] }) {
  const { instances } = useWindowManager()

  useEffect(() => {
    into.push(instances)
  }, [instances, into])

  return null
}

/** Puts the focused window away, which is what the yellow light does on a phone. */
function ParkButton() {
  const { focusedKey, minimise } = useWindowManager()

  if (focusedKey === null) {
    return null
  }

  return (
    <button type="button" onClick={() => minimise(focusedKey)}>
      Park
    </button>
  )
}

/** The surface, the window layer and the probe, all inside the manager a phone would give them. */
function setup() {
  const history: (readonly WindowInstance[])[] = []

  render(
    <WindowManagerProvider>
      <HomeSurface />
      <WindowLayer />
      <ParkButton />
      <Probe into={history} />
    </WindowManagerProvider>,
  )

  return {
    surface: screen.getByRole('heading', { level: 1 }).parentElement as HTMLElement,
    list: screen.getByRole('list', { name: 'Home' }),
    latest: () => history.at(-1) ?? [],
    history,
  }
}

beforeEach(() => {
  phoneLayout()
})

afterEach(() => {
  restoreLayout()
})

describe('the phone home surface', () => {
  // covers: AC-1, AC-2
  it('shows one heading over one named list of the seven windows, in the content own order', () => {
    const { list } = setup()

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
    expect(list).toHaveAccessibleName('Home')

    const tiles = within(list).getAllByRole('button')

    expect(tiles.map((tile) => tile.textContent)).toEqual(HOME_APPS.map((app) => app.name))
  })

  // covers: AC-3
  it('opens the window a tile names, through the one open action, recorded as coming from home', async () => {
    const user = userEvent.setup()
    const { list, latest } = setup()

    await user.click(within(list).getByRole('button', { name: 'Projects' }))

    expect(latest()).toHaveLength(1)
    expect(latest()[0]).toMatchObject({ windowId: 'projects', opener: { kind: 'home' } })
  })

  // covers: AC-3, AC-5
  it('focuses the window that is already open rather than opening a second', async () => {
    const user = userEvent.setup()
    const { list, latest } = setup()

    await user.click(within(list).getByRole('button', { name: 'Projects' }))
    await user.click(within(list).getByRole('button', { name: 'Projects' }))

    expect(latest()).toHaveLength(1)
  })

  // covers: AC-3, AC-4
  it('takes the surface out of sight and out of reach while a window is on screen', async () => {
    const user = userEvent.setup()
    const { surface, list } = setup()

    expect(surface.className).not.toContain('invisible')

    await user.click(within(list).getByRole('button', { name: 'Projects' }))

    // Hidden rather than removed: a window grows from and shrinks back into a tile, so the tiles
    // keep their boxes while they are out of the tab order and out of the accessibility tree.
    expect(surface.className).toContain('invisible')
    expect(screen.queryByRole('list', { name: 'Home' })).toBeInTheDocument()
  })

  // covers: AC-5, AC-6
  it('marks a parked window quieter, and brings it back through the same open action', async () => {
    const user = userEvent.setup()
    const { list, latest } = setup()

    await user.click(within(list).getByRole('button', { name: 'Skills' }))
    await user.click(screen.getByRole('button', { name: 'Park' }))

    expect(latest()[0]?.status).toBe('minimised')

    await user.click(within(list).getByRole('button', { name: 'Skills' }))

    expect(latest()).toHaveLength(1)
    expect(latest()[0]?.status).toBe('normal')
  })
})
