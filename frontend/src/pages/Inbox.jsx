import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import Spinner from '../components/Spinner'

export default function Inbox() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const LIMIT = 15

  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await api.get(`/message/inbox?page=${pageNum}&limit=${LIMIT}`)
      const msgs = data.data.messages
      if (append) {
        setMessages(prev => [...prev, ...msgs])
      } else {
        setMessages(msgs)
      }
      setHasMore(msgs.length === LIMIT)
    } catch {
      // silently ignore
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

  const deleteMessage = async (id) => {
    if (!confirm('Delete this message? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api.delete(`/message/${id}`)
      setMessages(prev => prev.filter(m => m._id !== id))
    } catch {
      alert('Failed to delete message.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <Spinner fullPage />

  return (
    <div className="animate-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={pageTitle}>Inbox</h1>
          <p style={pageSub}>Anonymous messages people have sent you</p>
        </div>
        <button
          onClick={() => { setLoading(true); setPage(1); fetchMessages(1, false) }}
          style={refreshBtn}
          title="Refresh"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
            No messages yet
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
            Share your anonymous link and people will be able to send you honest, private messages.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map((msg, i) => (
              <MessageCard
                key={msg._id}
                msg={msg}
                index={i}
                expanded={expandedId === msg._id}
                onExpand={() => setExpandedId(expandedId === msg._id ? null : msg._id)}
                onDelete={() => deleteMessage(msg._id)}
                deleting={deletingId === msg._id}
              />
            ))}
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

function MessageCard({ msg, index, expanded, onExpand, onDelete, deleting }) {
  const preview = msg.content
    ? msg.content.length > 120 ? msg.content.slice(0, 120) + '…' : msg.content
    : '[Attachment]'
  const isLong = msg.content && msg.content.length > 120

  return (
    <div
      style={{
        ...card,
        animationDelay: `${index * 0.04}s`,
      }}
      className="animate-up"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Anonymous badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span style={anonBadge}>
              <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
              </svg>
              Anonymous
            </span>
            <span style={timeLabel}>{formatDate(msg.createdAt)}</span>
          </div>

          {/* Message content */}
          <p style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.7, wordBreak: 'break-word' }}>
            {expanded || !isLong ? msg.content || '(no text content)' : preview}
          </p>

          {isLong && (
            <button onClick={onExpand} style={readMoreBtn}>
              {expanded ? 'Show less ↑' : 'Read more ↓'}
            </button>
          )}

          {/* Attachments */}
          {msg.attachments?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {msg.attachments.map((att, i) => (
                <a
                  key={i}
                  href={`/api${att.startsWith('/') ? '' : '/'}${att}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={attachLink}
                >
                  📎 Attachment {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={deleting}
          style={deleteBtn}
          title="Delete message"
        >
          {deleting ? (
            <div style={{ width: 14, height: 14, border: '2px solid var(--muted)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          )}
        </button>
      </div>
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
  transition: 'box-shadow 0.2s',
}
const anonBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  background: 'var(--sand)',
  color: 'var(--muted)',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  letterSpacing: '0.03em',
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
const attachLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.3rem 0.7rem',
  background: 'var(--sand)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: '0.8rem',
  color: 'var(--ink)',
  fontWeight: 500,
}
const deleteBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  cursor: 'pointer',
  padding: '0.3rem',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.15s',
  flexShrink: 0,
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
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
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
