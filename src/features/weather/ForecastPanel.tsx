import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Droplets,
  Sunrise,
  Sunset,
  Wind,
  Gauge,
  Sun,
  Thermometer,
} from 'lucide-react'
import { calendar, clock, temperature, weatherCondition, windDirection } from './format'
import { SkyIllustration, WeatherIcon } from './WeatherIcon'
import type { Forecast, Place, Unit } from './types'

export function ForecastPanel({ data, place, unit }: { data: Forecast; place: Place; unit: Unit }) {
  const [hourlyView, setHourlyView] = useState<'temperature' | 'rain'>('temperature')
  const c = data.current,
    today = data.daily[0]!
  const hourly = data.hourly.filter((hour) => hour.time >= `${c.time.slice(0, 13)}:00`).slice(0, 12)
  const high = Math.max(...data.daily.map((day) => day.high)),
    low = Math.min(...data.daily.map((day) => day.low))
  const temp = (value: number) => `${temperature(value, unit)}°`
  const uvLabel =
    today.uv < 3 ? 'Low' : today.uv < 6 ? 'Moderate' : today.uv < 8 ? 'High' : 'Very high'
  return (
    <>
      <section
        className={`current-card ${c.isDay ? '' : 'current-card--night'}`}
        aria-label={`Current weather in ${place.name}`}
      >
        <div className="current-card__top">
          <span className="eyebrow">CURRENT WEATHER</span>
          <span className="live-dot">As of {clock(c.time)} · local</span>
        </div>
        <div className="current-card__body">
          <div className="current-temperature">
            <span>{temp(c.temperature)}</span>
            <div>
              <h2>{weatherCondition(c.code).label}</h2>
              <p>Feels like {temp(c.feelsLike)}</p>
            </div>
          </div>
          <SkyIllustration code={c.code} isDay={c.isDay} />
        </div>
        <div className="current-card__bottom">
          <span>
            <ArrowUp size={15} /> {temp(today.high)} <ArrowDown size={15} /> {temp(today.low)}
          </span>
          <span>
            {c.isDay ? 'A little clarity for your day.' : 'The forecast, even after dark.'}
          </span>
        </div>
      </section>

      <section className="hourly-card card" aria-labelledby="hourly-title">
        <div className="section-heading">
          <div>
            <h2 id="hourly-title">The next 12 hours</h2>
            <p>A closer look at what’s coming.</p>
          </div>
          <div className="segmented small" aria-label="Hourly forecast metric">
            <button
              aria-pressed={hourlyView === 'temperature'}
              onClick={() => setHourlyView('temperature')}
            >
              Temperature
            </button>
            <button aria-pressed={hourlyView === 'rain'} onClick={() => setHourlyView('rain')}>
              Rain chance
            </button>
          </div>
        </div>
        <div
          className="hourly-scroll"
          tabIndex={0}
          role="region"
          aria-label="Hourly forecast, scroll for more hours"
        >
          {hourly.map((hour, i) => (
            <div className={`hour-item ${i === 0 ? 'hour-item--now' : ''}`} key={hour.time}>
              <span>{i === 0 ? 'Now' : clock(hour.time)}</span>
              <WeatherIcon code={hour.code} isDay={hour.isDay} size={31} />
              <span className="sr-only">{weatherCondition(hour.code).label}</span>
              <strong>
                {hourlyView === 'temperature' ? temp(hour.temperature) : `${hour.precipitation}%`}
              </strong>
              <small>
                <Droplets size={11} /> {hour.precipitation}%
              </small>
            </div>
          ))}
        </div>
      </section>

      <div className="details-grid">
        <section className="weekly-card card" aria-labelledby="weekly-title">
          <div className="section-heading">
            <div>
              <h2 id="weekly-title">The week ahead</h2>
              <p>Seven days, one simple outlook.</p>
            </div>
            <span className="subtle-badge">7 DAYS</span>
          </div>
          <div className="daily-list">
            {data.daily.map((day, i) => (
              <div className="daily-row" key={day.date}>
                <span className="daily-day">
                  {i === 0 ? 'Today' : calendar(day.date, { weekday: 'short' })}
                  <small>{calendar(day.date, { month: 'short', day: 'numeric' })}</small>
                </span>
                <WeatherIcon code={day.code} size={26} />
                <span className="daily-condition">{weatherCondition(day.code).label}</span>
                <span className="daily-rain">
                  <Droplets size={12} />
                  {day.precipitation}%
                </span>
                <span className="daily-low">{temp(day.low)}</span>
                <span className="temp-range">
                  <i
                    style={{
                      left: `${((day.low - low) / (high - low || 1)) * 100}%`,
                      width: `${Math.max(((day.high - day.low) / (high - low || 1)) * 100, 4)}%`,
                    }}
                  />
                </span>
                <strong className="daily-high">{temp(day.high)}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="highlights" aria-labelledby="highlights-title">
          <div className="section-heading">
            <div>
              <h2 id="highlights-title">Today’s details</h2>
              <p>The useful little things.</p>
            </div>
          </div>
          <div className="highlight-grid">
            <article className="metric card">
              <span>
                <Wind size={17} /> Wind
              </span>
              <p>
                {Math.round(c.wind)} <small>km/h</small>
              </p>
              <footer>
                {windDirection(c.windDirection)} · {Math.round(c.windDirection)}°
              </footer>
            </article>
            <article className="metric card">
              <span>
                <Droplets size={17} /> Humidity
              </span>
              <p>
                {c.humidity}
                <small>%</small>
              </p>
              <div className="humidity-track">
                <i style={{ width: `${c.humidity}%` }} />
              </div>
            </article>
            <article className="metric card">
              <span>
                <Sun size={17} /> UV index
              </span>
              <p>
                {today.uv.toFixed(1)} <small>{uvLabel}</small>
              </p>
              <footer>Today’s peak UV</footer>
            </article>
            <article className="metric card">
              <span>
                <Gauge size={17} /> Pressure
              </span>
              <p>
                {Math.round(c.pressure)} <small>hPa</small>
              </p>
              <footer>At ground level</footer>
            </article>
          </div>
          <article className="sun-card card">
            <div>
              <Sunrise size={22} />
              <span>
                Sunrise<strong>{clock(today.sunrise)}</strong>
              </span>
            </div>
            <div className="sun-path">
              <Sun size={19} />
              <span />
            </div>
            <div>
              <Sunset size={22} />
              <span>
                Sunset<strong>{clock(today.sunset)}</strong>
              </span>
            </div>
          </article>
        </section>
      </div>
      <div className="forecast-note">
        <Thermometer size={14} />
        <span>
          Forecast times are local to {place.name}. Weather can change; check local alerts before
          travel.
        </span>
      </div>
    </>
  )
}
