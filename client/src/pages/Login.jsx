import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import GaneshaLogo from '../components/GaneshaLogo'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { homePathFor } from '../utils/roles'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Loading from '../components/Loading'

// Friendlier wording for the two most common login failures.
function loginErrorMessage(error) {
  const status = error.response?.status
  if (status === 401) return 'Email or password is incorrect.'
  if (status === 403) return 'Your account is currently inactive. Please contact an admin.'
  return getErrorMessage(error)
}

export default function Login() {
  const { user, loading, login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset the browser tab title (it may still show the last page after logging out).
  useEffect(() => {
    document.title = 'Login · SiddhiBoys'
  }, [])

  if (loading) return <Loading fullScreen />
  // Already logged in → go straight to the right dashboard.
  if (user && !submitting) return <Navigate to={homePathFor(user.role)} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return // never send two login requests at once
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const loggedIn = await login(email.trim(), password)
      // Go back to the page they originally wanted, if it belongs to their role.
      const home = homePathFor(loggedIn.role)
      const from = location.state?.from
      navigate(from && from.startsWith(home) ? from : home, { replace: true })
    } catch (err) {
      setError(loginErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-700 to-primary-600 text-white shadow-md shadow-primary-600/20">
            <GaneshaLogo size={28} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SiddhiBoys</h1>
          <p className="mt-1 text-sm text-slate-500">Manage our group fund effortlessly.</p>
        </div>

        <Card className="sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {sessionExpired && !error && <Alert variant="info">Your session has expired. Please log in again.</Alert>}
            {error && <Alert>{error}</Alert>}

            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" loading={submitting} loadingText="Logging in..." className="w-full">
              Login
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
