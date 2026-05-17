import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import {
  buildIncidentId,
  normalizeIncident,
  sortIncidents,
  summarizeIncidents,
} from './incidentUtils.js'

const IOT_DEDUPE_WINDOW_MS = 10000

const buildActionId = () => `ACT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const appendAction = (incident, action) => ({
  ...incident,
  actionHistory: [action, ...(incident.actionHistory || [])],
  rangerRecommendations:
    action.actorRole === 'park_ranger' && action.recommendation
      ? [
          {
            id: action.id,
            recommendation: action.recommendation,
            note: action.comment || '',
            actorRole: action.actorRole,
            actorLabel: action.actorLabel,
            createdAt: action.createdAt,
          },
          ...(incident.rangerRecommendations || []),
        ]
      : (incident.rangerRecommendations || []),
})

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

  const incidentTimestampMs = (incident) => {
    const value = new Date(incident.timestamp).getTime()
    return Number.isFinite(value) ? value : 0
  }

  const findDuplicateIotIncidentIndex = (incident) => {
    if (incident.source !== 'IOT_SENSOR') return -1

    const exactIndex = incident.id ? incidents.findIndex((item) => item.id === incident.id) : -1
    if (exactIndex !== -1) return exactIndex

    const incidentTime = incidentTimestampMs(incident)
    const sensorId = incident.iot?.sensorId || 'plant-zone-01'

    return incidents.findIndex((item) =>
      item.source === 'IOT_SENSOR' &&
      item.eventType === incident.eventType &&
      (item.iot?.sensorId || 'plant-zone-01') === sensorId &&
      Math.abs(incidentTimestampMs(item) - incidentTime) <= IOT_DEDUPE_WINDOW_MS
    )
  }

  const mergeIotIncident = (existing, incoming) => ({
    ...existing,
    ...incoming,
    id: existing.id,
    status: existing.status || incoming.status,
    iot: {
      ...(existing.iot || {}),
      ...(incoming.iot || {}),
    },
    evidenceImage: incoming.evidenceImage || existing.evidenceImage,
    notes: incoming.evidenceImage ? incoming.notes : existing.notes || incoming.notes,
    actionHistory: incoming.actionHistory?.length ? incoming.actionHistory : existing.actionHistory || [],
    rangerRecommendations: incoming.rangerRecommendations?.length
      ? incoming.rangerRecommendations
      : existing.rangerRecommendations || [],
  })

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

      const duplicateIotIndex = findDuplicateIotIncidentIndex(incident)
      if (duplicateIotIndex !== -1) {
        incidents[duplicateIotIndex] = mergeIotIncident(incidents[duplicateIotIndex], incident)
        await persistRuntimeIncidents()
        return incidents[duplicateIotIndex]
      }

      incident.id = makeUniqueIncidentId(incident.id, incident.source, incident.timestamp)
      incidents = [incident, ...incidents].slice(0, maxRuntimeIncidents)
      await persistRuntimeIncidents()
      return incident
    },

    async updateIncidentStatus(id, status, action = {}) {
      const incidentIndex = incidents.findIndex((item) => item.id === id)
      if (incidentIndex === -1) return null

      const currentIncident = incidents[incidentIndex]
      const statusAction = {
        id: buildActionId(),
        type: 'status_changed',
        fromStatus: currentIncident.status,
        toStatus: status,
        actorRole: action.actorRole || 'api',
        actorLabel: action.actorLabel || 'Incident API',
        recommendation: null,
        comment: action.comment || '',
        createdAt: new Date().toISOString(),
      }

      incidents[incidentIndex] = appendAction({
        ...currentIncident,
        status,
      }, statusAction)
      await persistRuntimeIncidents()
      return incidents[incidentIndex]
    },

    async deleteIncident(id) {
      const incidentIndex = incidents.findIndex((item) => item.id === id)
      if (incidentIndex === -1) return null

      const [deletedIncident] = incidents.splice(incidentIndex, 1)
      await persistRuntimeIncidents()
      return deletedIncident
    },

    async addRangerRecommendation(id, recommendationInput = {}) {
      const incidentIndex = incidents.findIndex((item) => item.id === id)
      if (incidentIndex === -1) return null

      const action = {
        id: buildActionId(),
        type: 'note_added',
        fromStatus: incidents[incidentIndex].status,
        toStatus: null,
        actorRole: recommendationInput.actorRole || 'park_ranger',
        actorLabel: recommendationInput.actorLabel || 'Park Ranger alert console',
        recommendation: recommendationInput.recommendation,
        comment: recommendationInput.note || '',
        createdAt: new Date().toISOString(),
      }

      incidents[incidentIndex] = appendAction(incidents[incidentIndex], action)
      await persistRuntimeIncidents()
      return incidents[incidentIndex]
    },
  }
}
