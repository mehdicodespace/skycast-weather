import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Bookmark,
  Check,
  CloudSun,
  Compass,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Moon,
  RefreshCw,
  Sun,
  X,
} from 'lucide-react'
import { CitySearch } from '../features/places/CitySearch'
import {
  persist,
  readPlaceFromUrl,
  readSavedPlaces,
  readUnit,
  samePlace,
  SUGGESTED_PLACES,
  writePlaceToUrl,
} from '../features/places/storage'
import { ForecastPanel } from '../features/weather/ForecastPanel'
import { calendar, temperature, weatherCondition } from '../features/weather/format'
import { forecastOptions } from '../features/weather/queries'
import type { Place, Unit } from '../features/weather/types'
import { WeatherIcon } from '../features/weather/WeatherIcon'
import { applyTheme, readTheme } from './theme'

function DeveloperCredit() {
  return (
    <div className="developer-credit">
      <span>Developed by</span>
      <a href="https://github.com/mehdicodespace" target="_blank" rel="noreferrer">
        Mehdi Rafiei
        <ArrowUpRight size={12} aria-hidden="true" />
      </a>
      <span className="developer-title">Senior Front end developer</span>
    </div>
  )
}

function PlaceCard({
  place,
  unit,
  active,
  onSelect,
  onRemove,
}: {
  place: Place
  unit: Unit
  active: boolean
  onSelect: () => void
  onRemove?: () => void
}) {
  const query = useQuery(forecastOptions(place))
  return (
    <div className={`place-card ${active ? 'place-card--active' : ''}`}>
      <button onClick={onSelect} aria-current={active ? 'location' : undefined}>
        <span>
          <strong>{place.name}</strong>
          <small>{place.country || 'Current location'}</small>
        </span>
        {query.data ? (
          <>
            <WeatherIcon
              code={query.data.current.code}
              isDay={query.data.current.isDay}
              size={25}
            />
            <b>{temperature(query.data.current.temperature, unit)}°</b>
          </>
        ) : (
          <span className="place-placeholder">{query.isError ? '—' : '…'}</span>
        )}
      </button>
      {onRemove && (
        <button
          className="remove-place icon-button"
          onClick={onRemove}
          aria-label={`Remove ${place.name} from saved places`}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

export function App() {
  const [place, setPlace] = useState(readPlaceFromUrl)
  const [unit, setUnit] = useState<Unit>(readUnit)
  const [theme, setTheme] = useState(readTheme)
  const [saved, setSaved] = useState(readSavedPlaces)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const query = useQuery(forecastOptions(place))
  const isSaved = saved.some((item) => samePlace(item, place))

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onPop = () => {
      setPlace(readPlaceFromUrl())
      setNotice('')
    }
    const onOnline = () => setOnline(navigator.onLine)
    window.addEventListener('popstate', onPop)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOnline)
    }
  }, [])
  useEffect(() => {
    document.title = `${place.name} weather · Skycast`
  }, [place.name])

  function selectPlace(next: Place) {
    setPlace(next)
    writePlaceToUrl(next)
    setNotice('')
  }
  function savePlaces(next: Place[]) {
    setSaved(next)
    persist('places', JSON.stringify(next))
  }
  function toggleSaved() {
    if (isSaved) savePlaces(saved.filter((item) => !samePlace(item, place)))
    else if (saved.length < 8) savePlaces([...saved, place])
    else setNotice('You can save up to 8 places. Remove one to make room.')
  }
  function locate() {
    setNotice('')
    if (!navigator.geolocation) {
      setNotice('Location isn’t supported by this browser. Search for your city instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectPlace({
          id: 'current-location',
          name: 'Your location',
          country: '',
          latitude: Number(coords.latitude.toFixed(4)),
          longitude: Number(coords.longitude.toFixed(4)),
        })
        setLocating(false)
      },
      (error) => {
        setNotice(
          error.code === 1
            ? 'Location access was declined. Search for your city, or enable location in your browser settings.'
            : 'We couldn’t find your location. Try searching for a city instead.',
        )
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#forecast">
        Skip to forecast
      </a>
      <aside className="sidebar" aria-label="Places and about">
        <div className="sidebar-content">
          <a className="brand" href="/" aria-label="Skycast home">
            <span className="brand-icon">
              <CloudSun size={27} strokeWidth={1.7} />
            </span>
            skycast<span className="brand-period">.</span>
          </a>
          <p className="brand-tagline">A little clarity in the forecast.</p>
          <div className="sidebar-divider" />
          <div className="sidebar-label">
            <Compass size={15} />
            <h2>YOUR WEATHER, ANYWHERE</h2>
          </div>
          <button className="location-button" onClick={locate} disabled={locating}>
            {locating ? <LoaderCircle size={17} className="spin" /> : <LocateFixed size={17} />}{' '}
            {locating ? 'Finding your location…' : 'Use my location'}
            <ArrowUpRight size={15} />
          </button>
          <div className="places-heading">
            <h2>{saved.length ? 'Saved places' : 'Explore places'}</h2>
            <span>{saved.length ? `${saved.length}/8` : 'A FEW FAVORITES'}</span>
          </div>
          <div className="places-list">
            {(saved.length ? saved : SUGGESTED_PLACES).map((item) => (
              <PlaceCard
                key={item.id}
                place={item}
                unit={unit}
                active={samePlace(item, place)}
                onSelect={() => selectPlace(item)}
                onRemove={
                  saved.length
                    ? () => savePlaces(saved.filter((entry) => entry.id !== item.id))
                    : undefined
                }
              />
            ))}
          </div>
          <p className="saved-hint">
            <Bookmark size={14} /> Save a city to keep it close.
          </p>
        </div>
        <div className="sidebar-bottom">
          <div className="little-sky">
            <CloudSun size={40} strokeWidth={1.3} />
            <i />
            <i />
          </div>
          <h3>
            Make room for
            <br />a little outside.
          </h3>
          <p>Whatever the weather brings.</p>
          <DeveloperCredit />
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span className="topbar-label">YOUR DAILY OUTLOOK</span>
          <CitySearch onSelect={selectPlace} />
          <div className="segmented unit-toggle" aria-label="Temperature unit">
            {(['celsius', 'fahrenheit'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={unit === value}
                aria-label={value === 'celsius' ? 'Celsius' : 'Fahrenheit'}
                onClick={() => {
                  setUnit(value)
                  persist('unit', value)
                }}
              >
                °{value === 'celsius' ? 'C' : 'F'}
              </button>
            ))}
          </div>
          <button
            className="theme-toggle"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Dark mode"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              persist('theme', next)
            }}
          >
            <Sun size={15} aria-hidden="true" />
            <Moon size={15} aria-hidden="true" />
          </button>
        </header>
        <main id="forecast" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <p className="eyebrow">LOOK UP. PLAN AHEAD.</p>
              <h1>
                <MapPin size={25} strokeWidth={1.7} />
                {place.name}
                <span>{place.country}</span>
              </h1>
              <p className="date-label">
                {query.data
                  ? calendar(query.data.current.time, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Your local forecast, at a glance.'}
              </p>
            </div>
            <div className="heading-actions">
              <button className="save-button" aria-pressed={isSaved} onClick={toggleSaved}>
                {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                {isSaved ? 'Saved' : 'Save place'}
              </button>
              <button
                className="icon-button refresh-button"
                aria-label="Refresh weather"
                disabled={query.isFetching || !online}
                onClick={() => void query.refetch()}
              >
                <RefreshCw size={17} className={query.isFetching ? 'spin' : ''} />
              </button>
            </div>
          </div>
          {!online && (
            <div className="notice" role="status">
              You’re offline.{' '}
              {query.data
                ? 'Showing the last available forecast.'
                : 'Connect to the internet to load the forecast.'}
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                className="icon-button"
                aria-label="Dismiss message"
                onClick={() => setNotice('')}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {query.isError && (
            <div className="notice notice--error" role="alert">
              <span>
                {query.data
                  ? 'Couldn’t update the forecast. Showing the last available data. '
                  : ''}
                {query.error.message}
              </span>
              <button onClick={() => void query.refetch()}>Try again</button>
            </div>
          )}
          {query.data ? (
            <ForecastPanel
              key={`${place.latitude},${place.longitude}`}
              data={query.data}
              place={place}
              unit={unit}
            />
          ) : !query.isError ? (
            <div className="loading-view" role="status">
              <div className="skeleton skeleton--hero" />
              <div className="skeleton skeleton--hours" />
              <div className="skeleton skeleton--details" />
              <span className="sr-only">Loading weather for {place.name}…</span>
            </div>
          ) : (
            <section className="empty-state card">
              <CloudSun size={52} />
              <h2>Forecast taking a rain check.</h2>
              <p>Check your connection and try again, or choose another city.</p>
            </section>
          )}
        </main>
        <footer className="page-footer">
          <DeveloperCredit />
          <span>
            <span className="status-dot" />
            {query.data
              ? `${weatherCondition(query.data.current.code).label} in ${place.name}`
              : 'A little clarity, every day.'}
          </span>
          <span>
            Weather data by{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo <ArrowUpRight size={12} />
            </a>
          </span>
        </footer>
      </div>
    </div>
  )
}
