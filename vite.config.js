import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxies Yahoo Finance chart requests to dodge browser CORS blocking.
      // Frontend calls e.g. /api/yahoo/QLD?period1=...&period2=...&interval=1d
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        },
        rewrite: (path) => path.replace(/^\/api\/yahoo/, '/v8/finance/chart'),
      },
      // Symbol search, for the autocomplete dropdown. Same CORS-dodge, different endpoint.
      // NOTE: path must not share a prefix with '/api/yahoo' above, or that rule shadows this one.
      '/api/symbol-search': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        },
        rewrite: (path) => path.replace(/^\/api\/symbol-search/, '/v1/finance/search'),
      },
    },
  },
})
