// A small live smoke check, separate from deterministic unit and browser tests.
const geocoding =
  process.env.VITE_GEOCODING_API_URL || 'https://geocoding-api.open-meteo.com/v1/search'
const weather = process.env.VITE_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast'
for (const name of ['Tehran', 'London', 'New York']) {
  const search = new URL(geocoding)
  search.search = new URLSearchParams({ name, count: '1', language: 'en' })
  const response = await fetch(search, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Search ${name}: HTTP ${response.status}`)
  const { results } = await response.json()
  if (!results?.[0]) throw new Error(`Search ${name}: no results`)
  const place = results[0]
  const forecast = new URL(weather)
  forecast.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: 'auto',
    forecast_days: '7',
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,surface_pressure',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
  })
  const forecastResponse = await fetch(forecast, { signal: AbortSignal.timeout(15000) })
  if (!forecastResponse.ok) throw new Error(`Forecast ${name}: HTTP ${forecastResponse.status}`)
  const data = await forecastResponse.json()
  if (
    !Number.isFinite(data.current?.temperature_2m) ||
    data.daily?.time?.length !== 7 ||
    data.hourly?.time?.length < 24
  )
    throw new Error(`Forecast ${name}: unexpected response`)
  console.log(
    `${name}: search ${response.status}, forecast ${forecastResponse.status}, ${data.current.temperature_2m}°C, ${data.daily.time.length} days, ${data.hourly.time.length} hours, ${data.timezone}`,
  )
}
