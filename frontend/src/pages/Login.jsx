import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleAuthButton from '../components/GoogleAuthButton'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (idToken) => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle(idToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Decorative background */}
      <div style={styles.bg} />

      <div style={styles.card} className="animate-up">
        <div style={styles.brand}>
          <h1 style={styles.logo}>Saraha</h1>
          <p style={styles.tagline}>Receive honest, anonymous messages</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.heading}>Welcome back</h2>

          {error && <div style={styles.alert}>{error}</div>}

          <label style={styles.label}>
            Email address
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              style={styles.input}
              required
              autoFocus
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </label>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div style={styles.divider}>or</div>
          <GoogleAuthButton text="signin_with" onCredential={handleGoogleLogin} disabled={loading} />

          <p style={styles.footer}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>Create one</Link>
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
      radial-gradient(ellipse 60% 50% at 20% 20%, rgba(200,153,61,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 60% 60% at 80% 80%, rgba(200,85,61,0.10) 0%, transparent 70%)
    `,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    zIndex: 1,
  },
  brand: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.4rem',
    fontWeight: 700,
    color: 'var(--ink)',
    letterSpacing: '-0.03em',
    marginBottom: '0.25rem',
  },
  tagline: {
    fontSize: '0.9rem',
    color: 'var(--muted)',
  },
  form: {
    background: 'var(--paper)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
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
    gap: '0.4rem',
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
    transition: 'border-color 0.2s',
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
    transition: 'opacity 0.2s',
    marginTop: '0.25rem',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--muted)',
  },
  link: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  divider: {
    textAlign: 'center',
    color: 'var(--muted)',
    fontSize: '0.82rem',
    margin: '0.1rem 0',
  },
}
