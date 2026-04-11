import { useEffect, useMemo, useState } from 'react'
import './App.css'

const copy = {
  en: {
    portalTitle: 'Digital Portal',
    dashboard: 'Dashboard',
    training: 'Training',
    certs: 'Certificates',
    settings: 'Settings',
    notifications: 'Notifications',
    auth: 'Authentication',
    systemVersion: 'System: SFC-V1.0',
    openNotifications: 'Open notifications',
    openAuthPage: 'Open profile settings',
    logout: 'Logout',
    welcomeTitle: 'SFC Guide Center',
    welcomeSubtitle: "Professional digital training and certification for Sarawak's parks.",
    currentProgress: 'Current Progress',
    moduleBiodiversity: 'Module: Biodiversity',
    credentials: 'Credentials',
    verifiedCertificates: 'Verified Certificates',
    status: 'Status',
    active: 'Active',
    guideId: 'Guide ID',
    notifEmpty: 'No messages yet.',
    markAllRead: 'Mark all read',
    markSelectedRead: 'Mark selected read',
    deleteSelected: 'Delete selected',
    secureAccess: 'Secure Access',
    authWelcome: 'Welcome to SFC Portal',
    authDesc: 'Access your digital training and certificate services in one place. Login, register, or use admin access to manage the system.',
    login: 'Login',
    register: 'Register',
    admin: 'Admin',
    userLogin: 'User Login',
    createAccount: 'Create Account',
    adminLogin: 'Admin Login',
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    adminId: 'Admin ID',
    enterAdminPanel: 'Enter Admin Panel',
    settingsTitle: 'Settings Center',
    settingsDesc: 'Manage account, security and personalized portal preferences.',
    profileSettings: 'Profile Settings',
    passwordSettings: 'Password Settings',
    appearanceSettings: 'Appearance',
    languageSettings: 'Language',
    profileLocked: 'Profile editing is locked. Please login first.',
    passwordLocked: 'Password update is locked. Please login first.',
    loginToUnlock: 'Login to unlock',
    saveProfile: 'Save Profile',
    updatePassword: 'Update Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    themeMode: 'Theme Mode',
    lightMode: 'Light',
    darkMode: 'Dark',
    chooseLanguage: 'Choose Language',
    english: 'English',
    malay: 'Malay',
    chinese: 'Chinese',
    profileSaved: 'Profile updated successfully.',
    passwordMismatch: 'New password and confirm password do not match.',
    passwordUpdated: 'Password updated successfully.',
    loginSuccess: 'Login success (demo UI).',
    registerSuccess: 'Registration success (demo UI).',
    adminSuccess: 'Admin login success (demo UI).',
    filter: 'Filter',
    clearAll: 'Clear All',
    level: 'Level',
    statusLabel: 'Status',
    location: 'Location',
    beginner: 'Beginner',
    advance: 'Advance',
    activeCourse: 'Active',
    completed: 'Completed',
    planned: 'Planned',
    lab: 'Lab',
    online: 'Online',
    field: 'Field',
    apply: 'Apply',
    importantDates: 'Important Dates',
    noteDate: 'Date',
    noteText: 'Note',
    addNote: 'Add',
    notePlaceholder: 'Write an important reminder...',
    coursesTab: 'Courses',
    calendarTab: 'Calendar',
    saveEvent: 'Submit',
    close: 'Close',
    eventTitle: 'Title',
    eventLocation: 'Location',
    calendarList: 'Calendars',
    noEventTitle: 'Untitled Event',
    noCoursesPlanned: 'No courses planned',
    noCoursesHint: 'Courses module is not ready yet. You can update it later.',
  },
  ms: {
    portalTitle: 'Portal Digital',
    dashboard: 'Papan Pemuka',
    training: 'Latihan',
    certs: 'Sijil',
    settings: 'Tetapan',
    notifications: 'Pemberitahuan',
    auth: 'Pengesahan',
    systemVersion: 'Sistem: SFC-V1.0',
    openNotifications: 'Buka pemberitahuan',
    openAuthPage: 'Buka tetapan profil',
    logout: 'Log Keluar',
    welcomeTitle: 'Pusat Panduan SFC',
    welcomeSubtitle: 'Latihan digital profesional dan pensijilan untuk taman Sarawak.',
    currentProgress: 'Kemajuan Semasa',
    moduleBiodiversity: 'Modul: Biodiversiti',
    credentials: 'Kelayakan',
    verifiedCertificates: 'Sijil Disahkan',
    status: 'Status',
    active: 'Aktif',
    guideId: 'ID Pemandu',
    notifEmpty: 'Belum ada mesej.',
    markAllRead: 'Tanda semua dibaca',
    markSelectedRead: 'Tanda pilihan dibaca',
    deleteSelected: 'Padam pilihan',
    secureAccess: 'Akses Selamat',
    authWelcome: 'Selamat datang ke Portal SFC',
    authDesc: 'Akses latihan digital dan perkhidmatan sijil anda di satu tempat. Log masuk, daftar, atau gunakan akses admin untuk mengurus sistem.',
    login: 'Log Masuk',
    register: 'Daftar',
    admin: 'Admin',
    userLogin: 'Log Masuk Pengguna',
    createAccount: 'Cipta Akaun',
    adminLogin: 'Log Masuk Admin',
    fullName: 'Nama Penuh',
    email: 'E-mel',
    password: 'Kata Laluan',
    confirmPassword: 'Sahkan Kata Laluan',
    adminId: 'ID Admin',
    enterAdminPanel: 'Masuk Panel Admin',
    settingsTitle: 'Pusat Tetapan',
    settingsDesc: 'Urus akaun, keselamatan dan pilihan portal peribadi.',
    profileSettings: 'Tetapan Profil',
    passwordSettings: 'Tetapan Kata Laluan',
    appearanceSettings: 'Paparan',
    languageSettings: 'Bahasa',
    profileLocked: 'Suntingan profil dikunci. Sila log masuk dahulu.',
    passwordLocked: 'Kemas kini kata laluan dikunci. Sila log masuk dahulu.',
    loginToUnlock: 'Log masuk untuk buka kunci',
    saveProfile: 'Simpan Profil',
    updatePassword: 'Kemas kini Kata Laluan',
    currentPassword: 'Kata Laluan Semasa',
    newPassword: 'Kata Laluan Baharu',
    themeMode: 'Mod Tema',
    lightMode: 'Cerah',
    darkMode: 'Gelap',
    chooseLanguage: 'Pilih Bahasa',
    english: 'Inggeris',
    malay: 'Melayu',
    chinese: 'Cina',
    profileSaved: 'Profil berjaya dikemas kini.',
    passwordMismatch: 'Kata laluan baharu dan pengesahan tidak sepadan.',
    passwordUpdated: 'Kata laluan berjaya dikemas kini.',
    loginSuccess: 'Log masuk berjaya (UI demo).',
    registerSuccess: 'Pendaftaran berjaya (UI demo).',
    adminSuccess: 'Log masuk admin berjaya (UI demo).',
    filter: 'Penapis',
    clearAll: 'Kosongkan',
    level: 'Tahap',
    statusLabel: 'Status',
    location: 'Lokasi',
    beginner: 'Permulaan',
    advance: 'Lanjutan',
    activeCourse: 'Aktif',
    completed: 'Selesai',
    planned: 'Dirancang',
    lab: 'Makmal',
    online: 'Dalam Talian',
    field: 'Lapangan',
    apply: 'Guna',
    importantDates: 'Tarikh Penting',
    noteDate: 'Tarikh',
    noteText: 'Nota',
    addNote: 'Tambah',
    notePlaceholder: 'Tulis peringatan penting...',
    coursesTab: 'Kursus',
    calendarTab: 'Kalendar',
    saveEvent: 'Simpan',
    close: 'Tutup',
    eventTitle: 'Tajuk',
    eventLocation: 'Lokasi',
    calendarList: 'Kalendar',
    noEventTitle: 'Acara Tanpa Tajuk',
    noCoursesPlanned: 'Tiada kursus dirancang',
    noCoursesHint: 'Modul kursus belum siap. Anda boleh kemas kini kemudian.',
  },
  zh: {
    portalTitle: '数字门户',
    dashboard: '仪表板',
    training: '培训',
    certs: '证书',
    settings: '设置',
    notifications: '通知',
    auth: '认证',
    systemVersion: '系统: SFC-V1.0',
    openNotifications: '打开通知',
    openAuthPage: '打开个人设置',
    logout: '退出登录',
    welcomeTitle: 'SFC 导览中心',
    welcomeSubtitle: '为砂拉越公园提供专业数字化培训与认证服务。',
    currentProgress: '当前进度',
    moduleBiodiversity: '模块: 生物多样性',
    credentials: '资质',
    verifiedCertificates: '已验证证书',
    status: '状态',
    active: '活跃',
    guideId: '导览员ID',
    notifEmpty: '暂无消息。',
    markAllRead: '全部标记已读',
    markSelectedRead: '标记所选已读',
    deleteSelected: '删除所选',
    secureAccess: '安全访问',
    authWelcome: '欢迎来到 SFC 门户',
    authDesc: '在一个平台访问你的培训与证书服务。可进行登录、注册或管理员登录。',
    login: '登录',
    register: '注册',
    admin: '管理员',
    userLogin: '用户登录',
    createAccount: '创建账号',
    adminLogin: '管理员登录',
    fullName: '姓名',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    adminId: '管理员ID',
    enterAdminPanel: '进入管理面板',
    settingsTitle: '设置中心',
    settingsDesc: '管理账号、安全与个性化门户偏好。',
    profileSettings: '个人资料设置',
    passwordSettings: '密码设置',
    appearanceSettings: '外观',
    languageSettings: '语言',
    profileLocked: '个人资料编辑已锁定，请先登录。',
    passwordLocked: '密码修改已锁定，请先登录。',
    loginToUnlock: '登录后解锁',
    saveProfile: '保存资料',
    updatePassword: '更新密码',
    currentPassword: '当前密码',
    newPassword: '新密码',
    themeMode: '主题模式',
    lightMode: '浅色',
    darkMode: '深色',
    chooseLanguage: '选择语言',
    english: '英语',
    malay: '马来语',
    chinese: '华语',
    profileSaved: '个人资料已更新。',
    passwordMismatch: '新密码与确认密码不一致。',
    passwordUpdated: '密码更新成功。',
    loginSuccess: '登录成功（演示界面）。',
    registerSuccess: '注册成功（演示界面）。',
    adminSuccess: '管理员登录成功（演示界面）。',
    filter: '筛选',
    clearAll: '清除',
    level: '等级',
    statusLabel: '状态',
    location: '地点',
    beginner: '初级',
    advance: '高级',
    activeCourse: '进行中',
    completed: '已完成',
    planned: '计划中',
    lab: '实验室',
    online: '线上',
    field: '实地',
    apply: '应用',
    importantDates: '重要日期',
    noteDate: '日期',
    noteText: '备注',
    addNote: '添加',
    notePlaceholder: '记录重要事项...',
    coursesTab: '课程',
    calendarTab: '日历',
    saveEvent: '提交',
    close: '关闭',
    eventTitle: '标题',
    eventLocation: '地点',
    calendarList: '日历',
    noEventTitle: '未命名事件',
    noCoursesPlanned: '暂无课程计划',
    noCoursesHint: '课程模块尚未完成，之后可再更新。',
  },
}

