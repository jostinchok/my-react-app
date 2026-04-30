const DEFAULT_API_BASE_URL = 'http://localhost:4000'

export const MYSQL_DATABASE_NAME = 'park_guide_database'

export const API_LINKS = {
  modules:
    import.meta.env.VITE_MODULES_API_URL ||
    `${import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/api/training-modules`,
  profile:
    import.meta.env.VITE_PROFILE_API_URL ||
    `${import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/api/user-profile`,
  certifications:
    import.meta.env.VITE_CERTIFICATIONS_API_URL ||
    `${import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/api/certifications`,
  notifications:
    import.meta.env.VITE_NOTIFICATIONS_API_URL ||
    `${import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/api/notifications`,
  schedule:
    import.meta.env.VITE_SCHEDULE_API_URL ||
    `${import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/api/schedule`,
}

export const DB_SQL_SCHEMA = {
  sourceFile: 'database/db.sql',
  database: MYSQL_DATABASE_NAME,
  tables: {
    roles: ['role_id', 'role_name'],
    users: ['user_id', 'role_id', 'name', 'email', 'password_hash', 'created_at'],
    password_reset_tokens: ['token_id', 'user_id', 'token_hash', 'expires_at', 'used_at', 'created_at'],
    guide_profiles: ['guide_id', 'phone', 'organization', 'years_experience', 'address', 'avatar_url', 'status'],
    training_modules: [
      'module_id',
      'title',
      'description',
      'category',
      'park',
      'level',
      'duration',
      'format',
      'image_url',
      'accent_color',
      'badge_name',
      'objectives',
      'created_by',
      'created_at',
    ],
    lessons: ['lesson_id', 'module_id', 'title', 'content', 'media_url'],
    quizzes: ['quiz_id', 'module_id', 'title'],
    questions: ['question_id', 'quiz_id', 'question_text'],
    options: ['option_id', 'question_id', 'option_text', 'is_correct'],
    progress: ['progress_id', 'user_id', 'module_id', 'completed_lessons', 'quiz_passed', 'quiz_score', 'status', 'completion_date'],
    certifications: ['cert_id', 'user_id', 'module_id', 'title', 'status', 'issue_date', 'expiry_date'],
    incidents: ['incident_id', 'guide_id', 'incident_type', 'confidence', 'timestamp', 'status'],
    evidence: ['evidence_id', 'incident_id', 'file_path', 'file_type', 'uploaded_at'],
    notifications: ['notification_id', 'user_id', 'title', 'type', 'message', 'is_read', 'created_at'],
    schedule: ['schedule_id', 'user_id', 'module_id', 'title', 'date', 'location', 'type', 'status', 'created_at'],
  },
}

export const DATABASE_TABLE_TEMPLATE = {
  users: ['user_id', 'role_id', 'name', 'email', 'created_at'],
  guide_profiles: ['guide_id', 'phone', 'organization', 'years_experience', 'address', 'avatar_url', 'status'],
  training_modules: [
    'module_id',
    'title',
    'description',
    'category',
    'park',
    'level',
    'duration',
    'format',
    'image_url',
    'accent_color',
    'badge_name',
    'objectives',
    'created_by',
    'created_at',
  ],
  lessons: ['lesson_id', 'module_id', 'title', 'content', 'media_url'],
  quizzes: ['quiz_id', 'module_id', 'title'],
  questions: ['question_id', 'quiz_id', 'question_text'],
  options: ['option_id', 'question_id', 'option_text', 'is_correct'],
  progress: ['progress_id', 'user_id', 'module_id', 'completed_lessons', 'quiz_passed', 'quiz_score', 'status', 'completion_date'],
  certifications: ['cert_id', 'user_id', 'module_id', 'title', 'status', 'issue_date', 'expiry_date'],
  notifications: ['notification_id', 'user_id', 'title', 'type', 'message', 'is_read', 'created_at'],
  schedule: ['schedule_id', 'user_id', 'module_id', 'title', 'date', 'location', 'type', 'status', 'created_at'],
}

