import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PLACE, readPlaceFromUrl, readSavedPlaces, readUnit } from './storage'

beforeEach(() => {
  localStorage.clear()
  history.replaceState({}, '', '/')
})

describe('browser persistence', () => {
  it('recovers from corrupted saved places', () => {
    localStorage.setItem('skycast:places', '{bad json')
    expect(readSavedPlaces()).toEqual([])
  })
  it('rejects invalid saved coordinates', () => {
    localStorage.setItem('skycast:places', JSON.stringify([{ ...DEFAULT_PLACE, latitude: 900 }]))
    expect(readSavedPlaces()).toEqual([])
  })
  it('reads a shareable place and rejects invalid URLs', () => {
    history.replaceState({}, '', '/?lat=51.5&lon=-0.12&place=London&country=UK')
    expect(readPlaceFromUrl().name).toBe('London')
    history.replaceState({}, '', '/?lat=bad&lon=-0.12&place=London')
    expect(readPlaceFromUrl()).toEqual(DEFAULT_PLACE)
  })
  it('remembers Fahrenheit and falls back for unknown unit values', () => {
    localStorage.setItem('skycast:unit', 'fahrenheit')
    expect(readUnit()).toBe('fahrenheit')
    localStorage.setItem('skycast:unit', 'kelvin')
    expect(readUnit()).toBe('celsius')
  })
})
