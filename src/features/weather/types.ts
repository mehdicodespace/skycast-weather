import { z } from 'zod'

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  region: z.string().optional(),
})
export type Place = z.infer<typeof placeSchema>
export type Unit = 'celsius' | 'fahrenheit'

export interface Forecast {
  timezone: string
  current: {
    time: string
    temperature: number
    feelsLike: number
    humidity: number
    code: number
    isDay: boolean
    wind: number
    windDirection: number
    pressure: number
  }
  hourly: {
    time: string
    temperature: number
    code: number
    precipitation: number
    isDay: boolean
  }[]
  daily: {
    date: string
    code: number
    high: number
    low: number
    sunrise: string
    sunset: string
    precipitation: number
    uv: number
  }[]
}