export const PROFILE_FIELD_RULES = {
  readOnlyFromDatabase: ['displayName', 'email', 'assignedPark', 'position', 'guideId', 'role'],
  editableAndSavedToDatabase: ['phone', 'yearsExperience', 'address'],
  dbSqlReadyFields: {
    phone: 'guide_profiles.phone',
    displayName: 'users.name',
    email: 'users.email',
    assignedPark: 'guide_profiles.organization',
    guideId: 'guide_profiles.guide_id',
    role: 'roles.role_name',
  },
  needsDbSqlColumn: {
    avatar: 'guide_profiles.avatar_url is available for loading profile photos. Upload storage still needs backend handling.',
  },
}

const placeholderImage = '/training/protected-areas.png'

export const MYSQL_ENDPOINT_QUERY_TEMPLATE = {
  modules: `
    SELECT
      tm.module_id,
      tm.title,
      tm.description,
      tm.category,
      tm.park,
      tm.level,
      tm.duration,
      tm.format,
      tm.image_url,
      tm.accent_color,
      tm.badge_name,
      tm.objectives,
      tm.created_at
    FROM training_modules tm
    ORDER BY tm.created_at DESC;
  `,
  moduleLessons: `
    SELECT lesson_id, module_id, title, content, media_url
    FROM lessons
    WHERE module_id IN (?)
    ORDER BY lesson_id ASC;
  `,
  moduleQuiz: `
    SELECT
      q.quiz_id,
      q.module_id,
      q.title AS quiz_title,
      qs.question_id,
      qs.question_text,
      o.option_id,
      o.option_text,
      o.is_correct
    FROM quizzes q
    LEFT JOIN questions qs ON qs.quiz_id = q.quiz_id
    LEFT JOIN \`options\` o ON o.question_id = qs.question_id
    WHERE q.module_id IN (?)
    ORDER BY q.quiz_id ASC, qs.question_id ASC, o.option_id ASC;
  `,
  profile: `
    SELECT
      u.user_id,
      u.name,
      u.email,
      r.role_name,
      gp.phone,
      gp.organization,
      gp.years_experience,
      gp.address,
      gp.avatar_url,
      gp.status
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN guide_profiles gp ON gp.guide_id = u.user_id
    WHERE u.user_id = ?;
  `,
  certifications: `
    SELECT
      c.cert_id,
      c.user_id,
      c.module_id,
      c.title,
      c.status,
      c.issue_date,
      c.expiry_date,
      tm.title AS module_title
    FROM certifications c
    LEFT JOIN training_modules tm ON tm.module_id = c.module_id
    WHERE c.user_id = ?
    ORDER BY c.issue_date DESC;
  `,
  notifications: `
    SELECT notification_id, user_id, title, type, message, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC;
  `,
  progress: `
    SELECT progress_id, user_id, module_id, completed_lessons, quiz_passed, quiz_score, status, completion_date
    FROM progress
    WHERE user_id = ?;
  `,
  schedule: `
    SELECT schedule_id, user_id, module_id, title, date, location, type, status, created_at
    FROM schedule
    WHERE user_id = ?
    ORDER BY date ASC, created_at DESC;
  `,
}

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '')

const parseList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

const asText = (value, fallback = '') => String(firstValue(value, fallback))

const normalizeOptions = (value) =>
  parseList(value).map((option, index) =>
    typeof option === 'string'
      ? option
      : asText(option.option_text || option.text || option.label, `Option ${index + 1}`)
  )

export const normalizeModuleRow = (row, index = 0) => {
  const id = asText(firstValue(row.id, row.module_id, row.course_id), `module-${index + 1}`)
  const title = asText(firstValue(row.title, row.module_title, row.course_name), 'Untitled module')
  const lessons = parseList(row.lessons).map((lesson, lessonIndex) =>
    typeof lesson === 'string'
      ? lesson
      : asText(firstValue(lesson.title, lesson.lesson_title, lesson.content), `Lesson ${lessonIndex + 1}`)
  )
  const resources = parseList(row.resources).map((resource, resourceIndex) => ({
    id: asText(firstValue(resource.id, resource.resource_id), `${id}-resource-${resourceIndex + 1}`),
    title: asText(firstValue(resource.title, resource.name, resource.file_name), `Resource ${resourceIndex + 1}`),
    type: asText(firstValue(resource.type, resource.file_type), 'File'),
  }))
  const quizOptions = normalizeOptions(firstValue(row.quiz?.options, row.quiz_options))

  return {
    id,
    title,
    subtitle: asText(firstValue(row.subtitle, row.description), 'Module description will appear here after database data is loaded.'),
    category: asText(firstValue(row.category, row.type), 'Database Module'),
    park: asText(firstValue(row.park, row.assigned_park), 'All Parks'),
    level: asText(row.level, 'Beginner'),
    duration: asText(firstValue(row.duration, row.total_contact_hours && `${row.total_contact_hours} hours`), 'Self-paced'),
    format: asText(row.format, 'Online'),
    image: asText(firstValue(row.image, row.image_url, row.thumbnail_url), placeholderImage),
    accent: asText(firstValue(row.accent, row.accent_color), '#00b894'),
    badge: asText(firstValue(row.badge, row.badge_name), `${title} Badge`),
    objectives: parseList(row.objectives),
    lessons,
    resources,
    quiz: {
      question: asText(firstValue(row.quiz?.question, row.quiz_question), 'Assessment question will appear here.'),
      options: quizOptions,
      answer: Number.isInteger(row.quiz?.answer) ? row.quiz.answer : 0,
    },
  }
}

