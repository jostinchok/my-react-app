import { spawn } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'

const backendPort = 4000
const backendHealthUrl = `http://localhost:${backendPort}/api/health`
const backendPortWarning =
  `Port ${backendPort} is occupied by another process. Run: lsof -nP -iTCP:${backendPort} -sTCP:LISTEN`

const services = [
  {
    name: 'server',
    command: 'npm',
    args: ['run', 'dev:server'],
    url: backendHealthUrl,
  },
  {
    name: 'user',
    command: 'npm',
    args: ['run', 'dev:user'],
    url: 'http://localhost:5175/user',
  },
  {
    name: 'admin',
    command: 'npm',
    args: ['run', 'dev:admin'],
    url: 'http://localhost:5174/admin',
  },
  {
    name: 'mobile',
    command: 'npm',
    args: ['run', 'dev:mobile'],
    url: 'http://localhost:8081',
  },
  {
    name: 'hub',
    command: 'npm',
    args: ['run', 'dev:hub'],
    url: 'http://localhost:5173',
  },
]

const children = new Map()
let shuttingDown = false

function checkBackendHealth() {
  return new Promise((resolve) => {
    const request = http.get(backendHealthUrl, { timeout: 1200 }, (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 300)
    })

    request.on('timeout', () => {
      request.destroy()
      resolve(false)
    })

    request.on('error', () => resolve(false))
  })
}

function checkPortOpenOnHost(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })

    socket.setTimeout(1200)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.on('error', () => resolve(false))
  })
}

async function checkPortOpen(port) {
  const checks = await Promise.all([
    checkPortOpenOnHost(port, '127.0.0.1'),
    checkPortOpenOnHost(port, '::1'),
  ])
  return checks.some(Boolean)
}

async function shouldStartService(service) {
  if (service.name !== 'server') return true

  if (await checkBackendHealth()) {
    console.log(`server already running on http://localhost:${backendPort}, skipping backend start`)
    return false
  }

  if (await checkPortOpen(backendPort)) {
    console.warn(backendPortWarning)
    return false
  }

  return true
}

function colorFor(name) {
  const colors = {
    server: '\x1b[36m',
    user: '\x1b[32m',
    admin: '\x1b[35m',
    mobile: '\x1b[33m',
    hub: '\x1b[34m',
  }
  return colors[name] || '\x1b[37m'
}

function prefixLine(name, chunk) {
  const color = colorFor(name)
  const reset = '\x1b[0m'
  const prefix = `${color}[${name}]${reset} `
  const text = chunk.toString()
  process.stdout.write(
    text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => `${prefix}${line}`)
      .join('\n') + (text.endsWith('\n') ? '\n' : '')
  )
}

function startService(service) {
  const child = spawn(service.command, service.args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BROWSER: 'none',
      EXPO_NO_TELEMETRY: '1',
      FORCE_COLOR: '1',
    },
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  })

  children.set(service.name, child)
  child.stdout.on('data', (chunk) => prefixLine(service.name, chunk))
  child.stderr.on('data', (chunk) => prefixLine(service.name, chunk))
  child.on('exit', (code, signal) => {
    children.delete(service.name)
    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `code ${code}`
      console.error(`[${service.name}] exited with ${reason}`)
      shutdown(code || 1)
    }
  })
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children.values()) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 400)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

async function main() {
  console.log('Starting SFC review workspace:')
  for (const service of services) {
    console.log(`- ${service.name}: ${service.url}`)
    if (await shouldStartService(service)) {
      startService(service)
    }
  }
}

main().catch((error) => {
  console.error(`Launcher failed: ${error.message}`)
  shutdown(1)
})
