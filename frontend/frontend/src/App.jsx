import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsLoggedIn, selectUserRole } from './store/slices/authSlice'
import { ProtectedRoute, RoleRoute } from './utils/ProtectedRoute'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import SearchWorkers     from './pages/customer/SearchWorkers'
import WorkerDetail      from './pages/customer/WorkerDetail'
import MyBookings        from './pages/customer/MyBookings'
import BookingDetail     from './pages/customer/BookingDetail'

// Worker pages
import WorkerDashboard  from './pages/worker/WorkerDashboard'
import WorkerBookings   from './pages/worker/WorkerBookings'
import ManageServices   from './pages/worker/ManageServices'

// Shared pages
import HomePage    from './pages/shared/HomePage'
import ProfilePage from './pages/shared/ProfilePage'
import NotFound    from './pages/shared/NotFound'

function App() {
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const role       = useSelector(selectUserRole)

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"         element={<HomePage />} />
      <Route path="/login"    element={
        isLoggedIn
          ? <Navigate to={`/${role}/dashboard`} replace />
          : <LoginPage />
      } />
      <Route path="/register" element={
        isLoggedIn
          ? <Navigate to={`/${role}/dashboard`} replace />
          : <RegisterPage />
      } />

      {/* Customer routes */}
      <Route path="/customer/dashboard" element={
        <RoleRoute role="customer"><CustomerDashboard /></RoleRoute>
      } />
      <Route path="/customer/search" element={
        <RoleRoute role="customer"><SearchWorkers /></RoleRoute>
      } />
      <Route path="/customer/workers/:id" element={
        <RoleRoute role="customer"><WorkerDetail /></RoleRoute>
      } />
      <Route path="/customer/bookings" element={
        <RoleRoute role="customer"><MyBookings /></RoleRoute>
      } />
      <Route path="/customer/bookings/:id" element={
        <RoleRoute role="customer"><BookingDetail /></RoleRoute>
      } />

      {/* Worker routes */}
      <Route path="/worker/dashboard" element={
        <RoleRoute role="worker"><WorkerDashboard /></RoleRoute>
      } />
      <Route path="/worker/bookings" element={
        <RoleRoute role="worker"><WorkerBookings /></RoleRoute>
      } />
      <Route path="/worker/services" element={
        <RoleRoute role="worker"><ManageServices /></RoleRoute>
      } />

      {/* Shared protected routes */}
      <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App