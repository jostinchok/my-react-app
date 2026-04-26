import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  demoStorageVersion,
  demoUsers,
  roleBoundaries,
  supportTopics,
  trainingModules,
} from './data/trainingPlatform'

const STORAGE_KEY = 'sfc_citrus_training_demo'

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
  const [selectedModuleId, setSelectedModuleId] = useState(users[0]?.enrolledModuleIds?.[0] || trainingModules[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  const currentUser = users.find((user) => user.id === currentUserId) || users[0] || cloneSeedUsers()[0]
  const selectedModule = trainingModules.find((module) => module.id === selectedModuleId) || trainingModules[0]

  const moduleMap = useMemo(
    () => new Map(trainingModules.map((module) => [module.id, module])),
    []
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
    []
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

  const isEnrolled = (module, user = currentUser) => user.enrolledModuleIds?.includes(module.id)

  const getProgress = (module, user = currentUser) => {
    if (!isEnrolled(module, user)) return 0
    const lessonsDone = user.completedLessons?.[module.id]?.length || 0
    const quizDone = user.quizResults?.[module.id]?.passed ? 1 : 0
    return Math.round(((lessonsDone + quizDone) / (module.lessons.length + 1)) * 100)
  }

  const enrolledModules = useMemo(
    () => trainingModules.filter((module) => isEnrolled(module)),
    [currentUser]
  )

  const completedModules = useMemo(
    () => trainingModules.filter((module) => getProgress(module) === 100),
    [currentUser]
  )

  const overallProgress = useMemo(() => {
    if (enrolledModules.length === 0) return 0
    const total = enrolledModules.reduce((sum, module) => sum + getProgress(module), 0)
    return Math.round(total / enrolledModules.length)
  }, [currentUser, enrolledModules])

  const unreadCount = currentUser.notifications?.filter((item) => !item.read).length || 0

  const certificates = useMemo(() => {
    const baseCertificates = currentUser.certificates || []
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
  }, [currentUser, completedModules])

  const earnedBadgeIds = useMemo(
    () => new Set(completedModules.map((module) => module.id)),
    [completedModules]
  )

  const nextModule = useMemo(() => {
    const active = enrolledModules.find((module) => getProgress(module) < 100)
    return active || trainingModules.find((module) => !isEnrolled(module)) || trainingModules[0]
  }, [currentUser, enrolledModules])

  const categories = useMemo(
    () => ['all', ...new Set(trainingModules.map((module) => module.category))],
    []
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
  }, [currentUser, moduleSearch, moduleStatus, moduleCategory])

  const categoryProgress = useMemo(() => {
    return [...new Set(trainingModules.map((module) => module.category))].map((category) => {
      const modules = trainingModules.filter((module) => module.category === category)
      const average = Math.round(
        modules.reduce((sum, module) => sum + getProgress(module), 0) / modules.length
      )
      return { category, average }
    })
  }, [currentUser])

  const savedResourceIds = new Set(currentUser.savedResources || [])
  const savedResources = [
    ...allResources.filter((resource) => savedResourceIds.has(resource.id)),
    ...(currentUser.personalFiles || []),
  ]

  const switchUser = (userId) => {
    const nextUser = users.find((user) => user.id === userId)
    setCurrentUserId(userId)
    setSelectedModuleId(nextUser?.enrolledModuleIds?.[0] || trainingModules[0].id)
    setActiveTab('dashboard')
  }

  const resetDemo = () => {
    const freshUsers = cloneSeedUsers()
    setUsers(freshUsers)
    setCurrentUserId(freshUsers[0].id)
    setSelectedModuleId(freshUsers[0].enrolledModuleIds[0])
    setActiveTab('dashboard')
  }

  const openModule = (moduleId) => {
    setSelectedModuleId(moduleId)
    setActiveTab('module')
    setSidebarOpen(false)
  }

  const enrollModule = (module) => {
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
    updateCurrentUser((user) => ({
      ...user,
      schedule: [
        {
          id: `${user.id}-schedule-${Date.now()}`,
          ...scheduleForm,
          title: scheduleForm.title.trim(),
          location: scheduleForm.location.trim() || 'Self-paced',
        },
        ...(user.schedule || []),
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }))
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
    updateCurrentUser((user) => ({ ...user, [field]: value }))
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'D' },
    { id: 'modules', label: 'My Modules', icon: 'M' },
    { id: 'module', label: 'Module Details', icon: 'I' },
    { id: 'progress', label: 'Progress', icon: 'P' },
    { id: 'certificates', label: 'Certificates', icon: 'C' },
    { id: 'notifications', label: 'Notifications', icon: 'N' },
    { id: 'schedule', label: 'Schedule', icon: 'S' },
    { id: 'resources', label: 'Resources', icon: 'R' },
    { id: 'profile', label: 'Profile', icon: 'U' },
    { id: 'help', label: 'Help', icon: '?' },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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

      <main className="workspace">
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
            <select value={currentUserId} onChange={(event) => switchUser(event.target.value)} aria-label="Demo user switcher">
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} - {user.assignedPark}
                </option>
              ))}
            </select>
            <button type="button" className="reset-button" onClick={resetDemo}>
              Reset Demo
            </button>
            <button type="button" className="avatar-button" onClick={() => setActiveTab('profile')}>
              <span style={{ background: currentUser.avatarColor }}>{initials(currentUser.displayName)}</span>
            </button>
          </div>
        </header>

        <div className="page-scroll">
          {activeTab === 'dashboard' && (
            <section className="page-stack">
              <div className="hero-grid">
                <div
                  className="hero-copy"
                  style={{ '--hero-image': `url(${trainingModules[0].image})` }}
                >
                  <span className="kicker">Citrus learning path</span>
                  <h2>Fresh field training for Sarawak park guides.</h2>
                  <p>
                    Continue assigned modules, pass scenario quizzes, save field resources, and build certificate evidence from one polished user portal.
                  </p>
                  <div className="hero-actions">
                    <button type="button" onClick={() => openModule(nextModule.id)}>
                      Continue {nextModule.title}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setActiveTab('modules')}>
                      Browse all modules
                    </button>
                  </div>
                </div>
                <div className="next-card">
                  <img src={nextModule.image} alt="" />
                  <div>
                    <span>Next action</span>
                    <strong>{nextModule.title}</strong>
                    <ProgressBar value={getProgress(nextModule)} />
                    <small>{getProgress(nextModule)}% complete</small>
                  </div>
                </div>
              </div>

              <div className="stat-grid">
                <StatCard label="Overall progress" value={`${overallProgress}%`} detail={`${enrolledModules.length} enrolled modules`} />
                <StatCard label="Completed modules" value={`${completedModules.length}/10`} detail="Lessons plus quiz required" />
                <StatCard label="Certificates" value={String(certificates.length).padStart(2, '0')} detail="Verified or ready for review" />
                <StatCard label="Unread updates" value={String(unreadCount).padStart(2, '0')} detail="Training, resources, schedule" />
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Learning path" title={`${currentUser.username}'s active modules`} />
                  <div className="compact-module-list">
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
                  <PanelTitle kicker="Demo user" title="Quick review switcher" />
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
                title="Ten module training catalog"
                body="Search, filter, enroll, and continue every required Park Guide training module from the user side."
              />

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

          {activeTab === 'module' && (
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
                      <button type="button" onClick={() => alert('Certificate download is a front-end demo action.')}>
                        Download demo certificate
                      </button>
                    </article>
                  )
                })}
              </div>

              <section className="panel">
                <PanelTitle kicker="Badges" title="All module milestones" />
                <div className="badge-grid">
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
                {(currentUser.notifications || []).map((notification) => (
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
                body="Park Guides can review assigned sessions and add personal reminders for their own learning plan."
              />
              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Upcoming" title={`${currentUser.username}'s schedule`} />
                  <div className="schedule-list">
                    {(currentUser.schedule || []).map((item) => (
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

          {activeTab === 'resources' && (
            <section className="page-stack">
              <PageIntro
                kicker="Saved Resources / Files"
                title="Training files, quick guides, and personal uploads"
                body="Save module resources for later and keep demo personal files inside the current user profile."
              />
              <div className="content-grid">
                <section className="panel wide">
                  <PanelTitle kicker="Library" title="Available module resources" />
                  <div className="resource-grid">
                    {allResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        saved={savedResourceIds.has(resource.id)}
                        onToggle={() => toggleResource(resource.id)}
                      />
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <PanelTitle kicker="Saved" title="My saved files" />
                  <label className="upload-drop">
                    <input type="file" onChange={handlePersonalFile} />
                    <span>Upload demo file</span>
                    <small>PDF, image, video, or notes</small>
                  </label>
                  <div className="saved-list">
                    {savedResources.map((resource) => (
                      <div key={resource.id}>
                        <strong>{resource.title}</strong>
                        <span>{resource.type} - {resource.moduleTitle}</span>
                      </div>
                    ))}
                    {savedResources.length === 0 && <p>No saved files yet.</p>}
                  </div>
                </section>
              </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="page-stack">
              <PageIntro
                kicker="Profile / Account"
                title="Park Guide profile"
                body="Users can manage their own profile details. Role and admin authority are not editable here."
              />
              <div className="content-grid">
                <section className="panel profile-panel">
                  <div className="profile-avatar" style={{ background: currentUser.avatarColor }}>
                    {initials(currentUser.displayName)}
                  </div>
                  <h3>{currentUser.displayName}</h3>
                  <p>{currentUser.position}</p>
                  <span>{currentUser.status}</span>
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
                          value={currentUser[field] || ''}
                          onChange={(event) => updateProfileField(field, event.target.value)}
                        />
                      </label>
                    ))}
                    <label>
                      Guide ID
                      <input type="text" value={currentUser.guideId} disabled />
                    </label>
                    <label>
                      Role
                      <input type="text" value={currentUser.role} disabled />
                    </label>
                  </form>
                </section>
              </div>
            </section>
          )}

          {activeTab === 'help' && (
            <section className="page-stack">
              <PageIntro
                kicker="Help / Support"
                title="User-side support and permission guide"
                body="This area explains what Park Guides can access in the demo and what is intentionally reserved for admins."
              />
              <div className="content-grid">
                <section className="panel">
                  <PanelTitle kicker="Allowed" title="Park Guide can access" />
                  <ul className="permission-list can">
                    {roleBoundaries.can.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section className="panel">
                  <PanelTitle kicker="Locked" title="Admin-only actions" />
                  <ul className="permission-list cannot">
                    {roleBoundaries.cannot.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="faq-grid">
                {supportTopics.map((topic) => (
                  <article key={topic.title} className="panel">
                    <span className="kicker">Support</span>
                    <h3>{topic.title}</h3>
                    <p>{topic.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
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
