// src/pages/shared/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProfile, updateProfile, logoutUser } from "../../api/auth";
import {
  selectCurrentUser,
  setCredentials,
  clearCredentials,
} from "../../store/slices/authSlice";

// Common Kathmandu areas
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
];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NP", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxUser = useSelector(selectCurrentUser);

  // ── Fetch latest profile from API ─────────────────────────────────────────
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  // ── Edit form state ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    area: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Pre-fill form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        area: profile.area || "",
      });
    }
  }, [profile]);

  // ── Update mutation ───────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: updateProfile,

    onSuccess: (data) => {
      // data = { message, user }
      // Update Redux + localStorage with new user info
      // Keep existing tokens — only user data changes
      dispatch(
        setCredentials({
          user: data.user,
          access: localStorage.getItem("accessToken"),
          refresh: localStorage.getItem("refreshToken"),
        })
      );

      setIsEditing(false);
      setUpdateSuccess(true);
      setFormErrors({});

      // Hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    },

    onError: (error) => {
      const data = error.response?.data;
      if (data?.detail) {
        setFormErrors({ general: data.detail });
      } else if (typeof data === "object") {
        const mapped = {};
        for (const key in data) {
          mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
        setFormErrors(mapped);
      } else {
        setFormErrors({ general: "Failed to update profile. Please try again." });
      }
    },
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logoutUser(localStorage.getItem("refreshToken"));
    } catch {
      // silent
    } finally {
      dispatch(clearCredentials());
      navigate("/login", { replace: true });
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAreaSelect = (area) => {
    setFormData((prev) => ({ ...prev, area }));
    if (formErrors.area) {
      setFormErrors((prev) => ({ ...prev, area: "" }));
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.full_name.trim()) {
      e.full_name = "Full name is required.";
    } else if (formData.full_name.trim().length < 3) {
      e.full_name = "Full name must be at least 3 characters.";
    }
    if (!formData.area.trim()) {
      e.area = "Area is required.";
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    updateMutation.mutate({
      full_name: formData.full_name.trim(),
      area: formData.area.trim(),
    });
  };

  const handleCancelEdit = () => {
    // Reset form to current profile values
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        area: profile.area || "",
      });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  // ── Back navigation based on role ─────────────────────────────────────────
  const handleBack = () => {
    if (reduxUser?.role === "worker") {
      navigate("/worker/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  // ── Loading / error ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={styles.centered}>
        <p style={styles.errorText}>Failed to load profile.</p>
        <button onClick={handleBack} style={styles.backLinkBtn}>
          ← Go back
        </button>
      </div>
    );
  }

  // Initials for avatar
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const isWorker = profile?.role === "worker";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <button onClick={handleBack} style={styles.backBtn}>
          ← Back
        </button>
        <span style={styles.navTitle}>My Profile</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </nav>

      <main style={styles.main}>

        {/* ── Avatar + name card ── */}
        <div style={styles.heroCard}>
          <div style={styles.avatar}>{initials}</div>
          <div style={styles.heroInfo}>
            <h1 style={styles.heroName}>{profile?.full_name}</h1>
            <div style={styles.heroBadges}>
              <span
                style={{
                  ...styles.roleBadge,
                  backgroundColor: isWorker ? "#FFF1ED" : "#EFF6FF",
                  color: isWorker ? "#C84B2F" : "#1D4ED8",
                  border: `1px solid ${isWorker ? "#FECDC5" : "#BFDBFE"}`,
                }}
              >
                {isWorker ? "🔧 Worker" : "🧑 Customer"}
              </span>
              <span style={styles.areaBadge}>📍 {profile?.area}</span>
            </div>
          </div>
        </div>

        {/* ── Success message ── */}
        {updateSuccess && (
          <div style={styles.successBanner}>
            ✓ Profile updated successfully!
          </div>
        )}

        {/* ── Profile info card ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Account info</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={styles.editBtn}
              >
                ✏ Edit
              </button>
            )}
          </div>

          {!isEditing ? (
            // ── View mode ──
            <div style={styles.detailsGrid}>
              <DetailRow label="Full name" value={profile?.full_name} />
              <DetailRow label="Phone" value={profile?.phone} />
              <DetailRow
                label="Email"
                value={profile?.email || "Not provided"}
                valueStyle={!profile?.email ? { color: "#9CA3AF", fontStyle: "italic" } : {}}
              />
              <DetailRow label="Area" value={profile?.area} />
              <DetailRow label="Role" value={isWorker ? "Worker" : "Customer"} />
              <DetailRow
                label="Member since"
                value={formatDate(profile?.created_at)}
              />
            </div>
          ) : (
            // ── Edit mode ──
            <form onSubmit={handleSubmit} noValidate>

              {formErrors.general && (
                <div style={styles.errorBanner}>
                  ⚠ {formErrors.general}
                </div>
              )}

              {/* Full name */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full name</label>
                <input
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  style={{
                    ...styles.input,
                    ...(formErrors.full_name ? styles.inputError : {}),
                  }}
                />
                {formErrors.full_name && (
                  <p style={styles.fieldError}>{formErrors.full_name}</p>
                )}
              </div>

              {/* Area */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Area</label>
                <input
                  name="area"
                  type="text"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="Your area"
                  style={{
                    ...styles.input,
                    ...(formErrors.area ? styles.inputError : {}),
                  }}
                />
                {formErrors.area && (
                  <p style={styles.fieldError}>{formErrors.area}</p>
                )}
                {/* Quick area chips */}
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

              {/* Read-only fields info */}
              <div style={styles.readOnlyNote}>
                📌 Phone and email cannot be changed.
              </div>

              {/* Buttons */}
              <div style={styles.formBtns}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  style={{
                    ...styles.saveBtn,
                    opacity: updateMutation.isPending ? 0.7 : 1,
                    cursor: updateMutation.isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>

            </form>
          )}
        </div>

        {/* ── Quick links card ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Quick links</h2>
          <div style={styles.quickLinks}>
            {isWorker ? (
              <>
                <QuickLink
                  icon="📋"
                  label="My bookings"
                  onClick={() => navigate("/worker/dashboard")}
                />
                <QuickLink
                  icon="🔧"
                  label="Manage services"
                  onClick={() => navigate("/worker/services")}
                />
              </>
            ) : (
              <>
                <QuickLink
                  icon="📋"
                  label="My bookings"
                  onClick={() => navigate("/my-bookings")}
                />
                <QuickLink
                  icon="🔍"
                  label="Find workers"
                  onClick={() => navigate("/search-workers")}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div style={styles.dangerCard}>
          <h2 style={styles.cardTitle}>Account</h2>
          <button onClick={handleLogout} style={styles.logoutDangerBtn}>
            Sign out of GharKoKaam
          </button>
        </div>

      </main>
    </div>
  );
}

// ── Reusable components ───────────────────────────────────────────────────────
function DetailRow({ label, value, valueStyle = {} }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{ ...styles.detailValue, ...valueStyle }}>
        {value || "—"}
      </span>
    </div>
  );
}

function QuickLink({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={styles.quickLinkBtn}>
      <span style={styles.quickLinkIcon}>{icon}</span>
      <span style={styles.quickLinkLabel}>{label}</span>
      <span style={styles.quickLinkArrow}>→</span>
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#FDF6F0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  // Navbar
  navbar: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #F0E6DF",
    padding: "0 16px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    color: "#C84B2F",
    cursor: "pointer",
    padding: "6px",
    minWidth: "60px",
  },
  navTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A0A00",
  },
  logoutBtn: {
    background: "none",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "13px",
    color: "#7A6055",
    cursor: "pointer",
    fontWeight: 500,
  },

  // Main
  main: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px 16px 60px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  // Hero card
  heroCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontSize: "22px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 8px",
  },
  heroBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  roleBadge: {
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "20px",
    padding: "3px 10px",
  },
  areaBadge: {
    fontSize: "12px",
    color: "#7A6055",
    padding: "3px 0",
  },

  // Success banner
  successBanner: {
    backgroundColor: "#DCFCE7",
    border: "1px solid #86EFAC",
    borderRadius: "8px",
    color: "#166534",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 16px",
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "18px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#7A6055",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: 0,
  },
  editBtn: {
    background: "none",
    border: "1.5px solid #E0D5CF",
    borderRadius: "7px",
    padding: "5px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#3D2B1F",
    cursor: "pointer",
  },

  // Details
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    fontSize: "14px",
    paddingBottom: "12px",
    borderBottom: "1px solid #F9F5F2",
  },
  detailLabel: {
    color: "#9CA3AF",
    fontWeight: 500,
    flexShrink: 0,
    minWidth: "100px",
  },
  detailValue: {
    color: "#1A0A00",
    fontWeight: 600,
    textAlign: "right",
    flex: 1,
  },

  // Edit form
  errorBanner: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    color: "#B91C1C",
    fontSize: "14px",
    padding: "12px 16px",
    marginBottom: "16px",
  },
  fieldGroup: {
    marginBottom: "16px",
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
    fontSize: "14px",
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
  areaChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },
  chip: {
    padding: "4px 10px",
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
  readOnlyNote: {
    fontSize: "12px",
    color: "#9CA3AF",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "16px",
  },
  formBtns: {
    display: "flex",
    gap: "10px",
  },
  cancelBtn: {
    flex: 1,
    padding: "11px",
    fontSize: "14px",
    fontWeight: 600,
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2,
    padding: "11px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
  },

  // Quick links
  quickLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  quickLinkBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 8px",
    background: "none",
    border: "none",
    borderBottom: "1px solid #F9F5F2",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    borderRadius: "0",
  },
  quickLinkIcon: {
    fontSize: "18px",
    flexShrink: 0,
  },
  quickLinkLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1A0A00",
    flex: 1,
  },
  quickLinkArrow: {
    fontSize: "16px",
    color: "#C84B2F",
    flexShrink: 0,
  },

  // Danger zone
  dangerCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "18px",
  },
  logoutDangerBtn: {
    width: "100%",
    padding: "11px",
    fontSize: "14px",
    fontWeight: 600,
    border: "1.5px solid #FCA5A5",
    borderRadius: "8px",
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    cursor: "pointer",
    marginTop: "12px",
  },

  // Loading / error
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    gap: "12px",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: "15px",
  },
  errorText: {
    color: "#DC2626",
    fontSize: "15px",
  },
  backLinkBtn: {
    background: "none",
    border: "none",
    color: "#C84B2F",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};