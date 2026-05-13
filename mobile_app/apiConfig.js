import { Platform } from 'react-native'
import Constants from 'expo-constants'

/** AsyncStorage key for a user-saved API base URL (see App.js login screen). */
export const API_BASE_URL_STORAGE_KEY = 'sfc_api_base_url'

function isUnusableRelayHost(host) {
  if (!host) return true
  const h = String(host).toLowerCase()
  return (
    h.includes('exp.direct') ||
    h.includes('ngrok') ||
    h.includes('trycloudflare.com')
  )
}

/**
 * Backend URL for Expo Go / emulator / web.
 * Physical phone: Metro passes your PC IP via Constants — we reuse it for port 4000.
 * Override anytime: EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:4000 (restart Expo after changing).
 */
export function getApiBaseUrl() {
  const env =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
    Constants.expoConfig?.extra?.apiUrl

  if (env && String(env).trim()) {
    return String(env).trim().replace(/\/$/, '')
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const { protocol, hostname } = window.location
      return `${protocol}//${hostname}:4000`
    }
    return 'http://localhost:4000'
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