function App() {
  const [activeTab, setActiveTab] = useState('auth')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('en')
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    guideId: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('sfc_notifications_v1')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [trainingFilters, setTrainingFilters] = useState({
    level: ['beginner'],
    status: ['active'],
    location: ['online'],
  })
  const [trainingView, setTrainingView] = useState('courses')
  const [isTrainingFilterOpen, setIsTrainingFilterOpen] = useState(false)
  const [trainingNotes, setTrainingNotes] = useState(() => {
    try {
      const raw = localStorage.getItem('sfc_training_notes_v1')
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      return []
    }
  })
  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()) // 0-11
  const [noteDate, setNoteDate] = useState(() => today.toISOString().slice(0, 10))
  const [noteText, setNoteText] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  const t = copy[language]
  const [selectedIds, setSelectedIds] = useState([])
  const [authUser, setAuthUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    role: 'guide',
    email: '',
    password: '',
    resetToken: '',
    newPassword: '',
    fullName: '',
    confirmPassword: '',
    adminId: '',
  })
  const [authError, setAuthError] = useState('')
  const [authInfo, setAuthInfo] = useState('')

  const navLabels = {
    dashboard: t.dashboard,
    training: t.training,
    certs: t.certs,
    settings: t.settings,
    notifications: t.notifications,
    auth: t.auth,
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  useEffect(() => {
    try {
      localStorage.setItem('sfc_notifications_v1', JSON.stringify(notifications))
    } catch {
      // Ignore storage write issues.
    }
  }, [notifications])

  useEffect(() => {
    try {
      localStorage.setItem('sfc_training_notes_v1', JSON.stringify(trainingNotes))
    } catch {
      // Ignore storage write issues.
    }
  }, [trainingNotes])

  const formatDateKey = (dateObj) => dateObj.toISOString().slice(0, 10)

  const getNoteForDate = (dateKey) => {
    const found = trainingNotes.find((n) => n.date === dateKey)
    return found ? found.text : ''
  }

  const dayHasNote = (dateKey) => !!getNoteForDate(dateKey)

  const moveCalendarMonth = (delta) => {
    setCalendarMonth((prev) => {
      const next = prev + delta
      if (next < 0) {
        setCalendarYear((y) => y - 1)
        return 11
      }
      if (next > 11) {
        setCalendarYear((y) => y + 1)
        return 0
      }
      return next
    })
  }

  const buildCalendarCells = (year, month) => {
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // Monday as first day (like your example)
    const startWeekday = (first.getDay() + 6) % 7
    const cells = []
    for (let i = 0; i < startWeekday; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(year, month, d))
    }
    return cells
  }

  const buildMonthMatrix = (year, month) => {
    const first = new Date(year, month, 1)
    const offset = (first.getDay() + 6) % 7
    const start = new Date(year, month, 1 - offset)
    const cells = []
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      cells.push({
        date: d,
        inCurrentMonth: d.getMonth() === month,
      })
    }
    return cells
  }

  const toggleTrainingFilter = (group, value) => {
    setTrainingFilters((prev) => {
      const list = prev[group]
      const has = list.includes(value)
      return {
        ...prev,
        [group]: has ? list.filter((x) => x !== value) : [...list, value],
      }
    })
  }

  const clearTrainingFilters = () => {
    setTrainingFilters({ level: [], status: [], location: [] })
  }

  const addTrainingNote = () => {
    const text = noteText.trim()
    if (!noteDate) return
    setTrainingNotes((prev) => {
      const withoutExisting = prev.filter((n) => n.date !== noteDate)
      return [
        {
          id: Date.now(),
          date: noteDate,
          text,
          title: eventTitle.trim() || t.noEventTitle,
          location: eventLocation.trim(),
        },
        ...withoutExisting,
      ].slice(0, 60)
    })
    setNoteText('')
    setEventTitle('')
    setEventLocation('')
    setIsEventModalOpen(false)
  }

  const removeTrainingNote = (id) => {
    setTrainingNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setSelectedIds([])
  }

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
  }

  const markSelectedAsRead = () => {
    if (selectedIds.length === 0) return
    const idSet = new Set(selectedIds)
    setNotifications((prev) => prev.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n)))
    setSelectedIds([])
  }

  const deleteSelected = () => {
    if (selectedIds.length === 0) return
    const idSet = new Set(selectedIds)
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.id)))
    setSelectedIds([])
  }

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthInfo('')

    try {
      if (authMode === 'login') {
        if (!authForm.email || !authForm.password) {
          setAuthError('Please enter email and password.')
          return
        }

        const response = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
            role: authForm.role,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          setAuthError(data.message || 'Login failed.')
          return
        }

        setAuthUser(data.user)
        setProfile({
          fullName: data.user.name,
          email: data.user.email,
          guideId: data.user.role_name === 'guide' ? data.user.user_id : data.user.user_id,
        })
        setActiveTab('dashboard')
      } else if (authMode === 'register') {
        if (!authForm.fullName || !authForm.email || !authForm.password || !authForm.confirmPassword) {
          setAuthError('Please fill all registration fields.')
          return
        }
        if (authForm.password !== authForm.confirmPassword) {
          setAuthError(t.passwordMismatch)
          return
        }

        const response = await fetch(`${apiBase}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: authForm.fullName,
            email: authForm.email,
            password: authForm.password,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          setAuthError(data.message || 'Registration failed.')
          return
        }

        setAuthUser(data.user)
        setProfile({
          fullName: data.user.name,
          email: data.user.email,
          guideId: data.user.user_id,
        })
        setActiveTab('dashboard')
      } else if (authMode === 'forgot') {
        if (!authForm.email) {
          setAuthError('Please enter your email address.')
          return
        }

        const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          setAuthError(data.message || 'Unable to process forgot password request.')
          return
        }

        if (data.resetToken) {
          setAuthInfo(`${data.message} Reset token: ${data.resetToken}`)
          setAuthForm((prev) => ({ ...prev, resetToken: data.resetToken }))
        } else {
          setAuthInfo(data.message || 'Reset token generated. Continue with password reset.')
        }
        setAuthMode('reset')
      } else if (authMode === 'reset') {
        if (!authForm.email || !authForm.resetToken || !authForm.newPassword || !authForm.confirmPassword) {
          setAuthError('Please complete all reset password fields.')
          return
        }

        if (authForm.newPassword !== authForm.confirmPassword) {
          setAuthError(t.passwordMismatch)
          return
        }

        const response = await fetch(`${apiBase}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            token: authForm.resetToken,
            newPassword: authForm.newPassword,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          setAuthError(data.message || 'Unable to reset password.')
          return
        }

        setAuthInfo(data.message || 'Password has been reset. Please login with your new password.')
        setAuthMode('login')
        setAuthForm((prev) => ({
          ...prev,
          password: '',
          resetToken: '',
          newPassword: '',
          confirmPassword: '',
        }))
      }
    } catch (error) {
      setAuthError(error.message || 'Unable to connect to the server.')
    }
  }

  const handleLogout = () => {
    setAuthUser(null)
    setAuthMode('login')
    setAuthForm({
      role: 'guide',
      email: '',
      password: '',
      resetToken: '',
      newPassword: '',
      fullName: '',
      confirmPassword: '',
      adminId: '',
    })
    setProfile({
      fullName: '',
      email: '',
      guideId: '',
    })
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setAuthInfo('')
    setAuthError('')
    setActiveTab('auth')
  }

  const handleProfileSave = (event) => {
    event.preventDefault()
    alert(t.profileSaved)
  }

  const handlePasswordUpdate = (event) => {
    event.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t.passwordMismatch)
      return
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    alert(t.passwordUpdated)
  }

  useEffect(() => {
    if (activeTab !== 'notifications') setSelectedIds([])
  }, [activeTab])

  useEffect(() => {
    if (selectedIds.length === 0) return
    setSelectedIds((prev) => prev.filter((id) => notifications.some((n) => n.id === id)))
  }, [notifications, selectedIds.length])

  if (!authUser) {
    return (
      <div className="layout auth-only-page">
        <div className="auth-shell auth-only-shell">
          <div className="auth-hero">
            <span className="auth-tag">{t.secureAccess}</span>
            <h1>{t.authWelcome}</h1>
            <p>{t.authDesc}</p>
          </div>

          <div className="auth-card auth-only-card">
            <div className="auth-mode-switch">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login')
                  setAuthError('')
                  setAuthInfo('')
                }}
              >
                {t.login}
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('register')
                  setAuthError('')
                  setAuthInfo('')
                }}
              >
                {t.register}
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'login' ? (
                <>
                  <label>
                    {t.email}
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.password}
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.admin}
                    <select
                      value={authForm.role}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="guide">{t.userLogin}</option>
                      <option value="admin">{t.adminLogin}</option>
                    </select>
                  </label>
                  <button className="auth-submit" type="submit">
                    {t.login}
                  </button>
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot')
                      setAuthError('')
                      setAuthInfo('')
                      setAuthForm((prev) => ({
                        ...prev,
                        password: '',
                        resetToken: '',
                        newPassword: '',
                        confirmPassword: '',
                      }))
                    }}
                  >
                    Forgot Password?
                  </button>
                </>
              ) : authMode === 'register' ? (
                <>
                  <label>
                    {t.fullName}
                    <input
                      type="text"
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.email}
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.password}
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.confirmPassword}
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </label>
                  <button className="auth-submit" type="submit">
                    {t.createAccount}
                  </button>
                </>
              ) : authMode === 'forgot' ? (
                <>
                  <label>
                    {t.email}
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </label>
                  <button className="auth-submit" type="submit">
                    Request Reset Token
                  </button>
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() => {
                      setAuthMode('login')
                      setAuthError('')
                      setAuthInfo('')
                    }}
                  >
                    Back to Login
                  </button>
                </>
              ) : (
                <>
                  <label>
                    {t.email}
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Reset Token
                    <input
                      type="text"
                      value={authForm.resetToken}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, resetToken: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.newPassword}
                    <input
                      type="password"
                      value={authForm.newPassword}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t.confirmPassword}
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </label>
                  <button className="auth-submit" type="submit">
                    Reset Password
                  </button>
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() => {
                      setAuthMode('login')
                      setAuthError('')
                      setAuthInfo('')
                    }}
                  >
                    Back to Login
                  </button>
                </>
              )}
            </form>
            {authInfo && <p className="auth-info">{authInfo}</p>}
            {authError && <p className="auth-error">{authError}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`layout theme-${theme} ${isCollapsed ? 'sidebar-hidden' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sfc-logo">SFC</div>
          <span>{t.portalTitle}</span>
        </div>
        <nav className="side-menu">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span> {t.dashboard}
          </button>
          <button className={activeTab === 'training' ? 'active' : ''} onClick={() => setActiveTab('training')}>
            <span className="nav-icon">📖</span> {t.training}
          </button>
          <button className={activeTab === 'certs' ? 'active' : ''} onClick={() => setActiveTab('certs')}>
            <span className="nav-icon">📜</span> {t.certs}
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙️</span> {t.settings}
          </button>
        </nav>
        <div style={{marginTop: 'auto', padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <p style={{color: '#95a5a6', fontSize: '0.8rem'}}>{t.systemVersion}</p>
        </div>
      </aside>

      <main className="main-container">
        <header className="top-nav">
          <div className="left-header">
            <button className="menu-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? '☰' : '✕'}
            </button>
            <div className="breadcrumb">SFC / {(navLabels[activeTab] || activeTab).toUpperCase()}</div>
          </div>
          <div className="user-info">
            <button
              className="top-bell-button notification-button"
              onClick={() => setActiveTab('notifications')}
              aria-label={t.openNotifications}
              type="button"
            >
              <span className="nav-icon">🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            <button
              className="user-circle"
              onClick={() => {
                setActiveTab('settings')
              }}
              aria-label={t.openAuthPage}
              type="button"
            >
              {profile.fullName.slice(0, 1).toUpperCase()}
            </button>
            <button className="logout-button" onClick={handleLogout} type="button">
              {t.logout}
            </button>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-view">
              <div className="welcome-card">
                <h1 style={{margin: 0}}>{t.welcomeTitle}</h1>
                <p style={{opacity: 0.8}}>{t.welcomeSubtitle}</p>
              </div>
              <div className="status-grid">
                <div className="stat-box">
                  <span className="stat-title">{t.currentProgress}</span>
                  <div className="big-text">75%</div>
                  <div className="progress-bar"><div className="fill" style={{width: '75%'}}></div></div>
                  <p style={{fontSize: '0.8rem', color: '#888'}}>{t.moduleBiodiversity}</p>
                </div>
                <div className="stat-box">
                  <span className="stat-title">{t.credentials}</span>
                  <div className="big-text">02</div>
                  <p style={{marginTop: '10px', fontSize: '0.8rem'}}>{t.verifiedCertificates}</p>
                </div>
                <div className="stat-box">
                  <span className="stat-title">{t.status}</span>
                  <div className="big-text" style={{color: '#27ae60'}}>{t.active}</div>
                  <p style={{marginTop: '10px', fontSize: '0.8rem'}}>{t.guideId}: {profile.guideId}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="training-page">
              <div className="training-view-switch">
                <button
                  type="button"
                  className={trainingView === 'courses' ? 'active' : ''}
                  onClick={() => setTrainingView('courses')}
                >
                  {t.coursesTab}
                </button>
                <button
                  type="button"
                  className={trainingView === 'calendar' ? 'active' : ''}
                  onClick={() => setTrainingView('calendar')}
                >
                  {t.calendarTab}
                </button>
              </div>

              {trainingView === 'courses' && (
                <section className="training-courses">
                  <div className="training-tools">
                    <div className="training-tools-left">
                      <button
                        type="button"
                        className="training-filter-icon"
                        aria-label={t.filter}
                        onClick={() => setIsTrainingFilterOpen(true)}
                      >
                        ⚲
                      </button>
                    </div>
                  </div>

                  <div className="training-course-grid" role="list">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <article key={idx} className="training-course-card" role="listitem">
                        <div className="training-course-thumb" aria-hidden="true" />
                        <div className="training-course-body">
                          <div className="training-course-title">—</div>
                          <div className="training-course-meta">Coming soon</div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {trainingView === 'calendar' && (
                <section className="calendar-page">
                  <div className="calendar-main">
                    <div className="calendar-main-head">
                      <div className="calendar-main-title">
                        {new Date(calendarYear, calendarMonth, 1).toLocaleDateString(
                          language === 'ms' ? 'ms-MY' : language === 'zh' ? 'zh-CN' : 'en-MY',
                          { month: 'long', year: 'numeric' }
                        )}
                      </div>
                      <div className="calendar-main-nav">
                        <button type="button" onClick={() => moveCalendarMonth(-1)}>‹</button>
                        <button type="button" onClick={() => moveCalendarMonth(1)}>›</button>
                      </div>
                    </div>
                    <div className="calendar-main-grid">
                      {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
                        <div key={d} className="calendar-main-dow">{d}</div>
                      ))}
                      {buildMonthMatrix(calendarYear, calendarMonth).map(({ date, inCurrentMonth }) => {
                        const key = formatDateKey(date)
                        const hasNote = dayHasNote(key)
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`calendar-main-cell ${inCurrentMonth ? '' : 'out-month'}`}
                            onClick={() => {
                              setNoteDate(key)
                              setNoteText(getNoteForDate(key))
                              const item = trainingNotes.find((n) => n.date === key)
                              setEventTitle(item?.title || '')
                              setEventLocation(item?.location || '')
                              setIsEventModalOpen(true)
                            }}
                          >
                            <span>{date.getDate()}</span>
                            {hasNote && <span className="calendar-main-mark" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <aside className="calendar-side">
                    <div className="calendar-side-mini">
                      <div className="calendar-side-month">
                        {new Date(calendarYear, calendarMonth, 1).toLocaleDateString(
                          language === 'ms' ? 'ms-MY' : language === 'zh' ? 'zh-CN' : 'en-MY',
                          { month: 'long', year: 'numeric' }
                        )}
                      </div>
                      <div className="training-calendar-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                          <div key={d} className="cal-dow">{d}</div>
                        ))}
                        {buildCalendarCells(calendarYear, calendarMonth).map((dateObj, idx) => {
                          if (!dateObj) return <div key={idx} className="cal-cell empty" />
                          const key = formatDateKey(dateObj)
                          return (
                            <button
                              type="button"
                              key={key}
                              className={`cal-cell ${dayHasNote(key) ? 'has-note' : ''}`}
                              onClick={() => {
                                setNoteDate(key)
                                setNoteText(getNoteForDate(key))
                                const item = trainingNotes.find((n) => n.date === key)
                                setEventTitle(item?.title || '')
                                setEventLocation(item?.location || '')
                                setIsEventModalOpen(true)
                              }}
                            >
                              <span>{dateObj.getDate()}</span>
                              {dayHasNote(key) && <span className="cal-dot" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="calendar-side-list">
                      <h3>{t.calendarList}</h3>
                      <ul>
                        {trainingNotes.slice(0, 8).map((n) => (
                          <li key={n.id}>
                            <span>{n.date}</span>
                            <p>{n.title || t.noEventTitle}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                </section>
              )}

              {isTrainingFilterOpen && (
                <div
                  className="training-filter-overlay"
                  role="presentation"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setIsTrainingFilterOpen(false)
                  }}
                >
                  <aside className="training-filter-drawer" role="dialog" aria-label={t.filter}>
                    <div className="training-filter-head">
                      <h2>{t.filter}</h2>
                      <div className="training-filter-head-actions">
                        <button type="button" onClick={clearTrainingFilters}>{t.clearAll}</button>
                        <button type="button" className="training-filter-close" onClick={() => setIsTrainingFilterOpen(false)}>
                          ×
                        </button>
                      </div>
                    </div>

                    <section className="training-filter-section">
                      <h3>{t.level}</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.level.includes('beginner')}
                          onChange={() => toggleTrainingFilter('level', 'beginner')}
                        />
                        {t.beginner}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.level.includes('advance')}
                          onChange={() => toggleTrainingFilter('level', 'advance')}
                        />
                        {t.advance}
                      </label>
                    </section>

                    <section className="training-filter-section">
                      <h3>{t.statusLabel}</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.status.includes('active')}
                          onChange={() => toggleTrainingFilter('status', 'active')}
                        />
                        {t.activeCourse}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.status.includes('completed')}
                          onChange={() => toggleTrainingFilter('status', 'completed')}
                        />
                        {t.completed}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.status.includes('planned')}
                          onChange={() => toggleTrainingFilter('status', 'planned')}
                        />
                        {t.planned}
                      </label>
                    </section>

                    <section className="training-filter-section">
                      <h3>{t.location}</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.location.includes('lab')}
                          onChange={() => toggleTrainingFilter('location', 'lab')}
                        />
                        {t.lab}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.location.includes('online')}
                          onChange={() => toggleTrainingFilter('location', 'online')}
                        />
                        {t.online}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={trainingFilters.location.includes('field')}
                          onChange={() => toggleTrainingFilter('location', 'field')}
                        />
                        {t.field}
                      </label>
                    </section>

                    <button
                      type="button"
                      className="training-filter-apply"
                      onClick={() => setIsTrainingFilterOpen(false)}
                    >
                      {t.apply}
                    </button>
                  </aside>
                </div>
              )}

              {isEventModalOpen && (
                <div
                  className="calendar-modal-overlay"
                  role="presentation"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setIsEventModalOpen(false)
                  }}
                >
                  <div className="calendar-modal" role="dialog" aria-label="Edit event">
                    <div className="calendar-modal-head">
                      <h3>Edit event</h3>
                      <button type="button" onClick={() => setIsEventModalOpen(false)}>×</button>
                    </div>
                    <div className="calendar-modal-body">
                      <label>
                        {t.eventTitle}
                        <input
                          type="text"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder={t.noEventTitle}
                        />
                      </label>
                      <label>
                        {t.noteDate}
                        <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
                      </label>
                      <label>
                        {t.noteText}
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={t.notePlaceholder}
                          rows={3}
                        />
                      </label>
                      <label>
                        {t.eventLocation}
                        <input
                          type="text"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder={t.eventLocation}
                        />
                      </label>
                    </div>
                    <div className="calendar-modal-actions">
                      <button type="button" className="calendar-modal-close" onClick={() => setIsEventModalOpen(false)}>
                        {t.close}
                      </button>
                      <button type="button" className="calendar-modal-submit" onClick={addTrainingNote}>
                        {t.saveEvent}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-page">
              <div className="notif-page-header">
                <h1 className="notif-page-title">{t.notifications}</h1>
                <div className="notif-page-actions">
                  <button className="notif-page-btn" onClick={markAllAsRead} disabled={unreadCount === 0} type="button">
                    {t.markAllRead}
                  </button>
                  <button className="notif-page-btn" onClick={markSelectedAsRead} disabled={selectedIds.length === 0} type="button">
                    {t.markSelectedRead}
                  </button>
                  <button className="notif-page-btn" onClick={deleteSelected} disabled={selectedIds.length === 0} type="button">
                    {t.deleteSelected}
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <p className="notif-empty">{t.notifEmpty}</p>
              ) : (
                <div className="notif-list" role="list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-row ${n.read ? 'read' : 'unread'} ${selectedIds.includes(n.id) ? 'selected' : ''}`}
                      role="listitem"
                    >
                      <div className="notif-row-top">
                        <label className="notif-check" aria-label={`Select notification: ${n.title}`}>
                          <input
                            type="checkbox"
                            className="notif-check-input"
                            checked={selectedIds.includes(n.id)}
                            onChange={() => toggleSelected(n.id)}
                          />
                          <span className="notif-check-ui" aria-hidden="true" />
                        </label>
                        <div className="notif-row-title">{n.title}</div>
                        <div className="notif-row-time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="notif-row-body">{n.body}</div>
                      {!n.read && <div className="notif-unread-dot" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="auth-page">
              <div className="auth-shell">
                <div className="auth-hero">
                  <span className="auth-tag">{t.secureAccess}</span>
                  <h1>{t.authWelcome}</h1>
                  <p>{t.authDesc}</p>
                </div>

                <div className="auth-card">
                  <form className="auth-form" onSubmit={handleAuthSubmit}>
                    <h2>{t.adminLogin}</h2>
                    <label>
                      {t.adminId}
                      <input type="text" placeholder="ADMIN-001" required />
                    </label>
                    <label>
                      {t.password}
                      <input type="password" placeholder="Enter admin password" required />
                    </label>
                    <button className="auth-submit" type="submit">{t.enterAdminPanel}</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-page">
              <div className="settings-header">
                <h1>{t.settingsTitle}</h1>
                <p>{t.settingsDesc}</p>
              </div>

              <div className="settings-scroll">
                <section className="settings-card settings-panel">
                  <div className="settings-card-head">
                    <h2>{t.profileSettings}</h2>
                  </div>
                  <form className="settings-form" onSubmit={handleProfileSave}>
                    <fieldset>
                      <label>
                        {t.fullName}
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        {t.email}
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        {t.guideId}
                        <input
                          type="text"
                          value={profile.guideId}
                          onChange={(e) => setProfile((prev) => ({ ...prev, guideId: e.target.value }))}
                          required
                        />
                      </label>
                      <button className="settings-submit" type="submit">{t.saveProfile}</button>
                    </fieldset>
                  </form>
                </section>

                <section className="settings-card settings-panel">
                  <div className="settings-card-head">
                    <h2>{t.passwordSettings}</h2>
                  </div>
                  <form className="settings-form" onSubmit={handlePasswordUpdate}>
                    <fieldset>
                      <label>
                        {t.currentPassword}
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        {t.newPassword}
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        {t.confirmPassword}
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                      </label>
                      <button className="settings-submit" type="submit">{t.updatePassword}</button>
                    </fieldset>
                  </form>
                </section>

                <section className="settings-card settings-panel">
                  <h2>{t.appearanceSettings}</h2>
                  <div className="inline-options">
                    <span>{t.themeMode}</span>
                    <div className="inline-buttons">
                      <button
                        type="button"
                        className={theme === 'light' ? 'inline-active' : ''}
                        onClick={() => setTheme('light')}
                      >
                        {t.lightMode}
                      </button>
                      <button
                        type="button"
                        className={theme === 'dark' ? 'inline-active' : ''}
                        onClick={() => setTheme('dark')}
                      >
                        {t.darkMode}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="settings-card settings-panel">
                  <h2>{t.languageSettings}</h2>
                  <div className="inline-options">
                    <span>{t.chooseLanguage}</span>
                    <select
                      className="settings-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">{t.english}</option>
                      <option value="ms">{t.malay}</option>
                      <option value="zh">{t.chinese}</option>
                    </select>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
