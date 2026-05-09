import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function ConfirmEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: location.state?.email || '', otp: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [devOtpHint, setDevOtpHint] = useState(location.state?.devOtp || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.patch('/auth/confirm-email', { email: form.email, otp: form.otp })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendMsg('')
    setResending(true)
    try {
      const { data } = await api.patch('/auth/resend-confirm-email', { email: form.email })
      const devOtp = data?.data?.otpMeta?.devOtp
      setDevOtpHint(devOtp || '')
      setResendMsg(devOtp ? 'Email delivery failed in development. Use the code shown below.' : 'A new OTP has been sent to your email.')
    } catch (err) {
      setResendMsg(err.response?.data?.errorMessage || 'Could not resend OTP.')
    } finally {
      setResending(false)
    }
  }

  if (success) {
    return (
      <div style={page}>
        <div style={bg} />
        <div style={{ ...card, textAlign: 'center' }} className="animate-up">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={logo}>Email confirmed!</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>
            Redirecting you to sign in…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={bg} />
      <div style={card} className="animate-up">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={logo}>Confirm your email</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
            Enter the 6-digit code we sent to your inbox
          </p>
        </div>

        <form onSubmit={handleSubmit} style={formBox}>
          {error && <div style={alert}>{error}</div>}
          {devOtpHint && (
            <div style={devOtpBox}>
              Development OTP: <strong>{devOtpHint}</strong>
            </div>
          )}
          {resendMsg && (
            <div style={{
              ...alert,
              background: 'rgba(200,153,61,0.08)',
              border: '1px solid rgba(200,153,61,0.3)',
              color: 'var(--gold)',
            }}>
              {resendMsg}
            </div>
          )}

          <label style={labelSt}>
            Email address
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              style={inputSt}
              required
              autoFocus
            />
          </label>

          <label style={labelSt}>
            OTP Code
            <input
              type="text"
              maxLength={6}
              value={form.otp}
              onChange={e => setForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
              placeholder="123456"
              style={{ ...inputSt, letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }}
              required
            />
          </label>

          <button type="submit" disabled={loading} style={btn}>
            {loading ? 'Verifying…' : 'Confirm email'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !form.email}
              style={{ color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
            <Link to="/login" style={{ color: 'var(--muted)' }}>Back to sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const page = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '2rem', position: 'relative',
  overflow: 'hidden', background: 'var(--cream)',
}
const bg = {
  position: 'absolute', inset: 0,
  background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(200,153,61,0.10) 0%, transparent 70%)',
  pointerEvents: 'none',
}
const card = { width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }
const logo = {
  fontFamily: 'var(--font-display)', fontSize: '1.8rem',
  fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em',
}
const formBox = {
  background: 'var(--paper)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '2rem', display: 'flex',
  flexDirection: 'column', gap: '1.2rem', boxShadow: 'var(--shadow-lg)',
}
const alert = {
  background: 'rgba(200,85,61,0.08)', border: '1px solid rgba(200,85,61,0.25)',
  color: 'var(--accent)', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem',
}
const labelSt = {
  display: 'flex', flexDirection: 'column', gap: '0.4rem',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)',
}
const inputSt = {
  padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)',
  borderRadius: 8, fontSize: '0.95rem', background: 'var(--cream)',
  color: 'var(--ink)', outline: 'none',
}
const btn = {
  padding: '0.75rem', background: 'var(--accent)', color: 'white',
  border: 'none', borderRadius: 8, fontSize: '0.95rem',
  fontWeight: 600, cursor: 'pointer',
}
const devOtpBox = {
  background: 'rgba(61,167,114,0.10)',
  border: '1px solid rgba(61,167,114,0.35)',
  color: '#2f7f57',
  padding: '0.75rem 1rem',
  borderRadius: 8,
  fontSize: '0.9rem',
}
