import { useState } from 'react'
import AdminPage from './Admin'
import AuthPortal from './components/AuthPortal'

const AUTH_STORAGE_KEY = 'sfc_admin_user'

function App() {
	const [authUser, setAuthUser] = useState(() => {
		try {
			const raw = localStorage.getItem(AUTH_STORAGE_KEY)
			return raw ? JSON.parse(raw) : null
		} catch {
			return null
		}
	})

	const handleAuthSuccess = (user) => {
		setAuthUser(user)
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
	}

	const handleLogout = () => {
		localStorage.removeItem(AUTH_STORAGE_KEY)
		setAuthUser(null)
	}

	if (!authUser) {
		return <AuthPortal onAuthSuccess={handleAuthSuccess} />
	}

	return (
		<>
			<button
				type="button"
				onClick={handleLogout}
				style={{
					position: 'fixed',
					top: '14px',
					right: '14px',
					zIndex: 9999,
					border: 'none',
					borderRadius: '10px',
					padding: '10px 14px',
					fontWeight: 700,
					background: '#032c1d',
					color: '#ffffff',
					cursor: 'pointer',
				}}
			>
				Logout
			</button>
			<AdminPage />
		</>
	)
}

export default App
