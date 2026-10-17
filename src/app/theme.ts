export type Theme = 'light' | 'dark'

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('skycast:theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Fall back to the system preference when browser storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}
