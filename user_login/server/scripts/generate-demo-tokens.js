import crypto from 'crypto'

const token = () => crypto.randomBytes(32).toString('hex')

console.log('Copy these sample lines into a local .env file only. Do not commit real token values.')
console.log('')
console.log('DEVICE_TOKEN_AUTH_ENABLED=true')
console.log('ROLE_CHECK_ENABLED=true')
console.log(`AI_CAMERA_TOKEN=${token()}`)
console.log(`IOT_SENSOR_TOKEN=${token()}`)
console.log(`ADMIN_DEMO_TOKEN=${token()}`)
console.log(`RANGER_DEMO_TOKEN=${token()}`)
