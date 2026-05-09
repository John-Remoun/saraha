import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import Spinner from '../components/Spinner'

export default function Sent() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const LIMIT = 15

  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await api.get(`/message/sent?page=${pageNum}&limit=${LIMIT}`)
      const msgs = data.data.messages
      if (append) setMessages(prev => [...prev, ...msgs])
      else setMessages(msgs)
      setHasMore(msgs.length === LIMIT)
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages(1, false)
  }, [fetchMessages])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    fetchMessages(next, true)
  }

  if (loading) return <Spinner fullPage />

  return (
    <div className="animate-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={pageTitle}>Sent messages</h1>
          <p style={pageSub}>Messages you sent and the user you sent to</p>
        </div>
        <button
          onClick={() => { setLoading(true); setPage(1); fetchMessages(1, false) }}
          style={refreshBtn}
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📤</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
            No sent messages yet
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: 340, textAlign: 'center', lineHeight: 1.7 }}>
            Messages you send from the public page will appear here with recipient names.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map((msg) => {
              const name = [
                msg.receiverId?.firstName,
                msg.receiverId?.lastName,
              ].filter(Boolean).join(' ') || msg.receiverId?.username || msg.receiverId?.email || 'Unknown user'
              const preview = msg.content
                ? msg.content.length > 120 ? msg.content.slice(0, 120) + '…' : msg.content
                : '[Attachment]'
              const isLong = msg.content && msg.content.length > 120
              const expanded = expandedId === msg._id

              return (
                <div key={msg._id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={toBadge}>To: {name}</span>
                    <span style={timeLabel}>{formatDate(msg.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.7, wordBreak: 'break-word' }}>
                    {expanded || !isLong ? msg.content || '(no text content)' : preview}
                  </p>
                  {isLong && (
                    <button onClick={() => setExpandedId(expanded ? null : msg._id)} style={readMoreBtn}>
                      {expanded ? 'Show less ↑' : 'Read more ↓'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button onClick={loadMore} disabled={loadingMore} style={loadMoreBtn}>
                {loadingMore ? 'Loading…' : 'Load more messages'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function formatDate(str) {
  const d = new Date(str)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

const pageTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.8rem',
  fontWeight: 700,
  color: 'var(--ink)',
  letterSpacing: '-0.02em',
}
const pageSub = { fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.2rem' }
const card = {
  background: 'var(--paper)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '1.25rem 1.5rem',
  boxShadow: 'var(--shadow)',
}
const toBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'var(--sand)',
  color: 'var(--ink)',
  fontSize: '0.78rem',
  fontWeight: 600,
  padding: '0.25rem 0.65rem',
  borderRadius: '999px',
}
const timeLabel = { fontSize: '0.78rem', color: 'var(--muted)' }
const readMoreBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: '0.4rem',
  padding: 0,
}
const emptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4rem 2rem',
  background: 'var(--paper)',
  border: '1px dashed var(--border)',
  borderRadius: 16,
}
const refreshBtn = {
  padding: '0.5rem 1rem',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  background: 'none',
  color: 'var(--muted)',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
}
const loadMoreBtn = {
  padding: '0.65rem 1.75rem',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
}
