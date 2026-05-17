const configured = String(import.meta.env.VITE_ADMIN_API_BASE_URL || '').trim().replace(/\/$/, '')

/**
 * In dev, empty base uses Vite proxy (/api → admin API on :4002) and avoids CORS.
 * Set VITE_ADMIN_API_BASE_URL when the admin UI and API run on different hosts.
 */
export const API_BASE_URL = configured || (import.meta.env.DEV ? '' : 'http://localhost:4002')
