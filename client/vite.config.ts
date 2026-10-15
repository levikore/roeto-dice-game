import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// In development the browser talks to Vite, which forwards /api to the API server.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
  test: { environment: 'jsdom', globals: false },
})
