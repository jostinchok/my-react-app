import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { ResizeMode, Video } from 'expo-av'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Image, Linking, Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AuthScreens from './AuthScreens'
import { API_BASE_URL_STORAGE_KEY, getApiBaseUrl } from './apiConfig'
import { mobileContentApi } from './mobileApi'

const palette = {
  // Website colors synced from `user_page/src/App.css`
  forest: '#3a2a16',
  forest2: '#874500',
  charcoal: '#28251d',
  leaf: '#6bdc45',
  lime: '#b8f22f',
  citrus: '#ff7a1a',
  sun: '#ffd23f',
  cream: '#fff9e9',
  mist: '#f4f8ee',
  white: '#ffffff',
  line: '#dfe8d6',
  muted: '#617064',
  danger: '#c74f3f',
}

const sideMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'D' },
  { id: 'modules', label: 'Courses', icon: 'M' },
  { id: 'progress', label: 'Progress', icon: 'P' },
  { id: 'certificates', label: 'Certificates', icon: 'C' },
  { id: 'resources', label: 'Resources', icon: 'R' },
  { id: 'notifications', label: 'Notifications', icon: 'N' },
  { id: 'schedule', label: 'Schedule', icon: 'S' },
  { id: 'profile', label: 'Profile', icon: 'U' },
  { id: 'logout', label: 'Logout', icon: 'L' },
]

/** Server-driven content lives in DB and is loaded through mobile APIs */
/**Status Options*/
const enrollmentStatusOptions = ['all', 'none', 'pending', 'approved', 'declined']
const scheduleTypeOptions = ['Reminder', 'Field', 'Quiz', 'Certificate']
const NAV_WIDTH = 284
const SESSION_KEY = 'sfc_guide_session'

const getTodayIsoDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
/** Main guide shell after login (your orange sidebar UI). */
function GuideMainApp({ onRequestLogout, sessionUser, apiBaseUrl }) {
  const api = useMemo(() => mobileContentApi(apiBaseUrl), [apiBaseUrl])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeMenuId, setActiveMenuId] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [modules, setModules] = useState([])
  const [coursesCatalog, setCoursesCatalog] = useState([])
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  const [activeCourseId, setActiveCourseId] = useState(null)
  const [openedCourseId, setOpenedCourseId] = useState(null)
  const [moduleSearch, setModuleSearch] = useState('')
  const [courseStatusFilter, setCourseStatusFilter] = useState('all')
  const [moduleProgress, setModuleProgress] = useState({})
  const [completedSteps, setCompletedSteps] = useState({})
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizPosition, setQuizPosition] = useState({})
  const [quizScores, setQuizScores] = useState({})
  const [quizResults, setQuizResults] = useState({})
  const [notifications, setNotifications] = useState([])
  const [scheduleItems, setScheduleItems] = useState([])
  const [courseActionLoading, setCourseActionLoading] = useState(null)
  const [resourceCourseId, setResourceCourseId] = useState(null)
  const [resourceModuleId, setResourceModuleId] = useState(null)
  const [resources, setResources] = useState([])
  const [courseCertificates, setCourseCertificates] = useState([])
  const [selectedCertificateCourseId, setSelectedCertificateCourseId] = useState(null)
  const [certificateActionLoading, setCertificateActionLoading] = useState(null)
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourceUploading, setResourceUploading] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ date: getTodayIsoDate(), title: '', location: '', type: 'Reminder' })
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  /**Profile*/
  /**related to the database */
  const [profile, setProfile] = useState({
    fullName: 'SFC Park Guide',
    email: 'guide@sfc.demo',
    assignedPark: 'Bako National Park',
    parkGuideId: 'PG-1024',
    phoneNumber: '',
    birthday: '',
    address: '',
    imageUri: '',
  })
  const [profileForm, setProfileForm] = useState({
    fullName: 'SFC Park Guide',
    email: 'guide@sfc.demo',
    assignedPark: 'Bako National Park',
    parkGuideId: 'PG-1024',
    phoneNumber: '',
    birthday: '',
    address: '',
    imageUri: '',
  })
  const navTranslate = useRef(new Animated.Value(-NAV_WIDTH)).current
  const navOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!sessionUser?.name && !sessionUser?.email) return
    setProfile((p) => ({
      ...p,
      fullName: sessionUser.name || p.fullName,
      email: sessionUser.email || p.email,
    }))
    setProfileForm((p) => ({
      ...p,
      fullName: sessionUser.name || p.fullName,
      email: sessionUser.email || p.email,
    }))
  }, [sessionUser])

  // Derive avatar initial from current profile full name.
  //related to the databse
  const profileInitial = (profile.fullName?.trim()?.[0] || 'U').toUpperCase()

  const selectedModule = useMemo(
    () =>
      modules.find((m) => m.id === selectedModuleId) ||
      modules[0] || {
        id: null,
        title: 'No module assigned',
        subtitle: 'No learning module is currently assigned.',
        category: 'N/A',
        park: 'N/A',
        duration: '-',
        level: '-',
        progress: 0,
        objectives: [],
        lessons: [],
        quiz: [],
      },
    [modules, selectedModuleId]
  )
  const modulesForActiveCourse = useMemo(() => {
    if (!openedCourseId) return []
    return modules.filter((m) => String(m.course_id || '') === String(openedCourseId))
  }, [modules, openedCourseId])
  const modulesWithState = useMemo(
    () =>
      modules.map((m) => {
        const progress = moduleProgress[m.id] ?? m.progress
        const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'available'
        return { ...m, progress, status }
      }),
    [modules, moduleProgress]
  )
  const approvedCourses = useMemo(
    () => (coursesCatalog || []).filter((c) => c.enrollment_status === 'approved'),
    [coursesCatalog]
  )
  const approvedCourseIdSet = useMemo(
    () => new Set(approvedCourses.map((c) => String(c.course_id))),
    [approvedCourses]
  )
  const approvedModulesWithState = useMemo(
    () => modulesWithState.filter((m) => approvedCourseIdSet.has(String(m.course_id || ''))),
    [modulesWithState, approvedCourseIdSet]
  )
  const courseProgressSummaries = useMemo(
    () =>
      approvedCourses.map((course) => {
        const courseModules = approvedModulesWithState.filter((m) => String(m.course_id || '') === String(course.course_id))
        const totalModules = courseModules.length
        const completedModules = courseModules.filter((m) => m.progress === 100).length
        const averageProgress =
          totalModules > 0 ? Math.round(courseModules.reduce((sum, m) => sum + m.progress, 0) / totalModules) : 0
        return {
          ...course,
          modules: courseModules,
          totalModules,
          completedModules,
          averageProgress,
          isCompleted: totalModules > 0 && completedModules === totalModules,
        }
      }),
    [approvedCourses, approvedModulesWithState]
  )
  const overallProgress = useMemo(() => {
    if (!courseProgressSummaries.length) return 0
    return Math.round(
      courseProgressSummaries.reduce((sum, course) => sum + course.averageProgress, 0) / courseProgressSummaries.length
    )
  }, [courseProgressSummaries])
  const completedModuleCount = useMemo(
    () => approvedModulesWithState.filter((m) => m.progress === 100).length,
    [approvedModulesWithState]
  )
  const completedCourseCount = useMemo(
    () => courseProgressSummaries.filter((course) => course.isCompleted).length,
    [courseProgressSummaries]
  )
  const progressStrengthMap = useMemo(() => {
    const groups = [...new Set(approvedModulesWithState.map((m) => m.category))]
    return groups.map((category) => {
      const list = approvedModulesWithState.filter((m) => m.category === category)
      return { category, avg: Math.round(list.reduce((sum, m) => sum + m.progress, 0) / list.length) }
    })
  }, [approvedModulesWithState])
  const unreadCount = notifications.filter((n) => !n.read).length
  const strengthMap = useMemo(() => {
    const groups = [...new Set(modulesWithState.map((m) => m.category))]
    return groups.map((category) => {
      const list = modulesWithState.filter((m) => m.category === category)
      return { category, avg: Math.round(list.reduce((sum, m) => sum + m.progress, 0) / list.length) }
    })
  }, [modulesWithState])

  const filteredCourses = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase()
    return (coursesCatalog || []).filter((c) => {
      const queryMatch =
        !query ||
        `${c.course_name || ''} ${c.description || ''} ${c.course_id || ''}`.toLowerCase().includes(query)
      const statusMatch = courseStatusFilter === 'all' || c.enrollment_status === courseStatusFilter
      return queryMatch && statusMatch
    })
  }, [coursesCatalog, moduleSearch, courseStatusFilter])
  const visibleCourseCertificates = useMemo(
    () => (courseCertificates || []).filter((course) => Number(course.totalModules) > 0),
    [courseCertificates]
  )
  const modulesForCertificateCourse = useMemo(() => {
    if (!selectedCertificateCourseId) return []
    return modulesWithState.filter((m) => String(m.course_id || '') === String(selectedCertificateCourseId))
  }, [modulesWithState, selectedCertificateCourseId])

  useEffect(() => {
    if (!visibleCourseCertificates.length) {
      if (selectedCertificateCourseId !== null) setSelectedCertificateCourseId(null)
      return
    }
    const exists = visibleCourseCertificates.some((c) => String(c.courseId) === String(selectedCertificateCourseId))
    if (!exists) setSelectedCertificateCourseId(visibleCourseCertificates[0].courseId)
  }, [visibleCourseCertificates, selectedCertificateCourseId])

  const refreshMobileData = async () => {
    const userId = sessionUser?.user_id
    if (!userId) return
    const [moduleRes, coursesRes, notificationsRes, scheduleRes, profileRes, certificatesRes] = await Promise.all([
      api.getModules(userId),
      api.getCourses(userId),
      api.getNotifications(userId),
      api.getSchedule(userId),
      api.getProfile(userId),
      api.getCertificates(userId),
    ])

    const rawModuleList = Array.isArray(moduleRes.modules) ? moduleRes.modules : []
    const moduleList = Array.from(
      new Map(
        rawModuleList
          .filter((m) => m && m.id !== undefined && m.id !== null)
          .map((m) => [String(m.id), m])
      ).values()
    )
    setModules(moduleList)
    if (!selectedModuleId && moduleList.length) {
      setSelectedModuleId(moduleList[0].id)
      if (moduleList[0].course_id) setActiveCourseId(moduleList[0].course_id)
    }
    setModuleProgress(Object.fromEntries(moduleList.map((m) => [m.id, Number(m.progress) || 0])))
    setCompletedSteps(
      Object.fromEntries(
        moduleList.map((m) => [
          m.id,
          Array.isArray(m.completedLessons)
            ? m.completedLessons.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0)
            : [],
        ])
      )
    )
    setQuizScores(
      Object.fromEntries(
        moduleList.map((m) => [
          m.id,
          {
            score: Number(m.savedQuizScore) || 0,
            passed: Boolean(m.savedQuizPassed),
          },
        ])
      )
    )
    setQuizPosition(Object.fromEntries(moduleList.map((m) => [m.id, 0])))
    setCoursesCatalog(Array.isArray(coursesRes.courses) ? coursesRes.courses : [])
    setCourseCertificates(Array.isArray(certificatesRes.certificates) ? certificatesRes.certificates : [])
    setNotifications(Array.isArray(notificationsRes.notifications) ? notificationsRes.notifications : [])
    setScheduleItems(Array.isArray(scheduleRes.scheduleItems) ? scheduleRes.scheduleItems : [])

    if (profileRes?.profile) {
      setProfile((prev) => ({ ...prev, ...profileRes.profile }))
      setProfileForm((prev) => ({ ...prev, ...profileRes.profile }))
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!sessionUser?.user_id) return
      setIsDataLoading(true)
      try {
        await refreshMobileData()
      } catch (e) {
        if (!cancelled) Alert.alert('Sync error', e.message || 'Failed to load app data from database.')
      } finally {
        if (!cancelled) setIsDataLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sessionUser?.user_id, apiBaseUrl])


