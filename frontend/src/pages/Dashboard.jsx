import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ inbox: 0, sent: 0 })
  const [copied, setCopied] = useState(false)

  const profileLink = `${window.location.origin}/send/${user?._id}`

  useEffect(() => {
    Promise.all([
      api.get('/message/inbox?limit=1'),
      api.get('/message/sent?limit=1'),
    ]).then(([inboxRes, sentRes]) => {
      setStats({
        inbox: inboxRes.data.data.messages.length,
        sent: sentRes.data.data.messages.length,
      })
    }).catch(() => {})
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-up">
      {/* Welcome banner */}
      <div style={banner}>
        <div>
          <h1 style={bannerTitle}>
            Good {getGreeting()}, <span style={{ fontStyle: 'italic' }}>{user?.firstName}</span>
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Share your link and start receiving honest, anonymous messages.
          </p>
        </div>
      </div>

      {/* Share link card */}
      <section style={section}>
        <h2 style={sectionTitle}>Your anonymous link</h2>
        <p style={sectionSub}>Share this link so people can send you messages without revealing their identity.</p>
        <div style={linkBox}>
          <span style={linkText}>{profileLink}</span>
          <button onClick={copyLink} style={copyBtn}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>
      </section>

      {/* Stats row */}
      <div style={statsRow}>
        {[
          { label: 'Messages received', value: stats.inbox, href: '/inbox', icon: '✉️' },
          { label: 'Messages sent', value: stats.sent, href: '/sent', icon: '📤' },
        ].map((s, i) => (
          <button
            key={i}
            type="button"
            style={{ ...statCard, cursor: s.href ? 'pointer' : 'default' }}
            onClick={() => s.href && navigate(s.href)}
            disabled={!s.href}
          >
            <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const banner = {
  background: 'linear-gradient(135deg, var(--ink) 0%, #2d2d4e 100%)',
  borderRadius: 16,
  padding: '2rem 2rem',
  color: 'white',
}
const bannerTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.8rem',
  fontWeight: 700,
  color: 'white',
  letterSpacing: '-0.02em',
}
const section = {
  background: 'var(--paper)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '1.5rem',
  boxShadow: 'var(--shadow)',
}
const sectionTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '0.25rem',
}
const sectionSub = {
  fontSize: '0.875rem',
  color: 'var(--muted)',
  marginBottom: '1rem',
}
const linkBox = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'var(--cream)',
  border: '1.5px solid var(--border)',
  borderRadius: 10,
  padding: '0.65rem 1rem',
  flexWrap: 'wrap',
}
const linkText = {
  flex: 1,
  fontSize: '0.85rem',
  color: 'var(--muted)',
  wordBreak: 'break-all',
  fontFamily: 'monospace',
}
const copyBtn = {
  padding: '0.45rem 1rem',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: 7,
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const statsRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
}
const statCard = {
  background: 'var(--paper)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '1.25rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  boxShadow: 'var(--shadow)',
}
