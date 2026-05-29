const { getDefaultConfig } = require('expo/metro-config')
const http = require('http')

const config = getDefaultConfig(__dirname)

const AUTH_API_TARGET = (process.env.AUTH_API_PROXY_TARGET || 'http://127.0.0.1:4000').replace(/\/$/, '')
const USER_API_TARGET = (process.env.USER_API_PROXY_TARGET || 'http://127.0.0.1:4001').replace(/\/$/, '')

const pickProxyTarget = (pathname) => {
  if (pathname.startsWith('/api/auth')) return AUTH_API_TARGET
  if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) return USER_API_TARGET
  return null
}

const proxyHttpRequest = (req, res, targetBase) => {
  const incomingUrl = req.url || '/'
  const targetUrl = new URL(incomingUrl, targetBase)

  const proxyReq = http.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
    }
    res.end(JSON.stringify({ message: 'Mobile dev proxy failed. Is the backend running?', error: error.message }))
  })

  req.pipe(proxyReq)
}

config.server = config.server || {}
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const pathname = (req.url || '').split('?')[0]
    const targetBase = pickProxyTarget(pathname)
    if (targetBase) {
      proxyHttpRequest(req, res, targetBase)
      return
    }
    return middleware(req, res, next)
  }
}

module.exports = config
