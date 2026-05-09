
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

const MAX_CHARS = 1000

// حط البورت الصحيح بتاع الـ backend
const BASE_URL = 'http://localhost:3000'

const toImageUrl = (value) => {
  if (!value) return ''

  // لو الرابط كامل بالفعل
  if (value.startsWith('http')) {
    return value
  }

  // إزالة ../ من البداية
  value = value.replace(/\.\.\//g, '/')

  // التأكد من وجود /
  if (!value.startsWith('/')) {
    value = '/' + value
  }

  return `${BASE_URL}${value}`
}

export default function SendMessage() {
  const { userId } = useParams()

  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    api.get(`/user/${userId}/share-profile`)
      .then((r) => {
        console.log('PROFILE:', r.data.data.account)
        console.log('IMAGE:', r.data.data.account.profilePicture)
        console.log(
          'FINAL URL:',
          toImageUrl(r.data.data.account.profilePicture)
        )

        setProfile(r.data.data.account)
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!userId || !content.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const formData = new FormData()

      formData.append('content', content.trim())

      await api.post(`/message/${userId}`, formData)

      setStatus('success')
      setContent('')
    } catch (err) {
      setStatus('error')

      setErrorMsg(
        err.response?.data?.errorMessage ||
        'Failed to send message. Please try again.'
      )
    }
  }

  if (profileLoading) {
    return (
      <div style={page}>
        <div style={bg} />

        <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
          <div style={spinnerStyle} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={page}>
        <div style={bg} />

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🔍
          </div>

          <h2 style={displayName}>
            Profile not found
          </h2>

          <p
            style={{
              color: 'var(--muted)',
              marginTop: '0.5rem',
            }}
          >
            This user may not exist or their account isn't active.
          </p>

          <Link
            to="/register"
            style={{
              ...sendBtn,
              marginTop: '1.5rem',
              display: 'inline-block',
              textDecoration: 'none',
            }}
          >
            Create your own inbox
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={page}>
        <div style={bg} />

        <div
          style={{ ...card, textAlign: 'center' }}
          className="animate-up"
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            🎉
          </div>

          <h2 style={displayName}>
            Message sent!
          </h2>

          <p
            style={{
              color: 'var(--muted)',
              marginTop: '0.5rem',
              marginBottom: '1.5rem',
              lineHeight: 1.7,
            }}
          >
            Your anonymous message has been delivered to{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {profile.firstName}
            </strong>.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setStatus('idle')}
              style={sendBtn}
            >
              Send another
            </button>

            <Link
              to="/register"
              style={{
                ...sendBtn,
                background: 'var(--paper)',
                color: 'var(--ink)',
                border: '1.5px solid var(--border)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Create your own inbox
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={bg} />

      <div style={card} className="animate-up">

        {/* Profile Header */}
        <div style={profileHeader}>

          <div style={avatar}>
            {profile.profilePicture ? (
              <img
                src={toImageUrl(profile.profilePicture)}
                alt={profile.firstName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  console.log('IMAGE FAILED:', e.target.src)
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                {profile.firstName?.[0]}
                {profile.lastName?.[0]}
              </span>
            )}
          </div>

          <div>
            <h2 style={displayName}>
              {profile.firstName} {profile.lastName}
            </h2>

            <p style={displaySub}>
              Send an anonymous message
            </p>
          </div>
        </div>

        {/* Branding */}
        <div style={brandStrip}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--accent)',
            }}
          >
            Saraha
          </span>

          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--muted)',
            }}
          >
            100% anonymous · Your identity is never revealed
          </span>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {status === 'error' && (
            <div style={alertStyle}>
              {errorMsg}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <textarea
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value.slice(0, MAX_CHARS)
                )
              }
              placeholder={`Write an honest message to ${profile.firstName}… it's completely anonymous`}
              style={textarea}
              rows={6}
              required
              autoFocus
            />

            <span style={charCount}>
              {content.length} / {MAX_CHARS}
            </span>
          </div>

          <button
            type="submit"
            disabled={
              status === 'loading' ||
              !content.trim()
            }
            style={{
              ...sendBtn,
              opacity: !content.trim() ? 0.6 : 1,
              cursor: !content.trim()
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            {status === 'loading'
              ? 'Sending...'
              : 'Send anonymously'}
          </button>
        </form>
      </div>
    </div>
  )
}

const page = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--cream)',
}

const bg = {
  position: 'absolute',
  inset: 0,
  background: `
    radial-gradient(ellipse 80% 60% at 30% 20%, rgba(200,85,61,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 70% 80%, rgba(200,153,61,0.08) 0%, transparent 70%)
  `,
  pointerEvents: 'none',
}

const card = {
  width: '100%',
  maxWidth: 480,
  background: 'var(--paper)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '2rem',
  boxShadow: 'var(--shadow-lg)',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
}

const profileHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
}

const avatar = {
  width: 60,
  height: 60,
  borderRadius: '50%',
  background:
    'linear-gradient(135deg, var(--ink), #2d2d4e)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
}

const displayName = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.3rem',
  fontWeight: 700,
  color: 'var(--ink)',
  letterSpacing: '-0.01em',
}

const displaySub = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginTop: '0.15rem',
}

const brandStrip = {
  background: 'var(--cream)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '0.6rem 1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const textarea = {
  width: '100%',
  padding: '1rem',
  border: '1.5px solid var(--border)',
  borderRadius: 12,
  fontSize: '0.95rem',
  lineHeight: 1.7,
  background: 'var(--cream)',
  color: 'var(--ink)',
  resize: 'vertical',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
}

const charCount = {
  position: 'absolute',
  bottom: '0.5rem',
  right: '0.75rem',
  fontSize: '0.75rem',
  color: 'var(--muted)',
}

const sendBtn = {
  width: '100%',
  padding: '0.85rem',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
}

const alertStyle = {
  background: 'rgba(200,85,61,0.08)',
  border: '1px solid rgba(200,85,61,0.25)',
  color: 'var(--accent)',
  padding: '0.75rem 1rem',
  borderRadius: 8,
  fontSize: '0.875rem',
}

const spinnerStyle = {
  width: 32,
  height: 32,
  border: '3px solid var(--sand)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  display: 'inline-block',
}
