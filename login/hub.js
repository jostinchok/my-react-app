const checks = [
  { key: 'backend', url: '/api/health' },
  { key: 'incidents', url: '/api/incidents' },
  { key: 'summary', url: '/api/incidents/summary' },
  { key: 'user', url: '/user' },
  { key: 'admin', url: '/admin' },
  { key: 'ranger', url: '/admin/ranger' },
  { key: 'mobile', url: 'http://localhost:8081' },
]

function setStatus(key, status) {
  const el = document.querySelector(`[data-status-for="${key}"]`)
  if (!el) return
  el.textContent = status
  el.classList.remove('online', 'offline')
  el.classList.add(status === 'online' ? 'online' : 'offline')
}

async function checkService({ key, url }) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1800)
    const response = await fetch(url, {
      method: 'GET',
      mode: key === 'mobile' ? 'no-cors' : 'cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (key === 'mobile' || response.ok || response.status < 500) {
      setStatus(key, 'online')
      return
    }
    setStatus(key, 'offline')
  } catch {
    setStatus(key, 'offline')
  }
}

function refreshStatuses() {
  checks.forEach(checkService)
}

refreshStatuses()
setInterval(refreshStatuses, 10000)
