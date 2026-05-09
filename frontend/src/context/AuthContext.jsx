import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/user')
      setUser(data.data.account)
    } catch {
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [fetchProfile])

  const storeTokensAndLoadProfile = useCallback(async (payload) => {
    const tokenSource = payload?.data?.account || payload?.data || payload
    const accessToken = tokenSource?.access_token
    const refreshToken = tokenSource?.refresh_token

    if (!accessToken || !refreshToken) {
      throw new Error('Invalid authentication response from server')
    }

    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    await fetchProfile()
  }, [fetchProfile])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await storeTokensAndLoadProfile(data)
    return data
  }

  const loginWithGoogle = async (idToken) => {
    const { data } = await api.post('/auth/login/gmail', { idToken })
    await storeTokensAndLoadProfile(data)
    return data
  }

  const signupWithGoogle = async (idToken) => {
    const { data } = await api.post('/auth/signup/gmail', { idToken })
    await storeTokensAndLoadProfile(data)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/user/logout', { flag: 1 })
    } catch {}
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/signup', payload)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, fetchProfile, loginWithGoogle, signupWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
