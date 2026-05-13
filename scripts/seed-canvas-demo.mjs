const adminApiBaseUrl =
  process.env.ADMIN_API_BASE_URL ||
  process.env.VITE_ADMIN_API_BASE_URL ||
  process.env.ADMIN_API_PUBLIC_URL ||
  'http://localhost:4002'

const seedUrl = `${adminApiBaseUrl.replace(/\/$/, '')}/api/demo/canvas-seed`

async function main() {
  console.log(`Seeding Canvas demo courses through ${seedUrl}`)

  const response = await fetch(seedUrl, { method: 'POST' })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Seed request failed with HTTP ${response.status}.`)
  }

  console.log(payload.message || 'Canvas demo courses inserted.')
  for (const course of payload.courses || []) {
    console.log(`- ${course.id}: ${course.name || 'Demo course'} (${course.modules || 0} modules, ${course.items || 0} items)`)
  }
}

main().catch((error) => {
  console.error(`Canvas demo seed failed: ${error.message}`)
  process.exit(1)
})
