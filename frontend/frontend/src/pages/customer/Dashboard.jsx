// src/pages/customer/Dashboard.jsx
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { clearCredentials } from "../../store/slices/authSlice";
import { getBookingStats, getMyBookings } from "../../api/bookings";
import { getCategories } from "../../api/services";
import { logoutUser } from "../../api/auth";

// ── Status badge config ───────────────────────────────────────────────────────
// Maps booking status → { label, colors }
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "#FEF9C3",
    color: "#854D0E",
    border: "#FDE047",
  },
  accepted: {
    label: "Accepted",
    bg: "#DBEAFE",
    color: "#1E40AF",
    border: "#93C5FD",
  },
  in_progress: {
    label: "In Progress",
    bg: "#EDE9FE",
    color: "#5B21B6",
    border: "#C4B5FD",
  },
  completed: {
    label: "Completed",
    bg: "#DCFCE7",
    color: "#166534",
    border: "#86EFAC",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#FEE2E2",
    color: "#991B1B",
    border: "#FCA5A5",
  },
};

// ── Category icon map ─────────────────────────────────────────────────────────
// Maps category name keywords → emoji
// Adjust these to match your actual category names in the DB
const getCategoryIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("plumb")) return "🔧";
  if (n.includes("electric")) return "⚡";
  if (n.includes("clean")) return "🧹";
  if (n.includes("paint")) return "🎨";
  if (n.includes("carpent") || n.includes("wood")) return "🪚";
  if (n.includes("garden") || n.includes("lawn")) return "🌿";
  if (n.includes("pest")) return "🐛";
  if (n.includes("ac") || n.includes("cool") || n.includes("hvac")) return "❄️";
  if (n.includes("security") || n.includes("cctv")) return "📷";
  if (n.includes("cook") || n.includes("chef")) return "👨‍🍳";
  return "🏠";
};

