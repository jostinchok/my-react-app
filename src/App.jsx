import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('sfc_notifications_v1')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [selectedIds, setSelectedIds] = useState([])

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

  useEffect(() => {
    if (activeTab !== 'notifications') setSelectedIds([])
  }, [activeTab])

  useEffect(() => {
    if (selectedIds.length === 0) return
    setSelectedIds((prev) => prev.filter((id) => notifications.some((n) => n.id === id)))
  }, [notifications, selectedIds.length])

  return (
    <div className={`layout ${isCollapsed ? 'sidebar-hidden' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sfc-logo">SFC</div>
          <span>Digital Portal</span>
        </div>
        <nav className="side-menu">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={activeTab === 'training' ? 'active' : ''} onClick={() => setActiveTab('training')}>
            <span className="nav-icon">📖</span> Training
          </button>
          <button className={activeTab === 'certs' ? 'active' : ''} onClick={() => setActiveTab('certs')}>
            <span className="nav-icon">📜</span> Certificates
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙️</span> Settings
          </button>
        </nav>
        <div style={{marginTop: 'auto', padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <p style={{color: '#95a5a6', fontSize: '0.8rem'}}>System: SFC-V1.0</p>
        </div>
      </aside>

      <main className="main-container">
        <header className="top-nav">
          <div className="left-header">
            <button className="menu-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? '☰' : '✕'}
            </button>
            <div className="breadcrumb">SFC / {activeTab.toUpperCase()}</div>
          </div>
          <div className="user-info">
            <button
              className="top-bell-button notification-button"
              onClick={() => setActiveTab('notifications')}
              aria-label="Open notifications"
              type="button"
            >
              <span className="nav-icon">🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            <div className="user-circle">U1</div>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-view">
              <div className="welcome-card">
                <h1 style={{margin: 0}}>SFC Guide Center</h1>
                <p style={{opacity: 0.8}}>Professional digital training and certification for Sarawak's parks.</p>
              </div>
              <div className="status-grid">
                <div className="stat-box">
                  <span className="stat-title">Current Progress</span>
                  <div className="big-text">75%</div>
                  <div className="progress-bar"><div className="fill" style={{width: '75%'}}></div></div>
                  <p style={{fontSize: '0.8rem', color: '#888'}}>Module: Biodiversity</p>
                </div>
                <div className="stat-box">
                  <span className="stat-title">Credentials</span>
                  <div className="big-text">02</div>
                  <p style={{marginTop: '10px', fontSize: '0.8rem'}}>Verified Certificates</p>
                </div>
                <div className="stat-box">
                  <span className="stat-title">Status</span>
                  <div className="big-text" style={{color: '#27ae60'}}>Active</div>
                  <p style={{marginTop: '10px', fontSize: '0.8rem'}}>Guide ID: SFC-USER1</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-page">
              <div className="notif-page-header">
                <h1 className="notif-page-title">Notifications</h1>
                <div className="notif-page-actions">
                  <button className="notif-page-btn" onClick={markAllAsRead} disabled={unreadCount === 0} type="button">
                    Mark all read
                  </button>
                  <button className="notif-page-btn" onClick={markSelectedAsRead} disabled={selectedIds.length === 0} type="button">
                    Mark selected read
                  </button>
                  <button className="notif-page-btn" onClick={deleteSelected} disabled={selectedIds.length === 0} type="button">
                    Delete selected
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <p className="notif-empty">No messages yet.</p>
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
        </div>
      </main>
    </div>
  )
}

export default App
