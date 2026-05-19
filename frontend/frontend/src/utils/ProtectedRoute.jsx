// src/utils/ProtectedRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { selectIsAuthenticated, selectCurrentUser } from "../store/slices/authSlice";

// allowedRoles: array like ["customer"] or ["worker"] or ["customer", "worker"]
// If not passed, any logged-in user can access.
export default function ProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Not logged in — redirect to login, remember where they were going
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role — redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === "worker") return <Navigate to="/worker/dashboard" replace />;
    if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}