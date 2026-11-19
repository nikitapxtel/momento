import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

// No Supabase settings are present in tests, so the app runs in demo mode.

describe('App (demo mode)', () => {
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
    render(<App />)
    expect(screen.getByRole('button', { name: 'Show my weather' })).toBeInTheDocument()
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
