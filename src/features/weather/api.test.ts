import { afterEach, describe, expect, it, vi } from 'vitest'
import { getForecast, searchPlaces } from './api'
import { DEFAULT_PLACE } from '../places/storage'

afterEach(() => vi.unstubAllGlobals())

function respond(body: unknown, status = 200) {
  const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', mock)
  return mock
}

function forecastFixture() {
  return {
    timezone: 'Asia/Tehran',
    current: {
      time: '2026-10-19T18:00',
      temperature_2m: 22,
      apparent_temperature: 21,
      relative_humidity_2m: 30,
      weather_code: 1,
      is_day: 0,
      wind_speed_10m: 8,
      wind_direction_10m: 270,
      surface_pressure: 880,
    },
    hourly: {
      time: ['2026-10-19T18:00'],
      temperature_2m: [22],
      weather_code: [1],
      precipitation_probability: [0],
      is_day: [0],
    },
    daily: {
      time: Array.from({ length: 7 }, (_, i) => `2026-10-${19 + i}`),
      weather_code: Array(7).fill(1),
      temperature_2m_max: Array(7).fill(24),
      temperature_2m_min: Array(7).fill(15),
      sunrise: Array(7).fill('2026-10-19T06:15'),
      sunset: Array(7).fill('2026-10-19T17:30'),
      precipitation_probability_max: Array(7).fill(0),
      uv_index_max: Array(7).fill(4),
    },
  }
}

describe('API boundary', () => {
  it('normalizes a geocoding result and encodes search input', async () => {
    const fetchMock = respond({
      results: [
        { id: 1, name: 'New York', country: 'United States', latitude: 40.7, longitude: -74 },
      ],
    })
    const result = await searchPlaces('New York & nearby')
    expect(result[0]).toMatchObject({ id: '1', name: 'New York', longitude: -74 })
    expect(new URL(fetchMock.mock.calls[0]![0] as URL).searchParams.get('name')).toBe(
      'New York & nearby',
    )
  })
  it('returns an empty list for no matches', async () => {
    respond({ generationtime_ms: 0.4 })
    expect(await searchPlaces('zzzzzzzz')).toEqual([])
  })
  it('rejects a malformed success response', async () => {
    respond({ results: [{ name: 'Missing coordinates' }] })
    await expect(searchPlaces('Paris')).rejects.toThrow('unexpected response')
  })
  it('turns rate limits into an actionable error', async () => {
    respond({}, 429)
    await expect(searchPlaces('Paris')).rejects.toThrow('try again in a minute')
  })
  it('normalizes current and daily forecasts and requests local time', async () => {
    const fetchMock = respond(forecastFixture())
    const data = await getForecast(DEFAULT_PLACE)
    expect(data.current).toMatchObject({ temperature: 22, isDay: false, pressure: 880 })
    expect(data.daily).toHaveLength(7)
    expect(new URL(fetchMock.mock.calls[0]![0] as URL).searchParams.get('timezone')).toBe('auto')
  })
  it('rejects mismatched forecast array lengths before rendering', async () => {
    const fixture = forecastFixture()
    fixture.daily.weather_code = []
    respond(fixture)
    await expect(getForecast(DEFAULT_PLACE)).rejects.toThrow('unexpected response')
  })
  it('passes cancellation to fetch', async () => {
    const fetchMock = respond({})
    const controller = new AbortController()
    await searchPlaces('Paris', controller.signal)
    const signal = fetchMock.mock.calls[0]![1].signal as AbortSignal
    controller.abort()
    expect(signal.aborted).toBe(true)
  })
})