// ── Format date nicely ────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NP", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // First name from full_name (e.g. "Ram Sharma" → "Ram")
  const firstName = user?.full_name?.split(" ")[0] || "there";

  // ── Data fetching ─────────────────────────────────────────────────────────

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["bookingStats"],
    queryFn: getBookingStats,
    // If your stats endpoint isn't ready yet, this will just show 0s
    // and not crash the page
  });

  const {
    data: bookings,
    isLoading: bookingsLoading,
  } = useQuery({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await logoutUser(refreshToken);
    } catch {
      // Even if logout API fails, clear local state
    } finally {
      dispatch(clearCredentials());
      navigate("/login", { replace: true });
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  // Show only last 5 bookings on dashboard
  const recentBookings = Array.isArray(bookings) ? bookings.slice(0, 5) : [];

  // Stats with fallbacks to 0
  const statCards = [
    {
      label: "Total bookings",
      value: stats?.total ?? 0,
      bg: "#FFF7ED",
      color: "#C84B2F",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      bg: "#FEF9C3",
      color: "#854D0E",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0,
      bg: "#DCFCE7",
      color: "#166534",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.navLogo}>🏠</span>
          <span style={styles.navName}>GharKoKaam</span>
        </div>
        <div style={styles.navRight}>
          <button
            onClick={() => navigate("/profile")}
            style={styles.navIconBtn}
            title="Profile"
          >
            👤
          </button>
          <button
            onClick={() => navigate("/my-bookings")}
            style={styles.navIconBtn}
            title="My Bookings"
          >
            📋
          </button>
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={styles.main}>

        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingTitle}>
            Namaste, {firstName}! 🙏
          </h1>
          <p style={styles.greetingSubtitle}>
            What service do you need today?
          </p>
        </div>

        {/* ── Stats row ── */}
        <div style={styles.statsRow}>
          {statCards.map((s) => (
            <div
              key={s.label}
              style={{ ...styles.statCard, backgroundColor: s.bg }}
            >
              <p style={styles.statLabel}>{s.label}</p>
              <p style={{ ...styles.statValue, color: s.color }}>
                {statsLoading ? "..." : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Service categories ── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Browse services</h2>
            <button
              onClick={() => navigate("/search-workers")}
              style={styles.seeAllBtn}
            >
              See all →
            </button>
          </div>

          {categoriesLoading ? (
            <p style={styles.loadingText}>Loading categories...</p>
          ) : !categories || categories.length === 0 ? (
            <p style={styles.emptyText}>No categories found.</p>
          ) : (
            <div style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    navigate(`/search-workers?category=${cat.id}`)
                  }
                  style={styles.categoryCard}
                >
                  <span style={styles.categoryIcon}>
                    {getCategoryIcon(cat.name)}
                  </span>
                  <span style={styles.categoryName}>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent bookings ── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent bookings</h2>
            <button
              onClick={() => navigate("/my-bookings")}
              style={styles.seeAllBtn}
            >
              See all →
            </button>
          </div>

          {bookingsLoading ? (
            <p style={styles.loadingText}>Loading bookings...</p>
          ) : recentBookings.length === 0 ? (
            <div style={styles.emptyCard}>
              <p style={styles.emptyCardIcon}>📋</p>
              <p style={styles.emptyCardText}>No bookings yet</p>
              <p style={styles.emptyCardSub}>
                Browse services above and book your first worker!
              </p>
            </div>
          ) : (
            <div style={styles.bookingsList}>
              {recentBookings.map((booking) => {
                const statusCfg =
                  STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={booking.id}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    style={styles.bookingCard}
                  >
                    {/* Left: service info */}
                    <div style={styles.bookingInfo}>
                      <p style={styles.bookingService}>
                        {booking.service_name ||
                          booking.service?.name ||
                          "Service"}
                      </p>
                      <p style={styles.bookingWorker}>
                        Worker:{" "}
                        {booking.worker_name ||
                          booking.worker?.full_name ||
                          "—"}
                      </p>
                      <p style={styles.bookingDate}>
                        📅 {formatDate(booking.scheduled_date || booking.created_at)}
                      </p>
                    </div>

                    {/* Right: status badge */}
                    <div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: statusCfg.bg,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.border}`,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
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
    padding: "0 24px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navLogo: {
    fontSize: "24px",
  },
  navName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#C84B2F",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navIconBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "8px",
  },
  logoutBtn: {
    background: "none",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "14px",
    color: "#7A6055",
    cursor: "pointer",
    fontWeight: 500,
  },

  // Main
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "24px 16px 48px",
  },

  // Greeting
  greeting: {
    marginBottom: "24px",
  },
  greetingTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  greetingSubtitle: {
    fontSize: "15px",
    color: "#7A6055",
    margin: 0,
  },

  // Stats
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "32px",
  },
  statCard: {
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#7A6055",
    margin: "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontWeight: 600,
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
  },

  // Section
  section: {
    marginBottom: "32px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: 0,
  },
  seeAllBtn: {
    background: "none",
    border: "none",
    color: "#C84B2F",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },

  // Categories
  categoriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "12px",
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "12px",
    padding: "16px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "border-color 0.2s, transform 0.1s",
  },
  categoryIcon: {
    fontSize: "28px",
  },
  categoryName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#3D2B1F",
    textAlign: "center",
    lineHeight: 1.3,
  },

  // Bookings
  bookingsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  bookingWorker: {
    fontSize: "13px",
    color: "#7A6055",
    margin: "0 0 4px",
  },
  bookingDate: {
    fontSize: "12px",
    color: "#9CA3AF",
    margin: 0,
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },

  // Empty / loading
  loadingText: {
    color: "#9CA3AF",
    fontSize: "14px",
    padding: "8px 0",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: "14px",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "12px",
    padding: "40px 24px",
    textAlign: "center",
  },
  emptyCardIcon: {
    fontSize: "36px",
    margin: "0 0 8px",
  },
  emptyCardText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#3D2B1F",
    margin: "0 0 6px",
  },
  emptyCardSub: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: 0,
  },
};