import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { demoMemories } from '../lib/demo'
import { Carousel } from './Carousel'

const card = demoMemories.find((m) => m.kind === 'card')!
const cardIndex = demoMemories.indexOf(card)

function setup(props: Partial<Parameters<typeof Carousel>[0]> = {}) {
  const user = userEvent.setup()
  const onActiveChange = vi.fn()
  render(
    <div>
      <p>Outside</p>
      <Carousel
        memories={demoMemories}
        initialIndex={cardIndex}
        onActiveChange={onActiveChange}
        {...props}
      />
    </div>,
  )
  return { user, onActiveChange }
}

const flush = () => act(() => new Promise((r) => setTimeout(r, 5)))

describe('Carousel', () => {
  it('shows the details of the memory in front', () => {
    const { onActiveChange } = setup()
    expect(screen.getByRole('heading', { level: 2, name: card.title })).toBeInTheDocument()
    expect(
      screen.getByText(`${cardIndex + 1} of ${demoMemories.length} · Card · Mar 2019`),
    ).toBeInTheDocument()
    expect(onActiveChange).toHaveBeenLastCalledWith(card)
  })

  it('brings a side item to the front when it is clicked', async () => {
    const { user, onActiveChange } = setup()
    const next = demoMemories[cardIndex + 1]!
    await user.click(screen.getByRole('button', { name: `Show ${next.title}` }))
    expect(screen.getByRole('heading', { level: 2, name: next.title })).toBeInTheDocument()
    expect(onActiveChange).toHaveBeenLastCalledWith(next)
  })

  it('moves with the arrow keys and keeps focus on the front item', async () => {
    const { user } = setup()
    screen.getByRole('button', { name: `Open ${card.title}` }).focus()
    await user.keyboard('{ArrowRight}')
    const next = demoMemories[cardIndex + 1]!
    expect(screen.getByRole('heading', { level: 2, name: next.title })).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('heading', { level: 2, name: card.title })).toBeInTheDocument()
  })

  it('jumps to a memory from the indicator', async () => {
    const { user } = setup()
    const last = demoMemories[demoMemories.length - 1]!
    const group = screen.getByRole('group', { name: 'Jump to a memory' })
    await user.click(within(group).getByRole('button', { name: last.title }))
    expect(screen.getByRole('heading', { level: 2, name: last.title })).toBeInTheDocument()
  })

  it('opens in place, steps through sides, and closes when clicking outside', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: `Open ${card.title}` }))
    const sides = screen.getByRole('group', { name: 'Sides' })
    const sideButtons = within(sides).getAllByRole('button')
    expect(sideButtons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Front side',
      'Inside side',
      'Back side',
    ])
    expect(sideButtons[0]).toHaveAttribute('aria-current', 'true')

    await user.click(sideButtons[1]!)
    expect(within(sides).getByRole('button', { name: 'Inside side' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    // The handwritten message inside the card is on the page
    expect(screen.getByText(/Twenty-one!/)).toBeInTheDocument()

    await flush()
    await user.click(screen.getByText('Outside'))
    expect(screen.getByRole('group', { name: 'Jump to a memory' })).toBeInTheDocument()
  })

  it('can be closed by keyboard users with the Close button', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: `Open ${card.title}` }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('group', { name: 'Sides' })).not.toBeInTheDocument()
  })

  it('only offers the visibility switch to the owner', async () => {
    const onToggleShown = vi.fn()
    const { unmount } = render(<Carousel memories={demoMemories} initialIndex={cardIndex} />)
    expect(screen.queryByRole('button', { name: /on your profile/i })).not.toBeInTheDocument()
    unmount()

    const user = userEvent.setup()
    render(
      <Carousel memories={demoMemories} initialIndex={cardIndex} onToggleShown={onToggleShown} />,
    )
    await user.click(screen.getByRole('button', { name: /Shown on your profile/ }))
    expect(onToggleShown).toHaveBeenCalledWith(card)
  })

  it('renders nothing for an empty box', () => {
    const { container } = render(<Carousel memories={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows uploaded images without alt text noise and never as links', () => {
    setup()
    for (const img of document.querySelectorAll('img')) {
      expect(img).toHaveAttribute('alt', '')
      expect(img.closest('a')).toBeNull()
    }
  })
})
