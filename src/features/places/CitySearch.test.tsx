import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CitySearch } from './CitySearch'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function setup() {
  const onSelect = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <CitySearch onSelect={onSelect} />
    </QueryClientProvider>,
  )
  return { onSelect, input: screen.getByRole('combobox'), user: userEvent.setup() }
}

describe('city search interaction', () => {
  it('supports selecting a result with the keyboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              results: [
                {
                  id: 1,
                  name: 'London',
                  country: 'United Kingdom',
                  latitude: 51.5,
                  longitude: -0.1,
                },
              ],
            }),
          ),
        ),
      ),
    )
    const { user, input, onSelect } = setup()
    await user.type(input, 'London')
    await screen.findByRole('option')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'London' }))
    expect((input as HTMLInputElement).value).toBe('')
  })
  it('does not select an old result while a different search is waiting for debounce', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              results: [{ id: 1, name: 'London', latitude: 51.5, longitude: -0.1 }],
            }),
          ),
        ),
      ),
    )
    const { user, input, onSelect } = setup()
    await user.type(input, 'London')
    await screen.findByRole('option')
    fireEvent.change(input, { target: { value: 'Paris' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).not.toHaveBeenCalled()
  })
  it('closes the list on Escape and announces no results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response('{}'))),
    )
    const { user, input } = setup()
    await user.type(input, 'zzzzzz')
    await screen.findByText('No cities found. Try another spelling.')
    await user.keyboard('{Escape}')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })
})
