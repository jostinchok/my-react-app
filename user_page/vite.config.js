import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', 'user_login', 'server', '.env') })

const apiHost = process.env.API_HOST || '127.0.0.1'
const apiPort = Number(process.env.API_PORT || 4001)
const apiTarget = `http://${apiHost}:${apiPort}`

export default defineConfig({
  plugins: [react()],
  base: '/user',
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
