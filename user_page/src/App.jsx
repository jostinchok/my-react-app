import { useEffect, useMemo, useState } from 'react'
import './App.css'
import FileManager from './components/FileManager'
import {
  demoStorageVersion,
  demoUsers,
  roleBoundaries,
  supportTopics,
} from './data/trainingPlatform'
import {
  API_LINKS,
  loadDatabaseFrame,
  normalizeCertificateRow,
  normalizeModuleRow,
  normalizeNotificationRow,
  normalizeProfileRow,
  normalizeScheduleRow,
  loadCourseFiles,
  deleteScheduleItem,
  loadCanvasProgress,
  saveAvatarUpload,
  saveCanvasItemProgress,
  saveCanvasQuizAttempt,
  saveProfileField,
  saveScheduleItem,
  updateScheduleItem,
} from './services/databaseFrames'

const STORAGE_KEY = 'sfc_citrus_training_demo'
const userBasePath = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`
const logoSrc = `${userBasePath}sfc-citrus-logo.webp`
const editableProfileFields = new Set(['displayName', 'email', 'phone', 'yearsExperience', 'address'])

const readInitialShell = () => {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const requestedSection = cleanText(params.get('section'), 'overview')
  const sectionToTab = {
    overview: 'modules',
    modules: 'modules',
    item: 'module',
    progress: 'progress',
    files: 'files',
    completion: 'certificates',
  }
  const requestedTab = cleanText(params.get('tab'), sectionToTab[requestedSection], 'dashboard')
  const allowedTabs = new Set(['dashboard', 'modules', 'module', 'progress', 'files', 'certificates', 'notifications', 'schedule', 'profile'])
  const allowedSections = new Set(['overview', 'modules'])
  return {
    activeTab: allowedTabs.has(requestedTab) ? requestedTab : 'dashboard',
    courseSubView: allowedSections.has(requestedSection) ? requestedSection : 'overview',
    courseId: cleanText(params.get('course')),
  }
}

const cloneSeedUsers = () => JSON.parse(JSON.stringify(demoUsers))

const readStoredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed?.version === demoStorageVersion && Array.isArray(parsed.users)) {
      return parsed.users
    }
  } catch {
    // Fall through to seed data.
  }
  return cloneSeedUsers()
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'Not scheduled'
  return new Date(dateValue).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const cleanText = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const textValue = String(value).trim()
    if (!textValue || textValue.toLowerCase() === 'undefined' || textValue.toLowerCase() === 'null') continue
    return textValue
  }
  return ''
}

const validImageSrc = (value) => Boolean(cleanText(value))

const initials = (name = 'User') =>
  cleanText(name, 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const parseJsonMaybe = (value) => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text) return value
  if (!['[', '{'].includes(text[0])) return value
  try {
    return JSON.parse(text)
  } catch {
    return value
  }
}

const toList = (value) => {
  const parsed = parseJsonMaybe(value)
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') return [parsed]
  if (typeof parsed === 'string') {
    return parsed
      .split(/\r?\n|\s*;\s*/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const toPlainText = (value) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    return cleanText(value.title, value.name, value.label, value.text, value.content, value.body, value.description)
  }
  return ''
}

const normalizeItemType = (value) => {
  const text = cleanText(value, 'page').toLowerCase().replace(/[_-]+/g, ' ')
  if (text.includes('external') || text === 'url' || text === 'link') return 'link'
  if (text.includes('image') || text.includes('photo') || text.includes('diagram')) return 'image'
  if (text.includes('video') || text.includes('youtube')) return 'video'
  if (text.includes('quiz') || text.includes('assessment')) return 'quiz'
  if (text.includes('check')) return 'checklist'
  if (text.includes('file') || text.includes('pdf') || text.includes('document') || text.includes('slide')) return 'file'
  if (text.includes('text')) return 'text'
  return 'page'
}

const CANVAS_ITEM_META = {
  page: { label: 'Page', icon: '▤', helper: 'Rich text learning page' },
  text: { label: 'Text', icon: '≡', helper: 'Short text lesson' },
  file: { label: 'File', icon: '▣', helper: 'Document, slide, or downloadable resource' },
  image: { label: 'Image', icon: '▧', helper: 'Diagram, screenshot, or evidence image' },
  video: { label: 'Video', icon: '▶', helper: 'Training video or walkthrough' },
  link: { label: 'External Link', icon: '🔗', helper: 'Website, Canvas page, or reference' },
  quiz: { label: 'Quiz', icon: '?', helper: 'Scenario question with answer choices' },
  checklist: { label: 'Checklist', icon: '✓', helper: 'Step-by-step completion list' },
}

const itemTypeMeta = (type) => CANVAS_ITEM_META[normalizeItemType(type)] || CANVAS_ITEM_META.page

const normalizeCanvasItem = (rawItem, index, module) => {
  const raw = rawItem && typeof rawItem === 'object' ? rawItem : { title: rawItem }
  const type = normalizeItemType(raw.type || raw.itemType || raw.item_type || raw.contentType || raw.content_type || raw.kind)
  const id = cleanText(
    raw.id,
    raw.itemId,
    raw.item_id,
    raw.moduleItemId,
    raw.module_item_id,
    `${module?.id || 'module'}-item-${index + 1}`
  )
  const title = cleanText(raw.title, raw.name, raw.itemTitle, raw.item_title, raw.label, `${itemTypeMeta(type).label} ${index + 1}`)
  const description = cleanText(raw.description, raw.subtitle, raw.summary, raw.caption, raw.body, raw.content, '')
  const content = cleanText(raw.content, raw.pageContent, raw.page_content, raw.text, raw.body, raw.markdown, raw.description, '')
  const url = cleanText(raw.url, raw.href, raw.link, raw.fileUrl, raw.file_url, raw.mediaUrl, raw.media_url, raw.image, raw.imageUrl, raw.image_url)
  const sortOrder = Number(raw.sortOrder ?? raw.sort_order ?? raw.order ?? raw.position ?? index + 1)

  return {
    ...raw,
    id,
    type,
    title,
    description,
    content,
    url,
    status: cleanText(raw.status, raw.published ? 'Published' : '', 'Published'),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1,
    moduleId: cleanText(raw.moduleId, raw.module_id, module?.id),
    moduleTitle: cleanText(module?.title, raw.moduleTitle, raw.module_title),
  }
}

const getCanvasItems = (module) => {
  if (!module) return []
  const directItems = toList(
    module.items ||
    module.moduleItems ||
    module.module_items ||
    module.canvasItems ||
    module.canvas_items ||
    module.learningItems ||
    module.learning_items
  )

  if (directItems.length > 0) {
    return directItems
      .map((item, index) => normalizeCanvasItem(item, index, module))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const lessonItems = toList(module.lessons).map((lesson, index) =>
    normalizeCanvasItem(
      {
        id: `${module.id}-lesson-${index + 1}`,
        type: 'page',
        title: toPlainText(lesson) || `Lesson ${index + 1}`,
        description: 'Learning page generated from the lesson checklist.',
        content: toPlainText(lesson),
        sortOrder: index + 1,
      },
      index,
      module
    )
  )

  const resourceItems = toList(module.resources).map((resource, index) =>
    normalizeCanvasItem(
      {
        id: cleanText(resource?.id, `${module.id}-resource-${index + 1}`),
        type: resource?.type || 'file',
        title: toPlainText(resource) || `Resource ${index + 1}`,
        description: cleanText(resource?.description, resource?.moduleTitle, 'Module resource'),
        url: cleanText(resource?.url, resource?.href, resource?.fileUrl),
        sortOrder: lessonItems.length + index + 1,
      },
      lessonItems.length + index,
      module
    )
  )

  const quizItem = module.quiz
    ? [
        normalizeCanvasItem(
          {
            id: `${module.id}-quiz`,
            type: 'quiz',
            title: 'Scenario assessment',
            description: module.quiz.question,
            content: module.quiz.question,
            options: module.quiz.options,
            answer: module.quiz.answer,
            sortOrder: lessonItems.length + resourceItems.length + 1,
          },
          lessonItems.length + resourceItems.length,
          module
        ),
      ]
    : []

  return [...lessonItems, ...resourceItems, ...quizItem]
}

const getModuleObjectives = (module) => {
  const objectives = toList(module?.objectives).map(toPlainText).filter(Boolean)
  if (objectives.length > 0) return objectives

  const items = getCanvasItems(module)
  const derived = items
    .filter((item) => item.type === 'page' || item.type === 'text' || item.type === 'checklist')
    .map((item) => cleanText(item.objective, item.description, item.title))
    .filter(Boolean)
    .slice(0, 4)

  return derived.length > 0 ? derived : ['Review the module content', 'Complete each learning item', 'Apply the workflow during field duty']
}

const getQuizFromItem = (item, module) => {
  if (!item && module?.quiz?.question) return module.quiz

  const itemType = normalizeItemType(item?.type || item?.item_type || item?.itemType)
  if (!item || itemType !== 'quiz') return module?.quiz || null

  const nestedQuiz = item.quiz && typeof item.quiz === 'object' ? item.quiz : {}

  const optionList = toList(
    nestedQuiz.options ||
    nestedQuiz.choices ||
    item.options ||
    item.choices ||
    item.answers ||
    item.quizOptions ||
    item.quiz_options
  )
    .map(toPlainText)
    .filter(Boolean)

  const moduleOptions = toList(module?.quiz?.options)
    .map(toPlainText)
    .filter(Boolean)

  return {
    question: cleanText(
      nestedQuiz.question,
      item.question,
      item.content,
      item.description,
      module?.quiz?.question,
      'Scenario assessment question will appear here.'
    ),
    options: optionList.length > 0 ? optionList : moduleOptions,
    answer: Number(
      nestedQuiz.answer ??
      nestedQuiz.correctAnswer ??
      nestedQuiz.correct_answer ??
      item.answer ??
      item.correctAnswer ??
      item.correct_answer ??
      item.correctIndex ??
      item.correct_index ??
      module?.quiz?.answer ??
      0
    ),
  }
}

const isResourceLikeItem = (item) => ['file', 'image', 'video', 'link'].includes(normalizeItemType(item?.type))

const moduleImageSrc = (module) => cleanText(module?.image, module?.imageUrl, module?.image_url, module?.coverImage, module?.cover_image)

const persistableId = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

const getPersistableCanvasItemId = (item) => persistableId(item?.item_id ?? item?.itemId ?? item?.id)

const getCanvasQuizKey = (module, item) => `${module?.id || 'module'}:${item?.id || 'quiz'}`

const readLoginSession = () => {
  try {
    const raw = localStorage.getItem('sfc_session')
    const session = raw ? JSON.parse(raw) : null
    if (!session?.user_id) return null
    return {
      id: session.user_id,
      user_id: session.user_id,
      displayName: cleanText(session.name, 'Park Guide'),
      username: cleanText(session.name, 'Park Guide'),
      email: cleanText(session.email, ''),
      role: cleanText(session.role, 'guide'),
    }
  } catch {
    return null
  }
}

function App() {
  const [users, setUsers] = useState(readStoredUsers)
  const [loginSession] = useState(readLoginSession)
  const [initialShell] = useState(readInitialShell)
  const [currentUserId, setCurrentUserId] = useState(loginSession?.user_id || users[0]?.id || demoUsers[0].id)
  const [activeTab, setActiveTab] = useState(initialShell.activeTab || 'dashboard')
  const [courseSubView, setCourseSubView] = useState(initialShell.courseSubView || 'overview')
  const [trainingModules, setTrainingModules] = useState([])
  const [moduleFrame, setModuleFrame] = useState({
    status: 'loading',
    message: 'Waiting for module records from database.',
  })
  const [canvasProgressFrame, setCanvasProgressFrame] = useState({
    status: 'loading',
    message: 'Loading saved Canvas progress.',
  })
  const [canvasProgressRecords, setCanvasProgressRecords] = useState([])
  const [canvasQuizAttempts, setCanvasQuizAttempts] = useState([])
  const [profileFrame, setProfileFrame] = useState({
    status: 'loading',
    message: 'Waiting for profile record from database.',
  })
  const [databaseProfile, setDatabaseProfile] = useState(null)
  const [databaseCertificates, setDatabaseCertificates] = useState([])
  const [databaseNotifications, setDatabaseNotifications] = useState([])
  const [databaseSchedule, setDatabaseSchedule] = useState([])
  const [courseFiles, setCourseFiles] = useState([])
  const [fileFrame, setFileFrame] = useState({
    status: 'loading',
    message: 'Waiting for uploaded course files.',
  })
  const [selectedCourseId, setSelectedCourseId] = useState(initialShell.courseId || null)
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [moduleSearch, setModuleSearch] = useState('')
  const [moduleStatus, setModuleStatus] = useState('all')
  const [moduleCategory, setModuleCategory] = useState('all')
  const [quizDraft, setQuizDraft] = useState({})
  const [scheduleForm, setScheduleForm] = useState({
    date: '2026-05-20',
    title: '',
    location: '',
    type: 'Reminder',
  })
  const [editingScheduleId, setEditingScheduleId] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: demoStorageVersion, users }))
    } catch {
      // Local storage is optional for this demo.
    }
  }, [users])

  useEffect(() => {
    let ignore = false

    const userQuery = currentUserId ? `?userId=${encodeURIComponent(currentUserId)}` : ''

    setCanvasProgressFrame({
      status: 'loading',
      message: 'Loading saved Canvas progress.',
    })
    loadCanvasProgress(currentUserId)
      .then((payload) => {
        if (ignore) return
        setCanvasProgressRecords(payload.itemProgress)
        setCanvasQuizAttempts(payload.quizAttempts)
        const completedCount = payload.summary?.completedCount ?? payload.completedItemIds.length
        setCanvasProgressFrame({
          status: 'ready',
          message: `${completedCount} saved Canvas completion${completedCount === 1 ? '' : 's'} loaded from MySQL.`,
        })
      })
      .catch((error) => {
        if (ignore) return
        setCanvasProgressRecords([])
        setCanvasQuizAttempts([])
        setCanvasProgressFrame({
          status: 'fallback',
          message: `Canvas progress is using local fallback. ${error.message}`,
        })
      })

    loadDatabaseFrame(`${API_LINKS.modules}${userQuery}`, ['modules', 'trainingModules', 'courses'], normalizeModuleRow)
      .then((modules) => {
        if (ignore) return
        setTrainingModules(modules)
        const firstCourseId = cleanText(modules[0]?.courseId, modules[0]?.course_id)
        setSelectedCourseId((currentCourseId) =>
          currentCourseId && modules.some((module) => String(cleanText(module.courseId, module.course_id)) === String(currentCourseId))
            ? currentCourseId
            : firstCourseId || null
        )
        setSelectedModuleId(modules[0]?.id || null)
        setModuleFrame({
          status: modules.length > 0 ? 'ready' : 'empty',
          message: modules.length > 0
            ? `${modules.length} module${modules.length === 1 ? '' : 's'} loaded from database.`
            : 'Database connected, but no module rows were returned.',
        })
      })
      .catch((error) => {
        if (ignore) return
        setTrainingModules([])
        setSelectedModuleId(null)
        setModuleFrame({
          status: 'empty',
          message: `${error.message} Check the endpoint in user_page/src/services/databaseFrames.js.`,
        })
      })

    loadDatabaseFrame(`${API_LINKS.profile}${userQuery}`, ['profile', 'user', 'guideProfile'], normalizeProfileRow)
      .then((profiles) => {
        if (ignore) return
        setDatabaseProfile(profiles[0] || null)
        setProfileFrame({
          status: profiles[0] ? 'ready' : 'empty',
          message: profiles[0]
            ? 'Profile loaded from database.'
            : 'Database connected, but no guide profile row was returned.',
        })
      })
      .catch((error) => {
        if (ignore) return
        setDatabaseProfile(null)
        setProfileFrame({
          status: 'empty',
          message: error.message,
        })
      })

    loadDatabaseFrame(`${API_LINKS.certifications}${userQuery}`, ['certifications', 'certificates'], normalizeCertificateRow)
      .then((items) => {
        if (!ignore) setDatabaseCertificates(items)
      })
      .catch(() => {
        if (!ignore) setDatabaseCertificates([])
      })

    loadDatabaseFrame(`${API_LINKS.notifications}${userQuery}`, ['notifications'], normalizeNotificationRow)
      .then((items) => {
        if (!ignore) setDatabaseNotifications(items)
      })
      .catch(() => {
        if (!ignore) setDatabaseNotifications([])
      })

    loadDatabaseFrame(`${API_LINKS.schedule}${userQuery}`, ['schedule', 'schedules', 'trainingSchedule', 'progress'], normalizeScheduleRow)
      .then((items) => {
        if (!ignore) setDatabaseSchedule(items)
      })

    loadCourseFiles(currentUserId)
      .then((items) => {
        if (ignore) return
        setCourseFiles(items)
        setFileFrame({
          status: items.length > 0 ? 'ready' : 'empty',
          message: items.length > 0 ? `${items.length} course file${items.length === 1 ? '' : 's'} loaded.` : 'No uploaded course files yet.',
        })
      })
      .catch((error) => {
        if (ignore) return
        setCourseFiles([])
        setFileFrame({ status: 'empty', message: error.message })
      })
      .catch(() => {
        if (!ignore) setDatabaseSchedule([])
      })

    return () => {
      ignore = true
    }
  }, [currentUserId])

  const fallbackSessionUser = loginSession
    ? {
        id: loginSession.user_id,
        username: loginSession.username,
        displayName: loginSession.displayName,
        email: loginSession.email,
        role: loginSession.role,
        assignedPark: 'Sarawak Forestry Training Portal',
        position: loginSession.role,
        enrolledModuleIds: [],
        completedLessons: {},
        quizResults: {},
        savedResources: [],
        personalFiles: [],
        notifications: [],
        schedule: [],
        avatar: null,
        avatarColor: '#ff7a1a',
      }
    : null

  const seededUser =
    users.find((user) => String(user.id) === String(currentUserId)) ||
    fallbackSessionUser ||
    users[0] ||
    cloneSeedUsers()[0]

  const currentUser = databaseProfile
    ? {
        ...seededUser,
        ...databaseProfile,
        id: cleanText(databaseProfile.id, seededUser.id, currentUserId),
        username: cleanText(databaseProfile.displayName, seededUser.username, 'Park Guide'),
        displayName: cleanText(databaseProfile.displayName, seededUser.displayName, 'Park Guide'),
        email: cleanText(databaseProfile.email, seededUser.email, '-'),
        birthday: cleanText(databaseProfile.birthday, seededUser.birthday, '-'),
        phone: cleanText(databaseProfile.phone, seededUser.phone, '-'),
        assignedPark: cleanText(databaseProfile.assignedPark, seededUser.assignedPark, 'Sarawak Forestry Training Portal'),
        position: cleanText(databaseProfile.position, seededUser.position, databaseProfile.role, 'Park Guide'),
        yearsExperience: cleanText(databaseProfile.yearsExperience, seededUser.yearsExperience, '0'),
        address: cleanText(databaseProfile.address, seededUser.address, '-'),
        guideId: cleanText(databaseProfile.guideId, seededUser.guideId, currentUserId),
        role: cleanText(databaseProfile.role, seededUser.role, 'guide'),
        status: cleanText(databaseProfile.status, seededUser.status, 'active'),
        avatar: cleanText(databaseProfile.avatar, seededUser.avatar),
        avatarColor: cleanText(seededUser.avatarColor, '#ff7a1a'),
      }
    : {
        ...seededUser,
        username: cleanText(seededUser.username, seededUser.displayName, 'Park Guide'),
        displayName: cleanText(seededUser.displayName, seededUser.username, 'Park Guide'),
        email: cleanText(seededUser.email, '-'),
        birthday: cleanText(seededUser.birthday, '-'),
        phone: cleanText(seededUser.phone, '-'),
        assignedPark: cleanText(seededUser.assignedPark, 'Sarawak Forestry Training Portal'),
        position: cleanText(seededUser.position, seededUser.role, 'Park Guide'),
        yearsExperience: cleanText(seededUser.yearsExperience, '0'),
        address: cleanText(seededUser.address, '-'),
        guideId: cleanText(seededUser.guideId, currentUserId, '-'),
        role: cleanText(seededUser.role, 'guide'),
        status: cleanText(seededUser.status, 'Waiting for database profile'),
        avatar: cleanText(seededUser.avatar),
        avatarColor: cleanText(seededUser.avatarColor, '#ff7a1a'),
      }

  const profileUser = currentUser
  const courseList = useMemo(() => {
    const courses = new Map()

    trainingModules.forEach((module, index) => {
      const courseId = cleanText(module.courseId, module.course_id, module.courseName, `course-${index + 1}`)
      const existing = courses.get(courseId) || {
        id: courseId,
        courseId,
        name: cleanText(module.courseName, module.courseTitle, module.course_name, courseId),
        description: cleanText(module.courseDescription, module.course_description, 'Course overview will appear after Admin adds a description.'),
        startDate: cleanText(module.courseStartDate, module.course_start_date),
        endDate: cleanText(module.courseEndDate, module.course_end_date),
        contactHours: Number(module.courseContactHours ?? module.course_contact_hours ?? 0) || 0,
        modules: [],
        resources: new Map(),
      }

      existing.modules.push(module)

      toList(module.resources).forEach((resource, resourceIndex) => {
        const id = cleanText(resource?.id, `${module.id}-resource-${resourceIndex + 1}`)
        existing.resources.set(id, {
          id,
          title: toPlainText(resource) || `Resource ${resourceIndex + 1}`,
          type: cleanText(resource?.type, 'File'),
          moduleTitle: module.title,
          moduleId: module.id,
          url: cleanText(resource?.url, resource?.href, resource?.fileUrl),
        })
      })

      getCanvasItems(module)
        .filter(isResourceLikeItem)
        .forEach((item) => {
          existing.resources.set(item.id, {
            id: item.id,
            title: item.title,
            type: itemTypeMeta(item.type).label,
            moduleTitle: module.title,
            moduleId: module.id,
            url: item.url,
          })
        })

      courses.set(courseId, existing)
    })

    return [...courses.values()].map((course) => ({
      ...course,
      modules: course.modules.sort((a, b) => cleanText(a.title).localeCompare(cleanText(b.title))),
      resources: [...course.resources.values()],
      itemCount: course.modules.reduce((sum, module) => sum + getCanvasItems(module).length, 0),
    }))
  }, [trainingModules])

  useEffect(() => {
    if (courseList.length === 0) {
      setSelectedCourseId(null)
      return
    }
    if (!courseList.some((course) => String(course.id) === String(selectedCourseId))) {
      setSelectedCourseId(courseList[0].id)
    }
  }, [courseList, selectedCourseId])

  const selectedCourse = courseList.find((course) => String(course.id) === String(selectedCourseId)) || courseList[0] || null
  const selectedCourseModules = selectedCourse?.modules || []
  const selectedModule =
    selectedCourseModules.find((module) => String(module.id) === String(selectedModuleId)) ||
    trainingModules.find((module) => String(module.id) === String(selectedModuleId)) ||
    selectedCourseModules[0] ||
    null
  const selectedModuleItems = useMemo(() => getCanvasItems(selectedModule), [selectedModule])
  const selectedModuleObjectives = useMemo(() => getModuleObjectives(selectedModule), [selectedModule])
  const selectedCanvasItem = selectedModuleItems.find((item) => item.id === selectedCanvasItemId) || selectedModuleItems[0] || null
  const selectedModuleQuiz = getQuizFromItem(
    selectedModuleItems.find((item) => item.type === 'quiz'),
    selectedModule
  )
  const latestQuizAttemptByItem = useMemo(() => {
    const attempts = new Map()
    for (const attempt of canvasQuizAttempts) {
      const itemId = String(attempt.itemId)
      if (!itemId || attempts.has(itemId)) continue
      attempts.set(itemId, {
        passed: attempt.isCorrect,
        selected: attempt.selectedAnswer,
        score: attempt.scorePercent,
        completedAt: attempt.attemptedAt,
        saved: true,
      })
    }
    return attempts
  }, [canvasQuizAttempts])

  useEffect(() => {
    if (!selectedCourse) return
    if (selectedCourse.modules.some((module) => String(module.id) === String(selectedModuleId))) return

    const firstModule = selectedCourse.modules[0] || null
    setSelectedModuleId(firstModule?.id || null)
    setSelectedCanvasItemId(firstModule ? getCanvasItems(firstModule)[0]?.id || null : null)
  }, [selectedCourseId, selectedModuleId, trainingModules])

  useEffect(() => {
    if (!selectedModule) {
      setSelectedCanvasItemId(null)
      return
    }

    const items = getCanvasItems(selectedModule)
    setSelectedCanvasItemId((currentItemId) =>
      items.some((item) => item.id === currentItemId) ? currentItemId : items[0]?.id || null
    )
  }, [selectedModuleId, trainingModules])

  const moduleMap = useMemo(
    () => new Map(trainingModules.map((module) => [module.id, module])),
    [trainingModules]
  )

  const allResources = useMemo(
    () =>
      trainingModules.flatMap((module) => {
        const seededResources = toList(module.resources).map((resource, index) => ({
          ...resource,
          id: cleanText(resource?.id, `${module.id}-resource-${index + 1}`),
          title: toPlainText(resource) || `Resource ${index + 1}`,
          type: cleanText(resource?.type, 'File'),
          moduleId: module.id,
          moduleTitle: module.title,
          category: module.category,
          park: module.park,
        }))

        const canvasResources = getCanvasItems(module)
          .filter(isResourceLikeItem)
          .map((item) => ({
            id: item.id,
            title: item.title,
            type: itemTypeMeta(item.type).label,
            url: item.url,
            moduleId: module.id,
            moduleTitle: module.title,
            category: module.category,
            park: module.park,
          }))

        const unique = new Map([...seededResources, ...canvasResources].map((resource) => [resource.id, resource]))
        return [...unique.values()]
      }),
    [trainingModules]
  )
  const selectedCourseResources = selectedCourse?.resources || []
  const selectedCourseModuleIds = useMemo(
    () => new Set(selectedCourseModules.map((module) => String(module.id))),
    [selectedCourseModules]
  )
  const selectedCourseFiles = useMemo(
    () =>
      courseFiles.filter((file) =>
        !selectedCourse || selectedCourseModuleIds.has(String(file.moduleId)) || cleanText(file.course) === selectedCourse.name
      ),
    [courseFiles, selectedCourse, selectedCourseModuleIds]
  )

  const updateCurrentUser = (updater) => {
    setUsers((prevUsers) => {
      let found = false
      const nextUsers = prevUsers.map((user) => {
        if (String(user.id) !== String(currentUserId)) return user
        found = true
        return updater({ ...user })
      })
      if (found) return nextUsers
      return [...nextUsers, updater({ ...currentUser, id: currentUserId })]
    })
  }

  const addNotification = (title, body, type = 'training') => {
    updateCurrentUser((user) => ({
      ...user,
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          type,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...(user.notifications || []),
      ],
    }))
  }

  const isEnrolled = (module, user = currentUser) =>
    !!module &&
    (user.enrolledModuleIds?.includes(module.id) ||
      canvasProgressRecords.some((record) => String(record.moduleId) === String(module.id)))

  const completedItemIdsFor = (module, user = currentUser) => {
    const localCompleted = (user.completedLessons?.[module?.id] || []).map((item) => String(item))
    const savedCompleted = canvasProgressRecords
      .filter((record) => record.status === 'completed' && String(record.moduleId) === String(module?.id))
      .map((record) => String(record.itemId))
    return new Set([...localCompleted, ...savedCompleted])
  }

  const getQuizResultForItem = (module, item, user = currentUser) => {
    if (!module || !item) return null
    const itemId = getPersistableCanvasItemId(item)
    if (itemId && latestQuizAttemptByItem.has(String(itemId))) return latestQuizAttemptByItem.get(String(itemId))
    const quizKey = getCanvasQuizKey(module, item)
    return user.quizResults?.[quizKey] || user.quizResults?.[module.id] || null
  }

  const isCanvasItemDone = (module, item, user = currentUser) => {
    if (!module || !item) return false
    if (item.type === 'quiz' && getQuizResultForItem(module, item, user)) return true
    return completedItemIdsFor(module, user).has(String(item.id))
  }

  const getProgress = (module, user = currentUser) => {
    if (!module) return 0
    if (!isEnrolled(module, user)) return 0
    const items = getCanvasItems(module)
    if (items.length === 0) return 0
    const completedCount = items.filter((item) => isCanvasItemDone(module, item, user)).length
    return Math.round((completedCount / items.length) * 100)
  }

  const getCourseProgress = (course, user = currentUser) => {
    const modules = course?.modules || []
    if (modules.length === 0) return 0
    return Math.round(modules.reduce((sum, module) => sum + getProgress(module, user), 0) / modules.length)
  }

  const getCourseCompletedItemCount = (course) =>
    (course?.modules || []).reduce(
      (sum, module) => sum + getCanvasItems(module).filter((item) => isCanvasItemDone(module, item)).length,
      0
    )

  const enrolledModules = useMemo(
    () => trainingModules.filter((module) => isEnrolled(module)),
    [currentUser, trainingModules, canvasProgressRecords]
  )

  const completedModules = useMemo(
    () => trainingModules.filter((module) => getProgress(module) === 100),
    [currentUser, trainingModules, canvasProgressRecords, canvasQuizAttempts]
  )

  const overallProgress = useMemo(() => {
    if (enrolledModules.length === 0) return 0
    const total = enrolledModules.reduce((sum, module) => sum + getProgress(module), 0)
    return Math.round(total / enrolledModules.length)
  }, [currentUser, enrolledModules, trainingModules, canvasProgressRecords, canvasQuizAttempts])

  const completedCanvasItemCount = useMemo(
    () =>
      enrolledModules.reduce(
        (sum, module) => sum + getCanvasItems(module).filter((item) => isCanvasItemDone(module, item)).length,
        0
      ),
    [currentUser, enrolledModules, trainingModules, canvasProgressRecords, canvasQuizAttempts]
  )

  const userNotifications = databaseNotifications.length > 0 ? databaseNotifications : []
  const userSchedule = databaseSchedule.length > 0 ? databaseSchedule : currentUser.schedule || []
  const unreadCount = userNotifications.filter((item) => !item.read).length || 0

  const certificates = useMemo(() => {
    const baseCertificates = databaseCertificates
    const certifiedModuleIds = new Set(baseCertificates.map((certificate) => certificate.moduleId))
    const readyToReview = completedModules
      .filter((module) => !certifiedModuleIds.has(module.id))
      .map((module) => ({
        id: `${currentUser.id}-${module.id}-ready`,
        moduleId: module.id,
        title: module.badge,
        status: 'Ready for admin review',
        issueDate: 'Pending',
        expiryDate: '1 year after approval',
      }))
    return [...baseCertificates, ...readyToReview]
  }, [currentUser, completedModules, databaseCertificates])
  const selectedCourseCertificates = useMemo(
    () => certificates.filter((certificate) => selectedCourseModuleIds.has(String(certificate.moduleId))),
    [certificates, selectedCourseModuleIds]
  )

  const earnedBadgeIds = useMemo(
    () => new Set(completedModules.map((module) => module.id)),
    [completedModules]
  )

  const nextModule = useMemo(() => {
    const active = enrolledModules.find((module) => getProgress(module) < 100)
    return active || trainingModules.find((module) => !isEnrolled(module)) || null
  }, [currentUser, enrolledModules, trainingModules, canvasProgressRecords, canvasQuizAttempts])

  const categories = useMemo(
    () => ['all', ...new Set(selectedCourseModules.map((module) => module.category))],
    [selectedCourseModules]
  )

  const filteredModules = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase()
    return selectedCourseModules.filter((module) => {
      const progress = getProgress(module)
      const status =
        progress === 100 ? 'completed' : isEnrolled(module) ? 'in-progress' : 'available'
      const matchesSearch =
        !query ||
        `${module.title} ${module.subtitle} ${module.park} ${module.category}`
          .toLowerCase()
          .includes(query)
      const matchesStatus = moduleStatus === 'all' || moduleStatus === status
      const matchesCategory = moduleCategory === 'all' || moduleCategory === module.category
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [currentUser, moduleSearch, moduleStatus, moduleCategory, selectedCourseModules, canvasProgressRecords, canvasQuizAttempts])

  const categoryProgress = useMemo(() => {
    return [...new Set(selectedCourseModules.map((module) => module.category))].map((category) => {
      const modules = selectedCourseModules.filter((module) => module.category === category)
      const average = Math.round(
        modules.reduce((sum, module) => sum + getProgress(module), 0) / modules.length
      )
      return { category, average }
    })
  }, [currentUser, selectedCourseModules, canvasProgressRecords, canvasQuizAttempts])

  const savedResourceIds = new Set(currentUser.savedResources || [])
  const savedResources = [
    ...allResources.filter((resource) => savedResourceIds.has(resource.id)),
    ...(currentUser.personalFiles || []),
  ]

  const switchUser = (userId) => {
    const nextUser = users.find((user) => user.id === userId)
    setCurrentUserId(userId)
    setSelectedModuleId(nextUser?.enrolledModuleIds?.[0] || trainingModules[0]?.id || null)
    setActiveTab('dashboard')
  }

  const goToCourseSection = (section, courseId = selectedCourse?.id) => {
    const nextCourse = courseList.find((course) => String(course.id) === String(courseId)) || selectedCourse
    if (nextCourse?.id) {
      setSelectedCourseId(nextCourse.id)
      const moduleStillInCourse = nextCourse.modules.some((module) => String(module.id) === String(selectedModuleId))
      const nextModule = moduleStillInCourse
        ? nextCourse.modules.find((module) => String(module.id) === String(selectedModuleId))
        : nextCourse.modules[0]
      setSelectedModuleId(nextModule?.id || null)
      setSelectedCanvasItemId(nextModule ? getCanvasItems(nextModule)[0]?.id || null : null)
    }

    if (section === 'overview' || section === 'modules') {
      setCourseSubView(section)
      setActiveTab('modules')
    } else if (section === 'item') {
      setActiveTab('module')
    } else if (section === 'completion') {
      setActiveTab('certificates')
    } else {
      setActiveTab(section)
    }
    setSidebarOpen(false)
  }

  const openCourse = (courseId, section = 'overview') => {
    goToCourseSection(section, courseId)
  }

  const openModule = (moduleId) => {
    if (!moduleId) return
    const module = trainingModules.find((item) => item.id === moduleId)
    const firstItem = getCanvasItems(module)[0]
    const courseId = cleanText(module?.courseId, module?.course_id)
    if (courseId) setSelectedCourseId(courseId)
    setSelectedModuleId(moduleId)
    setSelectedCanvasItemId(firstItem?.id || null)
    setActiveTab('module')
    setSidebarOpen(false)
  }

  const enrollModule = (module) => {
    if (!module) return
    if (isEnrolled(module)) {
      openModule(module.id)
      return
    }
    updateCurrentUser((user) => ({
      ...user,
      enrolledModuleIds: [...(user.enrolledModuleIds || []), module.id],
      completedLessons: { ...(user.completedLessons || {}), [module.id]: [] },
    }))
    setSelectedModuleId(module.id)
    setActiveTab('module')
    addNotification('Module enrolled', `${module.title} is now in your learning path.`, 'training')
    if (module.courseId) {
      fetch(API_LINKS.enrollmentRequests, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          moduleId: module.id,
          courseId: module.courseId,
        }),
      }).catch((error) => {
        console.warn('Unable to send admin enrollment request:', error)
      })
    }
  }

  const toggleLesson = (module, lessonIndex) => {
    if (!module) return
    if (!isEnrolled(module)) return
    updateCurrentUser((user) => {
      const existing = user.completedLessons?.[module.id] || []
      const next = existing.includes(lessonIndex)
        ? existing.filter((item) => item !== lessonIndex)
        : [...existing, lessonIndex]
      return {
        ...user,
        completedLessons: {
          ...(user.completedLessons || {}),
          [module.id]: next.sort((a, b) => a - b),
        },
      }
    })
  }

  const canvasPersistencePayload = (module, item) => {
    const itemId = getPersistableCanvasItemId(item)
    const moduleId = persistableId(item?.module_id ?? item?.moduleId ?? module?.id)
    const courseId = cleanText(item?.course_id, item?.courseId, module?.course_id, module?.courseId)
    if (!itemId || !moduleId || !courseId) return null
    return {
      userId: currentUser.id,
      courseId,
      moduleId,
      itemId,
      itemType: normalizeItemType(item.type),
    }
  }

  const applyCanvasProgressPayload = (payload, message = 'Canvas progress saved to MySQL.') => {
    setCanvasProgressRecords(payload.itemProgress || [])
    setCanvasQuizAttempts(payload.quizAttempts || [])
    setCanvasProgressFrame({
      status: 'ready',
      message,
    })
  }

  const upsertOptimisticProgressRecord = (module, item, status) => {
    const payload = canvasPersistencePayload(module, item)
    if (!payload) return
    setCanvasProgressRecords((records) => {
      const nextRecords = records.filter((record) => String(record.itemId) !== String(payload.itemId))
      return [
        {
          id: `${payload.userId}-${payload.itemId}`,
          progressId: '',
          userId: String(payload.userId),
          guideId: String(payload.userId),
          courseId: payload.courseId,
          moduleId: String(payload.moduleId),
          itemId: String(payload.itemId),
          itemType: payload.itemType,
          status,
          completed: status === 'completed',
          completedAt: status === 'completed' ? new Date().toISOString() : '',
          lastViewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...nextRecords,
      ]
    })
  }

  const toggleCanvasItem = (module, item) => {
    if (!module || !item) return
    if (!isEnrolled(module)) return
    if (item.type === 'quiz') return

    const willComplete = !isCanvasItemDone(module, item)
    const nextStatus = willComplete ? 'completed' : 'not_started'
    upsertOptimisticProgressRecord(module, item, nextStatus)
    updateCurrentUser((user) => {
      const existing = (user.completedLessons?.[module.id] || []).map((value) => String(value))
      const itemId = String(item.id)
      const next = willComplete
        ? [...new Set([...existing, itemId])]
        : existing.filter((value) => value !== itemId)
      return {
        ...user,
        completedLessons: {
          ...(user.completedLessons || {}),
          [module.id]: next,
        },
      }
    })

    const payload = canvasPersistencePayload(module, item)
    if (!payload) {
      setCanvasProgressFrame({
        status: 'fallback',
        message: 'Canvas progress is using local fallback for this generated item.',
      })
      return
    }

    setCanvasProgressFrame({
      status: 'saving',
      message: 'Saving Canvas progress to MySQL...',
    })
    saveCanvasItemProgress({
      ...payload,
      status: nextStatus,
    })
      .then((savedPayload) => applyCanvasProgressPayload(savedPayload, 'Canvas item progress saved to MySQL.'))
      .catch((error) => {
        setCanvasProgressFrame({
          status: 'fallback',
          message: `Canvas progress kept locally. ${error.message}`,
        })
      })
  }

  const submitQuiz = (module, item, quizDefinition = getQuizFromItem(item, module)) => {
    if (!module || !quizDefinition) return
    if (!isEnrolled(module)) return
    const quizKey = getCanvasQuizKey(module, item)
    const selected = Number(quizDraft[quizKey] ?? quizDraft[module.id])
    if (Number.isNaN(selected)) return
    const correctIndex = Number(quizDefinition.answer ?? 0)
    const passed = selected === correctIndex
    const score = passed ? 100 : 0
    const options = toList(quizDefinition.options).map(toPlainText)
    const selectedAnswer = cleanText(options[selected], String(selected))
    const correctAnswer = cleanText(options[correctIndex], String(correctIndex))
    const quizResult = {
      passed,
      selected,
      selectedAnswer,
      correctAnswer,
      score,
      completedAt: new Date().toISOString().slice(0, 10),
    }
    const itemId = String(item?.id || `${module.id}-quiz`)

    upsertOptimisticProgressRecord(module, item, 'completed')
    updateCurrentUser((user) => {
      const existing = (user.completedLessons?.[module.id] || []).map((value) => String(value))
      const nextCompleted = [...new Set([...existing, itemId])]
      return {
        ...user,
        completedLessons: {
          ...(user.completedLessons || {}),
          [module.id]: nextCompleted,
        },
        quizResults: {
          ...(user.quizResults || {}),
          [module.id]: quizResult,
          [quizKey]: quizResult,
        },
      }
    })

    const payload = canvasPersistencePayload(module, item)
    if (!payload) {
      setCanvasProgressFrame({
        status: 'fallback',
        message: 'Canvas quiz attempt is using local fallback for this generated item.',
      })
    } else {
      setCanvasProgressFrame({
        status: 'saving',
        message: 'Saving Canvas quiz attempt to MySQL...',
      })
      saveCanvasQuizAttempt({
        ...payload,
        selectedAnswer,
        correctAnswer,
        isCorrect: passed,
        scorePercent: score,
      })
        .then((savedPayload) => applyCanvasProgressPayload(savedPayload, 'Canvas quiz attempt saved to MySQL.'))
        .catch((error) => {
          setCanvasProgressFrame({
            status: 'fallback',
            message: `Canvas quiz result kept locally. ${error.message}`,
          })
        })
    }

    addNotification(
      passed ? 'Quiz passed' : 'Quiz needs review',
      passed
        ? `${module.title} quiz passed. Complete all Canvas items to prepare the badge for admin review.`
        : `Review the Canvas items in ${module.title} and try again.`,
      passed ? 'certificate' : 'training'
    )
  }

  const markNotificationRead = (notificationId) => {
    updateCurrentUser((user) => ({
      ...user,
      notifications: (user.notifications || []).map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      ),
    }))
  }

  const markAllRead = () => {
    updateCurrentUser((user) => ({
      ...user,
      notifications: (user.notifications || []).map((item) => ({ ...item, read: true })),
    }))
  }

  const removeNotification = (notificationId) => {
    updateCurrentUser((user) => ({
      ...user,
      notifications: (user.notifications || []).filter((item) => item.id !== notificationId),
    }))
  }

  const upsertLocalScheduleItem = (scheduleItem) => {
    setDatabaseSchedule((items) => {
      const existing = items.length > 0 ? items : userSchedule
      const nextItems = existing.some((item) => item.id === scheduleItem.id)
        ? existing.map((item) => (item.id === scheduleItem.id ? scheduleItem : item))
        : [scheduleItem, ...existing]
      return nextItems.sort((a, b) => a.date.localeCompare(b.date))
    })
    updateCurrentUser((user) => {
      const existing = user.schedule || []
      const nextItems = existing.some((item) => item.id === scheduleItem.id)
        ? existing.map((item) => (item.id === scheduleItem.id ? scheduleItem : item))
        : [scheduleItem, ...existing]
      return {
        ...user,
        schedule: nextItems.sort((a, b) => a.date.localeCompare(b.date)),
      }
    })
  }

  const addScheduleItem = (event) => {
    event.preventDefault()
    if (!scheduleForm.date || !scheduleForm.title.trim()) return
    const scheduleItem = {
      id: editingScheduleId || `${currentUser.id}-schedule-${Date.now()}`,
      user_id: currentUser.id,
      title: scheduleForm.title.trim(),
      date: scheduleForm.date,
      location: scheduleForm.location.trim() || 'Self-paced',
      type: scheduleForm.type,
      status: 'Scheduled',
    }
    upsertLocalScheduleItem(scheduleItem)
    const saveRequest = editingScheduleId ? updateScheduleItem(scheduleItem, currentUserId) : saveScheduleItem(scheduleItem, currentUserId)
    saveRequest
      .then((payload) => {
        const savedItem = payload?.schedule ? normalizeScheduleRow(payload.schedule) : null
        if (savedItem?.id) upsertLocalScheduleItem(savedItem)
      })
      .catch(() => {
        // Keep the local schedule item visible while the database endpoint is not connected.
      })
    setScheduleForm({ date: scheduleForm.date, title: '', location: '', type: 'Reminder' })
    setEditingScheduleId(null)
    addNotification(
      'Schedule updated',
      editingScheduleId
        ? 'A personal learning reminder was edited in your schedule.'
        : 'A personal learning reminder was added to your schedule.',
      'schedule'
    )
  }

  const startScheduleEdit = (item) => {
    setEditingScheduleId(item.id)
    setScheduleForm({
      date: item.date || '',
      title: item.title || '',
      location: item.location || '',
      type: item.type || 'Reminder',
    })
  }

  const cancelScheduleEdit = () => {
    setEditingScheduleId(null)
    setScheduleForm({ date: scheduleForm.date || '2026-05-20', title: '', location: '', type: 'Reminder' })
  }

  const removeScheduleItem = (scheduleId) => {
    setDatabaseSchedule((items) => (items.length > 0 ? items : userSchedule).filter((item) => item.id !== scheduleId))
    updateCurrentUser((user) => ({
      ...user,
      schedule: (user.schedule || []).filter((item) => item.id !== scheduleId),
    }))
    if (editingScheduleId === scheduleId) cancelScheduleEdit()
    deleteScheduleItem(scheduleId, currentUserId).catch(() => {
      // Keep the local delete visible while the database endpoint is not connected.
    })
    addNotification('Schedule updated', 'A personal learning reminder was deleted from your schedule.', 'schedule')
  }

  const toggleResource = (resourceId) => {
    updateCurrentUser((user) => {
      const existing = user.savedResources || []
      const saved = existing.includes(resourceId)
        ? existing.filter((item) => item !== resourceId)
        : [...existing, resourceId]
      return { ...user, savedResources: saved }
    })
  }

  const handlePersonalFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    updateCurrentUser((user) => ({
      ...user,
      personalFiles: [
        {
          id: `${user.id}-file-${Date.now()}`,
          title: file.name,
          type: 'Personal upload',
          moduleTitle: 'Saved Resources',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        },
        ...(user.personalFiles || []),
      ],
    }))
    event.target.value = ''
    addNotification('Resource saved', `${file.name} was added to your saved resources.`, 'resource')
  }

  const handleCourseFileUploaded = (file) => {
    setCourseFiles((items) => [file, ...items])
    setFileFrame({ status: 'ready', message: 'Course file uploaded.' })
    addNotification('File uploaded', `${file.name} was saved to your course files.`, 'resource')
  }

  const handleCourseFileDeleted = (fileId) => {
    setCourseFiles((items) => items.filter((file) => file.id !== fileId))
    addNotification('File deleted', 'A course file was removed from your files.', 'resource')
  }

  const updateProfileField = (field, value) => {
    if (!editableProfileFields.has(field)) return
    updateCurrentUser((user) => ({ ...user, [field]: value }))
    setDatabaseProfile((profile) => (profile ? { ...profile, [field]: value } : profile))
  }

  const saveProfileEdit = (field, value) => {
    if (!editableProfileFields.has(field)) return
    saveProfileField(field, value, currentUserId).catch(() => {
      // Keep the local edit visible while the database endpoint is not connected.
    })
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const previewUrl = reader.result
      updateCurrentUser((user) => ({ ...user, avatar: previewUrl }))
      setDatabaseProfile((profile) => (profile ? { ...profile, avatar: previewUrl } : profile))
      saveAvatarUpload({ fileName: file.name, dataUrl: previewUrl, userId: currentUserId })
        .then((savedProfile) => {
          if (!savedProfile.avatar) return
          updateCurrentUser((user) => ({ ...user, avatar: savedProfile.avatar }))
          setDatabaseProfile((profile) => (profile ? { ...profile, avatar: savedProfile.avatar } : profile))
        })
        .catch(() => {
          // Keep the local preview visible while the database endpoint is not connected.
        })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleLogout = () => {
    localStorage.removeItem('sfc_session')
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5176'
    window.location.href = loginUrl
  }

  const navItems = [
    { id: 'dashboard', label: 'Courses', icon: 'C' },
    { id: 'modules', label: 'Course Overview', icon: 'O' },
    { id: 'module', label: 'Item Detail', icon: 'I' },
    { id: 'progress', label: 'Progress', icon: 'P' },
    { id: 'files', label: 'Files', icon: 'F' },
    { id: 'certificates', label: 'Completion', icon: '✓' },
    { id: 'notifications', label: 'Notifications', icon: 'N' },
    { id: 'schedule', label: 'Schedule', icon: 'S' },
    { id: 'profile', label: 'Profile', icon: 'U' },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand-block">
          <img className="brand-logo" src={logoSrc} alt="SFC Digital Portal logo" />
          <div>
            <strong>SFC Digital Portal</strong>
            <span>Digital Training</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="User portal">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => {
                if (item.id === 'modules') setCourseSubView('overview')
                setActiveTab(item.id)
                setSidebarOpen(false)
              }}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'notifications' && unreadCount > 0 && <b>{unreadCount}</b>}
            </button>
          ))}
        </nav>

        <div className="role-card">
          <span>Current Role</span>
          <strong>{currentUser.role}</strong>
          <p>Training access only. Admin controls stay locked.</p>
        </div>
      </aside>
      <div className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      <main className={`workspace ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setSidebarOpen((value) => !value)}>
            <span />
            <span />
            <span />
          </button>
          <img className="topbar-logo" src={logoSrc} alt="SFC Digital Portal logo" />
          <div className="topbar-brand-copy">
            <span className="kicker">SFC / {activeTab.replace('-', ' ').toUpperCase()}</span>
            <h1>{cleanText(currentUser.assignedPark, currentUser.displayName, 'SFC Guide Center')}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" className="logout-button" onClick={handleLogout}>
              Logout
            </button>
            <button type="button" className="avatar-button" onClick={() => setActiveTab('profile')}>
              {validImageSrc(currentUser.avatar) ? (
                <img src={currentUser.avatar} alt="User avatar" />
              ) : (
                <span style={{ background: currentUser.avatarColor }}>{initials(currentUser.displayName)}</span>
              )}
            </button>
          </div>
        </header>

        <div className="page-scroll">
          {activeTab === 'dashboard' && (
            <section className="page-stack course-list-page">
              <PageIntro
                kicker="Course List"
                title="SFC Digital Portal courses"
                body="Courses, modules, items, files, progress, and completion state are loaded from the training APIs when MySQL is running."
              />

              <div className={`module-source-banner ${moduleFrame.status}`}>
                {moduleFrame.message}
              </div>

              <div className="stat-grid">
                <StatCard label="Courses" value={String(courseList.length).padStart(2, '0')} detail="Backend course records" />
                <StatCard label="Modules" value={String(trainingModules.length).padStart(2, '0')} detail="Published module blocks" />
                <StatCard label="Canvas items" value={String(courseList.reduce((sum, course) => sum + course.itemCount, 0)).padStart(2, '0')} detail="Pages, files, videos, quizzes" />
                <StatCard label="Overall progress" value={`${overallProgress}%`} detail={`${enrolledModules.length} enrolled modules`} />
              </div>

              <div className="course-list-grid">
                {courseList.length === 0 && (
                  <EmptyFrame title="No backend courses yet" body="Run the Canvas demo seed after the Admin API is running, then refresh this page." />
                )}
                {courseList.map((course) => (
                  <article key={course.id} className={`course-card ${selectedCourse?.id === course.id ? 'selected' : ''}`}>
                    <div className="course-card-topline">
                      <span>{course.id}</span>
                      <b>{course.contactHours || course.modules.length}h</b>
                    </div>
                    <h3>{course.name}</h3>
                    <p>{course.description}</p>
                    <div className="course-card-meta">
                      <span>{course.modules.length} modules</span>
                      <span>{course.itemCount} items</span>
                      <span>{course.resources.length} resources</span>
                    </div>
                    <ProgressBar value={getCourseProgress(course)} />
                    <div className="course-card-actions">
                      <button type="button" onClick={() => openCourse(course.id, 'overview')}>
                        Open course
                      </button>
                      <button type="button" className="secondary-form-button" onClick={() => openCourse(course.id, 'modules')}>
                        Modules
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Selected course" title={selectedCourse?.name || 'Course shell'} />
                  {selectedCourse ? (
                    <div className="compact-module-list">
                      {selectedCourse.modules.map((module) => (
                        <button key={module.id} type="button" onClick={() => openModule(module.id)}>
                          <ModuleThumb module={module} />
                          <span>
                            <strong>{module.title}</strong>
                            <small>{module.park} - {getCanvasItems(module).length} items</small>
                          </span>
                          <b>{getProgress(module)}%</b>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyFrame title="Course shell waiting" body="Course overview, modules, item detail, progress, files, and completion state will appear after backend courses load." />
                  )}
                </section>
                <section className="panel">
                  <PanelTitle kicker="Role boundary" title="What this user can do" />
                  <ul className="permission-list can">
                    {roleBoundaries.can.slice(0, 5).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section className="panel">
                  <PanelTitle kicker="Admin locked" title="What this user cannot do" />
                  <ul className="permission-list cannot">
                    {roleBoundaries.cannot.slice(0, 5).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </section>
          )}

          {activeTab === 'modules' && (
            <section className="page-stack">
              <CourseShellNav
                courses={courseList}
                selectedCourse={selectedCourse}
                activeKey={courseSubView}
                onCourseChange={(courseId) => openCourse(courseId, courseSubView)}
                onSectionChange={goToCourseSection}
              />
              <PageIntro
                kicker={courseSubView === 'overview' ? 'Course Overview' : 'Course Modules'}
                title={selectedCourse?.name || 'Course shell'}
                body={
                  courseSubView === 'overview'
                    ? cleanText(selectedCourse?.description, 'Course overview appears after backend course data loads.')
                    : 'Search, filter, enroll, and continue modules inside the selected course.'
                }
              />
              <div className={`module-source-banner ${moduleFrame.status}`}>
                {moduleFrame.message}
              </div>

              {courseSubView === 'overview' && (
                <div className="course-overview-grid">
                  <section className="panel wide">
                    <PanelTitle kicker="Course summary" title={selectedCourse?.name || 'No course selected'} />
                    <div className="course-overview-meta">
                      <span>{selectedCourse?.id || 'Course ID'}</span>
                      <span>{selectedCourse?.modules.length || 0} modules</span>
                      <span>{selectedCourse?.itemCount || 0} Canvas items</span>
                      <span>{selectedCourse?.contactHours || 0} contact hours</span>
                    </div>
                    <p>{selectedCourse?.description || 'Course description will appear here after Admin publishes the course.'}</p>
                    <ProgressBar value={getCourseProgress(selectedCourse)} />
                    <div className="course-card-actions">
                      <button type="button" onClick={() => goToCourseSection('modules')}>View modules</button>
                      <button type="button" className="secondary-form-button" onClick={() => goToCourseSection('item')}>
                        Open item detail
                      </button>
                    </div>
                  </section>

                  <section className="panel">
                    <PanelTitle kicker="Completion" title="Course state" />
                    <div className="course-state-list">
                      <div><span>Progress</span><strong>{getCourseProgress(selectedCourse)}%</strong></div>
                      <div><span>Items complete</span><strong>{getCourseCompletedItemCount(selectedCourse)}/{selectedCourse?.itemCount || 0}</strong></div>
                      <div><span>Certificates</span><strong>{selectedCourseCertificates.length}</strong></div>
                    </div>
                  </section>

                  <section className="panel wide">
                    <PanelTitle kicker="Module outline" title="Course modules" />
                    <div className="compact-module-list">
                      {selectedCourseModules.length === 0 && (
                        <EmptyFrame title="No modules yet" body="Admin can add modules from the Course Builder." />
                      )}
                      {selectedCourseModules.map((module) => (
                        <button key={module.id} type="button" onClick={() => openModule(module.id)}>
                          <ModuleThumb module={module} />
                          <span>
                            <strong>{module.title}</strong>
                            <small>{module.level} - {getCanvasItems(module).length} items</small>
                          </span>
                          <b>{getProgress(module)}%</b>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {courseSubView === 'modules' && (
                <>
                  <div className="toolbar">
                    <input
                      type="search"
                      placeholder="Search modules, parks, topics..."
                      value={moduleSearch}
                      onChange={(event) => setModuleSearch(event.target.value)}
                    />
                    <select value={moduleStatus} onChange={(event) => setModuleStatus(event.target.value)}>
                      <option value="all">All status</option>
                      <option value="in-progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="available">Available</option>
                    </select>
                    <select value={moduleCategory} onChange={(event) => setModuleCategory(event.target.value)}>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="module-grid">
                    {filteredModules.length === 0 && (
                      <article className="module-card module-card-empty">
                        <div className="module-image empty-module-image" />
                        <div className="module-card-body">
                          <div className="module-meta">
                            <span>Database</span>
                            <span>Frame</span>
                            <span>Ready</span>
                          </div>
                          <h3>Module data frame</h3>
                          <p>The card design is ready. It will show real module rows after the endpoint in databaseFrames.js returns data.</p>
                          <ProgressBar value={0} />
                          <div className="module-actions">
                            <button type="button" disabled>Waiting for data</button>
                            <span>0%</span>
                          </div>
                        </div>
                      </article>
                    )}
                    {filteredModules.map((module) => {
                      const progress = getProgress(module)
                      const enrolled = isEnrolled(module)
                      return (
                        <article key={module.id} className="module-card">
                          <ModuleVisual module={module} className="module-image" asButton onClick={() => openModule(module.id)} />
                          <div className="module-card-body">
                            <div className="module-meta">
                              <span>{module.level}</span>
                              <span>{module.duration}</span>
                              <span>{module.format}</span>
                            </div>
                            <h3>{module.title}</h3>
                            <p>{module.subtitle}</p>
                            <ProgressBar value={progress} />
                            <div className="module-actions">
                              <button type="button" onClick={() => (enrolled ? openModule(module.id) : enrollModule(module))}>
                                {enrolled ? 'Open module' : 'Enroll'}
                              </button>
                              <span>{progress}%</span>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'module' && selectedModule && (
            <section className="page-stack">
              <CourseShellNav
                courses={courseList}
                selectedCourse={selectedCourse}
                activeKey="item"
                onCourseChange={(courseId) => openCourse(courseId, 'item')}
                onSectionChange={goToCourseSection}
              />
              <div className="module-detail-hero canvas-detail-hero">
                <ModuleVisual module={selectedModule} className="module-detail-visual" />
                <div>
                  <span className="kicker">{selectedModule.category} / {selectedModule.park}</span>
                  <h2>{selectedModule.title}</h2>
                  <p>{selectedModule.subtitle}</p>
                  <div className="detail-chips">
                    <span>{selectedModule.level}</span>
                    <span>{selectedModule.duration}</span>
                    <span>{selectedModule.format}</span>
                    <span>{selectedModuleItems.length} Canvas item{selectedModuleItems.length === 1 ? '' : 's'}</span>
                    <span>{getProgress(selectedModule)}% complete</span>
                  </div>
                  <ProgressBar value={getProgress(selectedModule)} />
                  <div className="hero-actions">
                    <button type="button" onClick={() => enrollModule(selectedModule)}>
                      {isEnrolled(selectedModule) ? 'Continue module' : 'Enroll module'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => goToCourseSection('modules')}>
                      Back to modules
                    </button>
                  </div>
                </div>
              </div>

              <div className="content-grid detail-layout canvas-detail-layout">
                <section className="panel wide canvas-module-panel">
                  <PanelTitle kicker="Canvas module" title="Learning items" />
                  <div className="module-source-banner ready">
                    This module is rendered from the Admin Canvas-style builder. Open each item, review the preview, then mark it complete.
                  </div>
                  <div className={`module-source-banner ${canvasProgressFrame.status}`}>
                    {canvasProgressFrame.message}
                  </div>

                  {!isEnrolled(selectedModule) && (
                    <EmptyFrame title="Enroll first" body="Park Guides must enroll before completing Canvas items and quiz attempts." />
                  )}

                  <div className="objective-grid canvas-objective-grid">
                    {selectedModuleObjectives.map((objective) => (
                      <div key={objective}>{objective}</div>
                    ))}
                  </div>

                  <div className="canvas-item-list">
                    {selectedModuleItems.length === 0 && (
                      <EmptyFrame title="No Canvas items yet" body="Admin can add pages, files, images, videos, links, quizzes, and checklists from the Course builder." />
                    )}
                    {selectedModuleItems.map((item, index) => {
                      const meta = itemTypeMeta(item.type)
                      const done = isCanvasItemDone(selectedModule, item)
                      const selected = selectedCanvasItem?.id === item.id
                      return (
                        <article key={item.id} className={`canvas-item-row ${selected ? 'selected' : ''} ${done ? 'done' : ''}`}>
                          <label className="canvas-item-check" title={item.type === 'quiz' ? 'Complete the quiz to tick this item.' : 'Mark item complete'}>
                            <input
                              type="checkbox"
                              checked={done}
                              disabled={!isEnrolled(selectedModule) || item.type === 'quiz'}
                              onChange={() => toggleCanvasItem(selectedModule, item)}
                            />
                          </label>
                          <button type="button" className="canvas-item-open" onClick={() => setSelectedCanvasItemId(item.id)}>
                            <span className="canvas-item-icon">{meta.icon}</span>
                            <span className="canvas-item-main">
                              <strong>{String(index + 1).padStart(2, '0')}. {item.title}</strong>
                              <small>{meta.label} · {item.description || meta.helper}</small>
                            </span>
                          </button>
                          <span className="canvas-item-status">{done ? 'complete' : item.status}</span>
                        </article>
                      )
                    })}
                  </div>
                </section>

                <aside className="panel canvas-preview-panel">
                  <PanelTitle kicker="Park Guide preview" title="Item preview" />
                  <CanvasItemPreview
                    item={selectedCanvasItem}
                    module={selectedModule}
                    enrolled={isEnrolled(selectedModule)}
                    completed={isCanvasItemDone(selectedModule, selectedCanvasItem)}
                    onToggleComplete={() => toggleCanvasItem(selectedModule, selectedCanvasItem)}
                    quizDefinition={selectedCanvasItem?.type === 'quiz' ? getQuizFromItem(selectedCanvasItem, selectedModule) : selectedModuleQuiz}
                    quizDraft={quizDraft}
                    setQuizDraft={setQuizDraft}
                    submitQuiz={submitQuiz}
                    quizResult={getQuizResultForItem(selectedModule, selectedCanvasItem)}
                    saved={selectedCanvasItem ? savedResourceIds.has(selectedCanvasItem.id) : false}
                    onSaveResource={() => selectedCanvasItem && toggleResource(selectedCanvasItem.id)}
                  />
                </aside>
              </div>

              <section className="panel">
                <PanelTitle kicker="Resources" title="Module files and media" />
                <div className="resource-grid">
                  {selectedModuleItems.filter(isResourceLikeItem).length === 0 && (
                    <EmptyFrame title="No media resources yet" body="Admin can add file, image, video, and external link items from the Course builder." />
                  )}
                  {selectedModuleItems.filter(isResourceLikeItem).map((item) => (
                    <ResourceCard
                      key={item.id}
                      resource={{
                        id: item.id,
                        title: item.title,
                        type: itemTypeMeta(item.type).label,
                        moduleTitle: selectedModule.title,
                        category: selectedModule.category,
                      }}
                      saved={savedResourceIds.has(item.id)}
                      onToggle={() => toggleResource(item.id)}
                    />
                  ))}
                </div>
              </section>
            </section>
          )}

          {activeTab === 'module' && !selectedModule && (
            <section className="page-stack">
              <div className="module-detail-hero empty-detail-hero">
                <div className="empty-module-image" />
                <div>
                  <span className="kicker">Database Module / Empty Frame</span>
                  <h2>Module detail template</h2>
                  <p>{moduleFrame.message}</p>
                  <div className="detail-chips">
                    <span>Level</span>
                    <span>Duration</span>
                    <span>Format</span>
                    <span>0% complete</span>
                  </div>
                  <ProgressBar value={0} />
                  <div className="hero-actions">
                    <button type="button" disabled>Waiting for data</button>
                    <button type="button" className="secondary-button" onClick={() => goToCourseSection('modules')}>
                      Back to modules
                    </button>
                  </div>
                </div>
              </div>
              <div className="content-grid detail-layout">
                <section className="panel wide">
                  <PanelTitle kicker="Learning objectives" title="Database frame" />
                  <EmptyFrame title="Objectives will render here" body="Link objective rows or JSON arrays to the objectives field in databaseFrames.js." />
                  <PanelTitle kicker="Lesson checklist" title="Database frame" />
                  <EmptyFrame title="Lessons will render here" body="Rows from the lessons table will become the checklist items." />
                </section>
                <aside className="panel">
                  <PanelTitle kicker="Scenario quiz" title="Assessment" />
                  <EmptyFrame title="Quiz will render here" body="Questions and options from your database will fill this box." />
                </aside>
              </div>
            </section>
          )}

          {activeTab === 'progress' && (
            <section className="page-stack">
              <CourseShellNav
                courses={courseList}
                selectedCourse={selectedCourse}
                activeKey="progress"
                onCourseChange={(courseId) => openCourse(courseId, 'progress')}
                onSectionChange={goToCourseSection}
              />
              <PageIntro
                kicker="Course Progress"
                title={selectedCourse?.name || 'Progress, strengths, and certification readiness'}
                body="This view tracks completion for the selected course shell."
              />

              <div className="stat-grid progress-stat-grid">
                <StatCard label="Course progress" value={`${getCourseProgress(selectedCourse)}%`} detail="Average across this course" />
                <StatCard label="Items done" value={`${getCourseCompletedItemCount(selectedCourse)}/${selectedCourse?.itemCount || 0}`} detail="Canvas items completed" />
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Module progress" title="Completion evidence" />
                  <div className="progress-table">
                    {selectedCourseModules.length === 0 && (
                      <EmptyFrame title="No module progress yet" body="Progress rows can be joined by module_id after your database modules are available." />
                    )}
                    {selectedCourseModules.map((module) => (
                      <button key={module.id} type="button" onClick={() => openModule(module.id)}>
                        <span>{module.title}</span>
                        <ProgressBar value={getProgress(module)} />
                        <b>{getProgress(module)}%</b>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <PanelTitle kicker="Category view" title="Strength map" />
                <div className="category-bars">
                    {categoryProgress.length === 0 && (
                      <EmptyFrame title="No categories yet" body="Category bars will appear after module category values load from the database." />
                    )}
                    {categoryProgress.map((item) => (
                      <div key={item.category}>
                        <span>{item.category}</span>
                        <ProgressBar value={item.average} />
                        <b>{item.average}%</b>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          )}

          {activeTab === 'certificates' && (
            <section className="page-stack">
              <CourseShellNav
                courses={courseList}
                selectedCourse={selectedCourse}
                activeKey="completion"
                onCourseChange={(courseId) => openCourse(courseId, 'completion')}
                onSectionChange={goToCourseSection}
              />
              <PageIntro
                kicker="Completion / Certificates"
                title={selectedCourse?.name || 'Guide credentials and milestones'}
                body="Park Guides can view selected-course certificate state and badge progress. Approval actions remain admin-only."
              />

              <div className="certificate-grid">
                {selectedCourseCertificates.length === 0 && (
                  <div className="empty-panel">No certificates yet. Complete a module and pass its quiz to prepare one for admin review.</div>
                )}
                {selectedCourseCertificates.map((certificate) => {
                  const module = moduleMap.get(certificate.moduleId)
                  return (
                    <article key={certificate.id} className="certificate-card">
                      {moduleImageSrc(module) && <img className="certificate-art" src={moduleImageSrc(module)} alt="" />}
                      <div className="certificate-stamp">{module?.badge?.slice(0, 2).toUpperCase() || 'SFC'}</div>
                      <span>{certificate.status}</span>
                      <h3>{certificate.title}</h3>
                      <p>{module?.title || 'Training credential'}</p>
                      <dl>
                        <div>
                          <dt>Issue</dt>
                          <dd>{certificate.issueDate}</dd>
                        </div>
                        <div>
                          <dt>Expiry</dt>
                          <dd>{certificate.expiryDate}</dd>
                        </div>
                      </dl>
                      <button type="button" onClick={() => alert('Connect this button to your certificate file endpoint.')}>
                        Download certificate
                      </button>
                    </article>
                  )
                })}
              </div>

              <section className="panel">
                <PanelTitle kicker="Badges" title="All module milestones" />
                <div className="badge-grid">
                  {selectedCourseModules.length === 0 && (
                    <EmptyFrame title="No badge rows yet" body="Badges will use module badge_name or badge fields when database modules load." />
                  )}
                  {selectedCourseModules.map((module) => (
                    <div key={module.id} className={earnedBadgeIds.has(module.id) ? 'badge earned' : 'badge locked'}>
                      <span style={{ background: module.accent }}>{module.badge.slice(0, 2).toUpperCase()}</span>
                      <strong>{module.badge}</strong>
                      <small>{earnedBadgeIds.has(module.id) ? 'Earned' : `${getProgress(module)}% complete`}</small>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="page-stack">
              <PageIntro
                kicker="Notifications"
                title="Training updates and reminders"
                body="Read admin announcements, resource updates, certificate messages, and schedule reminders."
              />
              <div className="notification-actions">
                <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
                  Mark all read
                </button>
              </div>
              <div className="notification-list">
                {userNotifications.length === 0 && (
                  <EmptyFrame title="No notifications yet" body="Notification cards will appear after the database returns rows from the notifications endpoint." />
                )}
                {userNotifications.map((notification) => (
                  <article key={notification.id} className={notification.read ? 'read' : 'unread'}>
                    <div>
                      <span>{notification.type}</span>
                      <h3>{notification.title}</h3>
                      <p>{notification.body}</p>
                      <small>{new Date(notification.createdAt).toLocaleString('en-MY')}</small>
                    </div>
                    <div className="notification-buttons">
                      <button type="button" onClick={() => markNotificationRead(notification.id)} disabled={notification.read}>
                        Read
                      </button>
                      <button type="button" onClick={() => removeNotification(notification.id)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'schedule' && (
            <section className="page-stack">
              <PageIntro
                kicker="Schedule"
                title="Training due dates and field sessions"
                body="Training schedule cards are ready to receive rows from your database."
              />
              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Upcoming" title={`${currentUser.username}'s schedule`} />
                  <div className="schedule-list">
                    {userSchedule.length === 0 && (
                      <EmptyFrame title="No schedule rows yet" body="Schedule items will appear after your schedule endpoint returns date, title, location, and type fields." />
                    )}
                    {userSchedule.map((item) => (
                      <article key={item.id}>
                        <time>{formatDate(item.date)}</time>
                        <div>
                          <span>{item.type}</span>
                          <h3>{item.title}</h3>
                          <p>{item.location}</p>
                        </div>
                        <div className="schedule-card-actions">
                          <button type="button" onClick={() => startScheduleEdit(item)}>Edit</button>
                          <button type="button" className="danger-button" onClick={() => removeScheduleItem(item.id)}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <PanelTitle kicker="Personal reminder" title={editingScheduleId ? 'Edit schedule item' : 'Add to my schedule'} />
                  <form className="schedule-form" onSubmit={addScheduleItem}>
                    <label>
                      Date
                      <input type="date" value={scheduleForm.date} onChange={(event) => setScheduleForm((prev) => ({ ...prev, date: event.target.value }))} />
                    </label>
                    <label>
                      Title
                      <input type="text" value={scheduleForm.title} onChange={(event) => setScheduleForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Module review or field drill" />
                    </label>
                    <label>
                      Location
                      <input type="text" value={scheduleForm.location} onChange={(event) => setScheduleForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Online or field location" />
                    </label>
                    <label>
                      Type
                      <select value={scheduleForm.type} onChange={(event) => setScheduleForm((prev) => ({ ...prev, type: event.target.value }))}>
                        <option>Reminder</option>
                        <option>Field</option>
                        <option>Quiz</option>
                        <option>Certificate</option>
                      </select>
                    </label>
                    <button type="submit">{editingScheduleId ? 'Save changes' : 'Add reminder'}</button>
                    {editingScheduleId && (
                      <button type="button" className="secondary-form-button" onClick={cancelScheduleEdit}>
                        Cancel edit
                      </button>
                    )}
                  </form>
                </section>
              </div>
            </section>
          )}

          {activeTab === 'files' && (
            <>
              <section className="page-stack">
                <CourseShellNav
                  courses={courseList}
                  selectedCourse={selectedCourse}
                  activeKey="files"
                  onCourseChange={(courseId) => openCourse(courseId, 'files')}
                  onSectionChange={goToCourseSection}
                />
                <PageIntro
                  kicker="Files / Resources"
                  title={selectedCourse?.name || 'Course files'}
                  body="Course-level resources combine Admin module items and Park Guide uploads for the selected course."
                />
                <div className={`module-source-banner ${fileFrame.status}`}>
                  {fileFrame.message}
                </div>
                <section className="panel wide">
                  <PanelTitle kicker="Admin resources" title="Module files, images, videos, and links" />
                  <div className="resource-grid">
                    {selectedCourseResources.length === 0 && (
                      <EmptyFrame title="No Admin resources yet" body="Admin can add file, image, video, and external link items from the Course Builder." />
                    )}
                    {selectedCourseResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        saved={savedResourceIds.has(resource.id)}
                        onToggle={() => toggleResource(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              </section>
              <FileManager
                files={selectedCourseFiles}
                modules={selectedCourseModules}
                userId={currentUserId}
                onFileUploaded={handleCourseFileUploaded}
                onFileDeleted={handleCourseFileDeleted}
                onError={(message) => {
                  setFileFrame({ status: 'empty', message })
                  addNotification('File action failed', message, 'resource')
                }}
              />
            </>
          )}

          {activeTab === 'profile' && (
            <section className="page-stack">
              <PageIntro
                kicker="Profile / Account"
                title="Park Guide profile"
                body="Profile fields are ready to receive guide profile rows from your database."
              />
              <div className="content-grid">
                <section className="panel profile-panel">
                  {!databaseProfile && (
                    <EmptyFrame title="Profile database frame" body={profileFrame.message} />
                  )}
                  <div className="profile-avatar" style={{ background: profileUser.avatarColor }}>
                    {profileUser.avatar ? (
                      <img src={profileUser.avatar} alt="Profile avatar" />
                    ) : (
                      initials(profileUser.displayName)
                    )}
                  </div>
                  <label className="avatar-upload-button">
                    Change photo
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                  <h3>{profileUser.displayName}</h3>
                  <p>{profileUser.position}</p>
                  <span>{profileUser.status}</span>
                  <div className="profile-mini-grid">
                    <div>
                      <strong>{overallProgress}%</strong>
                      <small>Overall progress</small>
                    </div>
                    <div>
                      <strong>{completedModules.length}/{trainingModules.length}</strong>
                      <small>Modules complete</small>
                    </div>
                    <div>
                      <strong>{certificates.length}</strong>
                      <small>Credentials</small>
                    </div>
                  </div>
                  <div className="profile-park-card">
                    <span>Assigned park</span>
                    <strong>{profileUser.assignedPark}</strong>
                    <small>{profileUser.guideId}</small>
                  </div>
                </section>
                <section className="panel wide">
                  <PanelTitle kicker="Editable details" title="My account" />
                  <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
                    {[
                      ['displayName', 'Display name'],
                      ['birthday', 'Birthday'],
                      ['email', 'Email'],
                      ['phone', 'Phone'],
                      ['assignedPark', 'Assigned park'],
                      ['position', 'Position'],
                      ['yearsExperience', 'Years of experience'],
                      ['address', 'Address'],
                    ].map(([field, label]) => (
                      <label key={field}>
                        {label}
                        <input
                          type="text"
                          value={profileUser[field] || '-'}
                          disabled={!editableProfileFields.has(field)}
                          onChange={(event) => updateProfileField(field, event.target.value)}
                          onBlur={(event) => saveProfileEdit(field, event.target.value)}
                        />
                      </label>
                    ))}
                    <label>
                      Guide ID
                      <input type="text" value={profileUser.guideId} disabled />
                    </label>
                    <label>
                      Role
                      <input type="text" value={profileUser.role} disabled />
                    </label>
                  </form>
                </section>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}

function CourseShellNav({ courses, selectedCourse, activeKey, onCourseChange, onSectionChange }) {
  const sections = [
    ['overview', 'Overview'],
    ['modules', 'Modules'],
    ['item', 'Item Detail'],
    ['progress', 'Progress'],
    ['files', 'Files'],
    ['completion', 'Completion'],
  ]

  return (
    <div className="course-shell-nav">
      <div className="course-shell-selector">
        <span className="kicker">Selected course</span>
        <label>
          <select
            value={selectedCourse?.id || ''}
            onChange={(event) => onCourseChange(event.target.value)}
            disabled={courses.length === 0}
          >
            {courses.length === 0 ? (
              <option value="">No backend courses loaded</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))
            )}
          </select>
        </label>
      </div>
      <nav aria-label="Course navigation">
        {sections.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeKey === key ? 'active' : ''}
            onClick={() => onSectionChange(key)}
            disabled={!selectedCourse}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function EmptyFrame({ title, body }) {
  return (
    <div className="empty-frame">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="progress-bar" aria-label={`${value}% complete`}>
      <div style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  )
}

function StatCard({ label, value, detail }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function PanelTitle({ kicker, title }) {
  return (
    <div className="panel-title">
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
    </div>
  )
}

function PageIntro({ kicker, title, body }) {
  return (
    <div className="page-intro">
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

function ResourceCard({ resource, saved, onToggle }) {
  return (
    <article className="resource-card">
      <span>{resource.type}</span>
      <h3>{resource.title}</h3>
      <p>{resource.moduleTitle}</p>
      <button type="button" onClick={onToggle}>
        {saved ? 'Saved' : 'Save'}
      </button>
    </article>
  )
}

function ModuleVisual({ module, className = '', asButton = false, onClick }) {
  const src = moduleImageSrc(module)
  const content = (
    <>
      {src ? <img src={src} alt="" onError={(event) => event.currentTarget.classList.add('is-broken')} /> : <div className="module-image-pattern" />}
      <span style={{ background: cleanText(module?.accent, '#ff7a1a') }}>{cleanText(module?.category, 'Training')}</span>
    </>
  )

  if (asButton) {
    return (
      <button type="button" className={`${className} module-visual`} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={`${className} module-visual`}>{content}</div>
}

function ModuleThumb({ module }) {
  const src = moduleImageSrc(module)
  return (
    <span className="module-thumb" style={{ '--module-accent': cleanText(module?.accent, '#ff7a1a') }}>
      {src ? <img src={src} alt="" onError={(event) => event.currentTarget.classList.add('is-broken')} /> : initials(module?.title || 'Module')}
    </span>
  )
}

function CanvasItemPreview({
  item,
  module,
  enrolled,
  completed,
  onToggleComplete,
  quizDefinition,
  quizDraft,
  setQuizDraft,
  submitQuiz,
  quizResult,
  saved,
  onSaveResource,
}) {
  if (!item) {
    return <EmptyFrame title="Select an item" body="Choose a Canvas item from the module list to preview what Park Guides will see." />
  }

  const meta = itemTypeMeta(item.type)
  const quizKey = getCanvasQuizKey(module, item)
  const checklistItems = toList(item.checklist || item.checklistItems || item.checklist_items || item.content)
    .map(toPlainText)
    .filter(Boolean)
  const hasExternalUrl = Boolean(cleanText(item.url))

  return (
    <div className="canvas-preview-content">
      <div className="canvas-preview-heading">
        <span className="canvas-item-icon large">{meta.icon}</span>
        <div>
          <strong>{item.title}</strong>
          <small>{meta.label} · {module?.title}</small>
        </div>
      </div>

      {item.description && <p className="canvas-preview-description">{item.description}</p>}

      {(item.type === 'page' || item.type === 'text') && (
        <div className="canvas-rich-content">
          {item.content || item.description || 'Admin page content will appear here after it is added in the Course builder.'}
        </div>
      )}

      {item.type === 'image' && (
        <div className="canvas-media-frame image-frame">
          {hasExternalUrl ? <img src={item.url} alt={item.title} /> : <span>Image placeholder</span>}
        </div>
      )}

      {item.type === 'video' && (
        <div className="canvas-media-frame video-frame">
          <span>▶</span>
          <strong>{hasExternalUrl ? 'Video link ready' : 'Video placeholder'}</strong>
          <small>{hasExternalUrl ? item.url : 'Add an MP4 or YouTube link from Admin.'}</small>
        </div>
      )}

      {item.type === 'file' && (
        <div className="canvas-file-frame">
          <strong>{item.title}</strong>
          <p>{item.description || 'Downloadable file or document resource.'}</p>
          <button type="button" disabled={!hasExternalUrl} onClick={() => hasExternalUrl && window.open(item.url, '_blank', 'noopener,noreferrer')}>
            {hasExternalUrl ? 'Open file' : 'File URL not attached yet'}
          </button>
        </div>
      )}

      {item.type === 'link' && (
        <div className="canvas-file-frame">
          <strong>External reference</strong>
          <p>{item.description || item.url || 'Admin can attach a website, Canvas page, or reference URL.'}</p>
          <button type="button" disabled={!hasExternalUrl} onClick={() => hasExternalUrl && window.open(item.url, '_blank', 'noopener,noreferrer')}>
            {hasExternalUrl ? 'Open link' : 'Link not attached yet'}
          </button>
        </div>
      )}

      {item.type === 'checklist' && (
        <div className="canvas-checklist-preview">
          {(checklistItems.length > 0 ? checklistItems : ['Review the evidence', 'Write a field note', 'Send recommendation for Admin review']).map((step, index) => (
            <label key={`${step}-${index}`}>
              <input type="checkbox" disabled />
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </label>
          ))}
        </div>
      )}

      {item.type === 'quiz' && (
        <div className="canvas-quiz-preview">
          <p className="quiz-question">{quizDefinition?.question || item.description || 'Quiz question will appear here.'}</p>
          {quizDefinition?.options?.length > 0 ? (
            <div className="quiz-options">
              {quizDefinition.options.map((option, index) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`quiz-${module.id}`}
                    value={index}
                    checked={Number(quizDraft[quizKey] ?? quizDraft[module.id]) === index}
                    disabled={!enrolled}
                    onChange={(event) =>
                      setQuizDraft((prev) => ({
                        ...prev,
                        [quizKey]: event.target.value,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <EmptyFrame title="Quiz options missing" body="Add answer choices in the Admin Course builder before the live demo." />
          )}
          <button
            type="button"
            className="full-button"
            disabled={!enrolled || !quizDefinition?.options?.length || quizDraft[quizKey] === undefined}
            onClick={() => submitQuiz(module, item, quizDefinition)}
          >
            Submit quiz
          </button>
          {quizResult && (
            <div className={quizResult.passed ? 'quiz-result pass' : 'quiz-result review'}>
              {quizResult.passed ? 'Passed' : 'Review needed'} - Score {quizResult.score}%
            </div>
          )}
        </div>
      )}

      <div className="canvas-preview-actions">
        {isResourceLikeItem(item) && (
          <button type="button" className="secondary-form-button" onClick={onSaveResource}>
            {saved ? 'Saved resource' : 'Save resource'}
          </button>
        )}
        <button type="button" className="full-button" disabled={!enrolled || item.type === 'quiz'} onClick={onToggleComplete}>
          {completed ? 'Mark incomplete' : item.type === 'quiz' ? 'Complete quiz to finish' : 'Mark complete'}
        </button>
      </div>
    </div>
  )
}

export default App
