import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const PRIMARY_GREEN = '#2e7d32'
const PRIMARY_DARK = '#1b5e20'
const ACCENT = '#6bdc45'
const LINK_GREEN = '#2e7d32'

const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const isCredentialFailureMessage = (message) => {
  const lower = String(message).toLowerCase()
  return (
    lower.includes('invalid credential') ||
    lower.includes('invalid email') ||
    lower.includes('unauthorized') ||
    lower.includes('401') ||
    !String(message).trim()
  )
}

const CREDENTIAL_ERROR_BAR =
  'Incorrect email or password. Check spelling and Caps Lock, or use Forgot Password below.'

export default function AuthScreens({ apiBaseUrl, onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [loginCredentialError, setLoginCredentialError] = useState(null)

  useEffect(() => {
    if (mode !== 'login') setLoginCredentialError(null)
  }, [mode])

  const postJson = async (path, body) => {
    let response
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new Error(
        err?.message?.includes('Network') || err?.message?.includes('Failed to fetch')
          ? `Cannot reach API at ${apiBaseUrl}. Same Wi‑Fi? Firewall allows port 4000?`
          : err.message || 'Network error'
      )
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const base = data.message || `Request failed (${response.status})`
      const detail = data.error ? ` — ${data.error}` : ''
      throw new Error(`${base}${detail}`)
    }
    return data
  }

  const handleLogin = async () => {
    const trimmed = email.trim()
    if (!trimmed || !password) {
      Alert.alert(
        'Missing details',
        'Please enter your registered guide email and password before signing in.'
      )
      return
    }
    if (!emailLooksValid(trimmed)) {
      Alert.alert(
        'Check your email',
        'Enter a valid email address (example: name@example.com). Guides sign in with the email they used at registration.'
      )
      return
    }
    setLoginCredentialError(null)
    setBusy(true)
    try {
      const data = await postJson('/api/auth/login', {
        email: trimmed,
        password,
      })
      const u = data.user
      if (u.role_name === 'admin') {
        setLoginCredentialError(null)
        Alert.alert(
          'Guides only',
          'This app is for park guides only. Admin accounts must use the Admin Dashboard in a browser (for example http://localhost:5174/admin).'
        )
        return
      }
      if (u.role_name && u.role_name !== 'guide') {
        setLoginCredentialError(null)
        Alert.alert(
          'Guides only',
          'Only guide accounts can use this mobile app. If you need access, please contact your administrator.'
        )
        return
      }
      setLoginCredentialError(null)
      onAuthenticated({
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        role_name: u.role_name,
      })
    } catch (e) {
      if (isCredentialFailureMessage(e.message)) {
        setLoginCredentialError(CREDENTIAL_ERROR_BAR)
      } else {
        Alert.alert('Login failed', e.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Name, email and password are required.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await postJson('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      })
      Alert.alert(
        'Account created',
        'Your guide account is saved in the database. You can log in now.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      )
    } catch (e) {
      Alert.alert('Registration failed', e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleForgot = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email you registered with.')
      return
    }
    setBusy(true)
    try {
      const data = await postJson('/api/auth/forgot-password', { email: email.trim() })
      const token = data.resetToken
      if (token) {
        Alert.alert(
          'Reset token (dev)',
          `Copy this token and use it on the Reset screen:\n\n${token}`,
          [{ text: 'Enter reset', onPress: () => { setResetToken(token); setMode('reset') } }]
        )
      } else {
        Alert.alert('Check email', 'If the account exists, a reset was processed.')
      }
    } catch (e) {
      Alert.alert('Request failed', e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async () => {
    if (!email.trim() || !resetToken.trim() || !newPassword) {
      Alert.alert('Missing fields', 'Email, token and new password are required.')
      return
    }
    setBusy(true)
    try {
      await postJson('/api/auth/reset-password', {
        email: email.trim(),
        token: resetToken.trim(),
        newPassword,
      })
      Alert.alert('Password updated', 'You can log in with your new password.', [
        { text: 'OK', onPress: () => setMode('login') },
      ])
    } catch (e) {
      Alert.alert('Reset failed', e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <LinearGradient colors={['#fffdf4', '#eff7e8', '#dcedc1']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require('./assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Digital Park Login</Text>

            {mode === 'login' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email/Username"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(v) => {
                    setLoginCredentialError(null)
                    setEmail(v)
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  visibilityToggle={true}
                  value={password}
                  onChangeText={(v) => {
                    setLoginCredentialError(null)
                    setPassword(v)
                  }}
                />
                {loginCredentialError ? (
                  <View style={styles.errorBar}>
                    <Text style={styles.errorBarText}>{loginCredentialError}</Text>
                    <Pressable
                      onPress={() => setLoginCredentialError(null)}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss error"
                    >
                      <Text style={styles.errorBarDismiss}>×</Text>
                    </Pressable>
                  </View>
                ) : null}
                <LinearGradient colors={[ACCENT, PRIMARY_GREEN]} style={styles.buttonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Pressable style={styles.buttonInner} onPress={handleLogin} disabled={busy}>
                    <Text style={styles.buttonText}>{busy ? 'Please wait…' : 'Login'}</Text>
                  </Pressable>
                </LinearGradient>
                <View style={styles.linksRow}>
                  <Pressable onPress={() => setMode('register')}>
                    <Text style={styles.linkLeft}>Register User</Text>
                  </Pressable>
                  <Pressable onPress={() => setMode('forgot')}>
                    <Text style={styles.linkRight}>Forgot Password?</Text>
                  </Pressable>
                </View>
              </>
            )}

            {mode === 'register' && (
              <>
                <Text style={styles.subtitle}>Create guide account</Text>
                <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <LinearGradient colors={[ACCENT, PRIMARY_GREEN]} style={styles.buttonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Pressable style={styles.buttonInner} onPress={handleRegister} disabled={busy}>
                    <Text style={styles.buttonText}>{busy ? 'Please wait…' : 'Register'}</Text>
                  </Pressable>
                </LinearGradient>
                <Pressable style={styles.backLink} onPress={() => setMode('login')}>
                  <Text style={styles.linkCenter}>Back to login</Text>
                </Pressable>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <Text style={styles.subtitle}>Forgot password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Registered email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <LinearGradient colors={[ACCENT, PRIMARY_GREEN]} style={styles.buttonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Pressable style={styles.buttonInner} onPress={handleForgot} disabled={busy}>
                    <Text style={styles.buttonText}>{busy ? 'Please wait…' : 'Send reset'}</Text>
                  </Pressable>
                </LinearGradient>
                <Pressable style={styles.backLink} onPress={() => setMode('login')}>
                  <Text style={styles.linkCenter}>Back to login</Text>
                </Pressable>
              </>
            )}

            {mode === 'reset' && (
              <>
                <Text style={styles.subtitle}>Reset password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput style={styles.input} placeholder="Reset token" value={resetToken} onChangeText={setResetToken} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                <LinearGradient colors={[ACCENT, PRIMARY_GREEN]} style={styles.buttonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Pressable style={styles.buttonInner} onPress={handleReset} disabled={busy}>
                    <Text style={styles.buttonText}>{busy ? 'Please wait…' : 'Update password'}</Text>
                  </Pressable>
                </LinearGradient>
                <Pressable style={styles.backLink} onPress={() => setMode('login')}>
                  <Text style={styles.linkCenter}>Back to login</Text>
                </Pressable>
              </>
            )}
            <Text style={styles.apiHint} selectable>
              API: {apiBaseUrl}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e6efea',
  },
  logo: {
    width: 200,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY_GREEN,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  errorBarText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#b71c1c',
    fontWeight: '600',
  },
  errorBarDismiss: {
    fontSize: 22,
    lineHeight: 24,
    color: '#c62828',
    fontWeight: '400',
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_DARK,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  buttonGrad: {
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonInner: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  linkLeft: {
    color: LINK_GREEN,
    fontSize: 14,
  },
  linkRight: {
    color: LINK_GREEN,
    fontSize: 14,
  },
  linkCenter: {
    color: LINK_GREEN,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  backLink: {
    marginTop: 16,
  },
  apiHint: {
    marginTop: 14,
    fontSize: 11,
    color: '#607064',
    textAlign: 'center',
  },
})
