// src/pages/customer/WorkerDetail.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getWorkerDetail } from "../../api/services";
import { createBooking } from "../../api/bookings";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
  if (!price) return "—";
  return `Rs. ${parseFloat(price).toLocaleString()}`;
};

const renderStars = (rating) => {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const empty = 5 - full;
  return "★".repeat(full) + "☆".repeat(empty);
};

// Min datetime for scheduling — must be at least 1 hour from now
const getMinDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  // Format to "YYYY-MM-DDTHH:MM" for datetime-local input
  return now.toISOString().slice(0, 16);
};

// Convert local datetime-local input value to ISO string with seconds
// e.g. "2026-06-01T10:00" → "2026-06-01T10:00:00Z"
const toISOString = (localDatetime) => {
  if (!localDatetime) return "";
  return new Date(localDatetime).toISOString();
};

// ─────────────────────────────────────────────────────────────────────────────
export default function WorkerDetail() {
  const { id } = useParams(); // /workers/:id
  const navigate = useNavigate();

  // ── Fetch worker detail ───────────────────────────────────────────────────
  const {
    data: worker,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workerDetail", id],
    queryFn: () => getWorkerDetail(id),
  });

  // ── Selected service state ────────────────────────────────────────────────
  // When worker has multiple services, customer picks one
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  // ── Booking form state ────────────────────────────────────────────────────
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    area: "",
    scheduled_at: "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ── Booking mutation ──────────────────────────────────────────────────────
  const bookingMutation = useMutation({
    mutationFn: createBooking,

    onSuccess: (data) => {
      setBookingSuccess(true);
      // After 2 seconds redirect to my bookings
      setTimeout(() => {
        navigate("/my-bookings");
      }, 2000);
    },

    onError: (error) => {
      const data = error.response?.data;
      if (typeof data === "object") {
        const mapped = {};
        for (const key in data) {
          mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
        setFormErrors(mapped);
      } else {
        setFormErrors({ general: "Failed to create booking. Please try again." });
      }
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    setShowBookingForm(true);
    // Scroll to booking form smoothly
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const validate = () => {
    const e = {};

    if (!selectedServiceId) {
      e.general = "Please select a service first.";
    }
    if (!formData.address.trim()) {
      e.address = "Address is required.";
    }
    if (!formData.area.trim()) {
      e.area = "Area is required.";
    }
    if (!formData.scheduled_at) {
      e.scheduled_at = "Please pick a date and time.";
    } else if (new Date(formData.scheduled_at) < new Date()) {
      e.scheduled_at = "Scheduled time must be in the future.";
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    bookingMutation.mutate({
      worker_id: parseInt(id),           // from URL param
      service_id: selectedServiceId,
      address: formData.address.trim(),
      area: formData.area.trim(),
      scheduled_at: toISOString(formData.scheduled_at),
      note: formData.note.trim(),
    });
  };

  // ── Selected service object ───────────────────────────────────────────────
  const selectedService = worker?.services_offered?.find(
    (s) => s.service?.id === selectedServiceId
  );

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading worker profile...</p>
      </div>
    );
  }

  if (isError || !worker) {
    return (
      <div style={styles.centered}>
        <p style={styles.errorText}>Worker not found.</p>
        <button
          onClick={() => navigate("/search-workers")}
          style={styles.backLinkBtn}
        >
          ← Back to search
        </button>
      </div>
    );
  }

  // ── Booking success screen ────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div style={styles.centered}>
        <div style={styles.successCard}>
          <p style={styles.successIcon}>✅</p>
          <h2 style={styles.successTitle}>Booking confirmed!</h2>
          <p style={styles.successSubtitle}>
            Your booking with {worker.full_name} has been sent.
            Redirecting to your bookings...
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <button
          onClick={() => navigate("/search-workers")}
          style={styles.backBtn}
        >
          ← Back
        </button>
        <span style={styles.navTitle}>Worker Profile</span>
        <div style={{ width: "60px" }} />
      </nav>

      <main style={styles.main}>

        {/* ── Worker profile card ── */}
        <div style={styles.profileCard}>

          {/* Avatar + name + badges */}
          <div style={styles.profileTop}>
            <div style={styles.avatar}>
              {worker.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div style={styles.profileInfo}>
              <div style={styles.nameRow}>
                <h1 style={styles.workerName}>{worker.full_name}</h1>
                {worker.is_verified && (
                  <span style={styles.verifiedBadge}>✓ Verified</span>
                )}
              </div>
              <p style={styles.workerArea}>📍 {worker.area}</p>
            </div>
            <span
              style={{
                ...styles.availBadge,
                backgroundColor: worker.is_available ? "#DCFCE7" : "#F3F4F6",
                color: worker.is_available ? "#166534" : "#6B7280",
                border: `1px solid ${worker.is_available ? "#86EFAC" : "#E5E7EB"}`,
              }}
            >
              {worker.is_available ? "Available" : "Busy"}
            </span>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <p style={styles.statValue}>
                {renderStars(worker.avg_rating)}
              </p>
              <p style={styles.statLabel}>
                {parseFloat(worker.avg_rating).toFixed(1)} rating
              </p>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <p style={styles.statValue}>{worker.total_jobs}</p>
              <p style={styles.statLabel}>Jobs done</p>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <p style={styles.statValue}>
                {worker.experience_years > 0
                  ? `${worker.experience_years} yr${worker.experience_years !== 1 ? "s" : ""}`
                  : "New"}
              </p>
              <p style={styles.statLabel}>Experience</p>
            </div>
          </div>

          {/* Bio */}
          {worker.bio ? (
            <p style={styles.bio}>{worker.bio}</p>
          ) : (
            <p style={styles.bioEmpty}>No bio provided.</p>
          )}

        </div>

        {/* ── Services section ── */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Services offered</h2>
          <p style={styles.sectionSubtitle}>
            Select a service to book
          </p>

          {worker.services_offered?.length === 0 ? (
            <p style={styles.emptyText}>No services listed yet.</p>
          ) : (
            <div style={styles.servicesList}>
              {worker.services_offered
                .filter((s) => s.is_active)
                .map((s) => {
                  const isSelected = selectedServiceId === s.service?.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleServiceSelect(s.service?.id)}
                      style={{
                        ...styles.serviceCard,
                        ...(isSelected ? styles.serviceCardSelected : {}),
                        cursor: worker.is_available ? "pointer" : "not-allowed",
                        opacity: worker.is_available ? 1 : 0.6,
                      }}
                    >
                      {/* Selection indicator */}
                      <div style={styles.serviceCardLeft}>
                        <div
                          style={{
                            ...styles.radioCircle,
                            ...(isSelected ? styles.radioCircleSelected : {}),
                          }}
                        >
                          {isSelected && (
                            <div style={styles.radioDot} />
                          )}
                        </div>
                      </div>

                      {/* Service info */}
                      <div style={styles.serviceInfo}>
                        <p style={styles.serviceName}>
                          {s.service?.name}
                        </p>
                        {s.service?.description && (
                          <p style={styles.serviceDesc}>
                            {s.service.description}
                          </p>
                        )}
                        <div style={styles.serviceMetaRow}>
                          <span style={styles.serviceDuration}>
                            ⏱ {s.my_duration} hr{parseFloat(s.my_duration) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={styles.servicePrice}>
                        <p style={styles.servicePriceValue}>
                          {formatPrice(s.my_price)}
                        </p>
                        <p style={styles.servicePriceLabel}>per visit</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* ── Booking form — shown after selecting a service ── */}
        {showBookingForm && worker.is_available && (
          <section id="booking-form" style={styles.section}>
            <h2 style={styles.sectionTitle}>Book now</h2>

            {/* Selected service summary */}
            {selectedService && (
              <div style={styles.selectedServiceSummary}>
                <span style={styles.selectedServiceName}>
                  {selectedService.service?.name}
                </span>
                <span style={styles.selectedServicePrice}>
                  {formatPrice(selectedService.my_price)}
                </span>
              </div>
            )}

            {/* General error */}
            {formErrors.general && (
              <div style={styles.errorBanner}>
                ⚠ {formErrors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Address */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Your address
                </label>
                <input
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. House No 12, New Baneshwor"
                  style={{
                    ...styles.input,
                    ...(formErrors.address ? styles.inputError : {}),
                  }}
                />
                {formErrors.address && (
                  <p style={styles.fieldError}>{formErrors.address}</p>
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
                  placeholder="e.g. Baneshwor"
                  style={{
                    ...styles.input,
                    ...(formErrors.area ? styles.inputError : {}),
                  }}
                />
                {formErrors.area && (
                  <p style={styles.fieldError}>{formErrors.area}</p>
                )}
              </div>

              {/* Scheduled date & time */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Preferred date & time
                </label>
                <input
                  name="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={handleChange}
                  min={getMinDateTime()}
                  style={{
                    ...styles.input,
                    ...(formErrors.scheduled_at ? styles.inputError : {}),
                  }}
                />
                {formErrors.scheduled_at && (
                  <p style={styles.fieldError}>{formErrors.scheduled_at}</p>
                )}
              </div>

              {/* Note */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Note{" "}
                  <span style={styles.optionalLabel}>(optional)</span>
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Any special instructions for the worker..."
                  rows={3}
                  style={styles.textarea}
                />
              </div>

              {/* Price summary */}
              {selectedService && (
                <div style={styles.priceSummary}>
                  <span style={styles.priceSummaryLabel}>
                    Total estimated
                  </span>
                  <span style={styles.priceSummaryValue}>
                    {formatPrice(selectedService.my_price)}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                style={{
                  ...styles.submitBtn,
                  opacity: bookingMutation.isPending ? 0.7 : 1,
                  cursor: bookingMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {bookingMutation.isPending
                  ? "Sending booking..."
                  : "Confirm Booking"}
              </button>

            </form>
          </section>
        )}

        {/* ── Unavailable warning ── */}
        {!worker.is_available && (
          <div style={styles.unavailableCard}>
            <p style={styles.unavailableText}>
              ⚠ This worker is currently unavailable for new bookings.
            </p>
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
    maxWidth: "680px",
    margin: "0 auto",
    padding: "20px 16px 60px",
  },

  // Profile card
  profileCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  },
  profileTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontSize: "18px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "2px",
  },
  workerName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: 0,
  },
  verifiedBadge: {
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
    border: "1px solid #93C5FD",
    borderRadius: "20px",
    padding: "2px 7px",
  },
  workerArea: {
    fontSize: "13px",
    color: "#7A6055",
    margin: 0,
  },
  availBadge: {
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "20px",
    padding: "4px 10px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // Stats
  statsRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "14px",
  },
  statBox: {
    flex: 1,
    textAlign: "center",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#C84B2F",
    margin: "0 0 2px",
    letterSpacing: "1px",
  },
  statLabel: {
    fontSize: "11px",
    color: "#7A6055",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statDivider: {
    width: "1px",
    height: "32px",
    backgroundColor: "#F0E6DF",
  },
  bio: {
    fontSize: "14px",
    color: "#3D2B1F",
    lineHeight: 1.6,
    margin: 0,
  },
  bioEmpty: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: 0,
    fontStyle: "italic",
  },

  // Section
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  sectionSubtitle: {
    fontSize: "13px",
    color: "#9CA3AF",
    margin: "0 0 14px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#9CA3AF",
  },

  // Service cards
  servicesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "border-color 0.2s",
  },
  serviceCardSelected: {
    borderColor: "#C84B2F",
    backgroundColor: "#FFFAF8",
  },
  serviceCardLeft: {
    flexShrink: 0,
  },
  radioCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #E0D5CF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#C84B2F",
  },
  radioDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#C84B2F",
  },
  serviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1A0A00",
    margin: "0 0 2px",
  },
  serviceDesc: {
    fontSize: "13px",
    color: "#7A6055",
    margin: "0 0 4px",
  },
  serviceMetaRow: {
    display: "flex",
    gap: "12px",
  },
  serviceDuration: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  servicePrice: {
    textAlign: "right",
    flexShrink: 0,
  },
  servicePriceValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#C84B2F",
    margin: "0 0 2px",
  },
  servicePriceLabel: {
    fontSize: "11px",
    color: "#9CA3AF",
    margin: 0,
  },

  // Booking form
  selectedServiceSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF1ED",
    border: "1px solid #FECDC5",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "20px",
  },
  selectedServiceName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#3D2B1F",
  },
  selectedServicePrice: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#C84B2F",
  },
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
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#3D2B1F",
    marginBottom: "6px",
  },
  optionalLabel: {
    fontSize: "12px",
    color: "#9CA3AF",
    fontWeight: 400,
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
  textarea: {
    width: "100%",
    padding: "11px 14px",
    fontSize: "15px",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#FFFAF7",
    color: "#1A0A00",
    resize: "vertical",
    fontFamily: "inherit",
  },
  priceSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E0D5CF",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
  },
  priceSummaryLabel: {
    fontSize: "14px",
    color: "#7A6055",
    fontWeight: 500,
  },
  priceSummaryValue: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1A0A00",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },

  // Unavailable
  unavailableCard: {
    backgroundColor: "#FEF9C3",
    border: "1px solid #FDE047",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "20px",
  },
  unavailableText: {
    fontSize: "14px",
    color: "#854D0E",
    margin: 0,
    fontWeight: 500,
  },

  // Loading / error / success
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
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
  backLinkBtn: {
    background: "none",
    border: "none",
    color: "#C84B2F",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "16px",
    padding: "48px 32px",
    textAlign: "center",
    maxWidth: "360px",
    width: "100%",
  },
  successIcon: {
    fontSize: "48px",
    margin: "0 0 16px",
  },
  successTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 8px",
  },
  successSubtitle: {
    fontSize: "14px",
    color: "#7A6055",
    margin: 0,
    lineHeight: 1.6,
  },
};