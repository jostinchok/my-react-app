import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import { useMemo, useRef, useState } from 'react'
import { Alert, Animated, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

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
  { id: 'modules', label: 'My Modules', icon: 'M' },
  { id: 'module', label: 'Module Details', icon: 'I' },
  { id: 'progress', label: 'Progress', icon: 'P' },
  { id: 'certificates', label: 'Certificates', icon: 'C' },
  { id: 'notifications', label: 'Notifications', icon: 'N' },
  { id: 'schedule', label: 'Schedule', icon: 'S' },
  { id: 'profile', label: 'Profile', icon: 'U' },
]

/**My Modules*/
const modulesSeed = [
  {
    id: 'bako-trail',
    title: 'Bako Trail Guiding',
    subtitle: 'Trail briefing, interpretation, and visitor management basics.',
    category: 'Guiding',
    park: 'Bako National Park',
    duration: '2h 20m',
    level: 'Beginner',
    progress: 75, /**Can be updated by the user*/
    objectives: ['Prepare visitor pre-brief checklist.', 'Lead interpretation stops clearly.', 'Handle route pacing and reroutes.'],
    lessons: ['Trail pre-brief checklist', 'Visitor group pacing', 'Hazard communication cues', 'Wildlife-safe distance rules'],
    quiz: [
      {
        question: 'What is the first action when the trail becomes slippery from heavy rain?',
        options: ['Continue quickly to finish route', 'Stop, regroup visitors, and reassess safe route', 'Ignore and continue briefing later'],
        answer: 1,
      },
      {
        question: 'What is the safest way to handle a lagging visitor?',
        options: ['Leave them behind', 'Pause group and re-align pacing', 'Increase speed for everyone'],
        answer: 1,
      },
      {
        question: 'Best wildlife safety guidance is to:',
        options: ['Approach for better photos', 'Maintain safe observation distance', 'Use flash near animals'],
        answer: 1,
      },
    ],
  },
  {
    id: 'visitor-safety',
    title: 'Visitor Safety Response',
    subtitle: 'Incident awareness, escalation, and immediate response protocol.',
    category: 'Safety',
    park: 'Kubah National Park',
    duration: '1h 45m',
    level: 'Intermediate',
    progress: 55, /**Can be updated by the user*/
    objectives: ['Identify incident severity quickly.', 'Execute first response flow correctly.', 'Document incidents consistently.'],
    lessons: ['Incident severity matrix', 'On-site communication flow', 'Emergency coordination basics', 'Incident reporting template'],
    quiz: [
      {
        question: 'When a visitor reports chest pain, what should you do first?',
        options: ['Finish current trail explanation', 'Assess and escalate emergency protocol immediately', 'Wait for visitor to rest'],
        answer: 1,
      },
      {
        question: 'For a minor slip injury, first step is:',
        options: ['Ignore if visitor can walk', 'Stop activity and perform quick assessment', 'Ask another visitor to handle it'],
        answer: 1,
      },
      {
        question: 'Incident logs should be completed:',
        options: ['Only for severe cases', 'For all incidents using standard template', 'At end of month'],
        answer: 1,
      },
    ],
  },
  {
    id: 'conservation-law',
    title: 'Conservation Law Essentials',
    subtitle: 'Protected-area rules and compliance communication.',
    category: 'Compliance',
    park: 'Gunung Gading National Park',
    duration: '2h 05m',
    level: 'Beginner',
    progress: 0,
    objectives: ['Explain protected-area restrictions.', 'Apply clear compliance messaging.', 'Record repeated rule breaches.'],
    lessons: ['Core conservation laws', 'Visitor rule communication', 'Escalation boundaries', 'Compliance reporting'],
    quiz: [
      {
        question: 'Which statement best reflects compliance communication?',
        options: ['Ignore minor breaches', 'Use clear instruction and document repeat cases', 'Argue with visitors'],
        answer: 1,
      },
      {
        question: 'If a visitor repeats restricted behavior, guides should:',
        options: ['Escalate according to protocol and record it', 'Allow it once more', 'Publicly confront aggressively'],
        answer: 0,
      },
      {
        question: 'Primary purpose of conservation law briefing is:',
        options: ['Punish visitors', 'Protect habitats and ensure safe conduct', 'Reduce guide workload'],
        answer: 1,
      },
    ],
  },
]
/**Notifications*/
const initialNotifications = [
  { id: 1, type: 'training', title: 'Module updated', body: 'Visitor Safety Response has new checklist items.', read: false },
  { id: 2, type: 'schedule', title: 'Reminder set', body: 'Bako Trail practice is due tomorrow.', read: false },
  { id: 3, type: 'certificate', title: 'Certificate ready', body: 'Your certificate is ready for demo download.', read: true },
]
/**Status Options*/
const statusOptions = ['all', 'in-progress', 'completed', 'available']
const categoryOptions = ['all', ...new Set(modulesSeed.map((m) => m.category))]
const scheduleTypeOptions = ['Reminder', 'Field', 'Quiz', 'Certificate']
const NAV_WIDTH = 284

const getTodayIsoDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
/**App*/
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeMenuId, setActiveMenuId] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState(modulesSeed[0].id)
  const [moduleSearch, setModuleSearch] = useState('')
  const [moduleStatusFilter, setModuleStatusFilter] = useState('all')
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState('all')
  const [moduleProgress, setModuleProgress] = useState(Object.fromEntries(modulesSeed.map((m) => [m.id, m.progress])))
  const [completedSteps, setCompletedSteps] = useState(Object.fromEntries(modulesSeed.map((m) => [m.id, []])))
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizPosition, setQuizPosition] = useState(Object.fromEntries(modulesSeed.map((m) => [m.id, 0])))
  const [quizScores, setQuizScores] = useState({})
  const [notifications, setNotifications] = useState(initialNotifications)
  const [scheduleItems, setScheduleItems] = useState([{ id: 's1', date: '2026-05-20', title: 'Bako Trail refresher', location: 'Field Session', type: 'Field' }])
  const [scheduleForm, setScheduleForm] = useState({ date: getTodayIsoDate(), title: '', location: '', type: 'Reminder' })
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
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


  // Derive avatar initial from current profile full name.
  const profileInitial = (profile.fullName?.trim()?.[0] || 'U').toUpperCase()

  const selectedModule = useMemo(() => modulesSeed.find((m) => m.id === selectedModuleId) || modulesSeed[0], [selectedModuleId])
  const modulesWithState = useMemo(
    () =>
      modulesSeed.map((m) => {
        const progress = moduleProgress[m.id] ?? m.progress
        const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'available'
        return { ...m, progress, status }
      }),
    [moduleProgress]
  )
  const overallProgress = useMemo(() => Math.round(modulesWithState.reduce((sum, m) => sum + m.progress, 0) / modulesWithState.length), [modulesWithState])
  const certificates = useMemo(() => modulesWithState.filter((m) => m.progress === 100), [modulesWithState])
  const unreadCount = notifications.filter((n) => !n.read).length
  const strengthMap = useMemo(() => {
    const groups = [...new Set(modulesWithState.map((m) => m.category))]
    return groups.map((category) => {
      const list = modulesWithState.filter((m) => m.category === category)
      return { category, avg: Math.round(list.reduce((sum, m) => sum + m.progress, 0) / list.length) }
    })
  }, [modulesWithState])


