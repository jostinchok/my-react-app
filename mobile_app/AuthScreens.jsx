import { useState } from 'react'
import { getUserApiBaseUrl, isExpoWebDevServer, normalizeAuthApiBaseUrl } from './apiConfig'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

const palette = {
  forest: '#3a2a16',
  forest2: '#874500',
  charcoal: '#28251d',
  citrus: '#ff7a1a',
  sun: '#ffd23f',
  cream: '#fff9e9',
  line: '#dfe8d6',
  muted: '#617064',
  danger: '#c74f3f',
  success: '#2f6f26',
  white: '#ffffff',
}

export default function AuthScreens({ apiBaseUrl, onAuthenticated }) {
  const authBaseUrl = normalizeAuthApiBaseUrl(apiBaseUrl)
  const [activeView, setActiveView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSendingForgot, setIsSendingForgot] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setMessage({ text: 'Please enter both email and password.', type: 'error' })
      return
    }

    setIsLoggingIn(true)
    setMessage({ text: '', type: '' })

    try {
      const response = await fetch(`${authBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: 'guide',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage({ text: data?.message || 'Invalid credentials. Try again.', type: 'error' })
        return
      }

      const user = data?.user
      const token = data?.token
      if (!user?.user_id || !token) {
        setMessage({ text: 'Login response is incomplete. Please try again.', type: 'error' })
        return
      }

      if (user.role_name !== 'guide') {
        Alert.alert(
          'Role not supported on mobile',
          'This mobile app currently supports Park Guide only. Please use the web portal for admin or ranger access.'
        )
        return
      }

      setMessage({ text: 'Login successful. Loading your dashboard...', type: 'success' })
      await onAuthenticated({
        user_id: user.user_id,
        name: user.name || '',
        email: user.email || email.trim(),
        role_name: user.role_name,
        token,
        loginAt: new Date().toISOString(),
      })
    } catch {
      setMessage({ text: 'Unable to connect to server. Please try again.', type: 'error' })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleRegister = async () => {
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword) {
      Alert.alert('Missing fields', 'Please fill in name, email and password.')
      return
    }

    setIsRegistering(true)
    try {
      const response = await fetch(`${authBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        Alert.alert('Registration failed', data?.message || 'Unable to create account.')
        return
      }

      Alert.alert('Account created', 'Your Park Guide account is ready. Please sign in.')
      setEmail(registerEmail.trim())
      setPassword('')
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
      setActiveView('login')
      setMessage({ text: 'Account created. You can now login.', type: 'success' })
    } catch {
      Alert.alert('Connection error', 'Could not reach server. Check API URL and backend status.')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Email required', 'Please enter your email address.')
      return
    }

    setIsSendingForgot(true)
    try {
      const response = await fetch(`${authBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        Alert.alert('Request failed', data?.message || 'Unable to process request.')
        return
      }

      const tokenHint = data?.resetToken ? `\n\nReset token: ${data.resetToken}` : ''
      Alert.alert(
        'Reset initiated',
        `If this email exists, a reset token was generated.${tokenHint}\n\nUse your reset flow endpoint to set a new password.`
      )
      setForgotEmail('')
      setActiveView('login')
    } catch {
      Alert.alert('Connection error', 'Could not reach server. Check API URL and backend status.')
    } finally {
      setIsSendingForgot(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.top}>
          <Image source={require('./assets/sfc-citrus-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.kicker}>SFC Digital Park</Text>
          <Text style={styles.title}>
            {activeView === 'login' ? 'Park Guide Login' : activeView === 'register' ? 'Create Park Guide Account' : 'Forgot Password'}
          </Text>
          <Text style={styles.note}>
            Auth: {authBaseUrl}
            {isExpoWebDevServer() ? ' (web proxy → :4000 / :4001)' : ` · Data: ${getUserApiBaseUrl(authBaseUrl)}`}
          </Text>
        </View>

        {activeView === 'login' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoggingIn}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoggingIn}
            />
            <View style={styles.roleBadgeWrap}>
              <Text style={styles.roleBadge}>Role: Park Guide only</Text>
            </View>
            {message.text ? (
              <Text style={[styles.message, message.type === 'success' ? styles.messageSuccess : styles.messageError]}>
                {message.text}
              </Text>
            ) : null}
            <Pressable style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]} onPress={handleLogin} disabled={isLoggingIn}>
              <Text style={styles.loginButtonText}>{isLoggingIn ? 'Logging in...' : 'Login'}</Text>
            </Pressable>
            <View style={styles.linksRow}>
              <Pressable onPress={() => setActiveView('register')} disabled={isLoggingIn}>
                <Text style={styles.link}>Register new account</Text>
              </Pressable>
              <Pressable onPress={() => setActiveView('forgot')} disabled={isLoggingIn}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {activeView === 'register' ? (
          <>
            <TextInput style={styles.input} placeholder="Full Name" value={registerName} onChangeText={setRegisterName} editable={!isRegistering} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={registerEmail}
              onChangeText={setRegisterEmail}
              editable={!isRegistering}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={registerPassword}
              onChangeText={setRegisterPassword}
              editable={!isRegistering}
            />
            <Pressable style={[styles.loginButton, isRegistering && styles.loginButtonDisabled]} onPress={handleRegister} disabled={isRegistering}>
              <Text style={styles.loginButtonText}>{isRegistering ? 'Creating account...' : 'Create Account'}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveView('login')} disabled={isRegistering}>
              <Text style={styles.backLink}>Back to Login</Text>
            </Pressable>
          </>
        ) : null}

        {activeView === 'forgot' ? (
          <>
            <Text style={styles.helperText}>Enter your email to request a password reset token from the backend.</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              editable={!isSendingForgot}
            />
            <Pressable style={[styles.loginButton, isSendingForgot && styles.loginButtonDisabled]} onPress={handleForgotPassword} disabled={isSendingForgot}>
              <Text style={styles.loginButtonText}>{isSendingForgot ? 'Submitting...' : 'Send Reset Request'}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveView('login')} disabled={isSendingForgot}>
              <Text style={styles.backLink}>Back to Login</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
    backgroundColor: palette.cream,
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: palette.forest2,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  top: {
    marginBottom: 4,
    alignItems: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 6,
  },
  kicker: {
    color: palette.citrus,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  title: {
    color: palette.forest,
    fontWeight: '900',
    fontSize: 24,
    textAlign: 'center',
  },
  note: {
    color: palette.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    backgroundColor: palette.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: palette.charcoal,
  },
  roleBadgeWrap: {
    alignItems: 'flex-start',
  },
  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.sun,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff4d8',
    color: palette.forest,
    fontWeight: '800',
    fontSize: 12,
  },
  message: {
    fontSize: 13,
  },
  messageError: {
    color: palette.danger,
  },
  messageSuccess: {
    color: palette.success,
  },
  loginButton: {
    borderRadius: 10,
    backgroundColor: palette.citrus,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: palette.forest,
    fontWeight: '900',
  },
  linksRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  link: {
    color: palette.forest2,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  backLink: {
    marginTop: 4,
    color: palette.forest2,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  helperText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
})