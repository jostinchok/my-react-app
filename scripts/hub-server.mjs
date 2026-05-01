import http from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { pipeline } from 'node:stream'

const port = Number(process.env.HUB_PORT || 5173)
const host = process.env.HUB_HOST || '127.0.0.1'
const root = process.cwd()

const proxies = [
  { prefix: '/api', target: 'http://localhost:4000' },
  { prefix: '/user', target: 'http://localhost:5175' },
  { prefix: '/admin', target: 'http://localhost:5174' },
]

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    ...headers,
  })
  res.end(body)
}

function serveFile(res, filePath) {
  if (!existsSync(filePath)) {
    send(res, 404, 'Not found')
    return
  }
  const ext = extname(filePath)
  res.writeHead(200, { 'content-type': mimeTypes[ext] || 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
}

function staticPathFor(urlPath) {
  if (urlPath === '/' || urlPath === '') return join(root, 'index.html')
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = resolve(root, `.${safePath}`)
  if (!filePath.startsWith(root)) return null
  return filePath
}

function proxyRequest(req, res, proxy) {
  const target = new URL(req.url || '/', proxy.target)
  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      host: target.host,
    },
  }

  const upstream = http.request(target, options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers)
    pipeline(upstreamRes, res, () => {})
  })

  upstream.on('error', (error) => {
    send(
      res,
      502,
      JSON.stringify({ status: 'offline', message: error.message }),
      { 'content-type': 'application/json; charset=utf-8' }
    )
  })

  pipeline(req, upstream, () => {})
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${port}`}`)
  const proxy = proxies.find((item) => url.pathname === item.prefix || url.pathname.startsWith(`${item.prefix}/`))

  if (proxy) {
    proxyRequest(req, res, proxy)
    return
  }

  const filePath = staticPathFor(url.pathname)
  if (!filePath) {
    send(res, 403, 'Forbidden')
    return
  }
  serveFile(res, filePath)
})

server.listen(port, host, () => {
  console.log(`Review hub available at http://localhost:${port}`)
  console.log('Proxy routes: /api -> 4000, /user -> 5175, /admin -> 5174')
})
