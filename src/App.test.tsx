import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// No Supabase settings are present in tests, so the app runs in demo mode.

describe('App (demo mode)', () => {
  beforeEach(() => {
    // Keep tests offline: the weather services are never really called.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    )
    return () => vi.unstubAllGlobals()
  })

  it('shows the sample box on the homepage', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Everything you’ve kept.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nine memories, four of them on your profile.')).toBeInTheDocument()
    expect(screen.getByText(/sample box/)).toBeInTheDocument()
  })

  it('switches between dark and light and remembers the choice', async () => {
    const user = userEvent.setup()
    const { container, unmount } = render(<App />)
    expect(container.querySelector('.app')).toHaveClass('theme-dark')
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(container.querySelector('.app')).toHaveClass('theme-light')
    unmount()
    const again = render(<App />)
    expect(again.container.querySelector('.app')).toHaveClass('theme-light')
  })

  it('does not ask for location until the person chooses to', () => {
    const getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    })
    render(<App />)
    expect(
      screen.getByRole('button', { name: /Use my location for the weather/ }),
    ).toBeInTheDocument()
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('explains when the browser blocks location', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) => fail({ code: 1 }),
      },
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Use my location for the weather/ }))
    expect(await screen.findByText(/didn’t share a location/)).toBeInTheDocument()
  })

  it('navigates to Explore and shows public boxes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Explore' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Other people’s boxes.' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /A sample box/ }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'A sample box’s box.' }),
    ).toBeInTheDocument()
  })

  it('only shows memories marked as shown on a public box', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Explore' }))
    await user.click(screen.getByRole('link', { name: /A sample box/ }))
    expect(screen.queryByRole('button', { name: /Letter from Dad/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /First gig/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Gran’s card/ }).length).toBeGreaterThan(0)
  })

  it('keeps sign-in and add pages out of reach in demo mode', () => {
    window.location.hash = '#/add'
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Everything you’ve kept.' }),
    ).toBeInTheDocument()
    window.location.hash = ''
  })
})
