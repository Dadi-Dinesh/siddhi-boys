import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { homePathFor } from './utils/roles'
import ProtectedRoute from './routes/ProtectedRoute'
import Loading from './components/Loading'
import AdminLayout from './layouts/AdminLayout'
import MemberLayout from './layouts/MemberLayout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import Contributions from './pages/admin/Contributions'
import Expenses from './pages/admin/Expenses'
import Members from './pages/admin/Members'
import Transactions from './pages/admin/Transactions'
import Settings from './pages/admin/Settings'
import Reports from './pages/admin/Reports'
import PaymentVerifications from './pages/admin/PaymentVerifications'
import MemberDashboard from './pages/member/MemberDashboard'
import GroupActivity from './pages/member/GroupActivity'

// "/" sends people to their dashboard, or to login.
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Loading fullScreen />
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Admin area */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="contributions" element={<Contributions />} />
            <Route path="payment-verifications" element={<PaymentVerifications />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="members" element={<Members />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Member area */}
          <Route
            path="/member"
            element={
              <ProtectedRoute requiredRole="MEMBER">
                <MemberLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MemberDashboard />} />
            <Route path="group-activity" element={<GroupActivity />} />
            <Route path="transactions" element={<Navigate to="/member/group-activity" replace />} />
            <Route path="*" element={<Navigate to="/member" replace />} />
          </Route>

          {/* Anything else */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
