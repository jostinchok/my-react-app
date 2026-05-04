import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const loginPageDir = resolve(rootDir, 'login')
const userPageDir = resolve(rootDir, 'user_page')
const adminPageDir = resolve(rootDir, 'admin_page')
const mobileAppDir = resolve(rootDir, 'mobile_app')
const sharedEnvPath = resolve(rootDir, 'user_login', 'server', '.env')
const adminEnvPath = resolve(adminPageDir, '.env')
const nodeCommand = process.execPath

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) return env

      const [, key, rawValue] = match
      const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2')
      env[key] = value
      return env
    }, {})
}

const sharedEnv = parseEnvFile(sharedEnvPath)
const adminEnv = parseEnvFile(adminEnvPath)
const backendPort = Number(sharedEnv.PORT || 4000)
const userApiHost = sharedEnv.API_HOST || '127.0.0.1'
const userApiPort = Number(sharedEnv.API_PORT || 4001)
const smokeSeconds = Number(process.env.DEV_ALL_SMOKE_SECONDS || 0)
const backendHealthUrl = `http://localhost:${backendPort}/api/health`
const userApiHealthUrl = `http://${userApiHost}:${userApiPort}/api/health`
const adminApiPort = Number(adminEnv.ADMIN_API_PORT || adminEnv.PORT || 4002)
const adminApiHealthUrl = `http://localhost:${adminApiPort}/api/health`

const services = [
  {
    name: 'server',
    command: nodeCommand,
    args: [resolve(rootDir, 'user_login', 'server', 'index.js')],
    url: backendHealthUrl,
    port: backendPort,
    healthUrl: backendHealthUrl,
  },
  {
    name: 'user-api',
    command: nodeCommand,
    args: [resolve(userPageDir, 'server', 'index.js')],
    url: userApiHealthUrl,
    port: userApiPort,
    healthUrl: userApiHealthUrl,
  },
  {
    name: 'admin-api',
    command: nodeCommand,
    args: [resolve(adminPageDir, 'adminServer.js')],
    cwd: adminPageDir,
    env: adminEnv,
    url: adminApiHealthUrl,
    port: adminApiPort,
    healthUrl: adminApiHealthUrl,
  },
  {
    name: 'login',
    command: nodeCommand,
    args: [resolve(loginPageDir, 'node_modules', 'vite', 'bin', 'vite.js')],
    cwd: loginPageDir,
    url: 'http://localhost:5176/login',
    port: 5176,
    healthUrl: 'http://localhost:5176/login',
  },
  {
    name: 'user',
    command: nodeCommand,
    args: [resolve(userPageDir, 'node_modules', 'vite', 'bin', 'vite.js')],
    cwd: userPageDir,
    url: 'http://localhost:5175/user',
    port: 5175,
    healthUrl: 'http://localhost:5175/user',
  },
  {
    name: 'admin',
    command: nodeCommand,
    args: [resolve(adminPageDir, 'node_modules', 'vite', 'bin', 'vite.js')],
    cwd: adminPageDir,
    url: 'http://localhost:5174/admin',
    port: 5174,
    healthUrl: 'http://localhost:5174/admin',
  },
  {
    name: 'mobile',
    command: nodeCommand,
    args: [resolve(mobileAppDir, 'node_modules', 'expo', 'bin', 'cli'), 'start', '--web', '--port', '8081'],
    cwd: mobileAppDir,
    url: 'http://localhost:8081',
    port: 8081,
  },
  {
    name: 'hub',
    command: nodeCommand,
    args: [resolve(rootDir, 'scripts', 'hub-server.mjs')],
    url: 'http://localhost:5173',
    port: 5173,
    healthUrl: 'http://localhost:5173',
  },
]

const children = new Map()
let shuttingDown = false

function checkHttpOk(url) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 1200 }, (response) => {
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
  if (!service.port) return true

  if (service.healthUrl && await checkHttpOk(service.healthUrl)) {
    console.log(`${service.name} already running on ${service.url}, skipping start`)
    return false
  }

  if (await checkPortOpen(service.port)) {
    console.warn(`Port ${service.port} is occupied by another process, skipping ${service.name} start`)
    return false
  }

  return true
}

async function probeService(service) {
  if (service.healthUrl && await checkHttpOk(service.healthUrl)) return 'ok'
  if (service.port && await checkPortOpen(service.port)) return 'port-open'
  return 'offline'
}

function colorFor(name) {
  const colors = {
    server: '\x1b[36m',
    'user-api': '\x1b[92m',
    'admin-api': '\x1b[92m',
    login: '\x1b[32m',
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
    cwd: service.cwd || rootDir,
    env: {
      ...process.env,
      ...sharedEnv,
      ...(service.env || {}),
      BROWSER: 'none',
      EXPO_NO_TELEMETRY: '1',
      FORCE_COLOR: '1',
    },
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
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

function stopChild(child) {
  if (child.killed) return
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  child.kill('SIGTERM')
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children.values()) {
    stopChild(child)
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

  if (smokeSeconds > 0) {
    setTimeout(async () => {
      console.log(`Dev smoke check after ${smokeSeconds}s:`)
      for (const service of services) {
        console.log(`- ${service.name}: ${await probeService(service)} (${service.url})`)
      }
      shutdown(0)
    }, smokeSeconds * 1000)
  }
}

main().catch((error) => {
  console.error(`Launcher failed: ${error.message}`)
  shutdown(1)
})
