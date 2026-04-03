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
    openAuthPage: 'Open login and registration page',
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
    openAuthPage: 'Buka halaman log masuk dan daftar',
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
    openAuthPage: '打开登录与注册页面',
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
  },
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authMode, setAuthMode] = useState('login')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('en')
  const [profile, setProfile] = useState({
    fullName: 'User One',
    email: 'user@sfc.com',
    guideId: 'SFC-USER1',
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

  const t = copy[language]
  const [selectedIds, setSelectedIds] = useState([])
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

  const handleAuthSubmit = (event, mode) => {
    event.preventDefault()
    const actionMap = {
      login: t.loginSuccess,
      register: t.registerSuccess,
      admin: t.adminSuccess,
    }
    setIsLoggedIn(true)
    setActiveTab('dashboard')
    alert(actionMap[mode])
  }

  const handleProfileSave = (event) => {
    event.preventDefault()
    if (!isLoggedIn) return
    alert(t.profileSaved)
  }

  const handlePasswordUpdate = (event) => {
    event.preventDefault()
    if (!isLoggedIn) return
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
                setAuthMode('login')
                setActiveTab('auth')
              }}
              aria-label={t.openAuthPage}
              type="button"
            >
              {profile.fullName.slice(0, 1).toUpperCase()}
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
                  <div className="auth-mode-switch">
                    <button
                      className={authMode === 'login' ? 'active' : ''}
                      onClick={() => setAuthMode('login')}
                      type="button"
                    >
                      {t.login}
                    </button>
                    <button
                      className={authMode === 'register' ? 'active' : ''}
                      onClick={() => setAuthMode('register')}
                      type="button"
                    >
                      {t.register}
                    </button>
                    <button
                      className={authMode === 'admin' ? 'active' : ''}
                      onClick={() => setAuthMode('admin')}
                      type="button"
                    >
                      {t.admin}
                    </button>
                  </div>

                  {authMode === 'login' && (
                    <form className="auth-form" onSubmit={(event) => handleAuthSubmit(event, 'login')}>
                      <h2>{t.userLogin}</h2>
                      <label>
                        {t.email}
                        <input type="email" placeholder="user@sfc.com" required />
                      </label>
                      <label>
                        {t.password}
                        <input type="password" placeholder="Enter password" required />
                      </label>
                      <button className="auth-submit" type="submit">{t.login}</button>
                    </form>
                  )}

                  {authMode === 'register' && (
                    <form className="auth-form" onSubmit={(event) => handleAuthSubmit(event, 'register')}>
                      <h2>{t.createAccount}</h2>
                      <label>
                        {t.fullName}
                        <input type="text" placeholder="Your full name" required />
                      </label>
                      <label>
                        {t.email}
                        <input type="email" placeholder="newuser@example.com" required />
                      </label>
                      <label>
                        {t.password}
                        <input type="password" placeholder="Create password" required />
                      </label>
                      <label>
                        {t.confirmPassword}
                        <input type="password" placeholder="Confirm password" required />
                      </label>
                      <button className="auth-submit" type="submit">{t.register}</button>
                    </form>
                  )}

                  {authMode === 'admin' && (
                    <form className="auth-form" onSubmit={(event) => handleAuthSubmit(event, 'admin')}>
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
                  )}
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
                    {!isLoggedIn && <span className="settings-lock">Locked</span>}
                  </div>
                  {!isLoggedIn && (
                    <div className="settings-locked-banner">
                      <span>{t.profileLocked}</span>
                      <button type="button" onClick={() => setActiveTab('auth')}>{t.loginToUnlock}</button>
                    </div>
                  )}
                  <form className="settings-form" onSubmit={handleProfileSave}>
                    <fieldset disabled={!isLoggedIn}>
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
                    {!isLoggedIn && <span className="settings-lock">Locked</span>}
                  </div>
                  {!isLoggedIn && (
                    <div className="settings-locked-banner">
                      <span>{t.passwordLocked}</span>
                      <button type="button" onClick={() => setActiveTab('auth')}>{t.loginToUnlock}</button>
                    </div>
                  )}
                  <form className="settings-form" onSubmit={handlePasswordUpdate}>
                    <fieldset disabled={!isLoggedIn}>
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
