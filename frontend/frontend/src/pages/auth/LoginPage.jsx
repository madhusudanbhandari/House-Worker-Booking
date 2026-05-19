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

  const from = location.state?.from?.pathname || null;

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Input handler ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (!formData.phone.trim()) {
      e.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      // Nepal mobile numbers are 10 digits, e.g. 9811111111
      e.phone = "Enter a valid 10-digit phone number.";
    }

    if (!formData.password) {
      e.password = "Password is required.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Mutation ─────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      dispatch(setCredentials(data));

      if (from) {
        navigate(from, { replace: true });
      } else if (data.user.role === "worker") {
        navigate("/worker/dashboard", { replace: true });
      } else if (data.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    },

    onError: (error) => {
      const data = error.response?.data;

      if (data?.detail) {
        setErrors({ general: data.detail });
      } else if (data?.non_field_errors) {
        // Django REST sometimes returns this for auth failures
        setErrors({ general: data.non_field_errors[0] });
      } else if (typeof data === "object") {
        const mapped = {};
        for (const key in data) {
          mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
        setErrors(mapped);
      } else {
        setErrors({ general: "Invalid phone number or password." });
      }
    },
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      phone: formData.phone.trim(),
      password: formData.password,
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.header}>
          <div style={styles.logoMark}>🏠</div>
          <h1 style={styles.title}>GharChore</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {errors.general && (
          <div style={styles.errorBanner}>⚠ {errors.general}</div>
        )}

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
              placeholder="9811111111"
              maxLength={10}
              style={{
                ...styles.input,
                ...(errors.phone ? styles.inputError : {}),
              }}
            />
            {errors.phone && <p style={styles.fieldError}>{errors.phone}</p>}
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

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Create one</Link>
        </p>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#FDF6F0",
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
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "8px",
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