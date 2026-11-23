import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/predict-city': 'http://127.0.0.1:5000',
      '/predict': 'http://127.0.0.1:5000',
      '/chat': 'http://127.0.0.1:5000',
      '/weather': 'http://127.0.0.1:5000',
      '/health': 'http://127.0.0.1:5000',
    },
  },
})