/**Open Menu*/
  const openMenu = () => {
    setMenuOpen(true)
    Animated.parallel([
      Animated.timing(navTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(navOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
  }
/**Close Menu*/
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(navTranslate, { toValue: -NAV_WIDTH, duration: 240, useNativeDriver: true }),
      Animated.timing(navOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setMenuOpen(false))
  }

  const goToTab = (tabId) => {
    if (tabId === 'logout') {
      closeMenu()
      onRequestLogout?.()
      return
    }
    setActiveMenuId(tabId)
    setActiveTab(tabId)
    closeMenu()
  }

  // Header profile shortcut: top-right icon routes to Profile page directly.
  const openProfileFromHeader = () => {
    setActiveMenuId('profile')
    setActiveTab('profile')
  }

  const openModuleDetails = (moduleId) => {
    const module = modules.find((m) => m.id === moduleId)
    if (module?.course_id) setActiveCourseId(module.course_id)
    setSelectedModuleId(moduleId)
    setActiveMenuId('modules')
    setActiveTab('module')
  }

  const openCourseModules = (courseId) => {
    const courseModules = modulesWithState.filter((m) => String(m.course_id || '') === String(courseId))
    if (!courseModules.length) {
      Alert.alert('No modules yet', 'This course has no published modules yet.')
      return
    }
    setOpenedCourseId(courseId)
    setActiveCourseId(courseId)
    openModuleDetails(courseModules[0].id)
  }

  const submitCourseRegistration = async (courseId) => {
    const userId = sessionUser?.user_id
    if (!userId) return
    setCourseActionLoading(courseId)
    try {
      await api.registerCourse(courseId, userId)
      await refreshMobileData()
      Alert.alert('Request sent', 'Your registration request was submitted to admin for approval.')
    } catch (e) {
      Alert.alert('Request failed', e.message || 'Unable to submit request.')
    } finally {
      setCourseActionLoading(null)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshMobileData()
    } catch (e) {
      Alert.alert('Refresh failed', e.message || 'Unable to fetch latest updates.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTrackableBlocks = (module) => {
    const blocks = Array.isArray(module?.contentBlocks) ? module.contentBlocks : []
    return blocks.filter((b) => b.type !== 'quiz')
  }

  const mediaUrl = (url) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    return `${api.base}${url.startsWith('/') ? '' : '/'}${url}`
  }
//related to the database
  const toggleStep = (moduleId, stepIndex) => {
    setCompletedSteps((prev) => {
      const current = prev[moduleId] || []
      const next = current.includes(stepIndex) ? current.filter((i) => i !== stepIndex) : [...current, stepIndex]
      const module = modules.find((m) => m.id === moduleId)
      const trackableTotal = getTrackableBlocks(module).length || 1
      const lessonRatio = (next.length / trackableTotal) * 70
      const quizRatio = (quizScores[moduleId]?.score || 0) * 0.3
      const progress = Math.round(Math.max(0, Math.min(100, lessonRatio + quizRatio)))
      setModuleProgress((state) => ({ ...state, [moduleId]: progress }))
      api.saveProgress(moduleId, {
        userId: sessionUser?.user_id,
        progressPercent: progress,
        completedLessons: next,
        quizScore: quizScores[moduleId]?.score || 0,
        quizPassed: Boolean(quizScores[moduleId]?.passed),
      }).catch(() => {})
      return { ...prev, [moduleId]: next.sort((a, b) => a - b) }
    })
  }
/**Select Quiz Answer*/
  const selectQuizAnswer = (moduleId, questionIndex, optionIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [questionIndex]: optionIndex,
      },
    }))
  }
/**Move Quiz Question*/
  const moveQuizQuestion = (moduleId, delta) => {
    const module = modules.find((m) => m.id === moduleId)
    const questionCount = module?.quiz.length || 1
    setQuizPosition((prev) => ({
      ...prev,
      [moduleId]: Math.max(0, Math.min(questionCount - 1, (prev[moduleId] || 0) + delta)),
    }))
  }
/**Submit Quiz*/
  const submitQuiz = () => {
    const module = selectedModule
    if (!module) return
    if (!module.quiz?.length) {
      Alert.alert('Quiz unavailable', 'This module currently has no quiz questions.')
      return
    }
    const answers = quizAnswers[module.id] || {}
    if (Object.keys(answers).length < module.quiz.length) {
      Alert.alert('Incomplete quiz', 'Please answer all quiz questions before submitting.')
      return
    }
    const getCorrectIndex = (question) => {
      const idx = Number(question?.answerIndex)
      if (Number.isInteger(idx) && idx >= 0) return idx
      if (question?.answer !== undefined) {
        const byText = (question.options || []).findIndex((opt) => String(opt) === String(question.answer))
        if (byText >= 0) return byText
      }
      return -1
    }

    const correct = module.quiz.reduce((count, question, index) => {
      const picked = Number(answers[index])
      const expected = getCorrectIndex(question)
      return count + (picked === expected ? 1 : 0)
    }, 0)
    const score = Math.round((correct / module.quiz.length) * 100)
    const correctByQuestion = {}
    module.quiz.forEach((question, index) => {
      const picked = Number(answers[index])
      const expected = getCorrectIndex(question)
      correctByQuestion[index] = picked === expected
    })
    setQuizResults((prev) => ({ ...prev, [module.id]: { submitted: true, correctByQuestion } }))
    setQuizScores((prev) => ({ ...prev, [module.id]: { score, passed: score === 100 } }))
    const lessonsDone = (completedSteps[module.id] || []).length
    const trackableTotal = getTrackableBlocks(module).length || 1
    const lessonRatio = (lessonsDone / trackableTotal) * 70
    const quizRatio = score * 0.3
    const progress = Math.round(Math.max(0, Math.min(100, lessonRatio + quizRatio)))
    const persisted = Number(moduleProgress[module.id] ?? module.progress ?? 0)
    const safeProgress = Math.max(progress, persisted)
    setModuleProgress((prev) => ({ ...prev, [module.id]: safeProgress }))
    api.saveProgress(module.id, {
      userId: sessionUser?.user_id,
      progressPercent: safeProgress,
      completedLessons: completedSteps[module.id] || [],
      quizScore: score,
      quizPassed: score === 100,
    }).catch(() => {})
    setNotifications((prev) => [{ id: Date.now(), type: 'training', title: score === 100 ? 'Quiz passed' : 'Quiz needs review', body: `${module.title} quiz score: ${score}%`, read: false }, ...prev])
  }
