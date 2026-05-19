// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Customer pages
import CustomerDashboard from "./pages/customer/Dashboard";
// import MyBookings from "./pages/customer/MyBookings";         // Step 14
// import BookingDetail from "./pages/customer/BookingDetail";   // Step 15
// import SearchWorkers from "./pages/customer/SearchWorkers";   // Step 16
// import WorkerDetail from "./pages/customer/WorkerDetail";     // Step 17

// // Worker pages
// import WorkerDashboard from "./pages/worker/WorkerDashboard"; // Step 18
// import WorkerBookings from "./pages/worker/WorkerBookings";   // Step 19
// import ManageServices from "./pages/worker/ManageServices";   // Step 20

// // Shared pages
// import ProfilePage from "./pages/shared/ProfilePage";         // Step 21
// import NotFound from "./pages/shared/NotFound";

export default function App() {
  return (
    <Routes>

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Customer routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <BookingDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search-workers"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <SearchWorkers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workers/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <WorkerDetail />
          </ProtectedRoute>
        }
      />

      {/* Worker routes */}
      {/* <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/bookings"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/services"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <ManageServices />
          </ProtectedRoute>
        }
      />

      {/* Shared routes */}
      {/* <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      {/* <Route path="*" element={<NotFound />} />   */}

    </Routes>
  );
}