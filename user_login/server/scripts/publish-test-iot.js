import mqtt from 'mqtt'

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883'
const topic = process.env.MQTT_TOPIC || 'ctip/sensor/plant-zone-01/proximity'

const payload = {
  source: 'IOT_SENSOR',
  event_type: 'ObjectCloseToPlant',
  sensor_id: 'plant-zone-01',
  location: 'Plant Zone 01',
  distance_cm: 14.6,
  threshold_cm: 20,
  status: 'triggered',
  severity: 'low',
}

const client = mqtt.connect(brokerUrl, {
  clientId: `ctip-test-publisher-${process.pid}-${Math.random().toString(16).slice(2)}`,
  clean: true,
  connectTimeout: 5000,
})

const finish = (exitCode) => {
  client.end(true, () => {
    process.exit(exitCode)
  })
}

const timeout = setTimeout(() => {
  console.error(`[mqtt-test] Timed out connecting to ${brokerUrl}`)
  finish(1)
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
  clearTimeout(timeout)
  console.error(`[mqtt-test] ${error.message}`)
  finish(1)
})
