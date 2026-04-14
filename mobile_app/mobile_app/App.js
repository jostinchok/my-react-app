import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

const copy = {
  en: {
    dashboard: 'Dashboard',
    training: 'Training',
    certs: 'Certificates',
    settings: 'Settings',
    notifications: 'Notifications',
    auth: 'Authentication',
    portalTitle: 'SFC Guide Center',
    welcomeSubtitle: "Professional digital training and certification for Sarawak's parks.",
    currentProgress: 'Current Progress',
    credentials: 'Credentials',
    verifiedCertificates: 'Verified Certificates',
    status: 'Status',
    active: 'Active',
    password: 'Password',
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
    coursesTab: 'Courses',
    calendarTab: 'Calendar',
    saveEvent: 'Submit',
    close: 'Close',
    eventTitle: 'Title',
    eventLocation: 'Location',
    calendarList: 'Calendars',
    noEventTitle: 'Untitled Event',
    noteDate: 'Date',
    noteText: 'Note',
    notePlaceholder: 'Write an important reminder...',
    noMessages: 'No messages yet.',
    profile: 'Profile',
    files: 'Files',
    logout: 'Logout',
    profileSettings: 'Profile Settings',
    passwordSettings: 'Password Settings',
    appearanceSettings: 'Appearance',
    languageSettings: 'Language',
    fullName: 'Full Name',
    email: 'Email',
    guideId: 'Guide ID',
    saveProfile: 'Save Profile',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    passwordMismatch: 'New password and confirm password do not match.',
    passwordUpdated: 'Password updated successfully.',
    profileSaved: 'Profile updated successfully.',
    birthday: 'Birthday',
    livingAddress: 'Address',
    chooseLanguage: 'Choose Language',
    chooseLanguage: 'Choose Language',
    english: 'English',
    malay: 'Malay',
    chinese: 'Chinese',
  },
  ms: {
    dashboard: 'Papan Pemuka',
    training: 'Latihan',
    certs: 'Sijil',
    settings: 'Tetapan',
    notifications: 'Pemberitahuan',
    auth: 'Pengesahan',
    portalTitle: 'Pusat Panduan SFC',
    welcomeSubtitle: 'Latihan digital profesional dan pensijilan untuk taman Sarawak.',
    currentProgress: 'Kemajuan Semasa',
    credentials: 'Kelayakan',
    verifiedCertificates: 'Sijil Disahkan',
    status: 'Status',
    active: 'Aktif',
    password: 'Kata Laluan',
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
    coursesTab: 'Kursus',
    calendarTab: 'Kalendar',
    saveEvent: 'Simpan',
    close: 'Tutup',
    eventTitle: 'Tajuk',
    eventLocation: 'Lokasi',
    calendarList: 'Kalendar',
    noEventTitle: 'Acara Tanpa Tajuk',
    noteDate: 'Tarikh',
    noteText: 'Nota',
    notePlaceholder: 'Tulis peringatan penting...',
    noMessages: 'Belum ada mesej.',
    profile: 'Profil',
    files: 'Fail',
    logout: 'Log Keluar',
    profileSettings: 'Tetapan Profil',
    passwordSettings: 'Tetapan Kata Laluan',
    appearanceSettings: 'Paparan',
    languageSettings: 'Bahasa',
    fullName: 'Nama Penuh',
    email: 'E-mel',
    guideId: 'ID Pemandu',
    saveProfile: 'Simpan Profil',
    currentPassword: 'Kata Laluan Semasa',
    newPassword: 'Kata Laluan Baharu',
    confirmPassword: 'Sahkan Kata Laluan',
    updatePassword: 'Kemas kini Kata Laluan',
    passwordMismatch: 'Kata laluan baharu dan pengesahan tidak sepadan.',
    passwordUpdated: 'Kata laluan berjaya dikemas kini.',
    profileSaved: 'Profil berjaya dikemas kini.',
    birthday: 'Tarikh Lahir',
    livingAddress: 'Alamat',
    chooseLanguage: 'Pilih Bahasa',
    chooseLanguage: 'Pilih Bahasa',
    english: 'Inggeris',
    malay: 'Melayu',
    chinese: 'Cina',
  },
  zh: {
    dashboard: '仪表板',
    training: '培训',
    certs: '证书',
    settings: '设置',
    notifications: '通知',
    auth: '认证',
    portalTitle: 'SFC 导览中心',
    welcomeSubtitle: '为砂拉越公园提供专业数字化培训与认证服务。',
    currentProgress: '当前进度',
    credentials: '资质',
    verifiedCertificates: '已验证证书',
    status: '状态',
    active: '活跃',
    password: '密码',
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
    coursesTab: '课程',
    calendarTab: '日历',
    saveEvent: '提交',
    close: '关闭',
    eventTitle: '标题',
    eventLocation: '地点',
    calendarList: '日历',
    noEventTitle: '未命名事件',
    noteDate: '日期',
    noteText: '备注',
    notePlaceholder: '记录重要事项...',
    noMessages: '暂无消息。',
    profile: '个人资料',
    files: '文件',
    logout: '登出',
    profileSettings: '个人资料设置',
    passwordSettings: '密码设置',
    appearanceSettings: '外观',
    languageSettings: '语言',
    fullName: '姓名',
    email: '邮箱',
    guideId: '导览员ID',
    saveProfile: '保存资料',
    currentPassword: '当前密码',
    newPassword: '新密码',
    confirmPassword: '确认密码',
    updatePassword: '更新密码',
    passwordMismatch: '新密码与确认密码不一致。',
    passwordUpdated: '密码更新成功。',
    profileSaved: '个人资料已更新。',
    birthday: '生日',
    livingAddress: '地址',
    chooseLanguage: '选择语言',
    chooseLanguage: '选择语言',
    english: '英语',
    malay: '马来语',
    chinese: '华语',
  },
}

