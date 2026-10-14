import { queryOptions } from '@tanstack/react-query'
import { getForecast } from './api'
import type { Place } from './types'

export const forecastOptions = (place: Place) =>
  queryOptions({
    queryKey: ['forecast', place.latitude, place.longitude],
    queryFn: ({ signal }) => getForecast(place, signal),
    refetchInterval: 15 * 60 * 1000,
  })
