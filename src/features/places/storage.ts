import { z } from 'zod'
import { placeSchema, type Place } from '../weather/types'

export const DEFAULT_PLACE: Place = {
  id: '112931',
  name: 'Tehran',
  country: 'Iran',
  latitude: 35.6944,
  longitude: 51.4215,
}
export const SUGGESTED_PLACES: Place[] = [
  DEFAULT_PLACE,
  {
    id: '2643743',
    name: 'London',
    country: 'United Kingdom',
    latitude: 51.5085,
    longitude: -0.1257,
  },
  {
    id: '5128581',
    name: 'New York',
    country: 'United States',
    latitude: 40.7143,
    longitude: -74.006,
  },
]

export function readSavedPlaces(): Place[] {
  try {
    const result = z
      .array(placeSchema)
      .max(8)
      .safeParse(JSON.parse(localStorage.getItem('skycast:places') ?? 'null'))
    return result.success ? result.data : []
  } catch {
    return []
  }
}

export function readUnit() {
  try {
    return localStorage.getItem('skycast:unit') === 'fahrenheit'
      ? ('fahrenheit' as const)
      : ('celsius' as const)
  } catch {
    return 'celsius' as const
  }
}

export function persist(key: string, value: string) {
  try {
    localStorage.setItem(`skycast:${key}`, value)
  } catch {
    /* The app remains usable when browser storage is unavailable. */
  }
}

export function readPlaceFromUrl(): Place {
  const params = new URLSearchParams(window.location.search)
  const lat = params.get('lat'),
    lon = params.get('lon'),
    name = params.get('place')
  if (lat === null || lon === null || !name) return DEFAULT_PLACE
  const result = placeSchema.safeParse({
    id: `${lat},${lon}`,
    name: name.slice(0, 100),
    country: (params.get('country') ?? '').slice(0, 100),
    latitude: Number(lat),
    longitude: Number(lon),
  })
  return result.success ? result.data : DEFAULT_PLACE
}

export function writePlaceToUrl(place: Place) {
  const url = new URL(window.location.href)
  url.search = new URLSearchParams({
    lat: String(place.latitude),
    lon: String(place.longitude),
    place: place.name,
    country: place.country,
  }).toString()
  window.history.pushState({}, '', url)
}

export function samePlace(a: Place, b: Place) {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01
}