const palette = {
  bg: '#f0f2f0',
  panel: '#ffffff',
  text: '#1f2f28',
  muted: '#5f726a',
  border: '#d8e4de',
  accent: '#165132',
  accentSoft: '#eaf5ef',
}

const navTabs = ['profile', 'files', 'dashboard', 'training', 'certs', 'notifications', 'settings', 'logout']
const NAV_WIDTH = 250

function formatDateKey(dateObj) {
  return dateObj.toISOString().slice(0, 10)
}

function buildMonthMatrix(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({ date: d, inCurrentMonth: d.getMonth() === month })
  }
  return cells
}

export default function App() {
  const [language, setLanguage] = useState('en')
  const t = copy[language] || copy.en
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isNavMounted, setIsNavMounted] = useState(false)

  const [trainingView, setTrainingView] = useState('courses')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    level: ['beginner'],
    status: ['active'],
    location: ['online'],
  })
  const [notifications, setNotifications] = useState([])
  const [today] = useState(new Date())
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [noteDate, setNoteDate] = useState(formatDateKey(today))
  const [noteText, setNoteText] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [trainingNotes, setTrainingNotes] = useState([])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profile, setProfile] = useState({ fullName: '', email: '', guideId: '', birthday: '', address: '' })
  const navTranslateX = useRef(new Animated.Value(-NAV_WIDTH)).current

  const monthCells = useMemo(() => buildMonthMatrix(calendarYear, calendarMonth), [calendarYear, calendarMonth])

  const toggleFilter = (group, value) => {
    setFilters((prev) => {
      const has = prev[group].includes(value)
      return { ...prev, [group]: has ? prev[group].filter((x) => x !== value) : [...prev[group], value] }
    })
  }

  const moveMonth = (delta) => {
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

  const getNoteForDate = (dateKey) => trainingNotes.find((n) => n.date === dateKey)

  const saveEvent = () => {
    if (!noteDate) return
    setTrainingNotes((prev) => {
      const next = prev.filter((n) => n.date !== noteDate)
      next.unshift({
        id: Date.now(),
        date: noteDate,
        text: noteText.trim(),
        title: eventTitle.trim() || t.noEventTitle,
        location: eventLocation.trim(),
      })
      return next.slice(0, 60)
    })
    setIsEventModalOpen(false)
    setNoteText('')
    setEventTitle('')
    setEventLocation('')
  }

  const openEventModal = (dateKey) => {
    const existing = getNoteForDate(dateKey)
    setNoteDate(dateKey)
    setNoteText(existing?.text || '')
    setEventTitle(existing?.title || '')
    setEventLocation(existing?.location || '')
    setIsEventModalOpen(true)
  }

  useEffect(() => {
    if (isNavOpen) {
      Animated.timing(navTranslateX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
      return
    }
    Animated.timing(navTranslateX, {
      toValue: -NAV_WIDTH,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsNavMounted(false)
    })
  }, [isNavOpen, navTranslateX])

  const handleProfileSave = () => {
    Alert.alert(t.profileSaved)
  }

  const handlePasswordUpdate = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert(t.passwordMismatch)
      return
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    Alert.alert(t.passwordUpdated)
  }

  const ProfileView = ({ profile, t }) => {
    const initials = profile.fullName ? profile.fullName.slice(0, 1).toUpperCase() : 'U'
    return (
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarCard}>
          <View style={styles.profileAvatarPreview}>
            <Text style={styles.profileAvatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileAvatarLabel}>
            <Text style={styles.profileLabelName}>{profile.fullName || 'User'}</Text>
            <Text style={styles.profileLabelEmail}>{profile.email || 'No email available'}</Text>
          </View>
        </View>
        <View style={styles.profileDetails}>
          <View style={styles.profileField}>
            <Text style={styles.profileLabel}>{t.fullName}</Text>
            <Text style={styles.profileValue}>{profile.fullName || '-'}</Text>
          </View>
          <View style={styles.profileField}>
            <Text style={styles.profileLabel}>{t.guideId}</Text>
            <Text style={styles.profileValue}>{profile.guideId || '-'}</Text>
          </View>
          <View style={styles.profileField}>
            <Text style={styles.profileLabel}>{t.email}</Text>
            <Text style={styles.profileValue}>{profile.email || '-'}</Text>
          </View>
          <View style={styles.profileField}>
            <Text style={styles.profileLabel}>{t.birthday}</Text>
            <Text style={styles.profileValue}>{profile.birthday || '-'}</Text>
          </View>
          <View style={styles.profileField}>
            <Text style={styles.profileLabel}>{t.livingAddress}</Text>
            <Text style={styles.profileValue}>{profile.address || '-'}</Text>
          </View>
        </View>
      </View>
    )
  }

  const AppHeader = (
    <View style={[styles.header, { backgroundColor: palette.panel, borderColor: palette.border }]}>
      <View style={styles.headerLeft}>
        <Pressable
          onPress={() => {
            setIsNavMounted(true)
            setIsNavOpen(true)
          }}
          style={[styles.menuBtn, { borderColor: palette.border, backgroundColor: palette.accentSoft }]}
        >
          <Text style={{ color: palette.text, fontWeight: '900' }}>☰</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>{t.portalTitle}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <StatusBar style="dark" />
      {AppHeader}
      <ScrollView contentContainerStyle={styles.contentWrap}>
        <Text style={[styles.sectionLabel, { color: palette.muted }]}>SFC / {t[activeTab]}</Text>

        {activeTab === 'auth' && (
          <View style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <Text style={[styles.h2, { color: palette.text }]}>{t.adminLogin}</Text>
            <TextInput placeholder={t.adminId} placeholderTextColor={palette.muted} style={[styles.input, { color: palette.text, borderColor: palette.border }]} />
            <TextInput placeholder={t.password} placeholderTextColor={palette.muted} secureTextEntry style={[styles.input, { color: palette.text, borderColor: palette.border }]} />
            <Pressable onPress={() => setActiveTab('dashboard')} style={[styles.primaryBtn, { backgroundColor: palette.accent }]}>
              <Text style={styles.primaryBtnText}>{t.enterAdminPanel}</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'dashboard' && (
          <View style={styles.stackGap}>
            <View style={[styles.hero, { backgroundColor: palette.panel, borderColor: palette.border }]}>
              <Text style={[styles.h1, { color: palette.text }]}>{t.portalTitle}</Text>
              <Text style={{ color: palette.muted }}>{t.welcomeSubtitle}</Text>
            </View>
            <View style={styles.statRow}>
              {[t.currentProgress, t.credentials, t.status].map((title, i) => (
                <View key={title} style={[styles.statCard, { backgroundColor: palette.panel, borderColor: palette.border }]}>
                  <Text style={{ color: palette.muted, fontWeight: '700' }}>{title}</Text>
                  <Text style={[styles.statBig, { color: palette.text }]}>{i === 0 ? '75%' : i === 1 ? '02' : t.active}</Text>
                  <Text style={{ color: palette.muted }}>{i === 1 ? t.verifiedCertificates : ' '}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'training' && (
          <View style={styles.stackGap}>
            <View style={styles.trainingSwitchRow}>
              {['courses', 'calendar'].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setTrainingView(v)}
                  style={[
                    styles.switchBtn,
                    {
                      backgroundColor: trainingView === v ? palette.accent : palette.panel,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text style={{ color: trainingView === v ? '#fff' : palette.text, fontWeight: '700' }}>
                    {v === 'courses' ? t.coursesTab : t.calendarTab}
                  </Text>
                </Pressable>
              ))}
            </View>

            {trainingView === 'courses' && (
              <View style={styles.stackGap}>
                <View style={styles.courseToolbar}>
                  <Pressable onPress={() => setIsFilterOpen(true)} style={[styles.iconBtn, { backgroundColor: palette.panel, borderColor: palette.border }]}>
                    <Text style={{ color: palette.text }}>⚲</Text>
                  </Pressable>
                </View>
                <View style={styles.courseGrid}>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <View key={idx} style={[styles.courseCard, { backgroundColor: palette.panel, borderColor: palette.border }]}>
                      <View style={[styles.courseThumb, { backgroundColor: '#d7efe1' }]} />
                      <View style={styles.courseBody}>
                        <Text style={{ color: palette.text, fontWeight: '800' }}>—</Text>
                        <Text style={{ color: palette.muted }}>Coming soon</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {trainingView === 'calendar' && (
              <View style={styles.calendarWrap}>
                <View style={[styles.calendarMain, { backgroundColor: palette.panel, borderColor: palette.border }]}>
                  <View style={styles.calendarHead}>
                    <Text style={{ color: palette.text, fontWeight: '800' }}>
                      {new Date(calendarYear, calendarMonth, 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
                    </Text>
                    <View style={styles.calendarNavRow}>
                      <Pressable onPress={() => moveMonth(-1)} style={[styles.navCircle, { borderColor: palette.border }]}>
                        <Text style={{ color: palette.text }}>{'<'}</Text>
                      </Pressable>
                      <Pressable onPress={() => moveMonth(1)} style={[styles.navCircle, { borderColor: palette.border }]}>
                        <Text style={{ color: palette.text }}>{'>'}</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={[styles.monthGrid, { borderColor: palette.border }]}>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
                      <View key={d} style={[styles.dowCell, { borderColor: palette.border }]}>
                        <Text style={{ color: palette.muted, fontSize: 12, fontWeight: '700' }}>{d}</Text>
                      </View>
                    ))}
                    {monthCells.map(({ date, inCurrentMonth }) => {
                      const key = formatDateKey(date)
                      const hasNote = !!getNoteForDate(key)
                      return (
                        <Pressable
                          key={key}
                          onPress={() => openEventModal(key)}
                          style={[
                            styles.monthCell,
                            { borderColor: palette.border, backgroundColor: palette.panel, opacity: inCurrentMonth ? 1 : 0.55 },
                          ]}
                        >
                          <Text style={{ color: palette.text }}>{date.getDate()}</Text>
                          {hasNote && <View style={styles.dotMark} />}
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
                <View style={styles.calendarSide}>
                  <View style={[styles.sideCard, { backgroundColor: palette.panel, borderColor: palette.border }]}>
                    <Text style={{ color: palette.text, textAlign: 'center', fontWeight: '800', marginBottom: 8 }}>
                      {new Date(calendarYear, calendarMonth, 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
                    </Text>
                    <View style={styles.miniGrid}>
                      {buildMonthMatrix(calendarYear, calendarMonth).slice(0, 35).map(({ date }, idx) => (
                        <Text key={`${idx}-${date.getDate()}`} style={{ color: palette.text, textAlign: 'center', fontSize: 12 }}>
                          {date.getDate()}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.sideCard, { backgroundColor: palette.panel, borderColor: palette.border }]}>
                    <Text style={{ color: palette.text, fontWeight: '800', marginBottom: 6 }}>{t.calendarList}</Text>
                    {trainingNotes.slice(0, 6).map((n) => (
                      <View key={n.id} style={styles.noteItem}>
                        <Text style={{ color: palette.muted, fontSize: 12 }}>{n.date}</Text>
                        <Text style={{ color: palette.text, fontWeight: '700' }}>{n.title || t.noEventTitle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'notifications' && (
          <View style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <Text style={[styles.h2, { color: palette.text }]}>{t.notifications}</Text>
            {notifications.length === 0 && <Text style={{ color: palette.muted }}>{t.noMessages}</Text>}
          </View>
        )}

        {activeTab === 'certs' && (
          <View style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <Text style={[styles.h2, { color: palette.text }]}>{t.certs}</Text>
            <Text style={{ color: palette.muted }}>{t.verifiedCertificates}</Text>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <Text style={[styles.h2, { color: palette.text }]}>{t.settings}</Text>
            <View style={[styles.settingsSection, { borderColor: palette.border }]}>
              <Text style={[styles.settingsTitle, { color: palette.text }]}>{t.profileSettings}</Text>
              <TextInput
                placeholder={t.fullName}
                placeholderTextColor={palette.muted}
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
                value={profile.fullName}
                onChangeText={(v) => setProfile((p) => ({ ...p, fullName: v }))}
              />
              <TextInput
                placeholder={t.email}
                placeholderTextColor={palette.muted}
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
                value={profile.email}
                onChangeText={(v) => setProfile((p) => ({ ...p, email: v }))}
              />
              <TextInput
                placeholder={t.guideId}
                placeholderTextColor={palette.muted}
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
                value={profile.guideId}
                onChangeText={(v) => setProfile((p) => ({ ...p, guideId: v }))}
              />
              <Pressable onPress={handleProfileSave} style={[styles.primaryBtn, { backgroundColor: palette.accent }]}>
                <Text style={styles.primaryBtnText}>{t.saveProfile}</Text>
              </Pressable>
            </View>

            <View style={[styles.settingsSection, { borderColor: palette.border }]}>
              <Text style={[styles.settingsTitle, { color: palette.text }]}>{t.passwordSettings}</Text>
              <TextInput
                placeholder={t.currentPassword}
                placeholderTextColor={palette.muted}
                secureTextEntry
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
                value={passwordForm.currentPassword}
                onChangeText={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))}
              />
              <TextInput
                placeholder={t.newPassword}
                placeholderTextColor={palette.muted}
                secureTextEntry
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
                value={passwordForm.newPassword}
                onChangeText={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
              />
              <TextInput
                placeholder={t.confirmPassword}
                placeholderTextColor={palette.muted}
                secureTextEntry
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
                value={passwordForm.confirmPassword}
                onChangeText={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))}
              />
              <Pressable onPress={handlePasswordUpdate} style={[styles.primaryBtn, { backgroundColor: palette.accent }]}>
                <Text style={styles.primaryBtnText}>{t.updatePassword}</Text>
              </Pressable>
            </View>



            <View style={[styles.settingsSection, { borderColor: palette.border }]}>
              <Text style={[styles.settingsTitle, { color: palette.text }]}>{t.languageSettings}</Text>
              <Text style={{ color: palette.muted }}>{t.chooseLanguage}</Text>
              <View style={styles.rowGap}>
                {[
                  { key: 'en', label: t.english },
                  { key: 'ms', label: t.malay },
                  { key: 'zh', label: t.chinese },
                ].map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setLanguage(item.key)}
                    style={[
                      styles.chipBtn,
                      {
                        borderColor: palette.border,
                        backgroundColor: language === item.key ? palette.accent : palette.panel,
                      },
                    ]}
                  >
                    <Text style={{ color: language === item.key ? '#fff' : palette.text }}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
        {activeTab === 'profile' && <ProfileView profile={profile} t={t} />}

      </ScrollView>

      <Modal visible={isNavMounted} transparent animationType="none">
        <Pressable style={styles.overlayLeft} onPress={() => setIsNavOpen(false)}>
          <Animated.View
            style={[
              styles.sideNav,
              {
                backgroundColor: palette.panel,
                borderColor: palette.border,
                transform: [{ translateX: navTranslateX }],
              },
            ]}
          >
            <Text style={[styles.sideNavTitle, { color: palette.text }]}>{t.portalTitle}</Text>
            {navTabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab)
                  setIsNavOpen(false)
                }}
                style={[
                  styles.sideNavItem,
                  {
                    backgroundColor: activeTab === tab ? palette.accent : palette.panel,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={{ color: activeTab === tab ? '#fff' : palette.text, fontWeight: '700' }}>{t[tab]}</Text>
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>

      <Modal visible={isFilterOpen} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setIsFilterOpen(false)}>
          <Pressable onPress={() => {}} style={[styles.sheet, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <Text style={[styles.h2, { color: palette.text }]}>{t.filter}</Text>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>{t.level}</Text>
            <Pressable onPress={() => toggleFilter('level', 'beginner')}><Text style={{ color: palette.text }}>{filters.level.includes('beginner') ? '☑' : '☐'} {t.beginner}</Text></Pressable>
            <Pressable onPress={() => toggleFilter('level', 'advance')}><Text style={{ color: palette.text }}>{filters.level.includes('advance') ? '☑' : '☐'} {t.advance}</Text></Pressable>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>{t.statusLabel}</Text>
            <Pressable onPress={() => toggleFilter('status', 'active')}><Text style={{ color: palette.text }}>{filters.status.includes('active') ? '☑' : '☐'} {t.activeCourse}</Text></Pressable>
            <Pressable onPress={() => toggleFilter('status', 'completed')}><Text style={{ color: palette.text }}>{filters.status.includes('completed') ? '☑' : '☐'} {t.completed}</Text></Pressable>
            <Pressable onPress={() => toggleFilter('status', 'planned')}><Text style={{ color: palette.text }}>{filters.status.includes('planned') ? '☑' : '☐'} {t.planned}</Text></Pressable>
            <Pressable onPress={() => setIsFilterOpen(false)} style={[styles.primaryBtn, { backgroundColor: palette.accent, marginTop: 12 }]}>
              <Text style={styles.primaryBtnText}>{t.apply}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={isEventModalOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsEventModalOpen(false)}>
          <Pressable onPress={() => {}} style={[styles.modalCard, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <Text style={[styles.h2, { color: palette.text, marginBottom: 10 }]}>Edit event</Text>
            <TextInput placeholder={t.eventTitle} placeholderTextColor={palette.muted} value={eventTitle} onChangeText={setEventTitle} style={[styles.input, { color: palette.text, borderColor: palette.border }]} />
            <TextInput placeholder={t.noteDate} placeholderTextColor={palette.muted} value={noteDate} onChangeText={setNoteDate} style={[styles.input, { color: palette.text, borderColor: palette.border }]} />
            <TextInput placeholder={t.noteText} placeholderTextColor={palette.muted} value={noteText} onChangeText={setNoteText} multiline style={[styles.input, styles.inputTall, { color: palette.text, borderColor: palette.border }]} />
            <TextInput placeholder={t.eventLocation} placeholderTextColor={palette.muted} value={eventLocation} onChangeText={setEventLocation} style={[styles.input, { color: palette.text, borderColor: palette.border }]} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsEventModalOpen(false)} style={[styles.secondaryBtn, { borderColor: palette.border }]}>
                <Text style={{ color: palette.text }}>{t.close}</Text>
              </Pressable>
              <Pressable onPress={saveEvent} style={[styles.primaryBtn, { backgroundColor: palette.accent }]}>
                <Text style={styles.primaryBtnText}>{t.saveEvent}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  menuBtn: { borderWidth: 1, borderRadius: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  contentWrap: { padding: 12, gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700' },
  navRow: { flexGrow: 0 },
  navBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 8,
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  h1: { fontSize: 28, fontWeight: '900' },
  h2: { fontSize: 24, fontWeight: '800' },
  stackGap: { gap: 10 },
  hero: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  statBig: { fontSize: 30, fontWeight: '900' },
  trainingSwitchRow: { flexDirection: 'row', gap: 8 },
  switchBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  courseToolbar: { flexDirection: 'row' },
  iconBtn: { borderWidth: 1, borderRadius: 10, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseCard: { width: '48%', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  courseThumb: { height: 90 },
  courseBody: { padding: 10, gap: 4 },
  calendarWrap: { flexDirection: 'row', gap: 8 },
  calendarMain: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 8, gap: 8 },
  calendarHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarNavRow: { flexDirection: 'row', gap: 6 },
  navCircle: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthGrid: { borderTopWidth: 1, borderLeftWidth: 1, flexDirection: 'row', flexWrap: 'wrap' },
  dowCell: { width: '14.2857%', borderBottomWidth: 1, borderRightWidth: 1, alignItems: 'center', paddingVertical: 6 },
  monthCell: { width: '14.2857%', minHeight: 62, borderBottomWidth: 1, borderRightWidth: 1, alignItems: 'flex-end', padding: 6 },
  dotMark: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#e74c3c', position: 'absolute', left: 6, top: 8 },
  calendarSide: { width: 130, gap: 8 },
  sideCard: { borderWidth: 1, borderRadius: 10, padding: 8 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between' },
  noteItem: { borderTopWidth: 1, borderColor: '#d8e4de', paddingTop: 6, marginTop: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  overlayLeft: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sideNav: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    borderRightWidth: 1,
    padding: 14,
    gap: 8,
  },
  sideNavTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  sideNavItem: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 14, borderWidth: 1, gap: 8 },
  sheetTitle: { marginTop: 8, fontWeight: '800' },
  modalCard: { margin: 16, borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  inputTall: { minHeight: 84, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  secondaryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  primaryBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  settingsSection: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  settingsTitle: { fontSize: 16, fontWeight: '800' },
  rowGap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  profileCard: { borderWidth: 1, borderRadius: 14, padding: 16, backgroundColor: palette.panel, borderColor: palette.border },
  profileAvatarCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  profileAvatarPreview: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: palette.accent, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.accentSoft
  },
  profileAvatarInitials: { color: '#fff', fontSize: 28, fontWeight: '900' },
  profileAvatarLabel: { flex: 1 },
  profileLabelName: { fontSize: 20, fontWeight: '900', color: palette.text },
  profileLabelEmail: { fontSize: 16, color: palette.muted },
  profileDetails: { gap: 12 },
  profileField: { gap: 2 },
  profileLabel: { fontSize: 14, fontWeight: '700', color: palette.muted },
  profileValue: { fontSize: 16, color: palette.text, fontWeight: '600' },
})
