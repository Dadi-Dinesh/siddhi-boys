import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { homePathFor } from '../utils/roles'
import Loading from '../components/Loading'
import ConnectionError from '../components/ConnectionError'

// Wrap routes that need a logged-in user, optionally of a specific role.
//   <ProtectedRoute requiredRole="ADMIN"> ... </ProtectedRoute>
// This is for navigation only — the backend still checks every request.
export default function ProtectedRoute({ requiredRole, children }) {
  const { user, loading, connectionError, loggedOut } = useAuth()
  const location = useLocation()

  if (loading) return <Loading fullScreen />
  if (connectionError) return <ConnectionError />

  if (!user) {
    // Remember where they were going (deep link or expired session), so we can send them
    // back after login. Not after a deliberate logout: then they start at their dashboard.
    return <Navigate to="/login" replace state={loggedOut ? undefined : { from: location.pathname }} />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  return children || <Outlet />
}
