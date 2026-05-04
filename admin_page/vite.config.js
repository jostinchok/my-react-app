import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // With base: '/admin', the SPA lives under /admin/ — root URL would otherwise look "broken".
    {
      name: 'redirect-root-to-admin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] || ''
          if (url === '/' || url === '/index.html') {
            res.statusCode = 302
            res.setHeader('Location', '/admin/')
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
  base: '/admin',
  server: {
    port: 5174,
    strictPort: true,
  },
})