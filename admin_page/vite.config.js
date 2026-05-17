import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const adminApiHost = process.env.ADMIN_API_HOST || process.env.API_HOST || '127.0.0.1'
const adminApiPort = Number(process.env.ADMIN_API_PORT || 4002)
const adminApiTarget = `http://${adminApiHost}:${adminApiPort}`

export default defineConfig({
  plugins: [react()],
  envDir: '..',
  base: '/admin',
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: adminApiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: adminApiTarget,
        changeOrigin: true,
      },
    },
  },
})
