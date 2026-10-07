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
// The backend only ever sends safe { success: false, message } texts (unexpected errors are
// already replaced by a generic message on the server), so its message is shown when present.
export function getErrorMessage(error) {
  if (!error?.response) return 'Unable to connect to the server. Please try again.'
  const { status, data } = error.response
  const message = typeof data?.message === 'string' && data.message.trim() ? data.message : null
  if (message) return message
  if (status === 401) return 'Please log in to continue.'
  if (status === 403) return 'You do not have permission to do this.'
  if (status === 404) return 'The requested item was not found.'
  if (status === 409) return 'This conflicts with an existing record.'
  if (status === 400 || status === 422) return 'Please check the details and try again.'
  if (status >= 500) return 'Something went wrong on the server. Please try again.'
  return 'Something went wrong. Please try again.'
}

export default api
