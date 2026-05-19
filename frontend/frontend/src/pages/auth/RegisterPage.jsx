// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../../api/auth";
import { setCredentials } from "../../store/slices/authSlice";

// Common areas in Kathmandu — shown as a quick-pick list
// User can also type their own area
const KATHMANDU_AREAS = [
  "Baneshwor, Kathmandu",
  "Thamel, Kathmandu",
  "Patan, Lalitpur",
  "Bhaktapur",
  "Koteshwor, Kathmandu",
  "Lazimpat, Kathmandu",
  "Baluwatar, Kathmandu",
  "Kalanki, Kathmandu",
  "Chabahil, Kathmandu",
  "Boudha, Kathmandu",
  "Kirtipur, Kathmandu",
  "Thankot, Kathmandu",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    area: "",
    password: "",
    password2: "",    // confirm password — only used client-side, NOT sent to API
    role: "customer",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    // Clear role-related errors when switching
    setErrors((prev) => ({ ...prev, general: "" }));
  };

  const handleAreaSelect = (area) => {
    setFormData((prev) => ({ ...prev, area }));
    if (errors.area) setErrors((prev) => ({ ...prev, area: "" }));
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (!formData.full_name.trim()) {
      e.full_name = "Full name is required.";
    } else if (formData.full_name.trim().length < 3) {
      e.full_name = "Full name must be at least 3 characters.";
    }

    if (!formData.phone.trim()) {
      e.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      e.phone = "Enter a valid 10-digit phone number (e.g. 9811111111).";
    }

    if (!formData.area.trim()) {
      e.area = "Please enter or select your area.";
    }

    if (!formData.password) {
      e.password = "Password is required.";
    } else if (formData.password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }

    if (!formData.password2) {
      e.password2 = "Please confirm your password.";
    } else if (formData.password !== formData.password2) {
      e.password2 = "Passwords do not match.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Mutation ─────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      dispatch(setCredentials(data));

      if (data.user.role === "worker") {
        navigate("/worker/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    },

    onError: (error) => {
      const data = error.response?.data;

      if (data?.detail) {
        setErrors({ general: data.detail });
      } else if (data?.non_field_errors) {
        setErrors({ general: data.non_field_errors[0] });
      } else if (typeof data === "object") {
        const mapped = {};
        for (const key in data) {
          mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
        setErrors(mapped);
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    },
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Send ONLY what your API expects — do NOT send password2
    mutation.mutate({
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      area: formData.area.trim(),
      password: formData.password,
      role: formData.role,
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>🏠</div>
          <h1 style={styles.title}>Join GharChore</h1>
          <p style={styles.subtitle}>Create your account in seconds</p>
        </div>

        {/* Role Selector */}
        <div style={styles.roleSelector}>
          <button
            type="button"
            onClick={() => handleRoleSelect("customer")}
            style={{
              ...styles.roleBtn,
              ...(formData.role === "customer" ? styles.roleBtnActive : {}),
            }}
          >
            <span style={styles.roleIcon}>🧑</span>
            <span style={styles.roleLabel}>I need services</span>
            <span style={styles.roleDesc}>Book home workers</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect("worker")}
            style={{
              ...styles.roleBtn,
              ...(formData.role === "worker" ? styles.roleBtnActive : {}),
            }}
          >
            <span style={styles.roleIcon}>🔧</span>
            <span style={styles.roleLabel}>I provide services</span>
            <span style={styles.roleDesc}>Earn as a worker</span>
          </button>
        </div>

        {/* General error banner */}
        {errors.general && (
          <div style={styles.errorBanner}>⚠ {errors.general}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Full name */}
          <div style={styles.fieldGroup}>
            <label htmlFor="full_name" style={styles.label}>Full name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              autoFocus
              value={formData.full_name}
              onChange={handleChange}
              placeholder={
                formData.role === "worker"
                  ? "e.g. Hari Plumber"
                  : "e.g. Ram Sharma"
              }
              style={{
                ...styles.input,
                ...(errors.full_name ? styles.inputError : {}),
              }}
            />
            {errors.full_name && <p style={styles.fieldError}>{errors.full_name}</p>}
          </div>

          {/* Phone */}
          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>Phone number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
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
            <p style={styles.hint}>This will be your login ID</p>
          </div>

          {/* Area — text input + quick-pick chips */}
          <div style={styles.fieldGroup}>
            <label htmlFor="area" style={styles.label}>
              {formData.role === "worker" ? "Service area" : "Your area"}
            </label>
            <input
              id="area"
              name="area"
              type="text"
              value={formData.area}
              onChange={handleChange}
              placeholder="Type your area or pick below"
              style={{
                ...styles.input,
                ...(errors.area ? styles.inputError : {}),
              }}
            />
            {errors.area && <p style={styles.fieldError}>{errors.area}</p>}

            {/* Quick-pick area chips */}
            <div style={styles.areaChips}>
              {KATHMANDU_AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleAreaSelect(a)}
                  style={{
                    ...styles.chip,
                    ...(formData.area === a ? styles.chipActive : {}),
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
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
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p style={styles.fieldError}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password2" style={styles.label}>Confirm password</label>
            <div style={styles.passwordWrapper}>
              <input
                id="password2"
                name="password2"
                type={showPassword2 ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Repeat your password"
                style={{
                  ...styles.input,
                  paddingRight: "48px",
                  ...(errors.password2 ? styles.inputError : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword2((v) => !v)}
                style={styles.eyeButton}
                aria-label="Toggle confirm password visibility"
              >
                {showPassword2 ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password2 && <p style={styles.fieldError}>{errors.password2}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              ...styles.submitButton,
              opacity: mutation.isPending ? 0.7 : 1,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            {mutation.isPending
              ? "Creating account..."
              : formData.role === "worker"
              ? "Register as Worker"
              : "Create Account"}
          </button>

        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>

      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
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
    maxWidth: "480px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
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
  roleSelector: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
  },
  roleBtn: {
    flex: 1,
    padding: "14px 10px",
    border: "1.5px solid #E0D5CF",
    borderRadius: "10px",
    background: "#FFFAF7",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    transition: "all 0.2s",
  },
  roleBtnActive: {
    borderColor: "#C84B2F",
    backgroundColor: "#FFF1ED",
  },
  roleIcon: {
    fontSize: "22px",
  },
  roleLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1A0A00",
  },
  roleDesc: {
    fontSize: "11px",
    color: "#9CA3AF",
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
  hint: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#9CA3AF",
  },
  areaChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },
  chip: {
    padding: "5px 10px",
    fontSize: "12px",
    border: "1px solid #E0D5CF",
    borderRadius: "20px",
    background: "#FFFAF7",
    color: "#7A6055",
    cursor: "pointer",
  },
  chipActive: {
    borderColor: "#C84B2F",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontWeight: 600,
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
    marginTop: "4px",
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