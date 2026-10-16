import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

function fixture() {
  const dates = Array.from({ length: 7 }, (_, i) => `2026-10-${19 + i}`)
  const times = dates.flatMap((date) =>
    Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`),
  )
  return {
    timezone: 'Asia/Tehran',
    current: {
      time: '2026-10-19T10:00',
      temperature_2m: 22,
      apparent_temperature: 21,
      relative_humidity_2m: 31,
      weather_code: 2,
      is_day: 1,
      wind_speed_10m: 8,
      wind_direction_10m: 260,
      surface_pressure: 880,
    },
    hourly: {
      time: times,
      temperature_2m: times.map(() => 22),
      weather_code: times.map(() => 2),
      precipitation_probability: times.map(() => 10),
      is_day: times.map(() => 1),
    },
    daily: {
      time: dates,
      weather_code: dates.map(() => 2),
      temperature_2m_max: dates.map(() => 25),
      temperature_2m_min: dates.map(() => 16),
      sunrise: dates.map((d) => `${d}T06:15`),
      sunset: dates.map((d) => `${d}T17:30`),
      precipitation_probability_max: dates.map(() => 10),
      uv_index_max: dates.map(() => 4.2),
    },
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: fixture() }))
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 2643743,
            name: 'London',
            country: 'United Kingdom',
            latitude: 51.5085,
            longitude: -0.1257,
          },
        ],
      },
    }),
  )
})

test('search, units, saved places, URL history and persistence', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The week ahead' })).toBeVisible()
  await page.getByRole('button', { name: 'Fahrenheit', exact: true }).click()
  await expect(page.locator('.current-temperature > span')).toHaveText('72°')
  await page.getByRole('button', { name: 'Save place', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.current-temperature > span')).toHaveText('72°')
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  const search = page.getByRole('combobox')
  await search.fill('London')
  await expect(page.getByRole('option')).toHaveCount(1)
  await search.press('ArrowDown')
  await search.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('London')
  await expect(page).toHaveURL(/place=London/)
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tehran')
  await page.getByRole('button', { name: 'Rain chance', exact: true }).click()
  await expect(page.locator('.hour-item strong').first()).toHaveText('10%')
  await page.getByRole('button', { name: 'Remove Tehran from saved places' }).click()
  await expect(page.getByRole('heading', { name: 'Explore places', exact: true })).toBeVisible()
})

test('weather failures show a recoverable error', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ status: 503, json: {} }),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('could not complete')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: fixture() }))
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'The week ahead' })).toBeVisible()
})

test('empty search and declined location give useful feedback', async ({ page, context }) => {
  await context.clearPermissions()
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {} }),
  )
  await page.goto('/')
  await page.getByRole('combobox').fill('zzzzzzz')
  await expect(page.getByText('No cities found. Try another spelling.')).toBeVisible()
  await page.getByRole('combobox').press('Escape')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByText(/Location access was declined/)).toBeVisible()
})

test('geolocation uses the coordinates returned by the browser', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 48.85, longitude: 2.35 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your location')
  await expect(page).toHaveURL(/lat=48.85/)
  await expect(page.getByRole('heading', { name: 'The week ahead' })).toBeVisible()
})

test('desktop and mobile have no accessibility violations or page overflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The week ahead' })).toBeVisible()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([])
  }
})

test('search results, night weather and error messages remain accessible', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => {
    const data = fixture()
    data.current.is_day = 0
    return route.fulfill({ json: data })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The week ahead' })).toBeVisible()
  await page.getByRole('combobox').fill('London')
  await expect(page.getByRole('option')).toHaveCount(1)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
})

test('offline mode identifies cached data', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The week ahead' })).toBeVisible()
  await context.setOffline(true)
  await expect(page.getByText(/You’re offline. Showing the last available forecast./)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Refresh weather' })).toBeDisabled()
})
