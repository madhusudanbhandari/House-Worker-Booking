// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../../api/auth";
import { setCredentials } from "../../store/slices/authSlice";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Where to redirect after login — default based on role
  // If user was trying to visit a protected page, send them back there
  const from = location.state?.from?.pathname || null;

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({}); // field-level validation errors
  const [showPassword, setShowPassword] = useState(false);

  // ── Input handler ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true = valid
  };

  // ── React Query mutation ─────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      // data = { access, refresh, user: { id, email, role, first_name, ... } }
      dispatch(setCredentials(data)); // Save to Redux + localStorage

      // Redirect based on role
      if (from) {
        navigate(from, { replace: true }); // Go back to where they came from
      } else if (data.user.role === "worker") {
        navigate("/worker/dashboard", { replace: true });
      } else if (data.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true }); // customer
      }
    },

    onError: (error) => {
      // error.response.data contains Django's error response
      // Django typically returns: { detail: "No active account found..." }
      // or field errors: { email: ["..."], password: ["..."] }
      const data = error.response?.data;

      if (data?.detail) {
        // Non-field error (wrong credentials)
        setErrors({ general: data.detail });
      } else if (typeof data === "object") {
        // Field-level errors from Django serializer
        const mapped = {};
        for (const key in data) {
          mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
        setErrors(mapped);
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    },
  });

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return; // Stop if client-side validation fails
    mutation.mutate(formData); // Fire the API call
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo + heading */}
        <div style={styles.header}>
          <div style={styles.logoMark}>🏠</div>
          <h1 style={styles.title}>GharChore</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* General error banner (wrong credentials etc.) */}
        {errors.general && (
          <div style={styles.errorBanner}>
            ⚠ {errors.general}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Phone field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>Phone number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              autoFocus
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              style={{
                ...styles.input,
                ...(errors.phone ? styles.inputError : {}),
              }}
            />
            {errors.email && <p style={styles.fieldError}>{errors.email}</p>}
          </div>

          {/* Password field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                style={{
                  ...styles.input,
                  paddingRight: "48px",
                  ...(errors.password ? styles.inputError : {}),
                }}
              />
              {/* Show/hide password toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p style={styles.fieldError}>{errors.password}</p>}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              ...styles.submitButton,
              opacity: mutation.isPending ? 0.7 : 1,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </button>

        </form>

        {/* Register link */}
        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
// Plain JS object styles — no extra libraries needed
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#FDF6F0", // warm off-white
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoMark: {
    fontSize: "40px",
    marginBottom: "8px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#7A6055",
    margin: 0,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    color: "#B91C1C",
    fontSize: "14px",
    padding: "12px 16px",
    marginBottom: "20px",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#3D2B1F",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    fontSize: "15px",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#FFFAF7",
    color: "#1A0A00",
    transition: "border-color 0.2s",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF7F7",
  },
  fieldError: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#DC2626",
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
  },
  submitButton: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#C84B2F", // GharChore brand red-orange
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background-color 0.2s",
  },
  footer: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "14px",
    color: "#7A6055",
  },
  link: {
    color: "#C84B2F",
    textDecoration: "none",
    fontWeight: 600,
  },
};