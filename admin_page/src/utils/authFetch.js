export const consumeAuthHandoff = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return

  const rawHash = window.location.hash?.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash || ''
  if (!rawHash) return

  const params = new URLSearchParams(rawHash)
  const token = params.get('sfc_token') || ''
  const sessionText = params.get('sfc_session') || ''
  if (!token && !sessionText) return

  if (token) localStorage.setItem('sfc_token', token)

  if (sessionText) {
    try {
      const session = JSON.parse(sessionText)
      localStorage.setItem('sfc_session', JSON.stringify({
        ...session,
        token: session.token || token,
      }))
    } catch {
      localStorage.setItem('sfc_session', sessionText)
    }
  }

  window.history.replaceState(
    window.history.state,
    document.title,
    `${window.location.pathname}${window.location.search}`
  )
}

export const getAuthToken = () => {
  consumeAuthHandoff()

  try {
    const session = JSON.parse(localStorage.getItem('sfc_session') || '{}')
    return session.token || localStorage.getItem('sfc_token') || ''
  } catch {
    return localStorage.getItem('sfc_token') || ''
  }
}

export const authFetch = (url, options = {}) => {
  const token = getAuthToken()
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(url, {
    ...options,
    headers,
  })
}