/**Open Menu*/
/**Filtered Modules*/
  const openMenu = () => {
    setMenuOpen(true)
    Animated.parallel([
      Animated.timing(navTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(navOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
  }
  const filteredModules = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase()
    return modulesWithState.filter((m) => {
      const queryMatch = !query || `${m.title} ${m.subtitle} ${m.park}`.toLowerCase().includes(query)
      const statusMatch = moduleStatusFilter === 'all' || m.status === moduleStatusFilter
      const categoryMatch = moduleCategoryFilter === 'all' || m.category === moduleCategoryFilter
      return queryMatch && statusMatch && categoryMatch
    })
  }, [modulesWithState, moduleSearch, moduleStatusFilter, moduleCategoryFilter])
/**Close Menu*/
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(navTranslate, { toValue: -NAV_WIDTH, duration: 240, useNativeDriver: true }),
      Animated.timing(navOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setMenuOpen(false))
  }

  const goToTab = (tabId) => {
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
    setSelectedModuleId(moduleId)
    setActiveMenuId('module')
    setActiveTab('module')
  }

  const toggleStep = (moduleId, stepIndex) => {
    setCompletedSteps((prev) => {
      const current = prev[moduleId] || []
      const next = current.includes(stepIndex) ? current.filter((i) => i !== stepIndex) : [...current, stepIndex]
      const module = modulesSeed.find((m) => m.id === moduleId)
      const lessonRatio = (next.length / (module?.lessons.length || 1)) * 70
      const quizRatio = (quizScores[moduleId]?.score || 0) * 0.3
      const progress = Math.round(Math.max(0, Math.min(100, lessonRatio + quizRatio)))
      setModuleProgress((state) => ({ ...state, [moduleId]: progress }))
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
    const module = modulesSeed.find((m) => m.id === moduleId)
    const questionCount = module?.quiz.length || 1
    setQuizPosition((prev) => ({
      ...prev,
      [moduleId]: Math.max(0, Math.min(questionCount - 1, (prev[moduleId] || 0) + delta)),
    }))
  }
/**Submit Quiz*/
  const submitQuiz = () => {
    const module = selectedModule
    const answers = quizAnswers[module.id] || {}
    if (Object.keys(answers).length < module.quiz.length) {
      Alert.alert('Incomplete quiz', 'Please answer all quiz questions before submitting.')
      return
    }
    const correct = module.quiz.reduce((count, question, index) => {
      return count + (Number(answers[index]) === question.answer ? 1 : 0)
    }, 0)
    const score = Math.round((correct / module.quiz.length) * 100)
    setQuizScores((prev) => ({ ...prev, [module.id]: { score, passed: score === 100 } }))
    const lessonsDone = (completedSteps[module.id] || []).length
    const lessonRatio = (lessonsDone / module.lessons.length) * 70
    const quizRatio = score * 0.3
    const progress = Math.round(Math.max(0, Math.min(100, lessonRatio + quizRatio)))
    setModuleProgress((prev) => ({ ...prev, [module.id]: progress }))
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

  const addReminder = () => {
    if (!scheduleForm.date || !scheduleForm.title.trim()) return
    if (!isValidIsoDate(scheduleForm.date)) {
      Alert.alert('Invalid date', 'Please enter a valid date in YYYY-MM-DD format.')
      return
    }
    if (editingScheduleId) {
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
      setScheduleItems((prev) => [{ id: `s-${Date.now()}`, date: scheduleForm.date, title: scheduleForm.title.trim(), location: scheduleForm.location.trim() || 'Self-paced', type: scheduleForm.type }, ...prev])
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
    const performDelete = () => {
      setScheduleItems((prev) => prev.filter((item) => item.id !== id))
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
      if (confirmed) performDelete()
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
          onPress: performDelete,
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

  const saveProfile = () => {
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

    setProfile({
      fullName,
      email,
      assignedPark,
      parkGuideId: profile.parkGuideId,
      phoneNumber,
      birthday,
      address,
      imageUri: profileForm.imageUri,
    })
    Alert.alert('Saved', 'Profile updated successfully.')
  }
/**Download Certificate*/
  const downloadCertificate = (moduleItem) => {
    if (moduleItem.progress < 100) return
    Alert.alert('Download started', `${moduleItem.title} certificate demo download.`)
  }
/**Mark Read*/
  const markRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const removeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id))

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
        {/* Clickable top-right profile icon as requested */}
        <Pressable onPress={openProfileFromHeader} style={styles.headerProfileBtn}>
          <Text style={styles.headerProfileIcon}>{profileInitial}</Text>
        </Pressable>
      </View>
      

      <ScrollView contentContainerStyle={styles.page}>
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
              <StatCard label="Completed modules" value={`${certificates.length}/${modulesWithState.length}`} detail="Lessons + quiz" />
              <StatCard label="Certificates" value={`${certificates.length}`} detail="Ready for download" />
              <StatCard label="Unread updates" value={`${unreadCount}`} detail="Notifications pending" />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Active modules</Text>
              {modulesWithState.map((m) => (
                <Pressable key={m.id} style={styles.moduleRow} onPress={() => openModuleDetails(m.id)}>
                  <View style={styles.rowThumb} />
                  <View style={styles.rowBody}><Text style={styles.rowTitle}>{m.title}</Text><Text style={styles.rowMeta}>{m.park} - {m.duration}</Text></View>
                  <Text style={styles.rowPct}>{m.progress}%</Text>
                </Pressable>
              ))}
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
              <Text style={styles.sectionTitle}>My Modules</Text>
              <TextInput style={styles.input} placeholder="Search modules, parks, topics..." value={moduleSearch} onChangeText={setModuleSearch} />
              <View style={styles.grid2}>
                <SelectLike title="Status" options={statusOptions} value={moduleStatusFilter} onPick={setModuleStatusFilter} />
                <SelectLike title="Category" options={categoryOptions} value={moduleCategoryFilter} onPick={setModuleCategoryFilter} />
              </View>
            </View>
            {filteredModules.map((m) => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.rowTitle}>{m.title}</Text>
                <Text style={styles.rowMeta}>{m.subtitle}</Text>
                <Text style={styles.rowMeta}>{m.category} - {m.level} - {m.duration}</Text>
                <ProgressBar value={m.progress} />
                <View style={styles.rowEnd}>
                  <Text style={styles.rowPct}>{m.progress}%</Text>
                  <Pressable style={styles.primaryButton} onPress={() => openModuleDetails(m.id)}><Text style={styles.primaryText}>Open module</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'module' && (
          <View style={styles.stack}>
            <View style={styles.heroMini}>
              <Text style={styles.heroKicker}>{selectedModule.category} / {selectedModule.park}</Text>
              <Text style={styles.heroTitleMini}>{selectedModule.title}</Text>
              <Text style={styles.heroBodyMini}>{selectedModule.subtitle}</Text>
              <ProgressBar value={moduleProgress[selectedModule.id] ?? selectedModule.progress} />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Learning objectives</Text>
              {selectedModule.objectives.map((item) => <Text key={item} style={styles.listText}>• {item}</Text>)}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lesson checklist</Text>
              {selectedModule.lessons.map((step, index) => {
                const checked = (completedSteps[selectedModule.id] || []).includes(index)
                return (
                  <Pressable key={step} onPress={() => toggleStep(selectedModule.id, index)} style={styles.checkItem}>
                    <Text style={styles.checkMark}>{checked ? '☑' : '☐'}</Text>
                    <Text style={styles.listText}>{step}</Text>
                  </Pressable>
                )
              })}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Scenario quiz</Text>
              <Text style={styles.quizStepLabel}>Question {(quizPosition[selectedModule.id] || 0) + 1} / {selectedModule.quiz.length}</Text>
              <Text style={styles.listText}>{selectedModule.quiz[quizPosition[selectedModule.id] || 0].question}</Text>
              {selectedModule.quiz[quizPosition[selectedModule.id] || 0].options.map((opt, i) => (
                <Pressable
                  key={opt}
                  onPress={() => selectQuizAnswer(selectedModule.id, quizPosition[selectedModule.id] || 0, i)}
                  style={styles.checkItem}
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
              {quizScores[selectedModule.id] && <Text style={styles.scoreText}>Score: {quizScores[selectedModule.id].score}%</Text>}
              {quizScores[selectedModule.id] && (
                <View style={styles.quizChartWrap}>
                  <QuizPieChart score={quizScores[selectedModule.id].score} />
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.stack}>
            <View style={styles.grid2}>
              <StatCard label="Overall progress" value={`${overallProgress}%`} detail="All modules average" />
              <StatCard label="Completed modules" value={`${certificates.length}`} detail="Full completion" />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Module completion list</Text>
              {modulesWithState.map((m) => (
                <View key={m.id} style={styles.progressLine}>
                  <Text style={styles.rowTitle}>{m.title}</Text>
                  <ProgressBar value={m.progress} />
                  <Text style={styles.rowPct}>{m.progress}%</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Strength map</Text>
              {strengthMap.map((s) => (
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
              <Text style={styles.rowMeta}>Only completed modules unlock their certificate. Incomplete modules remain locked.</Text>
              {modulesWithState.map((m) => (
                <View key={m.id} style={[styles.certificateCard, m.progress < 100 && styles.certificateCardLocked]}>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{m.title}</Text>
                    <Text style={styles.rowMeta}>{m.progress === 100 ? 'Certificate unlocked' : 'Certificate locked until module completion'}</Text>
                    <View style={styles.certificateMetaRow}>
                      <Text style={[styles.certificateBadge, m.progress === 100 ? styles.certificateBadgeUnlocked : styles.certificateBadgeLocked]}>
                        {m.progress === 100 ? 'Unlocked' : 'Locked'}
                      </Text>
                      <Text style={styles.rowMeta}>{m.progress}% complete</Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.primaryButton, m.progress < 100 && styles.disabledButton]}
                    onPress={() => downloadCertificate(m)}
                    disabled={m.progress < 100}
                  >
                    <Text style={styles.primaryText}>{m.progress === 100 ? 'Download' : 'Locked'}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>All module milestones</Text>
              <View style={styles.milestoneGrid}>
                {modulesWithState.map((m) => (
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
              <Pressable key={item.id} style={[styles.menuItem, activeMenuId === item.id && styles.menuItemActive]} onPress={() => goToTab(item.id)}>
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
  return (
    <View>
      <Text style={styles.statLabel}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option) => (
          <Pressable key={option} style={[styles.chip, value === option && styles.chipActive]} onPress={() => onPick(option)}>
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text>
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
  menuBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  menuText: { color: palette.citrus, fontWeight: '900' },
  kicker: { color: palette.citrus, fontSize: 11, fontWeight: '900' },
  topTitle: { color: palette.forest, fontSize: 18, fontWeight: '900' },
  // New clickable profile icon style for header-right quick access.
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
  rowPct: { color: palette.citrus, fontWeight: '900' },
  rowEnd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
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
