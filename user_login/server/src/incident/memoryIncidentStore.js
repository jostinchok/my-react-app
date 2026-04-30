import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import {
  buildIncidentId,
  normalizeIncident,
  sortIncidents,
  summarizeIncidents,
} from './incidentUtils.js'

export const createMemoryIncidentStore = ({
  runtimeIncidentFile,
  maxRuntimeIncidents = 250,
} = {}) => {
  let incidents = []

  const readRuntimeIncidents = () => {
    try {
      if (!runtimeIncidentFile || !fs.existsSync(runtimeIncidentFile)) return []
      const parsed = JSON.parse(fs.readFileSync(runtimeIncidentFile, 'utf8'))
      return Array.isArray(parsed) ? parsed.map((item) => normalizeIncident(item)).filter(Boolean) : []
    } catch (error) {
      console.warn(`[incidents] Runtime incident store ignored: ${error.message}`)
      return []
    }
  }

  const persistRuntimeIncidents = async () => {
    if (!runtimeIncidentFile) return
    await fsPromises.mkdir(path.dirname(runtimeIncidentFile), { recursive: true })
    await fsPromises.writeFile(runtimeIncidentFile, JSON.stringify(incidents, null, 2), 'utf8')
  }

  const makeUniqueIncidentId = (preferredId, source, timestamp) => {
    const prefix = source === 'AI_CAMERA' ? 'AI' : 'IOT'
    const date = timestamp.slice(0, 10)
    const matchingCount = incidents.filter((item) => item.id?.startsWith(`${prefix}-${date}-`)).length
    const baseId = preferredId || buildIncidentId(source, timestamp, matchingCount)
    if (!incidents.some((item) => item.id === baseId)) return baseId

    let index = 2
    let nextId = `${baseId}-${index}`
    while (incidents.some((item) => item.id === nextId)) {
      index += 1
      nextId = `${baseId}-${index}`
    }
    return nextId
  }

  return {
    type: 'memory',
    persistence: 'local-json',
    runtimeIncidentFile,

    async init() {
      incidents = readRuntimeIncidents()
      return { count: incidents.length }
    },

    async listIncidents() {
      return sortIncidents(incidents)
    },

    async countIncidents() {
      return incidents.length
    },

    async summarizeIncidents() {
      return summarizeIncidents(incidents)
    },

    async addIncident(input, options = {}) {
      const incident = normalizeIncident(input, options)
      if (!incident) {
        throw new Error('Incident must include source and event type.')
      }

      incident.id = makeUniqueIncidentId(incident.id, incident.source, incident.timestamp)
      incidents = [incident, ...incidents].slice(0, maxRuntimeIncidents)
      await persistRuntimeIncidents()
      return incident
    },

    async updateIncidentStatus(id, status) {
      const incidentIndex = incidents.findIndex((item) => item.id === id)
      if (incidentIndex === -1) return null

      incidents[incidentIndex] = {
        ...incidents[incidentIndex],
        status,
      }
      await persistRuntimeIncidents()
      return incidents[incidentIndex]
    },
  }
}