/**Add Reminder*/
  const formatDateInput = (value) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 4) return digits
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
/**Convert Date to ISO Format*/
  const toIsoDate = (dateObj) => {
    const year = dateObj.getFullYear()
    const month = `${dateObj.getMonth() + 1}`.padStart(2, '0')
    const day = `${dateObj.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isValidIsoDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
    if (!match) return false
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    if (month < 1 || month > 12 || day < 1) return false
    const maxDay = new Date(year, month, 0).getDate()
    return day <= maxDay
  }
/**Open Calendar*/
  const openCalendar = () => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(scheduleForm.date || '')
    if (match) {
      const [, y, m] = match
      setCalendarMonth(new Date(Number(y), Number(m) - 1, 1))
    }
    setCalendarOpen(true)
  }

  const handleDateInput = (value) => {
    setScheduleForm((prev) => ({ ...prev, date: formatDateInput(value) }))
  }

  const shiftCalendarMonth = (delta) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const pickCalendarDate = (dayNumber) => {
    const picked = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber)
    setScheduleForm((prev) => ({ ...prev, date: toIsoDate(picked) }))
    setCalendarOpen(false)
  }

  const calendarLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const monthStartDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const selectedDayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(scheduleForm.date || '')
  const selectedDay =
    selectedDayMatch &&
    Number(selectedDayMatch[1]) === calendarMonth.getFullYear() &&
    Number(selectedDayMatch[2]) - 1 === calendarMonth.getMonth()
      ? Number(selectedDayMatch[3])
      : null

  const addReminder = async () => {
    if (!scheduleForm.date || !scheduleForm.title.trim()) return
    if (!isValidIsoDate(scheduleForm.date)) {
      Alert.alert('Invalid date', 'Please enter a valid date in YYYY-MM-DD format.')
      return
    }
    try {
      if (editingScheduleId) {
        await api.updateSchedule(editingScheduleId, {
          userId: sessionUser?.user_id,
          date: scheduleForm.date,
          title: scheduleForm.title.trim(),
          location: scheduleForm.location.trim() || 'Self-paced',
          type: scheduleForm.type,
        })
        setScheduleItems((prev) =>
          prev.map((item) =>
            item.id === editingScheduleId
              ? {
                  ...item,
                  date: scheduleForm.date,
                  title: scheduleForm.title.trim(),
                  location: scheduleForm.location.trim() || 'Self-paced',
                  type: scheduleForm.type,
                }
              : item
          )
        )
        setEditingScheduleId(null)
      } else {
        const created = await api.createSchedule({
          userId: sessionUser?.user_id,
          date: scheduleForm.date,
          title: scheduleForm.title.trim(),
          location: scheduleForm.location.trim() || 'Self-paced',
          type: scheduleForm.type,
        })
        setScheduleItems((prev) => [{ id: created.id, date: created.date, title: created.title, location: created.location, type: created.type }, ...prev])
      }
    } catch (e) {
      Alert.alert('Schedule sync failed', e.message || 'Unable to save reminder.')
      return
    }
    setScheduleForm((prev) => ({ ...prev, date: getTodayIsoDate(), title: '', location: '', type: 'Reminder' }))
  }
  /**Update Reminder*/
  const startUpdateReminder = (item) => {
    setEditingScheduleId(item.id)
    setScheduleForm({
      date: item.date,
      title: item.title,
      location: item.location,
      type: item.type,
    })
  }
  /**Delete Reminder*/
  const deleteReminder = (id) => {
    const performDelete = async () => {
      try {
        await api.deleteSchedule(id, sessionUser?.user_id)
      } catch (e) {
        Alert.alert('Delete failed', e.message || 'Unable to delete reminder.')
        return
      }
      setScheduleItems((prev) => prev.filter((item) => Number(item.id) !== Number(id)))
      if (editingScheduleId === id) {
        setEditingScheduleId(null)
        setScheduleForm((prev) => ({ ...prev, date: getTodayIsoDate(), title: '', location: '', type: 'Reminder' }))
      }
    }

    // On web, use browser confirm to guarantee delete confirmation works.
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Are you sure you want to delete this reminder? This action cannot be undone.')
        : false
      if (confirmed) void performDelete()
      return
    }

    Alert.alert(
      'Delete reminder',
      'Are you sure you want to delete this reminder? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performDelete()
          },
        },
      ]
    )
  }
  
  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload a profile image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfileForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }))
    }
  }

  const saveProfile = async () => {
    const fullName = profileForm.fullName.trim()
    const email = profileForm.email.trim()
    const phoneNumber = profileForm.phoneNumber.trim()
    const birthday = profileForm.birthday.trim()
    const address = profileForm.address.trim()
    const assignedPark = profileForm.assignedPark.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?\d{8,15}$/
    const birthdayDate = birthday ? new Date(`${birthday}T00:00:00`) : null
    const today = new Date()
    const errors = []

    if (!fullName) errors.push('- Full Name is required.')
    if (!emailRegex.test(email)) errors.push('- Email must be in a valid format, e.g. name@example.com.')
    if (!phoneRegex.test(phoneNumber)) errors.push('- Phone Number must contain only digits and be 8 to 15 digits long.')
    if (!isValidIsoDate(birthday)) {
      errors.push('- Birthday must be a valid date in YYYY-MM-DD format.')
    } else if (birthdayDate && birthdayDate > today) {
      errors.push('- Birthday cannot be in the future.')
    }
    if (address.length < 8) errors.push('- Address must be at least 8 characters long.')
    if (!assignedPark) errors.push('- Assigned Park is required.')

    if (errors.length > 0) {
      Alert.alert('Invalid profile details', errors.join('\n'))
      return
    }

    const nextProfile = {
      fullName,
      email,
      assignedPark,
      parkGuideId: profile.parkGuideId,
      phoneNumber,
      birthday,
      address,
      imageUri: profileForm.imageUri,
    }
    try {
      await api.updateProfile(sessionUser?.user_id, nextProfile)
    } catch (e) {
      Alert.alert('Save failed', e.message || 'Profile update failed.')
      return
    }
    setProfile(nextProfile)
    Alert.alert('Saved', 'Profile updated successfully.')
  }
/**Download Certificate*/
  const requestCertificate = async (courseId) => {
    if (!courseId || !sessionUser?.user_id) return
    setCertificateActionLoading(courseId)
    try {
      await api.requestCertificate(sessionUser.user_id, courseId)
      await refreshMobileData()
      Alert.alert('Request sent', 'Your certificate request has been sent to admin for approval.')
    } catch (e) {
      Alert.alert('Request failed', e.message || 'Unable to submit certificate request.')
    } finally {
      setCertificateActionLoading(null)
    }
  }
/**Mark Read*/
  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await api.markNotificationRead(id, sessionUser?.user_id, true)
    } catch {}
  }
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await api.markAllNotificationsRead(sessionUser?.user_id)
    } catch {}
  }
  const removeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id))

  const selectedResourceCourse = useMemo(
    () => approvedCourses.find((c) => String(c.course_id) === String(resourceCourseId)) || null,
    [approvedCourses, resourceCourseId]
  )

  const formatBytes = (bytes) => {
    const value = Number(bytes) || 0
    if (value < 1024) return `${value} B`
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
    if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
    return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  const formatUploadDate = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
    return d.toLocaleString()
  }

  useEffect(() => {
    if (!resourceCourseId && approvedCourses.length > 0) {
      setResourceCourseId(approvedCourses[0].course_id)
    }
    if (resourceCourseId && !approvedCourses.some((c) => c.course_id === resourceCourseId)) {
      setResourceCourseId(approvedCourses[0]?.course_id || null)
    }
  }, [approvedCourses, resourceCourseId])

  const resourceModulesForCourse = useMemo(() => {
    if (!resourceCourseId) return []
    return (modules || []).filter((m) => String(m.course_id || '') === String(resourceCourseId))
  }, [modules, resourceCourseId])
  const selectedResourceModule = useMemo(
    () => resourceModulesForCourse.find((m) => Number(m.id) === Number(resourceModuleId)) || null,
    [resourceModulesForCourse, resourceModuleId]
  )

  useEffect(() => {
    if (!resourceCourseId) {
      setResourceModuleId(null)
      return
    }
    const valid = resourceModulesForCourse.some((m) => Number(m.id) === Number(resourceModuleId))
    if (!valid) {
      setResourceModuleId(resourceModulesForCourse[0]?.id || null)
    }
  }, [resourceCourseId, resourceModuleId, resourceModulesForCourse])

  const loadResources = async (courseId, moduleId) => {
    if (!courseId || !moduleId || !sessionUser?.user_id) {
      setResources([])
      return
    }
    const moduleStillInCourse = (modules || []).some(
      (m) => String(m.course_id || '') === String(courseId) && Number(m.id) === Number(moduleId)
    )
    if (!moduleStillInCourse) {
      setResources([])
      return
    }
    setResourcesLoading(true)
    try {
      const data = await api.getModuleResources(courseId, moduleId, sessionUser.user_id)
      setResources(Array.isArray(data.resources) ? data.resources : [])
    } catch (e) {
      setResources([])
      Alert.alert('Resources', e.message || 'Unable to load resources.')
    } finally {
      setResourcesLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'resources') return
    loadResources(resourceCourseId, resourceModuleId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, resourceCourseId, resourceModuleId, sessionUser?.user_id])

  const handleResourceUpload = async () => {
    if (!resourceCourseId || !resourceModuleId || !sessionUser?.user_id) {
      Alert.alert('Choose course', 'Please select an approved course first.')
      return
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true })
      if (result.canceled) return
      const file = result.assets?.[0]
      if (!file) return
      setResourceUploading(true)
      await api.uploadModuleResource(resourceCourseId, resourceModuleId, sessionUser.user_id, file)
      await loadResources(resourceCourseId, resourceModuleId)
      Alert.alert('Uploaded', `${file.name} was uploaded.`)
    } catch (e) {
      Alert.alert('Upload failed', e.message || 'Unable to upload file.')
    } finally {
      setResourceUploading(false)
    }
  }

  const handleResourceDownload = async (resource) => {
    if (!resourceCourseId || !resourceModuleId || !sessionUser?.user_id || !resource) return
    const url = api.getModuleResourceDownloadUrl(resourceCourseId, resourceModuleId, resource.resource_id, sessionUser.user_id)
    try {
      const supported = await Linking.canOpenURL(url)
      if (!supported) {
        Alert.alert('Cannot open file', 'No installed app can open this file URL.')
        return
      }
      await Linking.openURL(url)
    } catch (e) {
      Alert.alert('Open failed', e.message || 'Unable to open the file.')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <Pressable onPress={openMenu} style={styles.menuBtn}><Text style={styles.menuText}>☰</Text></Pressable>
          <View>
            <Text style={styles.kicker}>SFC / {activeTab.toUpperCase()}</Text>
            <Text style={styles.topTitle}>SFC Guide Center</Text>
          </View>
        </View>
        <View style={styles.topbarRight}>
          <Pressable onPress={handleRefresh} style={styles.headerRefreshBtn} disabled={isRefreshing || isDataLoading}>
            <Text style={styles.headerRefreshText}>{isRefreshing ? '...' : '↻'}</Text>
          </Pressable>
          {/* Clickable top-right profile icon as requested */}
          <Pressable onPress={openProfileFromHeader} style={styles.headerProfileBtn}>
            <Text style={styles.headerProfileIcon}>{profileInitial}</Text>
          </Pressable>
        </View>
      </View>
      

      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[palette.citrus]}
            tintColor={palette.citrus}
          />
        }
      >
        {isDataLoading && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Syncing data</Text>
            <Text style={styles.rowMeta}>Loading latest modules, schedule, notifications, and profile from database...</Text>
          </View>
        )}
        {activeTab === 'dashboard' && (
          <View style={styles.stack}>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>Citrus learning path</Text>
              <Text style={styles.heroTitle}>Fresh field training for Sarawak park guides.</Text>
              <Text style={styles.heroBody}>Continue assigned modules, pass scenario quizzes, and prepare certification milestones.</Text>
              <View style={styles.heroActions}>
                <Pressable style={styles.primaryButton} onPress={() => openModuleDetails(selectedModule.id)}><Text style={styles.primaryText}>Continue {selectedModule.title}</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => goToTab('modules')}><Text style={styles.secondaryText}>Browse all modules</Text></Pressable>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Switch module</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherRow}>
                {modulesWithState.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.moduleChip, selectedModuleId === m.id && styles.moduleChipActive]}
                    onPress={() => setSelectedModuleId(m.id)}
                  >
                    <Text style={[styles.moduleChipTitle, selectedModuleId === m.id && styles.moduleChipTitleActive]}>{m.title}</Text>
                    <Text style={[styles.moduleChipMeta, selectedModuleId === m.id && styles.moduleChipMetaActive]}>
                      {m.progress}% complete
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.selectedName}>{selectedModule.title}</Text>
              <View style={styles.selectedProgressRow}>
                <Text style={styles.selectedProgressLabel}>Selected module progress</Text>
                <Text style={styles.selectedProgressValue}>{moduleProgress[selectedModule.id] ?? selectedModule.progress}%</Text>
              </View>
              <ProgressBar value={moduleProgress[selectedModule.id] ?? selectedModule.progress} />
            </View>
            <View style={styles.grid2}>
              <StatCard label="Overall progress" value={`${overallProgress}%`} detail="Across all modules" />
              <StatCard label="Completed modules" value={`${completedModuleCount}/${modulesWithState.length}`} detail="Lessons + quiz" />
              <StatCard label="Certificates" value={`${courseCertificates.filter((c) => c.requestStatus === 'approved' && c.certId).length}`} detail="Approved by admin" />
              <StatCard label="Unread updates" value={`${unreadCount}`} detail="Notifications pending" />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Active modules</Text>
              {approvedModulesWithState.length === 0 ? (
                <Text style={styles.rowMeta}>No active modules yet. Register and get approved for a course first.</Text>
              ) : (
                approvedModulesWithState.map((m) => (
                  <Pressable key={m.id} style={styles.moduleRow} onPress={() => openModuleDetails(m.id)}>
                    <View style={styles.rowThumb} />
                    <View style={styles.rowBody}><Text style={styles.rowTitle}>{m.title}</Text><Text style={styles.rowMeta}>{m.park} - {m.duration}</Text></View>
                    <Text style={styles.rowPct}>{m.progress}%</Text>
                  </Pressable>
                ))
              )}
            </View>
            <View style={styles.roleCardsRow}>
              <RoleCard title="What user can do" items={['View assigned modules', 'Track progress and quizzes', 'Manage schedule reminders', 'Update profile']} />
              <RoleCard title="Admin-only actions" danger items={['Approve certificates', 'Edit module catalog', 'Manage all users', 'Change system settings']} />
            </View>
          </View>
        )}

        {activeTab === 'modules' && (
          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Courses</Text>
              <Text style={styles.rowMeta}>Browse all courses. Register first, then wait for admin approval to access modules.</Text>
              <TextInput style={styles.input} placeholder="Search courses..." value={moduleSearch} onChangeText={setModuleSearch} />
              <SelectLike title="Enrollment status" options={enrollmentStatusOptions} value={courseStatusFilter} onPick={setCourseStatusFilter} />
            </View>
            {filteredCourses.map((course) => {
              const status = course.enrollment_status || 'none'
              const statusLabel = status === 'none' ? 'Not registered' : status.charAt(0).toUpperCase() + status.slice(1)
              const statusStyle =
                status === 'approved'
                  ? styles.badgeSuccess
                  : status === 'pending'
                    ? styles.badgePending
                    : status === 'declined'
                      ? styles.badgeDeclined
                      : styles.badgeNeutral
              const buttonText =
                status === 'approved'
                  ? 'Open course'
                  : status === 'pending'
                    ? 'Pending approval'
                    : status === 'declined'
                      ? 'Re-apply'
                      : 'Register'
              const canOpen = status === 'approved'
              const canRequest = status !== 'pending' && !canOpen
              return (
                <View key={course.course_id} style={styles.card}>
                  <View style={styles.rowEnd}>
                    <Text style={styles.rowTitle}>{course.course_name}</Text>
                    <Text style={[styles.inlineBadge, statusStyle]}>{statusLabel}</Text>
                  </View>
                  <Text style={styles.rowMeta}>Course ID: {course.course_id}</Text>
                  <Text style={styles.rowMeta}>{course.description || 'No description yet.'}</Text>
                  <Text style={styles.rowMeta}>
                    {course.start_date || '-'} to {course.end_date || '-'} • {course.total_contact_hours || 0} hrs • {course.module_count || 0} modules
                  </Text>
                  {status === 'declined' && Boolean(course.remarks) && (
                    <Text style={styles.rowMeta}>Admin remark: {course.remarks}</Text>
                  )}
                  <View style={styles.rowEnd}>
                    <Text style={styles.rowPct}>{course.module_count || 0} modules</Text>
                    <Pressable
                      style={[styles.primaryButton, (!canOpen && !canRequest) && styles.disabledButton]}
                      onPress={() => {
                        if (canOpen) {
                          openCourseModules(course.course_id)
                        } else if (canRequest) {
                          submitCourseRegistration(course.course_id)
                        }
                      }}
                      disabled={(!canOpen && !canRequest) || courseActionLoading === course.course_id}
                    >
                      <Text style={styles.primaryText}>
                        {courseActionLoading === course.course_id ? 'Submitting...' : buttonText}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
            {filteredCourses.length === 0 && (
              <View style={styles.card}>
                <Text style={styles.rowMeta}>No courses found for this filter.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'module' && (
          <View style={styles.stack}>
            {!openedCourseId ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Module details</Text>
                <Text style={styles.rowMeta}>Open an approved course from Courses to view module details.</Text>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <View style={styles.rowEnd}>
                    <Text style={styles.sectionTitle}>Course modules</Text>
                    <Pressable style={styles.secondaryButton} onPress={() => goToTab('modules')}>
                      <Text style={styles.secondaryText}>Back to Courses</Text>
                    </Pressable>
                  </View>
                  {modulesForActiveCourse.length === 0 ? (
                    <Text style={styles.rowMeta}>No modules available for this course.</Text>
                  ) : (
                    modulesForActiveCourse.map((m) => (
                      <Pressable key={`course-module-${m.id}`} style={styles.moduleRow} onPress={() => setSelectedModuleId(m.id)}>
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle}>{m.title}</Text>
                          <Text style={styles.rowMeta}>{m.duration} • {m.level}</Text>
                        </View>
                        <Text style={styles.rowPct}>{(moduleProgress[m.id] ?? m.progress)}%</Text>
                      </Pressable>
                    ))
                  )}
                </View>
                <View style={styles.heroMini}>
                  <Text style={styles.heroKicker}>{selectedModule.category} / {selectedModule.park}</Text>
                  <Text style={styles.heroTitleMini}>{selectedModule.title}</Text>
                  <Text style={styles.heroBodyMini}>{selectedModule.subtitle}</Text>
                  <ProgressBar value={moduleProgress[selectedModule.id] ?? selectedModule.progress} />
                </View>
                {selectedModule.objectives?.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Learning objectives</Text>
                    {selectedModule.objectives.map((item, idx) => <Text key={`obj-${selectedModule.id}-${idx}`} style={styles.listText}>• {item}</Text>)}
                  </View>
                )}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Learning content</Text>
                  {getTrackableBlocks(selectedModule).map((block, index) => {
                    const checked = (completedSteps[selectedModule.id] || []).includes(index)
                    const label = block.title || (block.type === 'video' ? 'Video lesson' : block.type === 'image' ? 'Image lesson' : 'Lesson')
                    return (
                      <View key={`content-${selectedModule.id}-${index}`} style={styles.blockCard}>
                        <Pressable onPress={() => toggleStep(selectedModule.id, index)} style={styles.checkItem}>
                          <Text style={styles.checkMark}>{checked ? '☑' : '☐'}</Text>
                          <Text style={styles.listText}>{label}</Text>
                        </Pressable>
                        {block.type === 'text' && !!block.content && (
                          <Text style={styles.rowMeta}>{block.content}</Text>
                        )}
                        {block.type === 'image' && !!block.media_url && (
                          <View style={styles.lessonMediaFrame}>
                            <Image source={{ uri: mediaUrl(block.media_url) }} style={styles.lessonMediaImage} resizeMode="contain" />
                          </View>
                        )}
                        {block.type === 'video' && !!block.media_url && (
                          Platform.OS === 'web' ? (
                            <video src={mediaUrl(block.media_url)} controls style={{ width: '100%', borderRadius: 10, marginTop: 6 }} />
                          ) : (
                            <View style={styles.lessonMediaFrame}>
                              <Video
                                source={{ uri: mediaUrl(block.media_url) }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                style={styles.lessonMediaVideo}
                                shouldPlay={false}
                              />
                            </View>
                          )
                        )}
                        {(block.caption || block.type !== 'text') && !!block.caption && (
                          <Text style={styles.rowMeta}>{block.caption}</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Scenario quiz</Text>
                  {selectedModule.quiz.length > 0 ? (
                    <>
                      <Text style={styles.quizStepLabel}>Question {(quizPosition[selectedModule.id] || 0) + 1} / {selectedModule.quiz.length}</Text>
                      <Text style={styles.listText}>{selectedModule.quiz[quizPosition[selectedModule.id] || 0]?.question}</Text>
                      {(selectedModule.quiz[quizPosition[selectedModule.id] || 0]?.options || []).map((opt, i) => (
                        <Pressable
                          key={`opt-${selectedModule.id}-${quizPosition[selectedModule.id] || 0}-${i}`}
                          onPress={() => selectQuizAnswer(selectedModule.id, quizPosition[selectedModule.id] || 0, i)}
                          style={[
                            styles.checkItem,
                            quizResults[selectedModule.id]?.submitted &&
                            selectedModule.quiz[quizPosition[selectedModule.id] || 0]?.answerIndex === i
                              ? styles.quizCorrect
                              : undefined,
                            quizResults[selectedModule.id]?.submitted &&
                            Number(quizAnswers[selectedModule.id]?.[quizPosition[selectedModule.id] || 0]) === i &&
                            selectedModule.quiz[quizPosition[selectedModule.id] || 0]?.answerIndex !== i
                              ? styles.quizWrong
                              : undefined,
                          ]}
                        >
                          <Text style={styles.checkMark}>{Number(quizAnswers[selectedModule.id]?.[quizPosition[selectedModule.id] || 0]) === i ? '◉' : '○'}</Text>
                          <Text style={styles.listText}>{opt}</Text>
                        </Pressable>
                      ))}
                      <View style={styles.quizNavRow}>
                        <Pressable
                          style={[styles.secondaryButton, (quizPosition[selectedModule.id] || 0) === 0 && styles.disabledButton]}
                          onPress={() => moveQuizQuestion(selectedModule.id, -1)}
                          disabled={(quizPosition[selectedModule.id] || 0) === 0}
                        >
                          <Text style={styles.secondaryText}>Previous</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.secondaryButton, (quizPosition[selectedModule.id] || 0) === selectedModule.quiz.length - 1 && styles.disabledButton]}
                          onPress={() => moveQuizQuestion(selectedModule.id, 1)}
                          disabled={(quizPosition[selectedModule.id] || 0) === selectedModule.quiz.length - 1}
                        >
                          <Text style={styles.secondaryText}>Next</Text>
                        </Pressable>
                        <Pressable style={styles.primaryButton} onPress={submitQuiz}><Text style={styles.primaryText}>Submit</Text></Pressable>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.rowMeta}>No quiz is available for this module yet.</Text>
                  )}
                  {quizScores[selectedModule.id] && <Text style={styles.scoreText}>Score: {quizScores[selectedModule.id].score}%</Text>}
                  {quizResults[selectedModule.id]?.submitted && (
                    <Text style={styles.rowMeta}>
                      {quizScores[selectedModule.id]?.passed ? 'All answers are correct.' : 'Review highlighted answers and try again.'}
                    </Text>
                  )}
                  {quizScores[selectedModule.id] && (
                    <View style={styles.quizChartWrap}>
                      <QuizPieChart score={quizScores[selectedModule.id].score} />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.stack}>
            <View style={styles.grid2}>
              <StatCard label="Overall progress" value={`${overallProgress}%`} detail="Approved courses average" />
              <StatCard
                label="Completed courses"
                value={`${completedCourseCount}/${courseProgressSummaries.length}`}
                detail="All modules completed"
              />
              <StatCard
                label="Completed modules"
                value={`${completedModuleCount}/${approvedModulesWithState.length}`}
                detail="Approved courses only"
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Approved course progress</Text>
              {courseProgressSummaries.length === 0 ? (
                <Text style={styles.rowMeta}>No approved courses yet.</Text>
              ) : (
                courseProgressSummaries.map((course) => (
                  <View key={`approved-course-${course.course_id}`} style={styles.progressLine}>
                    <View style={styles.rowEnd}>
                      <Text style={styles.rowTitle}>{course.course_name || `Course ${course.course_id}`}</Text>
                      <Text style={[styles.inlineBadge, course.isCompleted ? styles.badgeSuccess : styles.badgePending]}>
                        {course.isCompleted ? 'Completed' : 'In progress'}
                      </Text>
                    </View>
                    <Text style={styles.rowMeta}>Course ID: {course.course_id}</Text>
                    <Text style={styles.rowMeta}>
                      Completed modules: {course.completedModules}/{course.totalModules}
                    </Text>
                    <ProgressBar value={course.averageProgress} />
                    <Text style={styles.rowPct}>{course.averageProgress}%</Text>
                  </View>
                ))
              )}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Approved modules by course</Text>
              {courseProgressSummaries.length === 0 ? (
                <Text style={styles.rowMeta}>No module progress available.</Text>
              ) : (
                courseProgressSummaries.map((course) => (
                  <View key={`approved-course-modules-${course.course_id}`} style={styles.progressCourseBlock}>
                    <Text style={styles.rowTitle}>{course.course_name || `Course ${course.course_id}`}</Text>
                    <Text style={styles.rowMeta}>Course ID: {course.course_id}</Text>
                    {course.modules.length === 0 ? (
                      <Text style={styles.rowMeta}>No modules published for this course.</Text>
                    ) : (
                      course.modules.map((m) => (
                        <View key={`approved-module-${course.course_id}-${m.id}`} style={styles.progressModuleRow}>
                          <View style={styles.rowBody}>
                            <Text style={styles.rowTitle}>{m.title || `Module ${m.id}`}</Text>
                            <Text style={styles.rowMeta}>Module ID: {m.id}</Text>
                            <Text style={styles.rowMeta}>Course ID: {m.course_id || course.course_id}</Text>
                          </View>
                          <View style={styles.progressModuleRight}>
                            <Text style={[styles.inlineBadge, m.progress === 100 ? styles.badgeSuccess : styles.badgeNeutral]}>
                              {m.progress === 100 ? 'Completed' : 'In progress'}
                            </Text>
                            <Text style={styles.rowPct}>{m.progress}%</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ))
              )}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Strength map</Text>
              {progressStrengthMap.map((s) => (
                <View key={s.category} style={styles.progressLine}>
                  <Text style={styles.rowTitle}>{s.category}</Text>
                  <ProgressBar value={s.avg} />
                  <Text style={styles.rowPct}>{s.avg}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'certificates' && (
          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Certificates</Text>
              <Text style={styles.rowMeta}>Certificate requests are available only after all modules in a course are completed. Admin approval is required before certificate issuance.</Text>
              {visibleCourseCertificates.map((course) => {
                const status = String(course.requestStatus || '').toLowerCase()
                const isApproved = status === 'approved' && Boolean(course.certId)
                const isPending = status === 'pending'
                const canRequest = course.allModulesDone && !isApproved && !isPending
                return (
                <View key={course.courseId} style={[styles.certificateCard, !course.allModulesDone && styles.certificateCardLocked]}>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{course.courseName}</Text>
                    <Text style={styles.rowMeta}>{course.doneModules}/{course.totalModules} modules completed</Text>
                    <View style={styles.certificateMetaRow}>
                      <Text style={[styles.certificateBadge, isApproved ? styles.certificateBadgeUnlocked : styles.certificateBadgeLocked]}>
                        {isApproved ? 'Approved' : isPending ? 'Pending approval' : course.allModulesDone ? 'Ready to request' : 'Locked'}
                      </Text>
                      <Text style={styles.rowMeta}>{course.certificateCode || `Course ID: ${course.courseId}`}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.primaryButton, !canRequest && styles.disabledButton]}
                    onPress={() => requestCertificate(course.courseId)}
                    disabled={!canRequest || certificateActionLoading === course.courseId}
                  >
                    <Text style={styles.primaryText}>
                      {certificateActionLoading === course.courseId ? 'Sending...' : isApproved ? 'Issued' : isPending ? 'Pending' : canRequest ? 'Request Certificate' : 'Locked'}
                    </Text>
                  </Pressable>
                </View>
              )})}
              {visibleCourseCertificates.length === 0 && (
                <Text style={styles.rowMeta}>No certificates yet. Certificates appear after admin creates badge/modules for a course.</Text>
              )}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>All course milestones</Text>
              {visibleCourseCertificates.length > 0 && (
                <SelectLike
                  title="Course"
                  options={visibleCourseCertificates.map((c) => ({
                    value: String(c.courseId),
                    label: `${c.courseName || c.courseId} (${c.doneModules}/${c.totalModules})`,
                  }))}
                  value={selectedCertificateCourseId ? String(selectedCertificateCourseId) : ''}
                  onPick={(value) => setSelectedCertificateCourseId(value)}
                />
              )}
              <View style={styles.milestoneGrid}>
                {modulesForCertificateCourse.map((m) => (
                  <View key={m.id} style={[styles.milestone, m.progress === 100 ? styles.milestoneDone : styles.milestonePending]}>
                    <View style={styles.milestoneHeader}>
                      <Text style={styles.rowTitle}>{m.title}</Text>
                      <Text style={styles.milestoneIcon}>{m.progress === 100 ? '✓' : <Text style={styles.milestoneIcon}>◔</Text>}</Text>
                    </View>
                    <Text style={styles.rowMeta}>{m.progress === 100 ? 'Milestone earned' : 'In progress'}</Text>
                    <ProgressBar value={m.progress} />
                    <Text style={styles.milestonePct}>{m.progress}% complete</Text>
                  </View>
                ))}
              </View>
              {visibleCourseCertificates.length > 0 && modulesForCertificateCourse.length === 0 && (
                <Text style={styles.rowMeta}>No modules found for selected course.</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'notifications' && (
          <View style={styles.stack}>
            <View style={styles.rowEnd}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <Pressable style={styles.secondaryButton} onPress={markAllRead}><Text style={styles.secondaryText}>Mark all read</Text></Pressable>
            </View>
            {notifications.map((n) => (
              <View key={n.id} style={[styles.card, !n.read && styles.unreadCard]}>
                <Text style={styles.heroKicker}>{n.type}</Text>
                <Text style={styles.rowTitle}>{n.title}</Text>
                <Text style={styles.rowMeta}>{n.body}</Text>
                <View style={styles.rowEnd}>
                  <Pressable style={styles.secondaryButton} onPress={() => markRead(n.id)}><Text style={styles.secondaryText}>Read</Text></Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => removeNotification(n.id)}><Text style={styles.secondaryText}>Remove</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Upcoming schedule</Text>
              {scheduleItems.map((item) => (
                <View key={item.id} style={styles.scheduleCard}>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>{item.date} - {item.location}</Text>
                    <Text style={[styles.scheduleTypeTag, item.type === 'Field' && styles.scheduleTypeField, item.type === 'Quiz' && styles.scheduleTypeQuiz, item.type === 'Certificate' && styles.scheduleTypeCertificate]}>{item.type}</Text>
                  </View>
                  <View style={styles.scheduleItemActions}>
                    <Pressable style={styles.secondaryButton} onPress={() => startUpdateReminder(item)}>
                      <Text style={styles.secondaryText}>Update</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => deleteReminder(item.id)}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{editingScheduleId ? 'Update reminder' : 'Add reminder'}</Text>
              <Text style={styles.profileFieldLabel}>Date</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="YYYY-MM-DD"
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={10}
                  value={scheduleForm.date}
                  onChangeText={handleDateInput}
                />
                <Pressable style={styles.calendarIconBtn} onPress={openCalendar}>
                  <Text style={styles.calendarIcon}>📅</Text>
                </Pressable>
              </View>
              <TextInput style={styles.input} placeholder="Title" value={scheduleForm.title} onChangeText={(v) => setScheduleForm((p) => ({ ...p, title: v }))} />
              <TextInput style={styles.input} placeholder="Location" value={scheduleForm.location} onChangeText={(v) => setScheduleForm((p) => ({ ...p, location: v }))} />
              <SelectLike title="Type" options={scheduleTypeOptions} value={scheduleForm.type} onPick={(value) => setScheduleForm((p) => ({ ...p, type: value }))} />
              <View style={styles.scheduleActionRow}>
                <Pressable style={styles.primaryButton} onPress={addReminder}>
                  <Text style={styles.primaryText}>{editingScheduleId ? 'Save update' : 'Add reminder'}</Text>
                </Pressable>
                {editingScheduleId && (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setEditingScheduleId(null)
                      setScheduleForm((prev) => ({ ...prev, date: getTodayIsoDate(), title: '', location: '', type: 'Reminder' }))
                    }}
                  >
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'resources' && (
          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Course resources</Text>
              <Text style={styles.rowMeta}>
                Browse, upload, and download files for courses you are approved to access.
              </Text>
              {approvedCourses.length === 0 ? (
                <Text style={styles.rowMeta}>
                  No approved courses yet. Register and wait for admin approval to access resources.
                </Text>
              ) : (
                <SelectLike
                  title="Course"
                  options={approvedCourses.map((c) => ({
                    value: String(c.course_id),
                    label: `${c.course_name || c.course_id} (${c.course_id})`,
                  }))}
                  value={resourceCourseId || ''}
                  onPick={(value) => setResourceCourseId(value)}
                />
              )}
              {selectedResourceCourse && (
                <View style={styles.courseInfoCard}>
                  <Text style={styles.courseInfoTitle}>{selectedResourceCourse.course_name || selectedResourceCourse.course_id}</Text>
                  <Text style={styles.rowMeta}>Course ID: {selectedResourceCourse.course_id}</Text>
                  {selectedResourceCourse.description ? (
                    <Text style={styles.rowMeta}>{selectedResourceCourse.description}</Text>
                  ) : null}
                  <Text style={styles.rowMeta}>
                    Duration: {selectedResourceCourse.start_date || '-'} to {selectedResourceCourse.end_date || '-'}
                  </Text>
                  <Text style={styles.rowMeta}>Contact hours: {selectedResourceCourse.total_contact_hours ?? 0}</Text>
                </View>
              )}
              {resourceCourseId && resourceModulesForCourse.length > 0 && (
                <SelectLike
                  title="Module"
                  options={resourceModulesForCourse.map((m, idx) => ({
                    value: String(m.id),
                    label: `Module ${idx + 1}: ${m.title || `#${m.id}`}`,
                  }))}
                  value={resourceModuleId ? String(resourceModuleId) : ''}
                  onPick={(value) => setResourceModuleId(Number(value))}
                />
              )}
              {selectedResourceModule && (
                <Text style={styles.rowMeta}>
                  Selected: {selectedResourceModule.title || `Module ${selectedResourceModule.id}`}
                </Text>
              )}
              <Pressable
                style={[styles.primaryButton, (!resourceCourseId || !resourceModuleId || resourceUploading) && styles.disabledButton]}
                onPress={handleResourceUpload}
                disabled={!resourceCourseId || !resourceModuleId || resourceUploading}
              >
                <Text style={styles.primaryText}>{resourceUploading ? 'Uploading…' : 'Upload file'}</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Files</Text>
              {resourcesLoading && resources.length === 0 ? (
                <Text style={styles.rowMeta}>Loading resources…</Text>
              ) : resources.length === 0 ? (
                <Text style={styles.rowMeta}>No resources for this course yet.</Text>
              ) : (
                resources.map((res) => (
                  <View key={res.resource_id} style={styles.scheduleCard}>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={2}>{res.original_name}</Text>
                      <Text style={styles.rowMeta}>
                        {formatBytes(res.size_bytes)} • {selectedResourceCourse?.course_name || res.course_name || resourceCourseId}
                      </Text>
                      <Text style={styles.rowMeta}>
                        Uploaded {formatUploadDate(res.created_at)}{res.uploaded_by_name ? ` by ${res.uploaded_by_name}` : ''}
                      </Text>
                    </View>
                    <View style={styles.scheduleItemActions}>
                      <Pressable style={styles.secondaryButton} onPress={() => handleResourceDownload(res)}>
                        <Text style={styles.secondaryText}>Open</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <View style={styles.profileHeaderCard}>
                {profileForm.imageUri ? (
                  <Image source={{ uri: profileForm.imageUri }} style={styles.profileAvatarImage} />
                ) : (
                  <View style={styles.profileAvatarFallback}>
                    <Text style={styles.profileAvatarInitial}>{profileInitial}</Text>
                  </View>
                )}
                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.rowTitle}>{profile.fullName}</Text>
                  <Text style={styles.rowMeta}>{profile.email}</Text>
                </View>
                <Pressable style={styles.secondaryButton} onPress={pickProfileImage}>
                  <Text style={styles.secondaryText}>Upload Photo</Text>
                </Pressable>
              </View>

              <View style={styles.profileCurrentDetailsCard}>
                <Text style={styles.sectionTitle}>Current Personal Details</Text>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Assigned Park</Text><Text style={styles.profileDetailValue}>{profile.assignedPark || '-'}</Text></View>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Park Guide ID</Text><Text style={styles.profileDetailValue}>{profile.parkGuideId || '-'}</Text></View>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Full Name</Text><Text style={styles.profileDetailValue}>{profile.fullName || '-'}</Text></View>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Email</Text><Text style={styles.profileDetailValue}>{profile.email || '-'}</Text></View>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Phone Number</Text><Text style={styles.profileDetailValue}>{profile.phoneNumber || '-'}</Text></View>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Birthday</Text><Text style={styles.profileDetailValue}>{profile.birthday || '-'}</Text></View>
                <View style={styles.profileDetailRow}><Text style={styles.profileDetailKey}>Address</Text><Text style={styles.profileDetailValue}>{profile.address || '-'}</Text></View>
              </View>

              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Assigned Park</Text>
                <TextInput style={styles.input} placeholder="Enter assigned park" value={profileForm.assignedPark} onChangeText={(v) => setProfileForm((p) => ({ ...p, assignedPark: v }))} />
              </View>
              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Park Guide ID</Text>
                <TextInput
                  style={[styles.input, styles.inputReadonly]}
                  value={profile.parkGuideId}
                  editable={false}
                  selectTextOnFocus={false}
                />
              </View>
              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Full Name</Text>
                <TextInput style={styles.input} placeholder="Enter full name" value={profileForm.fullName} onChangeText={(v) => setProfileForm((p) => ({ ...p, fullName: v }))} />
              </View>
              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Email</Text>
                <TextInput style={styles.input} placeholder="Enter email" value={profileForm.email} onChangeText={(v) => setProfileForm((p) => ({ ...p, email: v }))} />
              </View>
              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Phone Number</Text>
                <TextInput style={styles.input} placeholder="Enter phone number" value={profileForm.phoneNumber} onChangeText={(v) => setProfileForm((p) => ({ ...p, phoneNumber: v }))} />
              </View>
              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Birthday</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={profileForm.birthday} onChangeText={(v) => setProfileForm((p) => ({ ...p, birthday: v }))} />
              </View>
              <View style={styles.profileFieldBlock}>
                <Text style={styles.profileFieldLabel}>Address</Text>
                <TextInput style={styles.input} placeholder="Enter address" value={profileForm.address} onChangeText={(v) => setProfileForm((p) => ({ ...p, address: v }))} />
              </View>
              <Pressable style={styles.primaryButton} onPress={saveProfile}><Text style={styles.primaryText}>Save Profile</Text></Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setCalendarOpen(false)}>
          <Pressable style={styles.calendarModal} onPress={() => {}}>
            <View style={styles.calendarHeader}>
              <Pressable style={styles.calendarNavBtn} onPress={() => shiftCalendarMonth(-1)}>
                <Text style={styles.secondaryText}>‹</Text>
              </Pressable>
              <Text style={styles.calendarTitle}>{calendarLabel}</Text>
              <Pressable style={styles.calendarNavBtn} onPress={() => shiftCalendarMonth(1)}>
                <Text style={styles.secondaryText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.calendarWeekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                <Text key={`${d}-${idx}`} style={styles.calendarWeekday}>{d}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {Array.from({ length: monthStartDay }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.calendarCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1
                const isSelected = selectedDay === day
                return (
                  <Pressable key={`day-${day}`} style={[styles.calendarCell, isSelected && styles.calendarCellSelected]} onPress={() => pickCalendarDate(day)}>
                    <Text style={[styles.calendarCellText, isSelected && styles.calendarCellTextSelected]}>{day}</Text>
                  </Pressable>
                )
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={menuOpen} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: navTranslate }], opacity: navOpacity }]}>
            <View style={styles.brandBlock}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>SFC</Text></View>
              <View><Text style={styles.brandTitle}>Guide Center</Text><Text style={styles.brandSub}>Digital Training</Text></View>
            </View>
            {sideMenuItems.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.menuItem, item.id !== 'logout' && activeMenuId === item.id && styles.menuItemActive]}
                onPress={() => goToTab(item.id)}
              >
                <View style={styles.menuIconWrap}><Text style={styles.menuIcon}>{item.icon}</Text></View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            ))}
            <View style={styles.roleCard}>
              <Text style={styles.roleLabel}>Current Role</Text>
              <Text style={styles.roleValue}>Park Guide</Text>
              <Text style={styles.roleNote}>Training access only. Admin controls stay locked.</Text>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [booting, setBooting] = useState(true)
  const [apiBaseUrl, setApiBaseUrl] = useState(() => getApiBaseUrl())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [storedUrl, raw] = await Promise.all([
          AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ])
        if (cancelled) return
        if (storedUrl?.trim()) setApiBaseUrl(storedUrl.trim().replace(/\/$/, ''))
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (parsed?.user_id) setSession(parsed)
            else await AsyncStorage.removeItem(SESSION_KEY)
          } catch {
            await AsyncStorage.removeItem(SESSION_KEY)
          }
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAuthenticated = async (user) => {
    setSession(user)
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }

  const handleLogout = async () => {
    setSession(null)
    await AsyncStorage.removeItem(SESSION_KEY)
  }

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.mist }}>
        <Text style={{ color: palette.forest, fontWeight: '800' }}>Loading…</Text>
      </View>
    )
  }

  if (!session) {
    return <AuthScreens apiBaseUrl={apiBaseUrl} onAuthenticated={handleAuthenticated} />
  }

  return <GuideMainApp onRequestLogout={handleLogout} sessionUser={session} apiBaseUrl={apiBaseUrl} />
}

function ProgressBar({ value }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(value, 100))}%` }]} />
    </View>
  )
}

