import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsLoggedIn, selectUserRole } from '../store/slices/authSlice'

// Protects routes that require login
export function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector(selectIsLoggedIn)
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
    // replace = don't add /login to browser history
  }
  return children
}

// Protects routes that require a specific role
export function RoleRoute({ children, role }) {
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const userRole   = useSelector(selectUserRole)

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (userRole !== role) {
    // Wrong role — redirect to their own dashboard
    return <Navigate to={`/${userRole}/dashboard`} replace />
  }

  return children
}