export const normalizeProfileRow = (row = {}) => ({
  id: asText(firstValue(row.user_id, row.guide_id, row.id)),
  guideId: asText(firstValue(row.guide_id, row.guideId, row.user_id)),
  displayName: asText(firstValue(row.display_name, row.name)),
  email: asText(row.email),
  phone: asText(row.phone),
  assignedPark: asText(firstValue(row.assigned_park, row.park, row.organization)),
  position: asText(firstValue(row.position, row.role_name), 'Park Guide'),
  yearsExperience: asText(firstValue(row.years_experience, row.yearsExperience)),
  address: asText(row.address),
  role: asText(firstValue(row.role, row.role_name), 'guide'),
  status: asText(row.status, 'active'),
  avatar: asText(firstValue(row.avatar_url, row.avatar)),
})

export const normalizeCertificateRow = (row = {}) => ({
  id: asText(firstValue(row.id, row.cert_id)),
  moduleId: asText(firstValue(row.moduleId, row.module_id)),
  title: asText(firstValue(row.title, row.module_title), 'Training credential'),
  status: asText(row.status, row.issue_date ? 'Issued' : 'Pending'),
  issueDate: asText(firstValue(row.issueDate, row.issue_date), 'Pending'),
  expiryDate: asText(firstValue(row.expiryDate, row.expiry_date), 'Not set'),
})

export const normalizeNotificationRow = (row = {}) => ({
  id: asText(firstValue(row.id, row.notification_id)),
  title: asText(row.title, 'Notification'),
  body: asText(firstValue(row.body, row.message)),
  type: asText(row.type, 'training'),
  read: Boolean(firstValue(row.read, row.is_read, false)),
  createdAt: asText(firstValue(row.createdAt, row.created_at), new Date().toISOString()),
})

export const normalizeScheduleRow = (row = {}) => ({
  id: asText(firstValue(row.id, row.schedule_id, row.progress_id)),
  moduleId: asText(firstValue(row.moduleId, row.module_id)),
  title: asText(firstValue(row.title, row.module_title), 'Training schedule item'),
  date: asText(firstValue(row.date, row.schedule_date, row.due_date, row.start_date, row.completion_date)),
  location: asText(row.location, 'Self-paced'),
  type: asText(firstValue(row.type, row.status), 'Training'),
  status: asText(row.status, 'Scheduled'),
})

export const normalizeCollection = (payload, keys, normalizer) => {
  const keyedSource = keys.map((key) => payload?.[key]).find((value) => value)
  const source = Array.isArray(keyedSource)
    ? keyedSource
    : keyedSource && typeof keyedSource === 'object'
      ? [keyedSource]
      : Array.isArray(payload)
        ? payload
        : payload && typeof payload === 'object' && keys.length === 1
          ? [payload]
          : []
  return source.map(normalizer)
}

export const loadDatabaseFrame = async (url, keys, normalizer) => {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
    throw new Error(payload.message || `Unable to load ${url}.`)
  }
  
  return normalizeCollection(payload, keys, normalizer)
}

export const saveProfileField = async (field, value) => {
  const response = await fetch(API_LINKS.profile, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Unable to save ${field}.`)
  }

  return payload
}

export const saveScheduleItem = async (item) => {
  const response = await fetch(API_LINKS.schedule, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to save schedule item.')
  }

  return payload
}
