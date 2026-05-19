// src/pages/customer/SearchWorkers.jsx
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWorkers, getCategories } from "../../api/services";

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

// Common Kathmandu areas for the area filter dropdown
const AREAS = [
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

// ─────────────────────────────────────────────────────────────────────────────
export default function SearchWorkers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill category from URL if coming from dashboard category click
  // e.g. /search-workers?category=1
  const initialCategory = searchParams.get("category") || "";

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");         // search by name
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedArea, setSelectedArea] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // ── Fetch categories for filter dropdown ──────────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // ── Fetch workers — refetch when category or area filter changes ──────────
  const {
    data: workers = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workers", selectedCategory, selectedArea],
    queryFn: () =>
      getWorkers({
        category: selectedCategory,  // sent to Django as ?category=1
        area: selectedArea,          // sent to Django as ?area=Baneshwor
      }),
  });

  // ── Client-side filters (name search + available toggle) ──────────────────
  // Category and area are server-side (sent as query params)
  // Name search and available toggle are client-side for instant feedback
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesSearch =
        search === "" ||
        w.full_name.toLowerCase().includes(search.toLowerCase()) ||
        w.services_offered?.some((s) =>
          s.service?.name?.toLowerCase().includes(search.toLowerCase())
        );

      const matchesAvailable = !showAvailableOnly || w.is_available;

      return matchesSearch && matchesAvailable;
    });
  }, [workers, search, showAvailableOnly]);

  // ── Clear all filters ─────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedArea("");
    setShowAvailableOnly(false);
  };

  const hasActiveFilters =
    search || selectedCategory || selectedArea || showAvailableOnly;

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
        <span style={styles.navTitle}>Find Workers</span>
        <div style={{ width: "60px" }} />
      </nav>

      <main style={styles.main}>

        {/* ── Search bar ── */}
        <div style={styles.searchBar}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={styles.clearSearch}
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Filters row ── */}
        <div style={styles.filtersRow}>

          {/* Category dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.select}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Area dropdown */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            style={styles.select}
          >
            <option value="">All areas</option>
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {/* Available only toggle */}
          <button
            onClick={() => setShowAvailableOnly((v) => !v)}
            style={{
              ...styles.toggleBtn,
              ...(showAvailableOnly ? styles.toggleBtnActive : {}),
            }}
          >
            {showAvailableOnly ? "✓ " : ""}Available only
          </button>

        </div>

        {/* ── Results header ── */}
        <div style={styles.resultsHeader}>
          <p style={styles.resultsCount}>
            {isLoading
              ? "Searching..."
              : `${filteredWorkers.length} worker${filteredWorkers.length !== 1 ? "s" : ""} found`}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={styles.clearFiltersBtn}>
              Clear filters
            </button>
          )}
        </div>

        {/* ── Worker cards ── */}
        {isLoading ? (
          <div style={styles.loadingWrap}>
            <p style={styles.loadingText}>Finding workers near you...</p>
          </div>
        ) : isError ? (
          <div style={styles.errorWrap}>
            <p style={styles.errorText}>Failed to load workers.</p>
            <button onClick={refetch} style={styles.retryBtn}>
              Try again
            </button>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyIcon}>🔍</p>
            <p style={styles.emptyTitle}>No workers found</p>
            <p style={styles.emptySubtitle}>
              Try adjusting your filters or search term
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={styles.clearFiltersBtn}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.workersList}>
            {filteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onViewProfile={() => navigate(`/workers/${worker.id}`)}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

// ── Worker Card component ─────────────────────────────────────────────────────
function WorkerCard({ worker, onViewProfile }) {
  const rating = parseFloat(worker.avg_rating) || 0;

  return (
    <div style={styles.workerCard}>

      {/* ── Top row: avatar + name + badges ── */}
      <div style={styles.cardTop}>

        {/* Avatar circle with initials */}
        <div style={styles.avatar}>
          {worker.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>

        {/* Name + area */}
        <div style={styles.workerInfo}>
          <div style={styles.nameRow}>
            <h3 style={styles.workerName}>{worker.full_name}</h3>
            {worker.is_verified && (
              <span style={styles.verifiedBadge}>✓ Verified</span>
            )}
          </div>
          <p style={styles.workerArea}>📍 {worker.area}</p>
        </div>

        {/* Available / Unavailable pill */}
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

      {/* ── Stats row: rating + jobs + experience ── */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statStars}>
            {renderStars(worker.avg_rating)}
          </span>
          <span style={styles.statText}>
            {rating.toFixed(1)} ({worker.total_jobs} job{worker.total_jobs !== 1 ? "s" : ""})
          </span>
        </div>
        {worker.experience_years > 0 && (
          <div style={styles.stat}>
            <span style={styles.statText}>
              🏆 {worker.experience_years} yr{worker.experience_years !== 1 ? "s" : ""} exp
            </span>
          </div>
        )}
      </div>

      {/* ── Services offered ── */}
      {worker.services_offered?.length > 0 && (
        <div style={styles.servicesWrap}>
          {worker.services_offered
            .filter((s) => s.is_active)
            .slice(0, 3) // show max 3 services on card
            .map((s) => (
              <div key={s.id} style={styles.serviceChip}>
                <span style={styles.serviceChipName}>
                  {s.service?.name}
                </span>
                <span style={styles.serviceChipPrice}>
                  {formatPrice(s.my_price)}
                </span>
              </div>
            ))}
          {worker.services_offered.length > 3 && (
            <div style={styles.moreServices}>
              +{worker.services_offered.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* ── Bio (if exists) ── */}
      {worker.bio ? (
        <p style={styles.bio}>{worker.bio}</p>
      ) : null}

      {/* ── View Profile button ── */}
      <button
        onClick={onViewProfile}
        style={{
          ...styles.viewProfileBtn,
          ...(worker.is_available ? {} : styles.viewProfileBtnDisabled),
        }}
      >
        {worker.is_available ? "View Profile & Book →" : "View Profile →"}
      </button>

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
    padding: "20px 16px 48px",
  },

  // Search bar
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #E0D5CF",
    borderRadius: "12px",
    padding: "0 14px",
    marginBottom: "12px",
    gap: "10px",
  },
  searchIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "15px",
    padding: "12px 0",
    backgroundColor: "transparent",
    color: "#1A0A00",
  },
  clearSearch: {
    background: "none",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px",
    flexShrink: 0,
  },

  // Filters
  filtersRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  select: {
    flex: 1,
    minWidth: "140px",
    padding: "9px 12px",
    fontSize: "13px",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    color: "#3D2B1F",
    outline: "none",
    cursor: "pointer",
  },
  toggleBtn: {
    padding: "9px 14px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    color: "#7A6055",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  toggleBtnActive: {
    borderColor: "#C84B2F",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontWeight: 600,
  },

  // Results header
  resultsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  resultsCount: {
    fontSize: "14px",
    color: "#7A6055",
    margin: 0,
    fontWeight: 500,
  },
  clearFiltersBtn: {
    background: "none",
    border: "none",
    color: "#C84B2F",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },

  // Workers list
  workersList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  // Worker card
  workerCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "18px",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  avatar: {
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
  workerInfo: {
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
    fontSize: "16px",
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
    gap: "16px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statStars: {
    color: "#F59E0B",
    fontSize: "13px",
    letterSpacing: "1px",
  },
  statText: {
    fontSize: "13px",
    color: "#7A6055",
    fontWeight: 500,
  },

  // Services chips
  servicesWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
  },
  serviceChip: {
    backgroundColor: "#FFF7ED",
    border: "1px solid #FECDC5",
    borderRadius: "8px",
    padding: "5px 10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  serviceChipName: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#3D2B1F",
  },
  serviceChipPrice: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#C84B2F",
  },
  moreServices: {
    backgroundColor: "#F3F4F6",
    borderRadius: "8px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#6B7280",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
  },

  // Bio
  bio: {
    fontSize: "13px",
    color: "#7A6055",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },

  // View profile button
  viewProfileBtn: {
    width: "100%",
    padding: "11px",
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "center",
  },
  viewProfileBtnDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },

  // Loading / error / empty
  loadingWrap: {
    textAlign: "center",
    padding: "60px 0",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: "15px",
  },
  errorWrap: {
    textAlign: "center",
    padding: "60px 0",
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
  },
  emptySubtitle: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: "0 0 16px",
  },
};