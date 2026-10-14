import { z } from 'zod'
import { getJson } from '../../lib/http'
import type { Forecast, Place } from './types'

const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
      }),
    )
    .optional(),
})

const forecastSchema = z
  .object({
    timezone: z.string(),
    current: z.object({
      time: z.string(),
      temperature_2m: z.number(),
      apparent_temperature: z.number(),
      relative_humidity_2m: z.number(),
      weather_code: z.number(),
      is_day: z.number(),
      wind_speed_10m: z.number(),
      wind_direction_10m: z.number(),
      surface_pressure: z.number(),
    }),
    hourly: z.object({
      time: z.array(z.string()),
      temperature_2m: z.array(z.number()),
      weather_code: z.array(z.number()),
      precipitation_probability: z.array(z.number()),
      is_day: z.array(z.number()),
    }),
    daily: z.object({
      time: z.array(z.string()).min(7),
      weather_code: z.array(z.number()),
      temperature_2m_max: z.array(z.number()),
      temperature_2m_min: z.array(z.number()),
      sunrise: z.array(z.string()),
      sunset: z.array(z.string()),
      precipitation_probability_max: z.array(z.number()),
      uv_index_max: z.array(z.number()),
    }),
  })
  .superRefine((data, ctx) => {
    for (const group of [data.hourly, data.daily]) {
      if (Object.values(group).some((values) => values.length !== group.time.length)) {
        ctx.addIssue({ code: 'custom', message: 'Forecast arrays have inconsistent lengths.' })
      }
    }
  })

function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success)
    throw new Error('The weather service returned an unexpected response. Please try again later.')
  return result.data
}

export async function searchPlaces(term: string, signal?: AbortSignal): Promise<Place[]> {
  const url = new URL(
    import.meta.env.VITE_GEOCODING_API_URL || 'https://geocoding-api.open-meteo.com/v1/search',
  )
  url.search = new URLSearchParams({
    name: term.trim(),
    count: '6',
    language: 'en',
    format: 'json',
  }).toString()
  const data = parseResponse(geocodingSchema, await getJson(url, signal))
  return (data.results ?? []).map((place) => ({
    id: String(place.id),
    name: place.name,
    country: place.country ?? '',
    region: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
  }))
}

export async function getForecast(place: Place, signal?: AbortSignal): Promise<Forecast> {
  const url = new URL(
    import.meta.env.VITE_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast',
  )
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    timezone: 'auto',
    forecast_days: '7',
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,surface_pressure',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
  }).toString()
  const {
    current: c,
    hourly: h,
    daily: d,
    timezone,
  } = parseResponse(forecastSchema, await getJson(url, signal))
  return {
    timezone,
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      code: c.weather_code,
      isDay: c.is_day === 1,
      wind: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      pressure: c.surface_pressure,
    },
    hourly: h.time.map((time, i) => ({
      time,
      temperature: h.temperature_2m[i]!,
      code: h.weather_code[i]!,
      precipitation: h.precipitation_probability[i]!,
      isDay: h.is_day[i] === 1,
    })),
    daily: d.time.map((date, i) => ({
      date,
      code: d.weather_code[i]!,
      high: d.temperature_2m_max[i]!,
      low: d.temperature_2m_min[i]!,
      sunrise: d.sunrise[i]!,
      sunset: d.sunset[i]!,
      precipitation: d.precipitation_probability_max[i]!,
      uv: d.uv_index_max[i]!,
    })),
  }
}
