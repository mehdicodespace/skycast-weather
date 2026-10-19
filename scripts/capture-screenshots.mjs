import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const base = process.env.APP_URL || 'http://127.0.0.1:5173'
await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1120 },
    deviceScaleFactor: 1,
  })
  page.setDefaultTimeout(30000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('open-meteo.com'))
      console.log(response.status(), new URL(response.url()).hostname)
  })
  await page.goto(base)
  await page.getByRole('heading', { name: 'The week ahead' }).waitFor({ timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'docs/screenshots/desktop.png', fullPage: true })
  const search = page.getByRole('combobox', { name: 'Search for a city' })
  await search.fill('London')
  await page.getByRole('option').first().waitFor()
  await search.press('ArrowDown')
  await page.screenshot({ path: 'docs/screenshots/city-search.png', fullPage: true })
  await search.press('Escape')
  await search.fill('')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'docs/screenshots/mobile.png', fullPage: true })
  console.log(
    'Horizontal overflow:',
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  )
  console.log('Browser errors:', errors)
  if (errors.length) throw new Error(errors.join('\n'))
} finally {
  await browser.close()
}
