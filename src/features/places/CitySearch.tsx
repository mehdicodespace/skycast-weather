import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { searchPlaces } from '../weather/api'
import type { Place } from '../weather/types'

export function CitySearch({ onSelect }: { onSelect: (place: Place) => void }) {
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [value])
  const query = useQuery({
    queryKey: ['places', debounced],
    queryFn: ({ signal }) => searchPlaces(debounced, signal),
    enabled: debounced.length >= 2,
  })
  const results = query.data ?? []
  const visible = open && value.trim().length >= 2
  const canSelect = visible && !query.isFetching && debounced === value.trim()
  function select(place: Place) {
    onSelect(place)
    setValue('')
    setOpen(false)
    setActive(-1)
  }

  return (
    <div
      className="city-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <Search size={19} aria-hidden="true" />
      <input
        aria-label="Search for a city"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={listId}
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Search for a city…"
        autoComplete="off"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            setActive(-1)
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((n) => Math.min(n + 1, results.length - 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((n) => Math.max(n - 1, 0))
          }
          if (e.key === 'Enter' && canSelect && results[active >= 0 ? active : 0]) {
            e.preventDefault()
            select(results[active >= 0 ? active : 0]!)
          }
        }}
      />
      {value && (
        <button
          className="icon-button"
          onClick={() => {
            setValue('')
            setActive(-1)
          }}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      {visible && (
        <div className="search-popover">
          <div className="search-caption">FIND YOUR NEXT FORECAST</div>
          {query.isFetching || debounced !== value.trim() ? (
            <p className="search-message" role="status">
              <LoaderCircle className="spin" size={16} /> Searching cities…
            </p>
          ) : query.isError ? (
            <p className="search-message" role="alert">
              City search is unavailable. Please try again.
            </p>
          ) : results.length === 0 ? (
            <p className="search-message" role="status">
              No cities found. Try another spelling.
            </p>
          ) : null}
          <ul role="listbox" id={listId} aria-label="City search results">
            {!query.isFetching &&
              debounced === value.trim() &&
              results.map((place, i) => (
                <li key={place.id} role="presentation">
                  <button
                    role="option"
                    aria-selected={i === active}
                    id={`${listId}-${i}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(place)}
                    tabIndex={-1}
                  >
                    <MapPin size={18} />
                    <span>
                      <strong>{place.name}</strong>
                      <small>{[place.region, place.country].filter(Boolean).join(', ')}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
