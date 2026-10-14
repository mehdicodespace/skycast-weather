import type { Unit } from './types'

export function temperature(value: number, unit: Unit) {
  return Math.round(unit === 'fahrenheit' ? (value * 9) / 5 + 32 : value)
}

// API timestamps already use the destination's local time. Avoid interpreting them in the viewer's timezone.
export function clock(iso: string) {
  const hour = Number(iso.slice(11, 13))
  const minute = iso.slice(14, 16)
  return `${hour % 12 || 12}${minute === '00' ? '' : `:${minute}`} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function calendar(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' }).format(
    new Date(`${date.slice(0, 10)}T12:00:00Z`),
  )
}

export function windDirection(degrees: number) {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8]
}

export function weatherCondition(code: number) {
  if (code === 0) return { label: 'Clear skies', kind: 'sun' as const }
  if (code <= 2) return { label: 'Partly cloudy', kind: 'partly' as const }
  if (code === 3) return { label: 'Overcast', kind: 'cloud' as const }
  if (code <= 48) return { label: 'Foggy', kind: 'fog' as const }
  if (code <= 57) return { label: 'Drizzle', kind: 'rain' as const }
  if (code <= 67) return { label: 'Rain', kind: 'rain' as const }
  if (code <= 77) return { label: 'Snow', kind: 'snow' as const }
  if (code <= 82) return { label: 'Rain showers', kind: 'rain' as const }
  if (code <= 86) return { label: 'Snow showers', kind: 'snow' as const }
  if (code <= 99) return { label: 'Thunderstorms', kind: 'storm' as const }
  return { label: 'Conditions unavailable', kind: 'cloud' as const }
}
