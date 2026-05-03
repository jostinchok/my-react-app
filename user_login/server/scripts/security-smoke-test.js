import dotenv from 'dotenv'

dotenv.config()

const apiBaseUrl = (process.env.SECURITY_SMOKE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const deviceTokenAuthEnabled = ['1', 'true', 'yes', 'on'].includes(String(process.env.DEVICE_TOKEN_AUTH_ENABLED || '').toLowerCase())
const roleCheckEnabled = ['1', 'true', 'yes', 'on'].includes(String(process.env.ROLE_CHECK_ENABLED || '').toLowerCase())
const aiCameraToken = process.env.AI_CAMERA_TOKEN || ''
const iotSensorToken = process.env.IOT_SENSOR_TOKEN || ''

const results = []

const record = (name, passed, detail = '') => {
  results.push({ name, passed, detail })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`)
}

const request = async (path, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  return { response, body, text }
}

const expectStatus = async (name, path, options, expectedStatus) => {
  try {
    const result = await request(path, options)
    const passed = result.response.status === expectedStatus
    record(name, passed, `expected ${expectedStatus}, got ${result.response.status}`)
    return result
  } catch (error) {
    record(name, false, error.message)
    return null
  }
}

const aiIncidentPayload = (suffix) => ({
  id: `SEC-AI-${Date.now()}-${suffix}`,
  source: 'AI_CAMERA',
  eventType: 'TouchingPlants',
  severity: 'medium',
  status: 'New',
  timestamp: new Date().toISOString(),
  location: 'Security Smoke Test Zone',
  evidenceImage: '/evidence/ai/security-smoke-test.jpg',
  ai: {
    predictedClass: 'TouchingPlants',
    confidence: 0.91,
    margin: 0.31,
    bbox: [20, 30, 180, 210],
    probabilities: {
      TouchingPlants: 0.91,
      TouchingWildlife: 0.09,
    },
  },
  notes: 'Security smoke test incident.',
})

const iotIncidentPayload = (suffix, deviceToken = undefined) => ({
  id: `SEC-IOT-${Date.now()}-${suffix}`,
  source: 'IOT_SENSOR',
  event_type: 'ObjectCloseToPlant',
  sensor_id: 'plant-zone-01',
  location: 'Plant Zone 01',
  distance_cm: 12.3,
  threshold_cm: 20,
  topic: 'ctip/sensor/plant-zone-01/proximity',
  status: 'triggered',
  severity: 'low',
  ...(deviceToken ? { device_token: deviceToken } : {}),
})

const createAcceptedAiIncident = async () => {
  const headers = deviceTokenAuthEnabled ? { 'X-Device-Token': aiCameraToken } : {}
  const result = await expectStatus(
    'create valid AI incident for status tests',
    '/api/incidents',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(aiIncidentPayload('base')),
    },
    201
  )
  return result?.body?.incident?.id || null
}

const run = async () => {
  console.log(`Security smoke test target: ${apiBaseUrl}`)
  console.log(`DEVICE_TOKEN_AUTH_ENABLED=${deviceTokenAuthEnabled}`)
  console.log(`ROLE_CHECK_ENABLED=${roleCheckEnabled}`)
  console.log('')

  await expectStatus('health endpoint online', '/api/health', {}, 200)

  await expectStatus(
    'invalid source rejected',
    '/api/incidents',
    {
      method: 'POST',
      body: JSON.stringify({
        source: 'BAD_SOURCE',
        eventType: 'TouchingPlants',
      }),
    },
    400
  )

  await expectStatus(
    'invalid status rejected',
    '/api/incidents',
    {
      method: 'POST',
      body: JSON.stringify({
        source: 'IOT_SENSOR',
        event_type: 'ObjectCloseToPlant',
        status: 'Compromised',
      }),
    },
    400
  )

  const incidentsResult = await expectStatus('incidents endpoint readable', '/api/incidents', {}, 200)
  if (incidentsResult) {
    record(
      'incident API response hides absolute local paths',
      !incidentsResult.text.includes('/Users/'),
      incidentsResult.text.includes('/Users/') ? 'found /Users path in response' : 'no /Users path found'
    )
  }

  let incidentId = null

  if (deviceTokenAuthEnabled) {
    await expectStatus(
      'wrong AI device token rejected',
      '/api/incidents',
      {
        method: 'POST',
        headers: { 'X-Device-Token': 'wrong-token' },
        body: JSON.stringify(aiIncidentPayload('wrong-token')),
      },
      401
    )

    const acceptedAi = await expectStatus(
      'correct AI device token accepted',
      '/api/incidents',
      {
        method: 'POST',
        headers: { 'X-Device-Token': aiCameraToken },
        body: JSON.stringify(aiIncidentPayload('correct-token')),
      },
      201
    )
    incidentId = acceptedAi?.body?.incident?.id || null

    await expectStatus(
      'wrong IoT device token rejected',
      '/api/incidents',
      {
        method: 'POST',
        headers: { 'X-Device-Token': 'wrong-token' },
        body: JSON.stringify(iotIncidentPayload('wrong-token', 'wrong-token')),
      },
      401
    )

    await expectStatus(
      'correct IoT device token accepted',
      '/api/incidents',
      {
        method: 'POST',
        headers: { 'X-Device-Token': iotSensorToken },
        body: JSON.stringify(iotIncidentPayload('correct-token', iotSensorToken)),
      },
      201
    )
  } else {
    console.log('SKIP device-token checks because DEVICE_TOKEN_AUTH_ENABLED is not true.')
    incidentId = await createAcceptedAiIncident()
  }

  if (roleCheckEnabled) {
    if (!incidentId) {
      incidentId = await createAcceptedAiIncident()
    }

    if (!incidentId) {
      record('role checks need a created incident', false, 'no incident id available')
    } else {
      await expectStatus(
        'park_guide rejected for status PATCH',
        `/api/incidents/${encodeURIComponent(incidentId)}/status`,
        {
          method: 'PATCH',
          headers: { 'X-Actor-Role': 'park_guide' },
          body: JSON.stringify({ status: 'Acknowledged' }),
        },
        403
      )

      await expectStatus(
        'park_ranger accepted for status PATCH',
        `/api/incidents/${encodeURIComponent(incidentId)}/status`,
        {
          method: 'PATCH',
          headers: { 'X-Actor-Role': 'park_ranger' },
          body: JSON.stringify({ status: 'Acknowledged' }),
        },
        200
      )

      await expectStatus(
        'admin accepted for status PATCH',
        `/api/incidents/${encodeURIComponent(incidentId)}/status`,
        {
          method: 'PATCH',
          headers: { 'X-Actor-Role': 'admin' },
          body: JSON.stringify({ status: 'In Review' }),
        },
        200
      )
    }
  } else {
    console.log('SKIP role-check tests because ROLE_CHECK_ENABLED is not true.')
  }

  const failed = results.filter((item) => !item.passed)
  console.log('')
  console.log(`Security smoke test complete: ${results.length - failed.length}/${results.length} checks passed.`)

  if (failed.length > 0) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(`FAIL security smoke test crashed - ${error.message}`)
  process.exitCode = 1
})
