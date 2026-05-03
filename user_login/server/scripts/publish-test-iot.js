import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883'
const topic = process.env.MQTT_TOPIC || 'ctip/sensor/plant-zone-01/proximity'
const apiUrl = process.env.IOT_TEST_API_URL || 'http://localhost:4000/api/incidents'
const deviceToken = process.env.IOT_SENSOR_TOKEN || ''
const timestamp = new Date().toISOString()

const payload = {
  incident_id: `IOT-TEST-${timestamp.replace(/[:.]/g, '-')}`,
  source: 'IOT_SENSOR',
  event_type: 'ObjectCloseToPlant',
  sensor_id: 'plant-zone-01',
  location: 'Plant Zone 01',
  distance_cm: 14.6,
  threshold_cm: 20,
  timestamp,
  topic,
  status: 'triggered',
  severity: 'low',
}

if (deviceToken) {
  payload.device_token = deviceToken
}

let finished = false
let timeout

const client = mqtt.connect(brokerUrl, {
  clientId: `ctip-test-publisher-${process.pid}-${Math.random().toString(16).slice(2)}`,
  clean: true,
  connectTimeout: 5000,
})

const finish = (exitCode) => {
  if (finished) return
  finished = true
  client.end(true, () => {
    process.exit(exitCode)
  })
}

const fallbackToApi = async (reason) => {
  if (finished) return
  finished = true
  clearTimeout(timeout)

  client.end(true, async () => {
    try {
      console.warn(`[mqtt-test] MQTT unavailable (${reason}). Falling back to POST ${apiUrl}`)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(deviceToken ? { 'X-Device-Token': deviceToken } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const body = await response.json()
      console.log(`[mqtt-test] Simulated IoT incident via API: ${body.incident?.id || 'created'}`)
      console.log(JSON.stringify(payload))
      process.exit(0)
    } catch (error) {
      console.error(`[mqtt-test] Fallback API simulation failed: ${error.message}`)
      process.exit(1)
    }
  })
}

timeout = setTimeout(() => {
  fallbackToApi(`timed out connecting to ${brokerUrl}`)
}, 8000)

client.on('connect', () => {
  clearTimeout(timeout)
  const body = JSON.stringify(payload)
  client.publish(topic, body, { qos: 1 }, (error) => {
    if (error) {
      console.error(`[mqtt-test] Publish failed: ${error.message}`)
      finish(1)
      return
    }

    console.log(`[mqtt-test] Published to ${topic}`)
    console.log(body)
    setTimeout(() => finish(0), 1000)
  })
})

client.on('error', (error) => {
  fallbackToApi(error.message)
})
