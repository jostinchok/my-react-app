import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/admin': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      },

      '/user': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        ws: true,
    },
      '/login': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
      },
  },
  }
})