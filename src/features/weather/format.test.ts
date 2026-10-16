import { describe, expect, it } from 'vitest'
import { calendar, clock, temperature, weatherCondition, windDirection } from './format'

describe('weather formatting', () => {
  it('converts Celsius to Fahrenheit without losing the source precision', () => {
    expect(temperature(0, 'fahrenheit')).toBe(32)
    expect(temperature(-40, 'fahrenheit')).toBe(-40)
    expect(temperature(22.6, 'celsius')).toBe(23)
    expect(temperature(22.6, 'fahrenheit')).toBe(73)
  })
  it('formats destination time without applying the browser timezone', () => {
    expect(clock('2026-10-19T00:00')).toBe('12 AM')
    expect(clock('2026-10-19T12:00')).toBe('12 PM')
    expect(clock('2026-10-19T18:35')).toBe('6:35 PM')
    expect(calendar('2026-10-19', { weekday: 'long' })).toBe('Monday')
  })
  it('handles wind direction at the north boundary', () => {
    expect(windDirection(359)).toBe('N')
    expect(windDirection(90)).toBe('E')
  })
  it('covers freezing rain, snow showers, thunderstorms and unknown codes', () => {
    expect(weatherCondition(66).kind).toBe('rain')
    expect(weatherCondition(86).kind).toBe('snow')
    expect(weatherCondition(99).kind).toBe('storm')
    expect(weatherCondition(120).label).toBe('Conditions unavailable')
  })
})
