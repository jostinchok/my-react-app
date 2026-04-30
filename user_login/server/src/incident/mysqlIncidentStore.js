import {
  buildEvidenceFileMetadata,
  buildIncidentId,
  normalizeIncident,
  normalizeTimestamp,
  sanitizeIncidentPayload,
  sortIncidents,
  summarizeIncidents as summarizeIncidentList,
  toNumber,
} from './incidentUtils.js'

const ACTION_ACTORS = new Set(['system', 'admin', 'park_ranger', 'ai_camera', 'iot_sensor', 'api'])

const parseJsonColumn = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const jsonValue = (value) => (value === undefined ? null : JSON.stringify(value))

const toIsoTimestamp = (value) => {
  if (value instanceof Date) return value.toISOString()
  return normalizeTimestamp(value)
}

const formatMysqlDateTime = (value) =>
  normalizeTimestamp(value).slice(0, 23).replace('T', ' ')

const clampLimit = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 250
  return Math.min(Math.max(Math.trunc(parsed), 1), 1000)
}

const actorForIncident = (incident) => (incident.source === 'AI_CAMERA' ? 'ai_camera' : 'iot_sensor')

const safeActorRole = (value, fallback = 'api') => (ACTION_ACTORS.has(value) ? value : fallback)

const hydrateIncidentRows = async (connection, rows) => {
  if (!rows.length) return []

  const incidentIds = rows.map((row) => row.incident_id)
  const placeholders = incidentIds.map(() => '?').join(', ')

  const [aiRows] = await connection.query(
    `SELECT incident_id, predicted_class, confidence, margin, bbox_json, probabilities_json
     FROM monitoring_incident_ai_metadata
     WHERE incident_id IN (${placeholders})`,
    incidentIds
  )

  const [iotRows] = await connection.query(
    `SELECT incident_id, sensor_id, distance_cm, threshold_cm, mqtt_topic
     FROM monitoring_incident_iot_metadata
     WHERE incident_id IN (${placeholders})`,
    incidentIds
  )

  const [evidenceRows] = await connection.query(
    `SELECT incident_id, browser_url, file_name, mime_type, size_bytes, sha256
     FROM monitoring_incident_evidence_files
     WHERE incident_id IN (${placeholders})
     ORDER BY created_at ASC, evidence_id ASC`,
    incidentIds
  )

  const aiByIncident = new Map(aiRows.map((row) => [
    row.incident_id,
    {
      predictedClass: row.predicted_class,
      confidence: toNumber(row.confidence, 0),
      margin: toNumber(row.margin, 0),
      bbox: parseJsonColumn(row.bbox_json, []),
      probabilities: parseJsonColumn(row.probabilities_json, {
        TouchingPlants: 0,
        TouchingWildlife: 0,
      }),
    },
  ]))

  const iotByIncident = new Map(iotRows.map((row) => [
    row.incident_id,
    {
      sensorId: row.sensor_id,
      distanceCm: toNumber(row.distance_cm, null),
      thresholdCm: toNumber(row.threshold_cm, null),
      topic: row.mqtt_topic,
    },
  ]))

  const evidenceByIncident = new Map()
  for (const row of evidenceRows) {
    if (!evidenceByIncident.has(row.incident_id)) {
      evidenceByIncident.set(row.incident_id, row)
    }
  }

  return rows.map((row) => normalizeIncident({
    id: row.public_id,
    source: row.source,
    eventType: row.event_type,
    severity: row.severity,
    status: row.status,
    location: row.location,
    timestamp: toIsoTimestamp(row.occurred_at),
    notes: row.notes,
    evidenceImage: evidenceByIncident.get(row.incident_id)?.browser_url || null,
    ai: aiByIncident.get(row.incident_id) || null,
    iot: iotByIncident.get(row.incident_id) || null,
  })).filter(Boolean)
}

