import path from 'node:path'

const demoJwtSecret = 'dev-secret-change-this'

const enabled = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())

const parseOriginList = (value = '') =>
  String(value)
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

export const createCorsOptions = ({
  defaultOrigins = [],
  credentials = false,
  methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders = ['Content-Type', 'Authorization'],
} = {}) => {
  const configuredOrigin = String(process.env.CORS_ORIGIN || '').trim()
  const allowAnyOrigin = configuredOrigin === '*' && enabled(process.env.ALLOW_ANY_CORS_ORIGIN)
  const configuredOrigins = configuredOrigin && configuredOrigin !== '*'
    ? parseOriginList(configuredOrigin)
    : []
  const allowedOrigins = new Set([
    ...defaultOrigins.map((origin) => String(origin).replace(/\/+$/, '')),
    ...configuredOrigins,
  ])

  return {
    origin(origin, callback) {
      if (allowAnyOrigin || !origin || allowedOrigins.has(String(origin).replace(/\/+$/, ''))) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
    credentials,
    methods,
    allowedHeaders,
    optionsSuccessStatus: 204,
  }
}

export const getJwtSecret = (serviceName = 'API') => {
  const secret = process.env.JWT_SECRET || demoJwtSecret
  const production = process.env.NODE_ENV === 'production'
  if (production && (!process.env.JWT_SECRET || secret === demoJwtSecret || secret.length < 32)) {
    throw new Error(`${serviceName}: set a strong JWT_SECRET of at least 32 characters before running in production.`)
  }
  return secret
}

const attachmentExtensions = new Set(['.html', '.htm', '.svg', '.js', '.mjs', '.json', '.xml'])

const safeAttachmentName = (filePath) =>
  path.basename(filePath).replace(/["\\\r\n]/g, '_') || 'download'

export const createSafeStaticOptions = () => ({
  setHeaders(res, filePath) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
    res.setHeader('Cache-Control', 'no-store')

    if (attachmentExtensions.has(path.extname(filePath).toLowerCase())) {
      res.setHeader('Content-Disposition', `attachment; filename="${safeAttachmentName(filePath)}"`)
    }
  },
})

export const parseBase64DataUrl = (dataUrl) => {
  const match = /^data:([^;,]+)(?:;[^;,]+)*;base64,([a-zA-Z0-9+/=\s]+)$/i.exec(String(dataUrl || '').trim())
  if (!match) return null
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2].replace(/\s+/g, ''), 'base64'),
  }
}

export const defaultBlockedUploadExtensions = new Set([
  '.bat',
  '.cmd',
  '.com',
  '.exe',
  '.hta',
  '.htm',
  '.html',
  '.jar',
  '.js',
  '.mjs',
  '.msi',
  '.php',
  '.ps1',
  '.sh',
  '.svg',
])

export const defaultAllowedUploadMimeTypes = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain',
])

export const assertSafeUpload = ({
  fileName,
  mimeType,
  sizeBytes,
  maxBytes,
  allowedMimeTypes = defaultAllowedUploadMimeTypes,
  allowedMimePrefixes = ['image/', 'video/'],
  blockedExtensions = defaultBlockedUploadExtensions,
}) => {
  const extension = path.extname(String(fileName || '')).toLowerCase()
  const normalizedMime = String(mimeType || '').toLowerCase()
  const allowedByType = allowedMimeTypes.has(normalizedMime) ||
    allowedMimePrefixes.some((prefix) => normalizedMime.startsWith(prefix))

  if (blockedExtensions.has(extension)) {
    const error = new Error('This file type is blocked for security.')
    error.statusCode = 400
    throw error
  }

  if (maxBytes && Number(sizeBytes || 0) > maxBytes) {
    const error = new Error(`Uploaded file is too large. Maximum size is ${Math.floor(maxBytes / 1024 / 1024)}MB.`)
    error.statusCode = 400
    throw error
  }

  if (!allowedByType) {
    const error = new Error('This upload type is not allowed.')
    error.statusCode = 400
    throw error
  }
}