function StatCard({ label, value, detail }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  )
}

function SelectLike({ title, options, value, onPick }) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'object' && option !== null
      ? { value: String(option.value), label: String(option.label ?? option.value) }
      : { value: String(option), label: String(option) }
  )
  const selectedValue = String(value ?? '')
  return (
    <View>
      <Text style={styles.statLabel}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {normalizedOptions.map((option) => (
          <Pressable key={option.value} style={[styles.chip, selectedValue === option.value && styles.chipActive]} onPress={() => onPick(option.value)}>
            <Text style={[styles.chipText, selectedValue === option.value && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

function RoleCard({ title, items, danger = false }) {
  return (
    <View style={[styles.roleCardBlock, danger && styles.roleCardBlockDanger]}>
      <View style={styles.roleCardHeader}>
        <Text style={[styles.roleCardDot, danger && styles.roleCardDotDanger]}>●</Text>
        <Text style={styles.roleCardTitle}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.roleItemRow}>
          <Text style={[styles.roleItemBullet, danger && styles.roleItemBulletDanger]}>•</Text>
          <Text style={[styles.roleItemText, danger && styles.roleItemTextDanger]}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function QuizPieChart({ score }) {
  const correct = Math.max(0, Math.min(100, score))
  const incorrect = 100 - correct
  return (
    <View style={styles.quizPieContainer}>
      <View style={styles.quizPieCircle}>
        <View style={[styles.quizPieCorrect, { width: `${correct}%` }]} />
      </View>
      <Text style={styles.quizPieLabel}>Correct: {correct}% | Incorrect: {incorrect}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.mist },
  // Header uses website cream background and website line color.
  topbar: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  menuText: { color: palette.citrus, fontWeight: '900' },
  kicker: { color: palette.citrus, fontSize: 11, fontWeight: '900' },
  topTitle: { color: palette.forest, fontSize: 18, fontWeight: '900' },
  // New clickable profile icon style for header-right quick access.
  headerRefreshBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  headerRefreshText: { color: palette.citrus, fontSize: 18, fontWeight: '900' },
  headerProfileBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  headerProfileIcon: { color: palette.forest, fontSize: 16, fontWeight: '900' },
  page: { padding: 14, gap: 12 },
  stack: { gap: 12 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCardsRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  hero: { borderRadius: 12, padding: 16, backgroundColor: palette.forest, shadowColor: '#874500', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  heroKicker: { color: palette.sun, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  heroTitle: { color: palette.white, fontSize: 26, fontWeight: '900', marginTop: 6, lineHeight: 30 },
  heroBody: { color: '#fff4dd', marginTop: 8, lineHeight: 20 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  heroMini: { borderRadius: 12, padding: 14, backgroundColor: '#fff2cd', borderWidth: 1, borderColor: '#ecd88d', gap: 8 },
  heroTitleMini: { color: palette.forest, fontSize: 22, fontWeight: '900' },
  heroBodyMini: { color: palette.muted, lineHeight: 20 },
  primaryButton: { backgroundColor: palette.citrus, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  primaryText: { color: palette.forest, fontWeight: '900' },
  secondaryButton: { borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, paddingHorizontal: 12, paddingVertical: 10 },
  secondaryText: { color: palette.forest, fontWeight: '800' },
  card: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 12, gap: 8, shadowColor: '#874500', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  sectionTitle: { color: palette.forest, fontWeight: '900', fontSize: 18 },
  cardLabel: { color: palette.citrus, fontSize: 11, fontWeight: '900' },
  selectedName: { color: palette.forest, fontWeight: '800', marginTop: 4 },
  switcherRow: { paddingVertical: 2, paddingRight: 4 },
  moduleChip: {
    width: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#fffdf4',
  },
  moduleChipActive: {
    borderColor: palette.citrus,
    backgroundColor: '#fff4d8',
    shadowColor: '#874500',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  moduleChipTitle: { color: palette.forest, fontSize: 12, fontWeight: '800' },
  moduleChipTitleActive: { color: palette.forest },
  moduleChipMeta: { color: palette.muted, fontSize: 11, marginTop: 4 },
  moduleChipMetaActive: { color: palette.citrus, fontWeight: '800' },
  selectedProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  selectedProgressLabel: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  selectedProgressValue: { color: palette.citrus, fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 9, borderRadius: 999, overflow: 'hidden', backgroundColor: '#e5eadc' },
  progressFill: { height: '100%', backgroundColor: palette.citrus },
  statCard: { width: '48%', backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 12, gap: 6 },
  statLabel: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  statValue: { color: palette.forest, fontSize: 22, fontWeight: '900' },
  statDetail: { color: palette.muted, fontSize: 12 },
  moduleRow: { borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowThumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#e7efdd' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: palette.forest, fontWeight: '800' },
  rowMeta: { color: palette.muted, fontSize: 12 },
  courseInfoCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f9fbf5',
    gap: 4,
  },
  courseInfoTitle: { color: palette.forest, fontSize: 14, fontWeight: '900' },
  rowPct: { color: palette.citrus, fontWeight: '900' },
  rowEnd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inlineBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  badgeNeutral: { backgroundColor: '#f0f2ed', color: '#5f6a5f' },
  badgePending: { backgroundColor: '#fff4d6', color: '#9f6f00' },
  badgeSuccess: { backgroundColor: '#e8f7df', color: '#2f6f26' },
  badgeDeclined: { backgroundColor: '#fbe6e2', color: '#9b2f21' },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: palette.white,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#fff4d8', borderColor: palette.citrus },
  chipText: { color: palette.forest, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  chipTextActive: { color: palette.forest, fontWeight: '900' },
  input: { borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.white, paddingHorizontal: 10, paddingVertical: 10, color: palette.charcoal },
  inputReadonly: { backgroundColor: '#f5f7f1', color: '#748274' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  blockCard: { borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 10, gap: 6, marginBottom: 8, backgroundColor: '#fffdf7' },
  lessonMediaFrame: {
    width: '100%',
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: '#f1f3ef',
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    minHeight: 190,
  },
  lessonMediaImage: { width: '100%', height: 260 },
  lessonMediaVideo: { width: '100%', height: 240, backgroundColor: '#000' },
  quizCorrect: { backgroundColor: '#ebf8e3', borderRadius: 8, paddingHorizontal: 6 },
  quizWrong: { backgroundColor: '#fde9e5', borderRadius: 8, paddingHorizontal: 6 },
  checkMark: { color: palette.citrus, fontWeight: '900' },
  quizStepLabel: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  quizNavRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4 },
  disabledButton: { opacity: 0.45 },
  listText: { color: palette.charcoal, lineHeight: 20 },
  roleCardBlock: {
    flex: 1,
    minHeight: 190,
    borderWidth: 1,
    borderColor: '#008000',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#66FFoo',
    justifyContent: 'flex-start',
  },
  roleCardBlockDanger: {
    backgroundColor: '#fff7f3',
    borderColor: '#f2d8d3',
  },
  roleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  roleCardTitle: { flex: 1, flexShrink: 1, color: palette.forest, fontWeight: '900', fontSize: 16, lineHeight: 20 },
  roleCardDot: { color: palette.lime, fontSize: 12, fontWeight: '900' },
  roleCardDotDanger: { color: palette.danger },
  roleItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
  roleItemBullet: { color: palette.forest, fontWeight: '900' },
  roleItemBulletDanger: { color: palette.danger },
  roleItemText: { flex: 1, color: palette.charcoal, lineHeight: 20 },
  roleItemTextDanger: { color: '#8e382f' },
  scoreText: { color: palette.forest, fontWeight: '900', marginTop: 4 },
  quizChartWrap: { marginTop: 10, alignItems: 'center' },
  quizPieContainer: { alignItems: 'center', gap: 8, width: '100%' },
  quizPieCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: palette.line,
    borderWidth: 2,
    borderColor: palette.line,
  },
  quizPieCorrect: { height: '100%', backgroundColor: palette.leaf },
  quizPieLabel: { color: palette.forest, fontWeight: '800', fontSize: 12 },
  progressLine: { gap: 6, marginBottom: 8 },
  progressCourseBlock: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 6,
    backgroundColor: '#fffdf7',
  },
  progressModuleRow: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressModuleRight: { alignItems: 'flex-end', gap: 4 },
  certificateCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fffdf6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  certificateCardLocked: {
    backgroundColor: '#f7f7f4',
    borderColor: '#d8ddd2',
  },
  certificateMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  certificateBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '800' },
  certificateBadgeUnlocked: { backgroundColor: '#e9f8df', color: '#2d6f1c' },
  certificateBadgeLocked: { backgroundColor: '#eceee8', color: '#667065' },
  scheduleCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fffdf6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  scheduleTypeTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 88,
    flexShrink: 0,
    backgroundColor: '#eef6e5',
    color: '#2e6a1f',
  },
  scheduleTypeField: { backgroundColor: '#e7f1ff', color: '#1e4f8d' },
  scheduleTypeQuiz: { backgroundColor: '#fff2d8', color: '#8a5200' },
  scheduleTypeCertificate: { backgroundColor: '#f0e9ff', color: '#513090' },
  dateInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dateInput: { flex: 1 },
  calendarIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: { fontSize: 19 },
  scheduleItemActions: { gap: 8 },
  deleteButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0c2bb',
    backgroundColor: '#fff4f2',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteButtonText: { color: palette.danger, fontWeight: '800' },
  scheduleActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  calendarModal: {
    marginTop: 140,
    marginHorizontal: 26,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    padding: 12,
    gap: 8,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarTitle: { color: palette.forest, fontWeight: '900', fontSize: 16 },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  calendarWeekRow: { flexDirection: 'row' },
  calendarWeekday: { width: '14.285%', textAlign: 'center', color: palette.muted, fontWeight: '700', paddingVertical: 6 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: {
    width: '14.285%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarCellSelected: { backgroundColor: '#fff2d8', borderWidth: 1, borderColor: palette.citrus },
  calendarCellText: { color: palette.forest, fontWeight: '700' },
  calendarCellTextSelected: { color: palette.citrus, fontWeight: '900' },
  profileHeaderCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    backgroundColor: '#fffdf6',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatarImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: palette.line },
  profileAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: '#fff2d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarInitial: { color: palette.forest, fontSize: 22, fontWeight: '900' },
  profileHeaderInfo: { flex: 1 },
  profileCurrentDetailsCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    backgroundColor: '#fffdf6',
    padding: 12,
    gap: 8,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2e7',
    paddingBottom: 6,
  },
  profileDetailKey: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  profileDetailValue: { color: palette.forest, fontSize: 12, fontWeight: '800', maxWidth: '58%', textAlign: 'right' },
  profileFieldBlock: { gap: 6 },
  profileFieldLabel: { color: palette.forest, fontSize: 12, fontWeight: '800' },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  milestone: { width: '48%', borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 10, backgroundColor: palette.white, gap: 8 },
  milestoneDone: { backgroundColor: '#f3fde9', borderColor: '#cfe9b6' },
  milestonePending: { backgroundColor: '#fff9ef', borderColor: '#f1dfb9' },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneIcon: { fontSize: 16, fontWeight: '900', color: palette.forest },
  milestonePct: { color: palette.citrus, fontWeight: '900', fontSize: 12 },
  unreadCard: { borderColor: '#f0b24c', backgroundColor: '#fff7e4' },
  overlay: { flex: 1, backgroundColor: 'rgba(40,37,29,0.35)' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: NAV_WIDTH, padding: 16, borderRightWidth: 1, borderRightColor: palette.line, backgroundColor: '#ffb334', gap: 8 },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  brandMark: { width: 42, height: 42, borderRadius: 8, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: palette.forest, fontWeight: '900' },
  brandTitle: { color: palette.forest, fontWeight: '900' },
  brandSub: { color: '#684316', fontSize: 12 },
  menuItem: { minHeight: 44, borderRadius: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemActive: { backgroundColor: 'rgba(255,255,255,0.45)' },
  menuIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.62)', alignItems: 'center', justifyContent: 'center' },
  menuIcon: { color: palette.forest, fontSize: 11, fontWeight: '900' },
  menuLabel: { color: '#563716', fontWeight: '800' },
  roleCard: { marginTop: 'auto', borderWidth: 1, borderColor: 'rgba(58,42,22,0.18)', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.38)', padding: 12 },
  roleLabel: { color: '#684316', fontSize: 12, fontWeight: '700' },
  roleValue: { color: palette.forest, fontWeight: '900', marginTop: 4 },
  roleNote: { color: '#684316', marginTop: 6, lineHeight: 18, fontSize: 12 },
})
