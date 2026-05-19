// src/pages/worker/WorkerDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { selectCurrentUser, clearCredentials } from "../../store/slices/authSlice";
import { getWorkerBookings, getBookingStats, updateBookingStatus } from "../../api/bookings";
import { logoutUser } from "../../api/auth";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" },
  accepted: { label: "Accepted", bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
  in_progress: { label: "In Progress", bg: "#EDE9FE", color: "#5B21B6", border: "#C4B5FD" },
  completed: { label: "Completed", bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  rejected: { label: "Rejected", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
};

// ── What actions a worker can take per status ─────────────────────────────────
const WORKER_ACTIONS = {
  pending: [
    { label: "✓ Accept", nextStatus: "accepted", style: "accept" },
    { label: "✗ Reject", nextStatus: "rejected", style: "reject" },
  ],
  accepted: [
    { label: "▶ Start work", nextStatus: "in_progress", style: "accept" },
  ],
  in_progress: [
    { label: "✓ Mark complete", nextStatus: "completed", style: "accept" },
  ],
  completed: [],
  cancelled: [],
  rejected: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-NP", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price) => {
  if (!price) return "—";
  return `Rs. ${parseFloat(price).toLocaleString()}`;
};

// ── Tab filter options ────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function WorkerDashboard() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const firstName = user?.full_name?.split(" ")[0] || "there";

  const [activeTab, setActiveTab] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null); // booking id being updated

  // ── Data fetching ─────────────────────────────────────────────────────────
  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    isError: bookingsError,
  } = useQuery({
    queryKey: ["workerBookings"],
    queryFn: getWorkerBookings,
  });

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["bookingStats"],
    queryFn: getBookingStats,
  });

  // ── Status update mutation ────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: updateBookingStatus,

    onMutate: ({ id }) => {
      setActionLoadingId(id); // show loading on that specific booking card
    },

    onSuccess: () => {
      // Refetch both bookings and stats so numbers update instantly
      queryClient.invalidateQueries({ queryKey: ["workerBookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookingStats"] });
      setActionLoadingId(null);
    },

    onError: (error) => {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.status?.[0] ||
        "Failed to update status.";
      alert(msg); // simple error — we'll improve this later
      setActionLoadingId(null);
    },
  });

  const handleStatusUpdate = (bookingId, nextStatus) => {
    statusMutation.mutate({ id: bookingId, status: nextStatus });
  };

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

  // ── Filtered bookings by tab ──────────────────────────────────────────────
  const filteredBookings =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  // ── Stat cards ────────────────────────────────────────────────────────────
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
      label: "Active",
      value: stats?.active ?? 0,
      bg: "#EDE9FE",
      color: "#5B21B6",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0,
      bg: "#DCFCE7",
      color: "#166534",
    },
    {
      label: "Total earned",
      value: statsLoading ? "..." : `Rs. ${(stats?.total_earned ?? 0).toLocaleString()}`,
      bg: "#F0FDF4",
      color: "#15803D",
      wide: true, // span full width on last row
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
          <span style={styles.workerBadge}>Worker</span>
        </div>
        <div style={styles.navRight}>
          <button
            onClick={() => navigate("/worker/services")}
            style={styles.navBtn}
            title="Manage Services"
          >
            🔧 My Services
          </button>
          <button
            onClick={() => navigate("/profile")}
            style={styles.navIconBtn}
            title="Profile"
          >
            👤
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={styles.main}>

        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingTitle}>
            Namaste, {firstName}! 🙏
          </h1>
          <p style={styles.greetingSubtitle}>
            {user?.area} • Here are your bookings
          </p>
        </div>

        {/* ── Stats grid ── */}
        <div style={styles.statsGrid}>
          {statCards.filter((s) => !s.wide).map((s) => (
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

        {/* Total earned — full width card */}
        <div
          style={{
            ...styles.earnedCard,
            backgroundColor: "#F0FDF4",
          }}
        >
          <p style={styles.statLabel}>💰 Total earned</p>
          <p style={{ ...styles.statValue, color: "#15803D", fontSize: "32px" }}>
            {statsLoading
              ? "..."
              : `Rs. ${(stats?.total_earned ?? 0).toLocaleString()}`}
          </p>
        </div>

        {/* ── Bookings section ── */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Booking requests</h2>

          {/* Tab filter */}
          <div style={styles.tabs}>
            {TABS.map((tab) => {
              // Show count badge on pending tab
              const pendingCount =
                tab.key === "pending"
                  ? bookings.filter((b) => b.status === "pending").length
                  : null;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    ...styles.tab,
                    ...(activeTab === tab.key ? styles.tabActive : {}),
                  }}
                >
                  {tab.label}
                  {pendingCount > 0 && (
                    <span style={styles.tabBadge}>{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Booking cards */}
          {bookingsLoading ? (
            <p style={styles.loadingText}>Loading bookings...</p>
          ) : bookingsError ? (
            <p style={styles.errorText}>Failed to load bookings.</p>
          ) : filteredBookings.length === 0 ? (
            <div style={styles.emptyCard}>
              <p style={styles.emptyIcon}>📋</p>
              <p style={styles.emptyText}>No {activeTab === "all" ? "" : activeTab} bookings</p>
            </div>
          ) : (
            <div style={styles.bookingsList}>
              {filteredBookings.map((booking) => {
                const statusCfg =
                  STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                const actions = WORKER_ACTIONS[booking.status] || [];
                const isUpdating = actionLoadingId === booking.id;

                return (
                  <div key={booking.id} style={styles.bookingCard}>

                    {/* ── Card header: service + status ── */}
                    <div style={styles.cardHeader}>
                      <div>
                        <p style={styles.serviceName}>
                          {booking.service?.name}
                        </p>
                        <p style={styles.servicePrice}>
                          {formatPrice(booking.service?.base_price)}
                        </p>
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: statusCfg.bg,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.border}`,
                        }}
                      >
                        {booking.status_display || statusCfg.label}
                      </span>
                    </div>

                    {/* ── Divider ── */}
                    <div style={styles.divider} />

                    {/* ── Booking details ── */}
                    <div style={styles.detailsGrid}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>👤</span>
                        <span style={styles.detailLabel}>Customer</span>
                        <span style={styles.detailValue}>
                          {booking.customer?.full_name}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>📍</span>
                        <span style={styles.detailLabel}>Address</span>
                        <span style={styles.detailValue}>
                          {booking.address}, {booking.area}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>📅</span>
                        <span style={styles.detailLabel}>Scheduled</span>
                        <span style={styles.detailValue}>
                          {formatDate(booking.scheduled_at)}
                        </span>
                      </div>
                      {booking.note && (
                        <div style={styles.detailRow}>
                          <span style={styles.detailIcon}>📝</span>
                          <span style={styles.detailLabel}>Note</span>
                          <span style={styles.detailValue}>{booking.note}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Action buttons ── */}
                    {actions.length > 0 && (
                      <div style={styles.actions}>
                        {actions.map((action) => (
                          <button
                            key={action.nextStatus}
                            onClick={() =>
                              handleStatusUpdate(booking.id, action.nextStatus)
                            }
                            disabled={isUpdating}
                            style={{
                              ...styles.actionBtn,
                              ...(action.style === "accept"
                                ? styles.actionBtnAccept
                                : styles.actionBtnReject),
                              opacity: isUpdating ? 0.6 : 1,
                              cursor: isUpdating ? "not-allowed" : "pointer",
                            }}
                          >
                            {isUpdating ? "Updating..." : action.label}
                          </button>
                        ))}
                      </div>
                    )}

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
  navLogo: { fontSize: "24px" },
  navName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#C84B2F",
  },
  workerBadge: {
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    border: "1px solid #FECDC5",
    borderRadius: "20px",
    padding: "2px 8px",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navBtn: {
    background: "none",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "13px",
    color: "#3D2B1F",
    cursor: "pointer",
    fontWeight: 500,
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
  greeting: { marginBottom: "24px" },
  greetingTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  greetingSubtitle: {
    fontSize: "14px",
    color: "#7A6055",
    margin: 0,
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "12px",
  },
  statCard: {
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "11px",
    color: "#7A6055",
    margin: "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
  },
  earnedCard: {
    borderRadius: "12px",
    padding: "16px 24px",
    marginBottom: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Section
  section: { marginBottom: "32px" },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 14px",
  },

  // Tabs
  tabs: {
    display: "flex",
    gap: "6px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  tab: {
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1.5px solid #E0D5CF",
    borderRadius: "20px",
    background: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tabActive: {
    borderColor: "#C84B2F",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontWeight: 600,
  },
  tabBadge: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "20px",
    padding: "1px 6px",
    minWidth: "18px",
    textAlign: "center",
  },

  // Booking cards
  bookingsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "18px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  serviceName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  servicePrice: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#C84B2F",
    margin: 0,
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  divider: {
    height: "1px",
    backgroundColor: "#F0E6DF",
    marginBottom: "14px",
  },

  // Detail rows
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  detailRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
  },
  detailIcon: {
    fontSize: "14px",
    flexShrink: 0,
    marginTop: "1px",
  },
  detailLabel: {
    color: "#9CA3AF",
    minWidth: "72px",
    flexShrink: 0,
  },
  detailValue: {
    color: "#1A0A00",
    fontWeight: 500,
    flex: 1,
  },

  // Action buttons
  actions: {
    display: "flex",
    gap: "10px",
    paddingTop: "4px",
  },
  actionBtn: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
  },
  actionBtnAccept: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
  },
  actionBtnReject: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },

  // Empty / loading
  loadingText: {
    color: "#9CA3AF",
    fontSize: "14px",
    padding: "8px 0",
  },
  errorText: {
    color: "#DC2626",
    fontSize: "14px",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "36px",
    margin: "0 0 8px",
  },
  emptyText: {
    fontSize: "15px",
    color: "#7A6055",
    margin: 0,
    fontWeight: 500,
    textTransform: "capitalize",
  },
};