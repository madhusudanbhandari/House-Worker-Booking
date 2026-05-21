// src/pages/customer/BookingDetail.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookingById, updateBookingStatus } from "../../api/bookings";
import { createReview } from "../../api/reviews";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" },
  accepted: { label: "Accepted", bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
  in_progress: { label: "In Progress", bg: "#EDE9FE", color: "#5B21B6", border: "#C4B5FD" },
  completed: { label: "Completed", bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  rejected: { label: "Rejected", bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
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

const getTimelineDotColor = (status) => {
  return STATUS_CONFIG[status]?.color || "#9CA3AF";
};

// ── Star Rating component ─────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none",
            border: "none",
            fontSize: "32px",
            cursor: "pointer",
            padding: "2px",
            color: star <= (hovered || value) ? "#F59E0B" : "#E0D5CF",
            transition: "color 0.1s",
          }}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Review form state ─────────────────────────────────────────────────────
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // ── Cancel form state ─────────────────────────────────────────────────────
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // ── Fetch booking ─────────────────────────────────────────────────────────
  const {
    data: booking,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id),
  });

  // ── Review mutation ───────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: createReview,

    onSuccess: () => {
      setReviewSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },

    onError: (error) => {
      const data = error.response?.data;
      if (data?.detail) {
        setReviewError(data.detail);
      } else if (data?.non_field_errors) {
        setReviewError(data.non_field_errors[0]);
      } else if (typeof data === "object") {
        // Pick first field error
        const firstKey = Object.keys(data)[0];
        setReviewError(
          Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]
        );
      } else {
        setReviewError("Failed to submit review. Please try again.");
      }
    },
  });

  // ── Cancel mutation ───────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: updateBookingStatus,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookingStats"] });
      setShowCancelForm(false);
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

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      setReviewError("Please select a star rating.");
      return;
    }
    setReviewError("");
    reviewMutation.mutate({
      booking_id: parseInt(id),
      rating,
      comment,
    });
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason.");
      return;
    }
    cancelMutation.mutate({
      id: parseInt(id),
      status: "cancelled",
      note: cancelReason.trim(),
    });
  };

  // ── Loading / error ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading booking details...</p>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div style={styles.centered}>
        <p style={styles.errorText}>Booking not found.</p>
        <button
          onClick={() => navigate("/my-bookings")}
          style={styles.backLinkBtn}
        >
          ← Back to bookings
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const canCancel = ["pending", "accepted"].includes(booking.status);
  const isCompleted = booking.status === "completed";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <button
          onClick={() => navigate("/my-bookings")}
          style={styles.backBtn}
        >
          ← Back
        </button>
        <span style={styles.navTitle}>Booking Detail</span>
        <div style={{ width: "60px" }} />
      </nav>

      <main style={styles.main}>

        {/* ── Status banner ── */}
        <div
          style={{
            ...styles.statusBanner,
            backgroundColor: statusCfg.bg,
            borderColor: statusCfg.border,
          }}
        >
          <div>
            <p style={styles.statusBannerLabel}>Booking status</p>
            <p style={{ ...styles.statusBannerValue, color: statusCfg.color }}>
              {booking.status_display}
            </p>
          </div>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: statusCfg.color,
            }}
          />
        </div>

        {/* ── Service + Worker card ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Service details</h2>
          <div style={styles.detailsGrid}>
            <DetailRow icon="🔧" label="Service" value={booking.service?.name} />
            <DetailRow
              icon="💰"
              label="Price"
              value={formatPrice(booking.total_price)}
              valueStyle={{ color: "#C84B2F", fontWeight: 700 }}
            />
            <DetailRow
              icon="⏱"
              label="Duration"
              value={`${booking.service?.duration_hours} hr${parseFloat(booking.service?.duration_hours) !== 1 ? "s" : ""}`}
            />
          </div>

          <div style={styles.divider} />
          <h2 style={styles.cardTitle}>Worker</h2>
          <div style={styles.workerRow}>
            <div style={styles.workerAvatar}>
              {booking.worker?.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p style={styles.workerName}>{booking.worker?.full_name}</p>
              <p style={styles.workerPhone}>📞 {booking.worker?.phone}</p>
              <p style={styles.workerArea}>📍 {booking.worker?.area}</p>
            </div>
          </div>
        </div>

        {/* ── Booking info card ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Booking info</h2>
          <div style={styles.detailsGrid}>
            <DetailRow icon="📍" label="Address" value={`${booking.address}, ${booking.area}`} />
            <DetailRow icon="📅" label="Scheduled" value={formatDate(booking.scheduled_at)} />
            <DetailRow icon="🕐" label="Booked on" value={formatDate(booking.created_at)} />
            {booking.note && (
              <DetailRow icon="📝" label="Note" value={booking.note} />
            )}
            {booking.rejection_reason && (
              <DetailRow
                icon="❌"
                label="Rejected"
                value={booking.rejection_reason}
                valueStyle={{ color: "#DC2626" }}
              />
            )}
            {booking.cancellation_reason && (
              <DetailRow
                icon="🚫"
                label="Cancelled"
                value={booking.cancellation_reason}
                valueStyle={{ color: "#DC2626" }}
              />
            )}
          </div>
        </div>

        {/* ── Status timeline card ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Timeline</h2>
          {booking.status_history?.map((h, index) => (
            <div key={h.id} style={styles.timelineItem}>
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
              <div style={styles.timelineContent}>
                <p style={styles.timelineStatus}>
                  {STATUS_CONFIG[h.new_status]?.label || h.new_status}
                </p>
                <p style={styles.timelineMeta}>
                  by {h.changed_by_name} • {formatDate(h.changed_at)}
                </p>
                {h.note && (
                  <p style={styles.timelineNote}>"{h.note}"</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Cancel section — only for pending/accepted ── */}
        {canCancel && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Cancel booking</h2>
            {!showCancelForm ? (
              <button
                onClick={() => setShowCancelForm(true)}
                style={styles.cancelTriggerBtn}
              >
                Cancel this booking
              </button>
            ) : (
              <div>
                <p style={styles.cancelPrompt}>
                  Please tell us why you're cancelling:
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setCancelError("");
                  }}
                  placeholder="Your reason..."
                  rows={3}
                  style={styles.textarea}
                />
                {cancelError && (
                  <p style={styles.fieldError}>{cancelError}</p>
                )}
                <div style={styles.cancelBtns}>
                  <button
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelReason("");
                      setCancelError("");
                    }}
                    style={styles.cancelDismissBtn}
                  >
                    Keep booking
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={cancelMutation.isPending}
                    style={{
                      ...styles.cancelConfirmBtn,
                      opacity: cancelMutation.isPending ? 0.7 : 1,
                      cursor: cancelMutation.isPending ? "not-allowed" : "pointer",
                    }}
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Review section — only for completed bookings ── */}
        {isCompleted && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Leave a review</h2>

            {reviewSubmitted ? (
              // Success state
              <div style={styles.reviewSuccess}>
                <p style={styles.reviewSuccessIcon}>⭐</p>
                <p style={styles.reviewSuccessTitle}>Review submitted!</p>
                <p style={styles.reviewSuccessSubtitle}>
                  Thank you for rating {booking.worker?.full_name}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} noValidate>

                <p style={styles.reviewPrompt}>
                  How was your experience with {booking.worker?.full_name}?
                </p>

                {/* Star rating */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Your rating</label>
                  <StarRating value={rating} onChange={setRating} />
                  <p style={styles.ratingHint}>
                    {rating === 0 && "Tap a star to rate"}
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very good"}
                    {rating === 5 && "Excellent!"}
                  </p>
                </div>

                {/* Comment */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Comment{" "}
                    <span style={styles.optionalLabel}>(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share details about your experience..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>

                {reviewError && (
                  <p style={styles.fieldError}>{reviewError}</p>
                )}

                <button
                  type="submit"
                  disabled={reviewMutation.isPending || rating === 0}
                  style={{
                    ...styles.submitBtn,
                    opacity:
                      reviewMutation.isPending || rating === 0 ? 0.6 : 1,
                    cursor:
                      reviewMutation.isPending || rating === 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {reviewMutation.isPending
                    ? "Submitting..."
                    : "Submit review"}
                </button>

              </form>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// ── Reusable detail row ───────────────────────────────────────────────────────
function DetailRow({ icon, label, value, valueStyle = {} }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailIcon}>{icon}</span>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{ ...styles.detailValue, ...valueStyle }}>{value || "—"}</span>
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
    maxWidth: "680px",
    margin: "0 auto",
    padding: "20px 16px 60px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  // Status banner
  statusBanner: {
    borderRadius: "12px",
    border: "1.5px solid",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBannerLabel: {
    fontSize: "11px",
    color: "#7A6055",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    margin: "0 0 4px",
  },
  statusBannerValue: {
    fontSize: "20px",
    fontWeight: 700,
    margin: 0,
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "18px",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#7A6055",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 14px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#F0E6DF",
    margin: "16px 0",
  },

  // Details
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  detailRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "14px",
  },
  detailIcon: {
    fontSize: "15px",
    flexShrink: 0,
    marginTop: "1px",
  },
  detailLabel: {
    color: "#9CA3AF",
    minWidth: "80px",
    flexShrink: 0,
    fontWeight: 500,
  },
  detailValue: {
    color: "#1A0A00",
    fontWeight: 500,
    flex: 1,
  },

  // Worker row
  workerRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  workerAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  workerName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 2px",
  },
  workerPhone: {
    fontSize: "13px",
    color: "#7A6055",
    margin: "0 0 2px",
  },
  workerArea: {
    fontSize: "13px",
    color: "#9CA3AF",
    margin: 0,
  },

  // Timeline
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

  // Cancel
  cancelTriggerBtn: {
    background: "none",
    border: "1.5px solid #FCA5A5",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#DC2626",
    cursor: "pointer",
  },
  cancelPrompt: {
    fontSize: "14px",
    color: "#3D2B1F",
    margin: "0 0 10px",
  },
  cancelBtns: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  cancelDismissBtn: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    fontWeight: 600,
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
  },
  cancelConfirmBtn: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
  },

  // Review
  reviewPrompt: {
    fontSize: "14px",
    color: "#3D2B1F",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  fieldGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#3D2B1F",
    marginBottom: "8px",
  },
  optionalLabel: {
    fontSize: "12px",
    color: "#9CA3AF",
    fontWeight: 400,
  },
  ratingHint: {
    fontSize: "13px",
    color: "#F59E0B",
    fontWeight: 600,
    margin: "2px 0 0",
    minHeight: "18px",
  },
  textarea: {
    width: "100%",
    padding: "11px 14px",
    fontSize: "14px",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#FFFAF7",
    color: "#1A0A00",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  fieldError: {
    fontSize: "13px",
    color: "#DC2626",
    margin: "4px 0 8px",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  reviewSuccess: {
    textAlign: "center",
    padding: "20px 0",
  },
  reviewSuccessIcon: {
    fontSize: "40px",
    margin: "0 0 8px",
  },
  reviewSuccessTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 6px",
  },
  reviewSuccessSubtitle: {
    fontSize: "14px",
    color: "#7A6055",
    margin: 0,
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