// src/pages/shared/HomePage.jsx
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentUser } from "../../store/slices/authSlice";

// ── Service categories with icons ─────────────────────────────────────────────
const CATEGORIES = [
  { icon: "🔧", name: "Plumbing", desc: "Pipe repair, tap installation" },
  { icon: "⚡", name: "Electrical", desc: "Wiring, bulb fitting, repairs" },
  { icon: "🧹", name: "Cleaning", desc: "Deep clean, regular housekeeping" },
  { icon: "🎨", name: "Painting", desc: "Interior and exterior painting" },
  { icon: "🪚", name: "Carpentry", desc: "Furniture repair and woodwork" },
  { icon: "❄️", name: "AC Repair", desc: "Installation and servicing" },
  { icon: "🌿", name: "Gardening", desc: "Lawn care and plant maintenance" },
  { icon: "👨‍🍳", name: "Cooking", desc: "Home chef and meal prep" },
];

// ── How it works steps ────────────────────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    icon: "🔍",
    title: "Browse workers",
    desc: "Search by service category or area across Kathmandu valley.",
  },
  {
    number: "02",
    icon: "📅",
    title: "Book instantly",
    desc: "Pick a time slot, add your address, and confirm your booking.",
  },
  {
    number: "03",
    icon: "✅",
    title: "Get it done",
    desc: "Worker arrives, completes the job, and you rate the experience.",
  },
];

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "500+", label: "Happy customers" },
  { value: "50+", label: "Verified workers" },
  { value: "10+", label: "Service categories" },
  { value: "4.8★", label: "Average rating" },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Sita Maharjan",
    area: "Patan, Lalitpur",
    rating: 5,
    text: "Found a plumber within minutes. He arrived on time and fixed everything professionally. Highly recommend GharChore!",
    initials: "SM",
  },
  {
    name: "Rohan Shrestha",
    area: "Thamel, Kathmandu",
    rating: 5,
    text: "Booked an electrician for my new apartment. The process was so simple and the worker was verified and trustworthy.",
    initials: "RS",
  },
  {
    name: "Anita Tamang",
    area: "Bhaktapur",
    rating: 5,
    text: "GharChore saved me so much time. I got a cleaner for my home within the same day. Amazing service!",
    initials: "AT",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (user?.role === "worker") {
        navigate("/worker/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/register");
    }
  };

  const handleBrowseServices = () => {
    if (isAuthenticated) {
      navigate("/search-workers");
    } else {
      navigate("/register");
    }
  };

  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.navLogo}>🏠</span>
          <span style={styles.navName}>GharKoKaam</span>
        </div>
        <div style={styles.navLinks}>
          {isAuthenticated ? (
            <button
              onClick={() =>
                navigate(user?.role === "worker" ? "/worker/dashboard" : "/dashboard")
              }
              style={styles.navCta}
            >
              Go to dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                style={styles.navLoginBtn}
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/register")}
                style={styles.navCta}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            🇳🇵 Serving Kathmandu Valley
          </div>
          <h1 style={styles.heroTitle}>
            Trusted home services,<br />
            at your doorstep
          </h1>
          <p style={styles.heroSubtitle}>
            Book verified plumbers, electricians, cleaners, and more —
            all from your phone. Fast, reliable, and affordable.
          </p>
          <div style={styles.heroBtns}>
            <button onClick={handleGetStarted} style={styles.heroCtaBtn}>
              Book a service →
            </button>
            <button
              onClick={() => navigate("/register?role=worker")}
              style={styles.heroSecondaryBtn}
            >
              Join as a worker
            </button>
          </div>
        </div>

        {/* <div style={styles.heroCard}>
          <div style={styles.heroCardInner}>
            <div style={styles.heroCardHeader}>
              <div style={styles.heroCardAvatar}>HP</div>
              <div>
                <p style={styles.heroCardName}>Hari Plumber</p>
                <p style={styles.heroCardMeta}>⭐ 5.0 · Baneshwor</p>
              </div>
              <span style={styles.heroCardBadge}>Available</span>
            </div>
            <div style={styles.heroCardService}>
              <p style={styles.heroCardServiceName}>Pipe repair</p>
              <p style={styles.heroCardServicePrice}>Rs. 500</p>
            </div>
            <div style={styles.heroCardFooter}>
              <span style={styles.heroCardTime}>📅 Today, 3:00 PM</span>
              <button style={styles.heroCardBtn}>Book now</button>
            </div>
          </div>
        </div> */}

      </section>

      {/* ── Stats bar ── */}
      <section style={styles.statsBar}>
        {STATS.map((s) => (
          <div key={s.label} style={styles.statItem}>
            <p style={styles.statValue}>{s.value}</p>
            <p style={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Categories section ── */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Browse by service</h2>
          <p style={styles.sectionSubtitle}>
            Find the right professional for any home task
          </p>
        </div>
        <div style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={handleBrowseServices}
              style={styles.categoryCard}
            >
              <span style={styles.categoryIcon}>{cat.icon}</span>
              <p style={styles.categoryName}>{cat.name}</p>
              <p style={styles.categoryDesc}>{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ ...styles.section, backgroundColor: "#FFF7ED" }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>How it works</h2>
            <p style={styles.sectionSubtitle}>
              Get a professional at your door in 3 simple steps
            </p>
          </div>
          <div style={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <div key={step.number} style={styles.stepCard}>
                <div style={styles.stepNumber}>{step.number}</div>
                <div style={styles.stepIcon}>{step.icon}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={styles.stepArrow}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why GharChore ── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Why GharKoKaam?</h2>
            <p style={styles.sectionSubtitle}>
              We make home services simple, safe, and reliable
            </p>
          </div>
          <div style={styles.whyGrid}>
            {[
              {
                icon: "✓",
                title: "Verified workers",
                desc: "Every worker is background checked and verified before joining our platform.",
                color: "#DCFCE7",
                textColor: "#166534",
              },
              {
                icon: "⚡",
                title: "Fast booking",
                desc: "Book in under 2 minutes. No phone calls, no waiting — just instant confirmation.",
                color: "#DBEAFE",
                textColor: "#1E40AF",
              },
              {
                icon: "💰",
                title: "Transparent pricing",
                desc: "See exact prices before booking. No hidden charges or surprise fees.",
                color: "#FEF9C3",
                textColor: "#854D0E",
              },
              {
                icon: "⭐",
                title: "Rated & reviewed",
                desc: "Real reviews from real customers help you pick the best worker every time.",
                color: "#FFF1ED",
                textColor: "#C84B2F",
              },
            ].map((item) => (
              <div key={item.title} style={styles.whyCard}>
                <div
                  style={{
                    ...styles.whyIcon,
                    backgroundColor: item.color,
                    color: item.textColor,
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={styles.whyTitle}>{item.title}</h3>
                <p style={styles.whyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ ...styles.section, backgroundColor: "#FFF7ED" }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>What customers say</h2>
            <p style={styles.sectionSubtitle}>
              Real experiences from people across Kathmandu
            </p>
          </div>
          <div style={styles.testimonialsGrid}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={styles.testimonialCard}>
                <p style={styles.testimonialStars}>
                  {"★".repeat(t.rating)}
                </p>
                <p style={styles.testimonialText}>"{t.text}"</p>
                <div style={styles.testimonialAuthor}>
                  <div style={styles.testimonialAvatar}>{t.initials}</div>
                  <div>
                    <p style={styles.testimonialName}>{t.name}</p>
                    <p style={styles.testimonialArea}>📍 {t.area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>
            Ready to get started?
          </h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of happy customers across Kathmandu valley
          </p>
          <div style={styles.ctaBtns}>
            <button
              onClick={handleGetStarted}
              style={styles.ctaMainBtn}
            >
              Book a service now →
            </button>
            <button
              onClick={() => navigate("/register?role=worker")}
              style={styles.ctaWorkerBtn}
            >
              Become a worker
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}>🏠</span>
            <span style={styles.footerName}>GharKoKaam</span>
          </div>
          <p style={styles.footerTagline}>
            Trusted home services across Kathmandu valley
          </p>
          <p style={styles.footerCopy}>
            © 2026 GharKoKaam. Built by Madhusudan Bhandari
          </p>
        </div>
      </footer>

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflowX: "hidden",
  },

  // Navbar
  navbar: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #F0E6DF",
    padding: "0 24px",
    height: "64px",
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
  navLogo: { fontSize: "26px" },
  navName: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#C84B2F",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navLoginBtn: {
    background: "none",
    border: "1.5px solid #E0D5CF",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#3D2B1F",
    cursor: "pointer",
  },
  navCta: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  // Hero
  hero: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 24px 80px",
    display: "flex",
    alignItems: "center",
    gap: "48px",
    flexWrap: "wrap",
  },
  heroContent: {
    flex: "1 1 400px",
    minWidth: 0,
  },
  heroBadge: {
    display: "inline-block",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontSize: "13px",
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #FECDC5",
    marginBottom: "20px",
  },
  heroTitle: {
    fontSize: "42px",
    fontWeight: 800,
    color: "#1A0A00",
    lineHeight: 1.2,
    margin: "0 0 16px",
  },
  heroSubtitle: {
    fontSize: "17px",
    color: "#7A6055",
    lineHeight: 1.7,
    margin: "0 0 32px",
    maxWidth: "480px",
  },
  heroBtns: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  heroCtaBtn: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  heroSecondaryBtn: {
    backgroundColor: "transparent",
    color: "#C84B2F",
    border: "2px solid #C84B2F",
    borderRadius: "10px",
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  // Hero card
  heroCard: {
    flex: "1 1 300px",
    minWidth: 0,
    display: "flex",
    justifyContent: "center",
  },
  heroCardInner: {
    backgroundColor: "#FFFFFF",
    border: "2px solid #F0E6DF",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    maxWidth: "320px",
  },
  heroCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  heroCardAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontSize: "14px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroCardName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 2px",
  },
  heroCardMeta: {
    fontSize: "12px",
    color: "#7A6055",
    margin: 0,
  },
  heroCardBadge: {
    marginLeft: "auto",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #86EFAC",
    borderRadius: "20px",
    padding: "3px 8px",
    flexShrink: 0,
  },
  heroCardService: {
    backgroundColor: "#FFF7ED",
    borderRadius: "10px",
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  heroCardServiceName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A0A00",
    margin: 0,
  },
  heroCardServicePrice: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#C84B2F",
    margin: 0,
  },
  heroCardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCardTime: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  heroCardBtn: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "7px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  // Stats bar
  statsBar: {
    backgroundColor: "#1A0A00",
    padding: "32px 24px",
    display: "flex",
    justifyContent: "center",
    gap: "0",
    flexWrap: "wrap",
  },
  statItem: {
    textAlign: "center",
    padding: "0 40px",
    borderRight: "1px solid rgba(255,255,255,0.1)",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#C84B2F",
    margin: "0 0 4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
    margin: 0,
    fontWeight: 500,
  },

  // Sections
  section: {
    padding: "64px 0",
  },
  sectionInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "40px",
    maxWidth: "1100px",
    margin: "0 auto 40px",
    padding: "0 24px",
  },
  sectionTitle: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#1A0A00",
    margin: "0 0 10px",
  },
  sectionSubtitle: {
    fontSize: "16px",
    color: "#7A6055",
    margin: 0,
  },

  // Categories
  categoriesGrid: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "14px",
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "20px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  categoryIcon: {
    fontSize: "32px",
    marginBottom: "4px",
  },
  categoryName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: 0,
  },
  categoryDesc: {
    fontSize: "12px",
    color: "#9CA3AF",
    margin: 0,
    lineHeight: 1.4,
  },

  // Steps
  stepsGrid: {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
    position: "relative",
  },
  stepCard: {
    flex: "1 1 240px",
    maxWidth: "300px",
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "24px",
    textAlign: "center",
    position: "relative",
  },
  stepNumber: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#C84B2F",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  stepIcon: {
    fontSize: "36px",
    marginBottom: "12px",
  },
  stepTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 8px",
  },
  stepDesc: {
    fontSize: "14px",
    color: "#7A6055",
    margin: 0,
    lineHeight: 1.6,
  },
  stepArrow: {
    position: "absolute",
    right: "-20px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "20px",
    color: "#C84B2F",
    fontWeight: 700,
    zIndex: 1,
  },

  // Why section
  whyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  whyCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "24px",
  },
  whyIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "14px",
  },
  whyTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 8px",
  },
  whyDesc: {
    fontSize: "13px",
    color: "#7A6055",
    margin: 0,
    lineHeight: 1.6,
  },

  // Testimonials
  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  testimonialCard: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #F0E6DF",
    borderRadius: "14px",
    padding: "20px",
  },
  testimonialStars: {
    color: "#F59E0B",
    fontSize: "16px",
    margin: "0 0 10px",
    letterSpacing: "2px",
  },
  testimonialText: {
    fontSize: "14px",
    color: "#3D2B1F",
    lineHeight: 1.6,
    margin: "0 0 16px",
    fontStyle: "italic",
  },
  testimonialAuthor: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  testimonialAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#FFF1ED",
    color: "#C84B2F",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  testimonialName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1A0A00",
    margin: "0 0 2px",
  },
  testimonialArea: {
    fontSize: "12px",
    color: "#9CA3AF",
    margin: 0,
  },

  // CTA section
  ctaSection: {
    backgroundColor: "#1A0A00",
    padding: "80px 24px",
  },
  ctaInner: {
    maxWidth: "600px",
    margin: "0 auto",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "36px",
    fontWeight: 800,
    color: "#FFFFFF",
    margin: "0 0 12px",
  },
  ctaSubtitle: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.6)",
    margin: "0 0 32px",
  },
  ctaBtns: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  ctaMainBtn: {
    backgroundColor: "#C84B2F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  ctaWorkerBtn: {
    backgroundColor: "transparent",
    color: "#FFFFFF",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "10px",
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  // Footer
  footer: {
    backgroundColor: "#0F0600",
    padding: "40px 24px",
  },
  footerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    textAlign: "center",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  footerLogo: { fontSize: "24px" },
  footerName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#C84B2F",
  },
  footerTagline: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
    margin: "0 0 8px",
  },
  footerCopy: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
};