export const createMysqlIncidentStore = ({ pool } = {}) => {
  if (!pool) {
    throw new Error('MySQL incident store requires a mysql2 pool.')
  }

  const countExistingPublicIds = async (connection, publicIdPrefix) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS count FROM monitoring_incidents WHERE public_id LIKE ?',
      [`${publicIdPrefix}%`]
    )
    return Number(rows[0]?.count || 0)
  }

  const publicIdExists = async (connection, publicId) => {
    const [rows] = await connection.query(
      'SELECT incident_id FROM monitoring_incidents WHERE public_id = ? LIMIT 1',
      [publicId]
    )
    return rows.length > 0
  }

  const makeUniquePublicId = async (connection, preferredId, source, timestamp) => {
    const prefix = source === 'AI_CAMERA' ? 'AI' : 'IOT'
    const date = timestamp.slice(0, 10)
    const baseId = preferredId || buildIncidentId(
      source,
      timestamp,
      await countExistingPublicIds(connection, `${prefix}-${date}-`)
    )

    if (!(await publicIdExists(connection, baseId))) return baseId

    let index = 2
    let nextId = `${baseId}-${index}`
    while (await publicIdExists(connection, nextId)) {
      index += 1
      nextId = `${baseId}-${index}`
    }
    return nextId
  }

  const fetchIncidentByPublicId = async (publicId, connection = pool) => {
    const [rows] = await connection.query(
      `SELECT incident_id, public_id, source, event_type, severity, status, location, occurred_at, notes
       FROM monitoring_incidents
       WHERE public_id = ?
       LIMIT 1`,
      [publicId]
    )

    const hydrated = await hydrateIncidentRows(connection, rows)
    return hydrated[0] || null
  }

  return {
    type: 'mysql',
    persistence: 'mysql',

    async init() {
      await pool.query('SELECT 1')
      await pool.query('SELECT incident_id FROM monitoring_incidents LIMIT 1')
      return { ready: true }
    },

    async listIncidents({ limit = 250 } = {}) {
      const safeLimit = clampLimit(limit)
      const [rows] = await pool.query(
        `SELECT incident_id, public_id, source, event_type, severity, status, location, occurred_at, notes
         FROM monitoring_incidents
         ORDER BY occurred_at DESC, incident_id DESC
         LIMIT ${safeLimit}`
      )
      return sortIncidents(await hydrateIncidentRows(pool, rows))
    },

    async countIncidents() {
      const [rows] = await pool.query('SELECT COUNT(*) AS count FROM monitoring_incidents')
      return Number(rows[0]?.count || 0)
    },

    async summarizeIncidents() {
      const [rows] = await pool.query(
        `SELECT
           COUNT(*) AS total,
           SUM(source = 'AI_CAMERA') AS ai,
           SUM(source = 'IOT_SENSOR') AS iot,
           SUM(status = 'New') AS new_count,
           SUM(status = 'Reviewed') AS reviewed,
           SUM(status = 'Acknowledged') AS acknowledged,
           SUM(status = 'In Review') AS in_review,
           SUM(status = 'Resolved') AS resolved,
           SUM(status = 'False Alarm') AS false_alarm
         FROM monitoring_incidents`
      )

      const summary = rows[0] || {}
      return {
        total: Number(summary.total || 0),
        ai: Number(summary.ai || 0),
        iot: Number(summary.iot || 0),
        new: Number(summary.new_count || 0),
        reviewed: Number(summary.reviewed || 0),
        acknowledged: Number(summary.acknowledged || 0),
        inReview: Number(summary.in_review || 0),
        resolved: Number(summary.resolved || 0),
        falseAlarm: Number(summary.false_alarm || 0),
      }
    },

    async addIncident(input, options = {}) {
      const incident = normalizeIncident(input, options)
      if (!incident) {
        throw new Error('Incident must include source and event type.')
      }

      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()

        incident.id = await makeUniquePublicId(connection, incident.id, incident.source, incident.timestamp)
        const rawPayload = sanitizeIncidentPayload(input, incident)
        const [result] = await connection.query(
          `INSERT INTO monitoring_incidents
             (public_id, source, event_type, severity, status, location, occurred_at, notes, raw_payload)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            incident.id,
            incident.source,
            incident.eventType,
            incident.severity,
            incident.status,
            incident.location,
            formatMysqlDateTime(incident.timestamp),
            incident.notes,
            jsonValue(rawPayload),
          ]
        )

        const incidentId = result.insertId

        if (incident.ai) {
          await connection.query(
            `INSERT INTO monitoring_incident_ai_metadata
               (incident_id, predicted_class, confidence, margin, bbox_json, probabilities_json)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              incidentId,
              incident.ai.predictedClass,
              incident.ai.confidence,
              incident.ai.margin,
              jsonValue(incident.ai.bbox || []),
              jsonValue(incident.ai.probabilities || {}),
            ]
          )
        }

        if (incident.iot) {
          await connection.query(
            `INSERT INTO monitoring_incident_iot_metadata
               (incident_id, sensor_id, distance_cm, threshold_cm, mqtt_topic, received_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              incidentId,
              incident.iot.sensorId,
              incident.iot.distanceCm,
              incident.iot.thresholdCm,
              incident.iot.topic,
              formatMysqlDateTime(incident.timestamp),
            ]
          )
        }

        const evidence = buildEvidenceFileMetadata(incident.evidenceImage)
        if (evidence) {
          await connection.query(
            `INSERT INTO monitoring_incident_evidence_files
               (incident_id, evidence_type, browser_url, storage_key, file_name, mime_type, size_bytes, sha256)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              incidentId,
              evidence.evidenceType,
              evidence.browserUrl,
              evidence.storageKey,
              evidence.fileName,
              evidence.mimeType,
              evidence.sizeBytes,
              evidence.sha256,
            ]
          )
        }

        await connection.query(
          `INSERT INTO monitoring_incident_actions
             (incident_id, action_type, to_status, actor_role, actor_label, comment, raw_context)
           VALUES (?, 'created', ?, ?, ?, ?, ?)`,
          [
            incidentId,
            incident.status,
            actorForIncident(incident),
            incident.source,
            'Incident created by monitoring ingest.',
            jsonValue({ source: incident.source }),
          ]
        )

        await connection.commit()
        return await fetchIncidentByPublicId(incident.id, connection)
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    },

    async updateIncidentStatus(publicId, status, action = {}) {
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()

        const [rows] = await connection.query(
          `SELECT incident_id, status
           FROM monitoring_incidents
           WHERE public_id = ?
           LIMIT 1
           FOR UPDATE`,
          [publicId]
        )

        if (!rows.length) {
          await connection.rollback()
          return null
        }

        const incidentId = rows[0].incident_id
        const fromStatus = rows[0].status

        await connection.query(
          'UPDATE monitoring_incidents SET status = ? WHERE incident_id = ?',
          [status, incidentId]
        )

        await connection.query(
          `INSERT INTO monitoring_incident_actions
             (incident_id, action_type, from_status, to_status, actor_role, actor_label, comment, raw_context)
           VALUES (?, 'status_changed', ?, ?, ?, ?, ?, ?)`,
          [
            incidentId,
            fromStatus,
            status,
            safeActorRole(action.actorRole),
            action.actorLabel || 'Incident API',
            action.comment || null,
            jsonValue({ publicId }),
          ]
        )

        await connection.commit()
        return await fetchIncidentByPublicId(publicId, connection)
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    },

    summarizeIncidentList,
  }
}
