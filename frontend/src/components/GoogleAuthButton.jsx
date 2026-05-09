import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_ID = 'google-identity-services-script'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function GoogleAuthButton({ text = 'signin_with', onCredential, disabled = false }) {
  const btnRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const invalidClientId =
      !GOOGLE_CLIENT_ID ||
      /your-google-client-id/i.test(GOOGLE_CLIENT_ID)

    if (invalidClientId) {
      setError('Google sign-in is not configured. Set a real VITE_GOOGLE_CLIENT_ID in frontend .env.')
      return
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) onCredential(response.credential)
        },
        auto_select: false,
      })
      btnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        width: 320,
      })
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
      return
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID)
    if (!script) {
      script = document.createElement('script')
      script.id = GOOGLE_SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', renderGoogleButton)
    script.addEventListener('error', () => setError('Failed to load Google Sign-In script.'))

    return () => {
      script?.removeEventListener('load', renderGoogleButton)
    }
  }, [onCredential, text])

  return (
    <div style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {error ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{error}</div>
      ) : (
        <div ref={btnRef} />
      )}
    </div>
  )
}
