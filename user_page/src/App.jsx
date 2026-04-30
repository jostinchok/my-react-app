import { useEffect, useMemo, useState } from 'react'
import './App.css'
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
  saveProfileField,
  saveScheduleItem,
} from './services/databaseFrames'

const STORAGE_KEY = 'sfc_citrus_training_demo'
const editableProfileFields = new Set(['phone', 'yearsExperience', 'address'])

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

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function App() {
  const [users, setUsers] = useState(readStoredUsers)
  const [currentUserId, setCurrentUserId] = useState(users[0]?.id || demoUsers[0].id)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [trainingModules, setTrainingModules] = useState([])
  const [moduleFrame, setModuleFrame] = useState({
    status: 'loading',
    message: 'Waiting for module records from database.',
  })
  const [databaseProfile, setDatabaseProfile] = useState(null)
  const [databaseCertificates, setDatabaseCertificates] = useState([])
  const [databaseNotifications, setDatabaseNotifications] = useState([])
  const [databaseSchedule, setDatabaseSchedule] = useState([])
  const [selectedModuleId, setSelectedModuleId] = useState(null)
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: demoStorageVersion, users }))
    } catch {
      // Local storage is optional for this demo.
    }
  }, [users])

  useEffect(() => {
    let ignore = false

    loadDatabaseFrame(API_LINKS.modules, ['modules', 'trainingModules', 'courses'], normalizeModuleRow)
      .then((modules) => {
        if (ignore) return
        setTrainingModules(modules)
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

    loadDatabaseFrame(API_LINKS.profile, ['profile', 'user', 'guideProfile'], normalizeProfileRow)
      .then((profiles) => {
        if (!ignore) setDatabaseProfile(profiles[0] || null)
      })
      .catch(() => {
        if (!ignore) setDatabaseProfile(null)
      })

    loadDatabaseFrame(API_LINKS.certifications, ['certifications', 'certificates'], normalizeCertificateRow)
      .then((items) => {
        if (!ignore) setDatabaseCertificates(items)
      })
      .catch(() => {
        if (!ignore) setDatabaseCertificates([])
      })

    loadDatabaseFrame(API_LINKS.notifications, ['notifications'], normalizeNotificationRow)
      .then((items) => {
        if (!ignore) setDatabaseNotifications(items)
      })
      .catch(() => {
        if (!ignore) setDatabaseNotifications([])
      })

    loadDatabaseFrame(API_LINKS.schedule, ['schedule', 'schedules', 'trainingSchedule', 'progress'], normalizeScheduleRow)
      .then((items) => {
        if (!ignore) setDatabaseSchedule(items)
      })
      .catch(() => {
        if (!ignore) setDatabaseSchedule([])
      })

    return () => {
      ignore = true
    }
  }, [])

  const seededUser = users.find((user) => user.id === currentUserId) || users[0] || cloneSeedUsers()[0]
  const currentUser = databaseProfile ? { ...seededUser, ...databaseProfile } : seededUser
  const profileUser = databaseProfile
    ? currentUser
    : {
        ...currentUser,
        displayName: currentUser.displayName || 'Guide',
        email: currentUser.email || '-',
        phone: currentUser.phone || '-',
        assignedPark: currentUser.assignedPark || '-',
        position: currentUser.position || '-',
        yearsExperience: currentUser.yearsExperience || '-',
        address: currentUser.address || '-',
        guideId: currentUser.guideId || '-',
        role: currentUser.role || 'guide',
        status: 'Waiting for database profile',
        avatar: currentUser.avatar || null,
        avatarColor: currentUser.avatarColor,
      }
  const selectedModule = trainingModules.find((module) => module.id === selectedModuleId) || null

  const moduleMap = useMemo(
    () => new Map(trainingModules.map((module) => [module.id, module])),
    [trainingModules]
  )

  const allResources = useMemo(
    () =>
      trainingModules.flatMap((module) =>
        module.resources.map((resource) => ({
          ...resource,
          moduleId: module.id,
          moduleTitle: module.title,
          category: module.category,
          park: module.park,
        }))
      ),
    [trainingModules]
  )

  const updateCurrentUser = (updater) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === currentUserId ? updater({ ...user }) : user))
    )
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

  const isEnrolled = (module, user = currentUser) => !!module && user.enrolledModuleIds?.includes(module.id)

  const getProgress = (module, user = currentUser) => {
    if (!module) return 0
    if (!isEnrolled(module, user)) return 0
    const lessonsDone = user.completedLessons?.[module.id]?.length || 0
    const quizDone = user.quizResults?.[module.id]?.passed ? 1 : 0
    return Math.round(((lessonsDone + quizDone) / ((module.lessons?.length || 0) + 1)) * 100)
  }

  const enrolledModules = useMemo(
    () => trainingModules.filter((module) => isEnrolled(module)),
    [currentUser, trainingModules]
  )

  const completedModules = useMemo(
    () => trainingModules.filter((module) => getProgress(module) === 100),
    [currentUser, trainingModules]
  )

  const overallProgress = useMemo(() => {
    if (enrolledModules.length === 0) return 0
    const total = enrolledModules.reduce((sum, module) => sum + getProgress(module), 0)
    return Math.round(total / enrolledModules.length)
  }, [currentUser, enrolledModules, trainingModules])

  const userNotifications = databaseNotifications.length > 0 ? databaseNotifications : []
  const userSchedule = databaseSchedule.length > 0 ? databaseSchedule : []
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

  const earnedBadgeIds = useMemo(
    () => new Set(completedModules.map((module) => module.id)),
    [completedModules]
  )

  const nextModule = useMemo(() => {
    const active = enrolledModules.find((module) => getProgress(module) < 100)
    return active || trainingModules.find((module) => !isEnrolled(module)) || null
  }, [currentUser, enrolledModules, trainingModules])

  const categories = useMemo(
    () => ['all', ...new Set(trainingModules.map((module) => module.category))],
    [trainingModules]
  )

  const filteredModules = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase()
    return trainingModules.filter((module) => {
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
  }, [currentUser, moduleSearch, moduleStatus, moduleCategory, trainingModules])

  const categoryProgress = useMemo(() => {
    return [...new Set(trainingModules.map((module) => module.category))].map((category) => {
      const modules = trainingModules.filter((module) => module.category === category)
      const average = Math.round(
        modules.reduce((sum, module) => sum + getProgress(module), 0) / modules.length
      )
      return { category, average }
    })
  }, [currentUser, trainingModules])

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

  const openModule = (moduleId) => {
    if (!moduleId) return
    setSelectedModuleId(moduleId)
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

  const submitQuiz = (module) => {
    if (!module) return
    if (!isEnrolled(module)) return
    const selected = Number(quizDraft[module.id])
    if (Number.isNaN(selected)) return
    const passed = selected === module.quiz.answer
    updateCurrentUser((user) => ({
      ...user,
      quizResults: {
        ...(user.quizResults || {}),
        [module.id]: {
          passed,
          selected,
          score: passed ? 100 : 0,
          completedAt: new Date().toISOString().slice(0, 10),
        },
      },
    }))
    addNotification(
      passed ? 'Quiz passed' : 'Quiz needs review',
      passed
        ? `${module.title} quiz passed. Complete all lessons to prepare the badge for admin review.`
        : `Review the resources in ${module.title} and try again.`,
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

  const addScheduleItem = (event) => {
    event.preventDefault()
    if (!scheduleForm.date || !scheduleForm.title.trim()) return
    const scheduleItem = {
      id: `${currentUser.id}-schedule-${Date.now()}`,
      user_id: currentUser.id,
      title: scheduleForm.title.trim(),
      date: scheduleForm.date,
      location: scheduleForm.location.trim() || 'Self-paced',
      type: scheduleForm.type,
      status: 'Scheduled',
    }
    setDatabaseSchedule((items) => [scheduleItem, ...items].sort((a, b) => a.date.localeCompare(b.date)))
    updateCurrentUser((user) => ({
      ...user,
      schedule: [
        scheduleItem,
        ...(user.schedule || []),
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }))
    saveScheduleItem(scheduleItem).catch(() => {
      // Keep the local schedule item visible while the database endpoint is not connected.
    })
    setScheduleForm({ date: scheduleForm.date, title: '', location: '', type: 'Reminder' })
    addNotification('Schedule updated', 'A personal learning reminder was added to your schedule.', 'schedule')
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

  const updateProfileField = (field, value) => {
    if (!editableProfileFields.has(field)) return
    updateCurrentUser((user) => ({ ...user, [field]: value }))
    setDatabaseProfile((profile) => (profile ? { ...profile, [field]: value } : profile))
  }

  const saveProfileEdit = (field, value) => {
    if (!editableProfileFields.has(field)) return
    saveProfileField(field, value).catch(() => {
      // Keep the local edit visible while the database endpoint is not connected.
    })
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateCurrentUser((user) => ({ ...user, avatar: reader.result }))
      setDatabaseProfile((profile) => (profile ? { ...profile, avatar: reader.result } : profile))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'D' },
    { id: 'modules', label: 'My Modules', icon: 'M' },
    { id: 'module', label: 'Module Details', icon: 'I' },
    { id: 'progress', label: 'Progress', icon: 'P' },
    { id: 'certificates', label: 'Certificates', icon: 'C' },
    { id: 'notifications', label: 'Notifications', icon: 'N' },
    { id: 'schedule', label: 'Schedule', icon: 'S' },
    { id: 'profile', label: 'Profile', icon: 'U' },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand-block">
          <div className="brand-mark">SFC</div>
          <div>
            <strong>Guide Center</strong>
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
          <div>
            <span className="kicker">SFC / {activeTab.replace('-', ' ').toUpperCase()}</span>
            <h1>{currentUser.assignedPark}</h1>
          </div>
          <div className="topbar-actions">
            <select value={currentUserId} onChange={(event) => switchUser(event.target.value)} aria-label="User switcher">
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} - {user.assignedPark}
                </option>
              ))}
            </select>
            <button type="button" className="avatar-button" onClick={() => setActiveTab('profile')}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="User avatar" />
              ) : (
                <span style={{ background: currentUser.avatarColor }}>{initials(currentUser.displayName)}</span>
              )}
            </button>
          </div>
        </header>

        <div className="page-scroll">
          {activeTab === 'dashboard' && (
            <section className="page-stack">
              <div className="hero-grid">
                <div
                  className="hero-copy"
                  style={{ '--hero-image': nextModule ? `url(${nextModule.image})` : 'none' }}
                >
                  <span className="kicker">Citrus learning path</span>
                  <h2>Fresh field training for Sarawak park guides.</h2>
                  <p>
                    Continue assigned modules, pass scenario quizzes, save field resources, and build certificate evidence from one polished user portal.
                  </p>
                  <div className="hero-actions">
                    <button type="button" disabled={!nextModule} onClick={() => openModule(nextModule?.id)}>
                      {nextModule ? `Continue ${nextModule.title}` : 'Waiting for modules'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setActiveTab('modules')}>
                      Browse all modules
                    </button>
                  </div>
                </div>
                <div className="next-card">
                  {nextModule ? (
                    <>
                      <img src={nextModule.image} alt="" />
                      <div>
                        <span>Next action</span>
                        <strong>{nextModule.title}</strong>
                        <small>{getProgress(nextModule)}% complete</small>
                      </div>
                    </>
                  ) : (
                    <EmptyFrame title="Module frame" body={moduleFrame.message} />
                  )}
                </div>
              </div>

              <div className="stat-grid">
                <StatCard label="Overall progress" value={`${overallProgress}%`} detail={`${enrolledModules.length} enrolled modules`} />
                <StatCard label="Completed modules" value={`${completedModules.length}/${trainingModules.length}`} detail="Lessons plus quiz required" />
                <StatCard label="Certificates" value={String(certificates.length).padStart(2, '0')} detail="Verified or ready for review" />
                <StatCard label="Unread updates" value={String(unreadCount).padStart(2, '0')} detail="Training, resources, schedule" />
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Learning path" title={`${currentUser.username}'s active modules`} />
                  <div className="compact-module-list">
                    {enrolledModules.length === 0 && (
                      <EmptyFrame title="No database modules yet" body="This box will show enrolled module rows after the database returns module data." />
                    )}
                    {enrolledModules.map((module) => (
                      <button key={module.id} type="button" onClick={() => openModule(module.id)}>
                        <img src={module.image} alt="" />
                        <span>
                          <strong>{module.title}</strong>
                          <small>{module.park} - {module.duration}</small>
                        </span>
                        <b>{getProgress(module)}%</b>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <PanelTitle kicker="User account" title="Quick review switcher" />
                  <div className="user-switcher">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className={user.id === currentUserId ? 'active' : ''}
                        onClick={() => switchUser(user.id)}
                      >
                        <span style={{ background: user.avatarColor }}>{initials(user.displayName)}</span>
                        <strong>{user.username}</strong>
                        <small>{user.position}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="content-grid">
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
              <PageIntro
                kicker="My Modules"
                title={`${trainingModules.length} database module${trainingModules.length === 1 ? '' : 's'}`}
                body="Search, filter, enroll, and continue modules returned by your database endpoint."
              />
              <div className={`module-source-banner ${moduleFrame.status}`}>
                {moduleFrame.message}
              </div>

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
                      <button type="button" className="module-image" onClick={() => openModule(module.id)}>
                        <img src={module.image} alt="" />
                        <span style={{ background: module.accent }}>{module.category}</span>
                      </button>
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
            </section>
          )}

          {activeTab === 'module' && selectedModule && (
            <section className="page-stack">
              <div className="module-detail-hero">
                <img src={selectedModule.image} alt="" />
                <div>
                  <span className="kicker">{selectedModule.category} / {selectedModule.park}</span>
                  <h2>{selectedModule.title}</h2>
                  <p>{selectedModule.subtitle}</p>
                  <div className="detail-chips">
                    <span>{selectedModule.level}</span>
                    <span>{selectedModule.duration}</span>
                    <span>{selectedModule.format}</span>
                    <span>{getProgress(selectedModule)}% complete</span>
                  </div>
                  <ProgressBar value={getProgress(selectedModule)} />
                  <div className="hero-actions">
                    <button type="button" onClick={() => enrollModule(selectedModule)}>
                      {isEnrolled(selectedModule) ? 'Continue module' : 'Enroll module'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setActiveTab('modules')}>
                      Back to modules
                    </button>
                  </div>
                </div>
              </div>

              <div className="content-grid detail-layout">
                <section className="panel wide">
                  <PanelTitle kicker="Learning objectives" title="What this module teaches" />
                  <div className="objective-grid">
                    {selectedModule.objectives.map((objective) => (
                      <div key={objective}>{objective}</div>
                    ))}
                  </div>

                  <PanelTitle kicker="Lesson checklist" title="Complete each step" />
                  <div className="lesson-list">
                    {selectedModule.lessons.map((lesson, index) => {
                      const done = currentUser.completedLessons?.[selectedModule.id]?.includes(index)
                      return (
                        <label key={lesson} className={done ? 'done' : ''}>
                          <input
                            type="checkbox"
                            checked={!!done}
                            disabled={!isEnrolled(selectedModule)}
                            onChange={() => toggleLesson(selectedModule, index)}
                          />
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <strong>{lesson}</strong>
                        </label>
                      )
                    })}
                  </div>
                </section>

                <aside className="panel">
                  <PanelTitle kicker="Scenario quiz" title="Assessment" />
                  <p className="quiz-question">{selectedModule.quiz.question}</p>
                  <div className="quiz-options">
                    {selectedModule.quiz.options.map((option, index) => (
                      <label key={option}>
                        <input
                          type="radio"
                          name={`quiz-${selectedModule.id}`}
                          value={index}
                          checked={Number(quizDraft[selectedModule.id]) === index}
                          disabled={!isEnrolled(selectedModule)}
                          onChange={(event) =>
                            setQuizDraft((prev) => ({
                              ...prev,
                              [selectedModule.id]: event.target.value,
                            }))
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="full-button"
                    disabled={!isEnrolled(selectedModule) || quizDraft[selectedModule.id] === undefined}
                    onClick={() => submitQuiz(selectedModule)}
                  >
                    Submit quiz
                  </button>
                  {currentUser.quizResults?.[selectedModule.id] && (
                    <div className={currentUser.quizResults[selectedModule.id].passed ? 'quiz-result pass' : 'quiz-result review'}>
                      {currentUser.quizResults[selectedModule.id].passed ? 'Passed' : 'Review needed'} - Score {currentUser.quizResults[selectedModule.id].score}%
                    </div>
                  )}
                </aside>
              </div>

              <section className="panel">
                <PanelTitle kicker="Resources" title="Module files and media" />
                <div className="resource-grid">
                  {selectedModule.resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={{ ...resource, moduleTitle: selectedModule.title, category: selectedModule.category }}
                      saved={savedResourceIds.has(resource.id)}
                      onToggle={() => toggleResource(resource.id)}
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
                    <button type="button" className="secondary-button" onClick={() => setActiveTab('modules')}>
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
              <PageIntro
                kicker="Learning Progress"
                title="Progress, strengths, and certification readiness"
                body="This page gives the Park Guide a clear view of module completion and where to focus next."
              />

              <div className="stat-grid">
                <StatCard label="Overall" value={`${overallProgress}%`} detail="Average across enrolled modules" />
                <StatCard label="Lessons done" value={String(enrolledModules.reduce((sum, module) => sum + (currentUser.completedLessons?.[module.id]?.length || 0), 0))} detail="Checklist items completed" />
                <StatCard label="Passed quizzes" value={String(Object.values(currentUser.quizResults || {}).filter((result) => result.passed).length)} detail="Scenario assessments" />
                <StatCard label="Badges ready" value={String(completedModules.length)} detail="Completed module badges" />
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Module progress" title="Completion evidence" />
                  <div className="progress-table">
                    {trainingModules.length === 0 && (
                      <EmptyFrame title="No module progress yet" body="Progress rows can be joined by module_id after your database modules are available." />
                    )}
                    {trainingModules.map((module) => (
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
              <PageIntro
                kicker="Certificates / Badges"
                title="Guide credentials and milestones"
                body="Park Guides can view certificate status and badge progress. Approval actions remain admin-only."
              />

              <div className="certificate-grid">
                {certificates.length === 0 && (
                  <div className="empty-panel">No certificates yet. Complete a module and pass its quiz to prepare one for admin review.</div>
                )}
                {certificates.map((certificate) => {
                  const module = moduleMap.get(certificate.moduleId)
                  return (
                    <article key={certificate.id} className="certificate-card">
                      {module?.image && <img className="certificate-art" src={module.image} alt="" />}
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
                  {trainingModules.length === 0 && (
                    <EmptyFrame title="No badge rows yet" body="Badges will use module badge_name or badge fields when database modules load." />
                  )}
                  {trainingModules.map((module) => (
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
                      </article>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <PanelTitle kicker="Personal reminder" title="Add to my schedule" />
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
                    <button type="submit">Add reminder</button>
                  </form>
                </section>
              </div>
            </section>
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
                    <EmptyFrame title="Profile database frame" body="Connect VITE_PROFILE_API_URL or the profile link in databaseFrames.js to fill this profile from your database." />
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

export default App
