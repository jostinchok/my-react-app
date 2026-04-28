import { spawn } from 'node:child_process'

const services = [
  {
    name: 'server',
    command: 'npm',
    args: ['run', 'dev:server'],
    url: 'http://localhost:4000/api/health',
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

console.log('Starting SFC review workspace:')
for (const service of services) {
  console.log(`- ${service.name}: ${service.url}`)
  startService(service)
}
