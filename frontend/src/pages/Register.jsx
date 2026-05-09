import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleAuthButton from '../components/GoogleAuthButton'

const getRegisterErrorMessage = (err) => {
  const status = err?.response?.status
  const apiMessage =
    err?.response?.data?.extra?.[0]?.details?.[0]?.message ||
    err?.response?.data?.errorMessage ||
    err?.response?.data?.message ||
    ''

  if (status === 409 || /already exists/i.test(apiMessage)) {
    return 'This email is already registered. Please sign in instead.'
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'Server is temporarily unavailable. Please try again in a moment.'
  }

  if (/email service authentication failed|gmail app password|badcredentials|username and password not accepted|invalid login/i.test(apiMessage)) {
    return 'Email service is not configured correctly on the server. Please contact support or try again later.'
  }

  return apiMessage || err?.message || 'Registration failed. Please try again.'
}

export default function Register() {
  const { register, signupWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }
    setLoading(true)
    try {
      const result = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone,
      })
      const devOtp = result?.data?.otpMeta?.devOtp
      navigate('/confirm-email', {
        state: {
          email: form.email,
          devOtp,
        },
      })
    } catch (err) {
      setError(getRegisterErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async (idToken) => {
    setError('')
    setLoading(true)
    try {
      await signupWithGoogle(idToken)
      navigate('/dashboard')
    } catch (err) {
      setError(getRegisterErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card} className="animate-up">
        <div style={styles.brand}>
          <h1 style={styles.logo}>Saraha</h1>
          <p style={styles.tagline}>Create your anonymous inbox</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.heading}>Create account</h2>

          {error && <div style={styles.alert}>{error}</div>}

          <label style={styles.label}>
            Full name
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="John Smith"
              style={styles.input}
              required
              autoFocus
            />
            <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>First and last name, each capitalised</small>
          </label>

          <label style={styles.label}>
            Email address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Phone number
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 chars, upper, lower, symbol"
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Confirm password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              style={styles.input}
              required
            />
          </label>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <div style={styles.divider}>or</div>
          <GoogleAuthButton text="signup_with" onCredential={handleGoogleSignup} disabled={loading} />

          <p style={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--cream)',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(ellipse 60% 50% at 80% 10%, rgba(200,153,61,0.10) 0%, transparent 70%),
      radial-gradient(ellipse 60% 60% at 10% 90%, rgba(200,85,61,0.08) 0%, transparent 70%)
    `,
    pointerEvents: 'none',
  },
  card: { width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 },
  brand: { textAlign: 'center', marginBottom: '2rem' },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 700,
    color: 'var(--ink)',
    letterSpacing: '-0.03em',
  },
  tagline: { fontSize: '0.9rem', color: 'var(--muted)' },
  form: {
    background: 'var(--paper)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
    boxShadow: 'var(--shadow-lg)',
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--ink)',
    fontFamily: 'var(--font-display)',
  },
  alert: {
    background: 'rgba(200,85,61,0.08)',
    border: '1px solid rgba(200,85,61,0.25)',
    color: 'var(--accent)',
    padding: '0.75rem 1rem',
    borderRadius: 8,
    fontSize: '0.875rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--ink)',
  },
  input: {
    padding: '0.65rem 0.9rem',
    border: '1.5px solid var(--border)',
    borderRadius: 8,
    fontSize: '0.95rem',
    background: 'var(--cream)',
    color: 'var(--ink)',
    outline: 'none',
  },
  btn: {
    padding: '0.75rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
  footer: { textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)' },
  link: { color: 'var(--accent)', fontWeight: 600 },
  divider: {
    textAlign: 'center',
    color: 'var(--muted)',
    fontSize: '0.82rem',
    margin: '0.1rem 0',
  },
}
