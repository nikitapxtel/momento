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

test.describe('weather', () => {
  const forecast = JSON.stringify({ current: { temperature_2m: 9.2, weather_code: 61, is_day: 1 } })
  const geocode = JSON.stringify({
    results: [{ name: 'London', latitude: 51.5, longitude: -0.12 }],
  })

  test.use({ timezoneId: 'Europe/London' })

  test.beforeEach(async ({ page }) => {
    await page.route('https://geocoding-api.open-meteo.com/**', (r) =>
      r.fulfill({
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: geocode,
      }),
    )
    await page.route('https://api.open-meteo.com/**', (r) =>
      r.fulfill({
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: forecast,
      }),
    )
  })

  test('shows the weather for your time zone without asking for location', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('button', { name: /London · 9° Rain/ })).toBeVisible()
    await expect(page.locator('.sky')).toHaveAttribute('data-weather', 'rain')
  })

  test('uses your location when you allow it, rounded first', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 51.454514, longitude: -2.58791 })
    const requested: string[] = []
    page.on(
      'request',
      (r) => r.url().includes('api.open-meteo.com/v1/forecast') && requested.push(r.url()),
    )
    await page.goto('./')
    await page.getByRole('button', { name: /Use my location for the weather/ }).click()
    await expect(page.locator('.weather-note')).toHaveText('9° Rain')
    expect(requested.some((u) => u.includes('latitude=51.5') && u.includes('longitude=-2.6'))).toBe(
      true,
    )
    expect(requested.some((u) => u.includes('51.4545'))).toBe(false)
  })

  test('explains what happened when location is blocked', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /Use my location for the weather/ }).click()
    await expect(page.getByText(/didn’t share a location/)).toBeVisible()
    await expect(page.getByRole('button', { name: /London · 9° Rain/ })).toBeVisible()
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
