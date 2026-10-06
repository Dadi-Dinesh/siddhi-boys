import axios from 'axios'

// Single Axios instance used by every API call in the app.
// The base URL comes from the root .env (VITE_API_URL) with fallback to '/api' for Vite dev proxy.
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
})

// ---- Token storage (localStorage). Only the JWT is stored — never the password.
const TOKEN_KEY = 'batch_fund_token'

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Storage unavailable (e.g. private mode): the session just won't survive a refresh.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // ignore
    }
  },
}

// ---- Attach "Authorization: Bearer <token>" to every request automatically.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- If the server says our token is no longer valid (401), log out everywhere.
// AuthContext registers what "log out" means via setUnauthorizedHandler().
let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === '/auth/login'
    // A 401 from the login form just means a wrong password, not an expired session.
    if (error.response?.status === 401 && !isLoginRequest && tokenStorage.get()) {
      tokenStorage.clear()
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

// Turns any API error into a short, friendly message for the UI.
// Raw Axios/server errors are never shown to the user.
export function getErrorMessage(error) {
  if (!error?.response) return 'Unable to connect to the server. Please try again.'
  const { status, data } = error.response
  if (status >= 500) return 'Something went wrong on the server. Please try again.'
  if (status === 403 && !data?.message) return 'You do not have permission to do this.'
  return data?.message || 'Something went wrong. Please try again.'
}

export default api
