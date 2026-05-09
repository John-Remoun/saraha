import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '0.9rem',
    color: isActive ? 'var(--accent)' : 'var(--muted)',
    background: isActive ? 'rgba(200,85,61,0.08)' : 'transparent',
    transition: 'var(--transition)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'var(--paper)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}>
            Saraha
          </span>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <NavLink to="/dashboard" style={({ isActive }) => navStyle(isActive)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </NavLink>
            <NavLink to="/inbox" style={({ isActive }) => navStyle(isActive)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Inbox
            </NavLink>
            <NavLink to="/sent" style={({ isActive }) => navStyle(isActive)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Sent
            </NavLink>
          </nav>

          {/* User menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink to="/profile" style={({ isActive }) => ({
              ...navStyle(isActive),
              padding: '0.35rem 0.75rem',
            })}>
              {user?.firstName}
            </NavLink>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                fontSize: '0.85rem',
                color: 'var(--muted)',
                fontWeight: 500,
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.color = 'var(--muted)'
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        color: 'var(--muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border)',
      }}>
        © {new Date().getFullYear()} Saraha — Send & receive anonymous messages
      </footer>
    </div>
  )
}
