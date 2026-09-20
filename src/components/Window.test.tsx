import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Window } from '#components/Window'

describe('Window', () => {
  it('names the window with its title', () => {
    render(
      <Window title="Projects">
        <p>Project files</p>
      </Window>,
    )

    expect(screen.getByRole('region', { name: 'Projects' })).toBeInTheDocument()
  })

  it('names each light from the window title', () => {
    render(
      <Window title="Projects" onClose={() => {}} onMinimise={() => {}} onZoom={() => {}}>
        <p>Project files</p>
      </Window>,
    )

    expect(screen.getByRole('button', { name: 'Close Projects' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Minimise Projects' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Zoom Projects' })).toBeEnabled()
  })

  it('disables a light that has no handler rather than leaving it dead', () => {
    render(
      <Window title="Projects" onClose={() => {}}>
        <p>Project files</p>
      </Window>,
    )

    expect(screen.getByRole('button', { name: 'Close Projects' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Minimise Projects' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom Projects' })).toBeDisabled()
  })

  it('calls the handler a light was given', async () => {
    const onClose = vi.fn()
    render(
      <Window title="Projects" onClose={onClose}>
        <p>Project files</p>
      </Window>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Close Projects' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('skips a disabled light in the tab order', async () => {
    render(
      <Window title="Projects">
        <button type="button">Open</button>
      </Window>,
    )

    await userEvent.tab()

    expect(document.activeElement).toHaveTextContent('Open')
  })

  it('renders the leading and trailing slots beside the title', () => {
    render(
      <Window title="Projects" leading={<span>Lead</span>} trailing={<span>Trail</span>}>
        <p>Project files</p>
      </Window>,
    )

    const window = screen.getByRole('region', { name: 'Projects' })

    expect(window).toHaveTextContent('Lead')
    expect(window).toHaveTextContent('Trail')
  })
})
