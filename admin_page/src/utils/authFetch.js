export const getAuthToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('sfc_session') || '{}')
    return session.token || localStorage.getItem('sfc_token') || ''
  } catch {
    return localStorage.getItem('sfc_token') || ''
  }
}

export const authFetch = (url, options = {}) => {
  const token = getAuthToken()

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
}