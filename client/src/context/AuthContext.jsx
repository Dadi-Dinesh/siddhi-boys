import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setUnauthorizedHandler, tokenStorage } from '../services/api'
import { AuthContext } from '../hooks/useAuth'

// Asks the server who the saved token belongs to.
// Returns { user } on success, { invalidToken } if the token was rejected (401),
// or { connectionError } if the server couldn't be reached or failed (token is kept for a retry).
async function fetchCurrentUser() {
  try {
    const { data } = await api.get('/auth/me')
    return { user: data.data }
  } catch (error) {
    return error.response?.status === 401 ? { invalidToken: true } : { connectionError: true }
  }
}

// Holds who is logged in and provides login() / logout() to the whole app.
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => tokenStorage.get())
  const [user, setUser] = useState(null)
  // True until we've checked any saved token with the server, so the
  // login page never flashes for someone who is already logged in.
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()))
  const [connectionError, setConnectionError] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  // true right after the user clicks Logout, so the login page doesn't send them
  // back to the page they were on (that only makes sense for deep links / expired sessions)
  const [loggedOut, setLoggedOut] = useState(false)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  // Called by the API layer whenever the server rejects our token (401).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setSessionExpired(true)
    })
  }, [clearSession])

  // Puts the result of fetchCurrentUser() into state.
  const applySession = useCallback(
    (result) => {
      if (result.user) setUser(result.user)
      if (result.invalidToken) clearSession() // the API interceptor already removed the token
      setConnectionError(Boolean(result.connectionError))
      setLoading(false)
    },
    [clearSession],
  )

  // On app start: if a token was saved, ask the server who we are.
  useEffect(() => {
    if (tokenStorage.get()) fetchCurrentUser().then(applySession)
  }, [applySession])

  // "Try again" button on the connection-error screen.
  const retry = useCallback(() => {
    setLoading(true)
    setConnectionError(false)
    fetchCurrentUser().then(applySession)
  }, [applySession])

  // Throws on failure so the login form can show the error.
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    tokenStorage.set(data.data.token)
    setToken(data.data.token)
    // Ask the server who we are. The role always comes from the backend.
    const me = await api.get('/auth/me')
    setUser(me.data.data)
    setSessionExpired(false)
    setLoggedOut(false)
    return me.data.data
  }, [])

  // JWTs can't be "logged out" on the server in V1, so we simply forget the token.
  const logout = useCallback(() => {
    setLoggedOut(true)
    clearSession()
    setSessionExpired(false)
    navigate('/login', { replace: true })
  }, [clearSession, navigate])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      connectionError,
      sessionExpired,
      loggedOut,
      login,
      logout,
      retry,
    }),
    [user, token, loading, connectionError, sessionExpired, loggedOut, login, logout, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
