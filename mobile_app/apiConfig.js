import { Platform } from 'react-native'
import Constants from 'expo-constants'

/** AsyncStorage key for a user-saved API base URL (see App.js login screen). */
export const API_BASE_URL_STORAGE_KEY = 'sfc_api_base_url'

const EXPO_WEB_DEV_PORTS = new Set(['8081', '19006'])

function isUnusableRelayHost(host) {
  if (!host) return true
  const h = String(host).toLowerCase()
  return (
    h.includes('exp.direct') ||
    h.includes('ngrok') ||
    h.includes('trycloudflare.com')
  )
}

export function isExpoWebDevServer() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false
  return EXPO_WEB_DEV_PORTS.has(String(window.location.port || ''))
}

/**
 * Auth/login API base URL.
 * - Expo web (:8081): same origin — Metro proxies /api/auth → :4000
 * - Expo Go / device: PC LAN IP on :4000 (or EXPO_PUBLIC_API_URL)
 */
export function getApiBaseUrl() {
  const env =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
    Constants.expoConfig?.extra?.apiUrl

  if (env && String(env).trim()) {
    return String(env).trim().replace(/\/$/, '')
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (isExpoWebDevServer()) {
        return window.location.origin.replace(/\/$/, '')
      }
      const { protocol, hostname } = window.location
      return `${protocol}//${hostname}:4000`
    }
    return 'http://localhost:8081'
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest?.debuggerHost ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost

  if (debuggerHost) {
    const host = String(debuggerHost).split(':')[0]?.replace(/^\[|\]$/g, '')
    if (host && !isUnusableRelayHost(host)) return `http://${host}:4000`
  }

  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) {
    const host = String(hostUri).split(':')[0]?.replace(/^\[|\]$/g, '')
    if (host && !isUnusableRelayHost(host)) return `http://${host}:4000`
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000'
  }

  return 'http://localhost:4000'
}

/**
 * Park Guide data API (:4001). On Expo web dev, same origin as auth (Metro proxy).
 */
export function getUserApiBaseUrl(authBaseUrl = getApiBaseUrl()) {
  const authBase = String(authBaseUrl || '').replace(/\/$/, '')
  if (!authBase) return 'http://localhost:4001'

  if (Platform.OS === 'web' && isExpoWebDevServer() && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '')
  }

  return authBase.replace(/:4000(?=\/|$)/, ':4001')
}

/**
 * Auth/login API must be on port 4000. Stored overrides sometimes point at :4001/:4002 by mistake.
 */
export function normalizeAuthApiBaseUrl(url) {
  const trimmed = String(url || '').trim().replace(/\/$/, '')
  if (!trimmed) return getApiBaseUrl()
  if (Platform.OS === 'web' && isExpoWebDevServer()) {
    return getApiBaseUrl()
  }
  return trimmed
    .replace(/:4001(?=\/|$)/, ':4000')
    .replace(/:4002(?=\/|$)/, ':4000')
}
