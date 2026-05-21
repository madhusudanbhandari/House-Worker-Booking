// src/pages/customer/MyBookings.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, updateBookingStatus } from "../../api/bookings";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" },
  accepted: { label: "Accepted", bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
  in_progress: { label: "In Progress", bg: "#EDE9FE", color: "#5B21B6", border: "#C4B5FD" },
  completed: { label: "Completed", bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  rejected: { label: "Rejected", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
};

// ── Tab options ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

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

// ── Status history timeline dot color ────────────────────────────────────────
const getTimelineDotColor = (status) => {
  const cfg = STATUS_CONFIG[status];
  return cfg ? cfg.color : "#9CA3AF";
};

// ─────────────────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null); // which booking shows timeline
  const [cancellingId, setCancellingId] = useState(null); // booking being cancelled
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // ── Fetch bookings ────────────────────────────────────────────────────────
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  // ── Cancel mutation ───────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: updateBookingStatus,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookingStats"] });
      setCancellingId(null);
      setCancelReason("");
      setCancelError("");
    },

    onError: (error) => {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.status?.[0] ||
        "Failed to cancel booking.";
      setCancelError(msg);
    },
  });

  const handleCancelConfirm = (bookingId) => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }
    cancelMutation.mutate({
      id: bookingId,
      status: "cancelled",
      note: cancelReason.trim(),
    });
  };

  // ── Filtered bookings ─────────────────────────────────────────────────────
  const filteredBookings =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  // ── Toggle timeline expand ────────────────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    // Close cancel form if opening a different card
    if (cancellingId !== id) {
      setCancellingId(null);
      setCancelReason("");
      setCancelError("");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <button
          onClick={() => navigate("/dashboard")}
          style={styles.backBtn}
        >
          ← Back
        </button>
        <span style={styles.navTitle}>My Bookings</span>
        <div style={{ width: "60px" }} />
      </nav>

      <main style={styles.main}>

        {/* ── Tab filter ── */}
        <div style={styles.tabsWrap}>
          {TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === tab.key).length;

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
                {count > 0 && (
                  <span
                    style={{
                      ...styles.tabCount,
                      ...(activeTab === tab.key
                        ? styles.tabCountActive
                        : {}),
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Results count ── */}
        <p style={styles.resultsCount}>
          {isLoading
            ? "Loading..."
            : `${filteredBookings.length} booking${filteredBookings.length !== 1 ? "s" : ""}`}
        </p>

        {/* ── Booking cards ── */}
        {isLoading ? (
          <div style={styles.centered}>
            <p style={styles.loadingText}>Loading your bookings...</p>
          </div>
        ) : isError ? (
          <div style={styles.centered}>
            <p style={styles.errorText}>Failed to load bookings.</p>
            <button onClick={refetch} style={styles.retryBtn}>
              Try again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyIcon}>📋</p>
            <p style={styles.emptyTitle}>
              No {activeTab === "all" ? "" : activeTab} bookings
            </p>
            <p style={styles.emptySubtitle}>
              {activeTab === "all"
                ? "Browse services and make your first booking!"
                : `You have no ${activeTab} bookings right now.`}
            </p>
            {activeTab === "all" && (
              <button
                onClick={() => navigate("/search-workers")}
                style={styles.browseBtn}
              >
                Browse workers →
              </button>
            )}
          </div>
        ) : (
          <div style={styles.bookingsList}>
            {filteredBookings.map((booking) => {
              const statusCfg =
                STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedId === booking.id;
              const isCancelling = cancellingId === booking.id;
              const canCancel = ["pending", "accepted"].includes(booking.status);

              return (
                <div key={booking.id} style={styles.bookingCard}>

                  {/* ── Card header ── */}
                  <div style={styles.cardHeader}>
                    <div style={styles.cardHeaderLeft}>
                      <p style={styles.serviceName}>
                        {booking.service?.name}
                      </p>
                      <p style={styles.workerName}>
                        👷 {booking.worker?.full_name}
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
                      {booking.status_display}
                    </span>
                  </div>

                  <div style={styles.divider} />

                  {/* ── Booking details ── */}
                  <div style={styles.detailsGrid}>
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
                    <div style={styles.detailRow}>
                      <span style={styles.detailIcon}>💰</span>
                      <span style={styles.detailLabel}>Total</span>
                      <span style={{
                        ...styles.detailValue,
                        color: "#C84B2F",
                        fontWeight: 700,
                      }}>
                        {formatPrice(booking.total_price)}
                      </span>
                    </div>
                    {booking.note && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>📝</span>
                        <span style={styles.detailLabel}>Note</span>
                        <span style={styles.detailValue}>{booking.note}</span>
                      </div>
                    )}
                    {booking.rejection_reason && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>❌</span>
                        <span style={styles.detailLabel}>Rejected</span>
                        <span style={{ ...styles.detailValue, color: "#DC2626" }}>
                          {booking.rejection_reason}
                        </span>
                      </div>
                    )}
                    {booking.cancellation_reason && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailIcon}>🚫</span>
                        <span style={styles.detailLabel}>Cancelled</span>
                        <span style={{ ...styles.detailValue, color: "#DC2626" }}>
                          {booking.cancellation_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Action buttons row ── */}
                  <div style={styles.actionsRow}>

                    {/* Toggle timeline */}
                    <button
                      onClick={() => toggleExpand(booking.id)}
                      style={styles.timelineToggleBtn}
                    >
                      {isExpanded ? "Hide timeline ▲" : "View timeline ▼"}
                    </button>

                    {/* Cancel button — only for pending/accepted */}
                    {canCancel && !isCancelling && (
                      <button
                        onClick={() => {
                          setCancellingId(booking.id);
                          setCancelError("");
                          setCancelReason("");
                        }}
                        style={styles.cancelBtn}
                      >
                        Cancel booking
                      </button>
                    )}

                    {/* Leave review — only for completed */}
                    {booking.status === "completed" && (
                      <button
                        onClick={() =>
                          navigate(`/bookings/${booking.id}`)
                        }
                        style={styles.reviewBtn}
                      >
                        ⭐ Leave review
                      </button>
                    )}

                  </div>

                  {/* ── Cancel confirmation form ── */}
                  {isCancelling && (
                    <div style={styles.cancelForm}>
                      <p style={styles.cancelFormTitle}>
                        Why are you cancelling?
                      </p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => {
                          setCancelReason(e.target.value);
                          setCancelError("");
                        }}
                        placeholder="Provide a reason..."
                        rows={2}
                        style={styles.cancelTextarea}
                      />
                      {cancelError && (
                        <p style={styles.cancelError}>{cancelError}</p>
                      )}
                      <div style={styles.cancelFormBtns}>
                        <button
                          onClick={() => {
                            setCancellingId(null);
                            setCancelReason("");
                            setCancelError("");
                          }}
                          style={styles.cancelFormDismiss}
                        >
                          Keep booking
                        </button>
                        <button
                          onClick={() => handleCancelConfirm(booking.id)}
                          disabled={cancelMutation.isPending}
                          style={{
                            ...styles.cancelFormConfirm,
                            opacity: cancelMutation.isPending ? 0.7 : 1,
                            cursor: cancelMutation.isPending
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          {cancelMutation.isPending
                            ? "Cancelling..."
                            : "Yes, cancel"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Status history timeline ── */}
                  {isExpanded && booking.status_history?.length > 0 && (
                    <div style={styles.timeline}>
                      <div style={styles.divider} />
                      <p style={styles.timelineTitle}>Booking timeline</p>
                      {booking.status_history.map((h, index) => (
                        <div key={h.id} style={styles.timelineItem}>
                          {/* Dot + vertical line */}
                          <div style={styles.timelineLeft}>
                            <div
                              style={{
                                ...styles.timelineDot,
                                backgroundColor: getTimelineDotColor(h.new_status),
                              }}
                            />
                            {index < booking.status_history.length - 1 && (
                              <div style={styles.timelineLine} />
                            )}
                          </div>
                          {/* Content */}
                          <div style={styles.timelineContent}>
                            <p style={styles.timelineStatus}>
                              {STATUS_CONFIG[h.new_status]?.label ||
                                h.new_status}
                            </p>
                            <p style={styles.timelineMeta}>
                              by {h.changed_by_name} •{" "}
                              {formatDate(h.changed_at)}
                            </p>
                            {h.note && (
                              <p style={styles.timelineNote}>
                                "{h.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

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

  // Main
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "20px 16px 60px",
  },

  // Tabs
  tabsWrap: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  tab: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1.5px solid #E0D5CF",
    borderRadius: "20px",
    background: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  tabActive: {
    borderColor: "#C84B2F",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontWeight: 600,
  },
  tabCount: {
    fontSize: "11px",
    backgroundColor: "#E0D5CF",
    color: "#7A6055",
    borderRadius: "20px",
    padding: "1px 6px",
    fontWeight: 600,
  },
  tabCountActive: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
  },

  // Results count
  resultsCount: {
    fontSize: "13px",
    color: "#9CA3AF",
    margin: "0 0 14px",
  },

  // Bookings list
  bookingsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  // Booking card
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
    gap: "12px",
  },
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  workerName: {
    fontSize: "13px",
    color: "#7A6055",
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

  // Details
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "14px",
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

  // Actions row
  actionsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  timelineToggleBtn: {
    background: "none",
    border: "1px solid #E0D5CF",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#7A6055",
    cursor: "pointer",
    fontWeight: 500,
  },
  cancelBtn: {
    background: "none",
    border: "1px solid #FCA5A5",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#DC2626",
    cursor: "pointer",
    fontWeight: 500,
  },
  reviewBtn: {
    background: "none",
    border: "1px solid #FDE047",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#854D0E",
    cursor: "pointer",
    fontWeight: 500,
    backgroundColor: "#FEF9C3",
  },

  // Cancel form
  cancelForm: {
    marginTop: "14px",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "10px",
    padding: "14px",
  },
  cancelFormTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#991B1B",
    margin: "0 0 8px",
  },
  cancelTextarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#FFFFFF",
    color: "#1A0A00",
    resize: "vertical",
    fontFamily: "inherit",
    marginBottom: "8px",
  },
  cancelError: {
    fontSize: "13px",
    color: "#DC2626",
    margin: "0 0 8px",
  },
  cancelFormBtns: {
    display: "flex",
    gap: "8px",
  },
  cancelFormDismiss: {
    flex: 1,
    padding: "9px",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid #E0D5CF",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
  },
  cancelFormConfirm: {
    flex: 1,
    padding: "9px",
    fontSize: "13px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
  },

  // Timeline
  timeline: {
    marginTop: "14px",
  },
  timelineTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#7A6055",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 14px",
  },
  timelineItem: {
    display: "flex",
    gap: "12px",
    marginBottom: "4px",
  },
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    width: "16px",
  },
  timelineDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "2px",
  },
  timelineLine: {
    width: "2px",
    flex: 1,
    backgroundColor: "#F0E6DF",
    margin: "4px 0",
    minHeight: "20px",
  },
  timelineContent: {
    paddingBottom: "16px",
    flex: 1,
  },
  timelineStatus: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A0A00",
    margin: "0 0 2px",
  },
  timelineMeta: {
    fontSize: "12px",
    color: "#9CA3AF",
    margin: "0 0 2px",
  },
  timelineNote: {
    fontSize: "12px",
    color: "#7A6055",
    fontStyle: "italic",
    margin: "2px 0 0",
  },

  // Empty / loading
  centered: {
    textAlign: "center",
    padding: "60px 0",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: "15px",
  },
  errorText: {
    color: "#DC2626",
    fontSize: "15px",
    marginBottom: "12px",
  },
  retryBtn: {
    padding: "8px 20px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  emptyWrap: {
    textAlign: "center",
    padding: "60px 0",
  },
  emptyIcon: {
    fontSize: "40px",
    margin: "0 0 12px",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#3D2B1F",
    margin: "0 0 6px",
    textTransform: "capitalize",
  },
  emptySubtitle: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: "0 0 16px",
  },
  browseBtn: {
    padding: "10px 24px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
};