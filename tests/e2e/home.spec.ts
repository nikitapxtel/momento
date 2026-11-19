import { expect, test } from '@playwright/test'

test.describe('homepage', () => {
  test('shows the sample box with the card in front', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything you’ve kept.')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Gran’s card for my 21st')
  })

  test('moves through memories by clicking, keys and the indicator', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: 'Show Polzeath, first holiday' }).click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Polzeath, first holiday')

    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('First gig, Brixton')

    await page
      .getByRole('group', { name: 'Jump to a memory' })
      .getByRole('button', { name: 'Letter from Dad' })
      .click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Letter from Dad')
  })

  test('the item in front is centred on the page', async ({ page }) => {
    await page.goto('./')
    const box = await page
      .getByRole('button', { name: 'Open Gran’s card for my 21st' })
      .boundingBox()
    const width = page.viewportSize()!.width
    expect(box).not.toBeNull()
    expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(4)
  })

  test('opens a card in place, turns through its sides, and closes on an outside click', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByRole('button', { name: 'Open Gran’s card for my 21st' }).click()
    const sides = page.getByRole('group', { name: 'Sides' })
    await expect(sides.getByRole('button')).toHaveCount(3)

    await sides.getByRole('button', { name: 'Inside side' }).click()
    await expect(page.getByText(/Twenty-one!/)).toBeVisible()

    await page.getByRole('heading', { level: 1 }).click()
    await expect(page.getByRole('group', { name: 'Jump to a memory' })).toBeVisible()
  })

  test('switches between dark and light', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await expect(page.locator('.app')).toHaveClass(/theme-light/)
    await page.reload()
    await expect(page.locator('.app')).toHaveClass(/theme-light/)
  })

  test('never requests location without being asked', async ({ page, context }) => {
    let asked = false
    await context.exposeFunction('reportGeoRequest', () => (asked = true))
    await page.addInitScript(() => {
      const g = navigator.geolocation
      g.getCurrentPosition = () =>
        (window as unknown as { reportGeoRequest: () => void }).reportGeoRequest()
    })
    await page.goto('./')
    await page.waitForTimeout(300)
    expect(asked).toBe(false)
  })

  test('sends a strict Content Security Policy', async ({ page }) => {
    await page.goto('./')
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content')
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("object-src 'none'")
  })
})

test.describe('explore', () => {
  test('lists public boxes and shows only shared memories', async ({ page }) => {
    await page.goto('./#/explore')
    await page.getByRole('link', { name: /A sample box/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A sample box’s box.')
    await expect(page.getByRole('button', { name: /Letter from Dad/ })).toHaveCount(0)
  })

  test('a missing or private box says so', async ({ page }) => {
    await page.goto('./#/u/nobody_here')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing to see here.')
  })
})
