import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, getServices } from "../../api/services";
import api from "../../api/axios";


const getMyServices = async () => {
  const response = await api.get("/services/my-services/");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const addMyService = async ({ service_id, my_price, my_duration }) => {
  const response = await api.post("/services/my-services/", {
    service_id,
    my_price,
    my_duration,
  });
  return response.data;
};

const deleteMyService = async (id) => {
  await api.delete(`/services/my-services/${id}/`);
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
  if (!price) return "—";
  return `Rs. ${parseFloat(price).toLocaleString()}`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ManageServices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Add form state ────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    service_id: "",
    my_price: "",
    my_duration: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ── Delete confirm state ──────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null); // id being confirmed for delete

  // ── Fetch my services ─────────────────────────────────────────────────────
  const {
    data: myServices = [],
    isLoading: myServicesLoading,
    isError: myServicesError,
  } = useQuery({
    queryKey: ["myServices"],
    queryFn: getMyServices,
  });

  // ── Fetch all available services to pick from ─────────────────────────────
  const { data: allServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
    // Normalize in case paginated
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  // ── Already added service IDs — to filter out from dropdown ──────────────
  const addedServiceIds = myServices.map((s) => s.service?.id);

  // ── Available services to add = all services minus already added ──────────
  const availableServices = allServices.filter(
    (s) => !addedServiceIds.includes(s.id) && s.is_active
  );

  // ── Add mutation ──────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: addMyService,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myServices"] });
      setShowAddForm(false);
      setFormData({ service_id: "", my_price: "", my_duration: "" });
      setFormErrors({});
    },

    onError: (error) => {
      const data = error.response?.data;
      if (data?.error) {
        setFormErrors({ general: data.error });
      } else if (typeof data === "object") {
        const mapped = {};
        for (const key in data) {
          mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
        setFormErrors(mapped);
      } else {
        setFormErrors({ general: "Failed to add service. Please try again." });
      }
    },
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteMyService,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myServices"] });
      setDeletingId(null);
    },

    onError: () => {
      alert("Failed to remove service. Please try again.");
      setDeletingId(null);
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

  const validate = () => {
    const e = {};

    if (!formData.service_id) {
      e.service_id = "Please select a service.";
    }
    if (!formData.my_price) {
      e.my_price = "Price is required.";
    } else if (isNaN(formData.my_price) || parseFloat(formData.my_price) <= 0) {
      e.my_price = "Enter a valid price.";
    }
    if (formData.my_duration && isNaN(formData.my_duration)) {
      e.my_duration = "Enter a valid duration in hours.";
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    addMutation.mutate({
      service_id: parseInt(formData.service_id),
      my_price: formData.my_price,
      my_duration: formData.my_duration || undefined,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <button
          onClick={() => navigate("/worker/dashboard")}
          style={styles.backBtn}
        >
          ← Back
        </button>
        <span style={styles.navTitle}>My Services</span>
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            setFormErrors({});
          }}
          style={styles.addBtn}
        >
          {showAddForm ? "✕ Cancel" : "+ Add"}
        </button>
      </nav>

      <main style={styles.main}>

        {/* ── Add service form ── */}
        {showAddForm && (
          <div style={styles.addFormCard}>
            <h2 style={styles.addFormTitle}>Add a new service</h2>

            {formErrors.general && (
              <div style={styles.errorBanner}>⚠ {formErrors.general}</div>
            )}

            <form onSubmit={handleAddSubmit} noValidate>

              {/* Service picker */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Service</label>
                {availableServices.length === 0 ? (
                  <p style={styles.noServicesText}>
                    All available services have been added already.
                  </p>
                ) : (
                  <select
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleChange}
                    style={{
                      ...styles.select,
                      ...(formErrors.service_id ? styles.inputError : {}),
                    }}
                  >
                    <option value="">Select a service...</option>
                    {availableServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — base Rs. {parseFloat(s.base_price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.service_id && (
                  <p style={styles.fieldError}>{formErrors.service_id}</p>
                )}
              </div>

              {/* My price */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Your price (Rs.)</label>
                <input
                  name="my_price"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.my_price}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  style={{
                    ...styles.input,
                    ...(formErrors.my_price ? styles.inputError : {}),
                  }}
                />
                {formErrors.my_price && (
                  <p style={styles.fieldError}>{formErrors.my_price}</p>
                )}
              </div>

              {/* My duration */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Duration (hours){" "}
                  <span style={styles.optionalLabel}>(optional)</span>
                </label>
                <input
                  name="my_duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.my_duration}
                  onChange={handleChange}
                  placeholder="e.g. 1.5"
                  style={{
                    ...styles.input,
                    ...(formErrors.my_duration ? styles.inputError : {}),
                  }}
                />
                {formErrors.my_duration && (
                  <p style={styles.fieldError}>{formErrors.my_duration}</p>
                )}
                <p style={styles.hint}>
                  Leave blank to use the service default duration
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  addMutation.isPending || availableServices.length === 0
                }
                style={{
                  ...styles.submitBtn,
                  opacity:
                    addMutation.isPending || availableServices.length === 0
                      ? 0.6
                      : 1,
                  cursor:
                    addMutation.isPending || availableServices.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {addMutation.isPending ? "Adding..." : "Add service"}
              </button>

            </form>
          </div>
        )}

        {/* ── My services list ── */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Your services ({myServices.length})
          </h2>
        </div>

        {myServicesLoading ? (
          <p style={styles.loadingText}>Loading your services...</p>
        ) : myServicesError ? (
          <p style={styles.errorText}>Failed to load services.</p>
        ) : myServices.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.emptyIcon}>🔧</p>
            <p style={styles.emptyTitle}>No services added yet</p>
            <p style={styles.emptySubtitle}>
              Add services so customers can find and book you.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={styles.emptyAddBtn}
            >
              + Add your first service
            </button>
          </div>
        ) : (
          <div style={styles.servicesList}>
            {myServices.map((s) => {
              const isDeleting = deletingId === s.id;

              return (
                <div key={s.id} style={styles.serviceCard}>

                  {/* ── Service info ── */}
                  <div style={styles.serviceCardTop}>
                    <div style={styles.serviceInfo}>
                      <p style={styles.serviceName}>{s.service?.name}</p>
                      {s.service?.description && (
                        <p style={styles.serviceDesc}>
                          {s.service.description}
                        </p>
                      )}
                    </div>
                    {/* Active indicator */}
                    <span
                      style={{
                        ...styles.activeBadge,
                        backgroundColor: s.is_active ? "#DCFCE7" : "#F3F4F6",
                        color: s.is_active ? "#166534" : "#6B7280",
                        border: `1px solid ${s.is_active ? "#86EFAC" : "#E5E7EB"}`,
                      }}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* ── Price + duration row ── */}
                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <p style={styles.metaLabel}>Your price</p>
                      <p style={styles.metaValue}>
                        {formatPrice(s.my_price)}
                      </p>
                    </div>
                    <div style={styles.metaDivider} />
                    <div style={styles.metaItem}>
                      <p style={styles.metaLabel}>Duration</p>
                      <p style={styles.metaValue}>
                        {s.my_duration
                          ? `${s.my_duration} hr${parseFloat(s.my_duration) !== 1 ? "s" : ""}`
                          : "—"}
                      </p>
                    </div>
                    <div style={styles.metaDivider} />
                    <div style={styles.metaItem}>
                      <p style={styles.metaLabel}>Base price</p>
                      <p style={{ ...styles.metaValue, color: "#9CA3AF" }}>
                        {formatPrice(s.service?.base_price)}
                      </p>
                    </div>
                  </div>

                  {/* ── Delete confirmation ── */}
                  {!isDeleting ? (
                    <button
                      onClick={() => setDeletingId(s.id)}
                      style={styles.removeBtn}
                    >
                      Remove service
                    </button>
                  ) : (
                    <div style={styles.deleteConfirm}>
                      <p style={styles.deleteConfirmText}>
                        Remove "{s.service?.name}" from your profile?
                      </p>
                      <div style={styles.deleteConfirmBtns}>
                        <button
                          onClick={() => setDeletingId(null)}
                          style={styles.deleteCancelBtn}
                        >
                          Keep it
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(s.id)}
                          disabled={deleteMutation.isPending}
                          style={{
                            ...styles.deleteConfirmBtn,
                            opacity: deleteMutation.isPending ? 0.7 : 1,
                            cursor: deleteMutation.isPending
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          {deleteMutation.isPending
                            ? "Removing..."
                            : "Yes, remove"}
                        </button>
                      </div>
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
  addBtn: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "7px 14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "60px",
  },

  // Main
  main: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "20px 16px 60px",
  },

  // Add form card
  addFormCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #C84B2F",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
  },
  addFormTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 16px",
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
    marginBottom: "16px",
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
  select: {
    width: "100%",
    padding: "11px 14px",
    fontSize: "14px",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#FFFAF7",
    color: "#1A0A00",
    cursor: "pointer",
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
  hint: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#9CA3AF",
  },
  noServicesText: {
    fontSize: "14px",
    color: "#9CA3AF",
    fontStyle: "italic",
    margin: 0,
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  // Section header
  sectionHeader: {
    marginBottom: "14px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: 0,
  },

  // Services list
  servicesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  // Service card
  serviceCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "16px",
  },
  serviceCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "12px",
  },
  serviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 4px",
  },
  serviceDesc: {
    fontSize: "13px",
    color: "#7A6055",
    margin: 0,
  },
  activeBadge: {
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "20px",
    padding: "3px 9px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // Meta row
  metaRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "14px",
  },
  metaItem: {
    flex: 1,
    textAlign: "center",
  },
  metaLabel: {
    fontSize: "11px",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontWeight: 600,
    margin: "0 0 2px",
  },
  metaValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#C84B2F",
    margin: 0,
  },
  metaDivider: {
    width: "1px",
    height: "28px",
    backgroundColor: "#F0E6DF",
  },

  // Remove button
  removeBtn: {
    background: "none",
    border: "1px solid #FCA5A5",
    borderRadius: "7px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#DC2626",
    cursor: "pointer",
  },

  // Delete confirm
  deleteConfirm: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    padding: "12px",
  },
  deleteConfirmText: {
    fontSize: "13px",
    color: "#991B1B",
    fontWeight: 500,
    margin: "0 0 10px",
  },
  deleteConfirmBtns: {
    display: "flex",
    gap: "8px",
  },
  deleteCancelBtn: {
    flex: 1,
    padding: "8px",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid #E0D5CF",
    borderRadius: "7px",
    background: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
  },
  deleteConfirmBtn: {
    flex: 1,
    padding: "8px",
    fontSize: "13px",
    fontWeight: 600,
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
  },

  // Loading / error / empty
  loadingText: {
    color: "#9CA3AF",
    fontSize: "14px",
  },
  errorText: {
    color: "#DC2626",
    fontSize: "14px",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "48px 24px",
    textAlign: "center",
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
  },
  emptySubtitle: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: "0 0 20px",
  },
  emptyAddBtn: {
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