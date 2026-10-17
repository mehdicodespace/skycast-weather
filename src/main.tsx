import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'
import { applyTheme, readTheme } from './app/theme'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/manrope'
import './styles.css'

applyTheme(readTheme())

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
