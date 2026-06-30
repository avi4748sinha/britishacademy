import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  LockKeyhole,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import {
  achievements,
  downloads,
  facilities,
  feeStructure,
  galleryItems,
  heroSlides,
  notices,
  portalCards,
  reviewSources,
  school,
  stats,
} from "./data/schoolData";

const asset = (name) => `/assets/${name}`;
const API_BASE = "http://127.0.0.1:8000/api/v1";
const ADMISSION_POPUP_KEY = "ba_admission_popup_closed_v2";
const LOCAL_USERS = {
  student: { username: "BA2026001", password: "student123", name: "Ayaan Khan", role: "student" },
  teacher: { username: "TCH001", password: "teacher123", name: "Class Teacher", role: "teacher" },
  admin: { username: "admin", password: "admin123", name: "School Admin", role: "admin" },
};

const LOCAL_DASHBOARDS = {
  student: {
    summary: [
      { label: "Attendance", value: "94%" },
      { label: "Fee Status", value: "Clear" },
      { label: "Class Rank", value: "Top 10" },
      { label: "Notices", value: "4" },
    ],
    attendance: [
      { month: "June", present: "22", absent: "1", percentage: "96%" },
      { month: "July", present: "20", absent: "2", percentage: "91%" },
    ],
    fees: [
      { receipt_no: "BAF-1021", month: "June", amount: "Rs 850", status: "Paid" },
      { receipt_no: "BAF-1044", month: "July", amount: "Rs 850", status: "Paid" },
    ],
    results: [
      { subject: "English", marks: "88", grade: "A" },
      { subject: "Mathematics", marks: "91", grade: "A+" },
      { subject: "Science", marks: "86", grade: "A" },
    ],
  },
  teacher: {
    summary: [
      { label: "Assigned Classes", value: "5" },
      { label: "Attendance Pending", value: "1" },
      { label: "Homework", value: "3" },
      { label: "Notices", value: "4" },
    ],
    classes: [
      { class_name: "Class 6", section: "A", subject: "Science", students: "38" },
      { class_name: "Class 7", section: "A", subject: "Science", students: "35" },
    ],
    today: ["Mark Class 6 attendance", "Upload science homework", "Review activity photos"],
  },
  admin: {
    summary: [
      { label: "Students", value: "680+" },
      { label: "Teachers", value: "28" },
      { label: "Admissions", value: "Open" },
      { label: "Inquiries", value: "24" },
    ],
    students: [
      { admission_no: "BA2026001", name: "Ayaan Khan", class_name: "Class 6", status: "Active" },
      { admission_no: "BA2026002", name: "Sana Parween", class_name: "Class 5", status: "Active" },
    ],
    modules: ["Admissions", "Students", "Fees", "Attendance", "Results", "Notices", "Gallery"],
    activity: ["New admission inquiry received", "Notice board updated", "Gallery assets reviewed"],
  },
};

function localLogin(role, username, password) {
  if (!username.trim() || !password.trim()) {
    throw new Error("Enter username and password.");
  }
  const expected = LOCAL_USERS[role];
  const knownUser = Object.values(LOCAL_USERS).find((user) => user.username.toLowerCase() === username.trim().toLowerCase());
  if (knownUser && knownUser.password !== password) {
    throw new Error("Invalid login details.");
  }
  const user = knownUser || { ...expected, username: username.trim() };
  return {
    access_token: `local:${user.role}:${user.username}`,
    token_type: "bearer",
    user: { username: user.username, name: user.name, role: user.role },
  };
}

function localSessionFromToken(token) {
  if (!token?.startsWith("local:")) return null;
  const [, role, username] = token.split(":");
  const base = LOCAL_USERS[role] || LOCAL_USERS.student;
  return { username: username || base.username, name: base.name, role: base.role };
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdmissionPopup, setShowAdmissionPopup] = useState(() => {
    return sessionStorage.getItem(ADMISSION_POPUP_KEY) !== "yes";
  });

  function closeAdmissionPopup() {
    sessionStorage.setItem(ADMISSION_POPUP_KEY, "yes");
    setShowAdmissionPopup(false);
  }

  return (
    <div className="app-shell">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NoticeTicker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/academics" element={<AcademicsPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/notices" element={<NoticePage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      <Footer />
      {showAdmissionPopup && <AdmissionPopup onClose={closeAdmissionPopup} />}
    </div>
  );
}

function Header({ menuOpen, setMenuOpen }) {
  const navItems = [
    ["Home", "/"],
    ["About", "/about"],
    ["Academics", "/academics"],
    ["Admissions", "/admissions"],
    ["Achievements", "/achievements"],
    ["Gallery", "/gallery"],
    ["Notices", "/notices"],
    ["Reviews", "/reviews"],
    ["Contact", "/contact"],
  ];

  return (
    <header className="site-header">
      <div className="top-strip">
        <div className="container strip-inner">
          <span>UDISE: <strong>{school.udise}</strong></span>
          <span>Academic Year: <strong>{school.academicYear}</strong></span>
          <span>{school.stateLine}</span>
          <span className="status-pill">{school.status}</span>
        </div>
      </div>

      <div className="container brand-row">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <img src={asset("logo.png")} alt="British Academy logo" />
          <span>
            <strong>{school.name}</strong>
            <small>{school.place} | {school.established}</small>
          </span>
        </Link>
        <div className="header-actions">
          <a href={`tel:+91${school.phones[0]}`}>
            <Phone size={18} />
            {school.phones[0]}
          </a>
          <Link className="admission-chip" to="/admissions">Admission Open</Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="navMenu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        <div className={`container nav-menu ${menuOpen ? "open" : ""}`} id="navMenu">
          {navItems.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
              end={path === "/"}
            >
              {label}
            </NavLink>
          ))}
          <NavLink className="login-link" to="/login" onClick={() => setMenuOpen(false)}>
            Login
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

function AdmissionPopup({ onClose }) {
  return (
    <div className="admission-modal-backdrop" role="dialog" aria-modal="true" aria-label="Admissions open">
      <div className="admission-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close admission popup">
          <X size={22} />
        </button>
        <div className="modal-poster">
          <img src={asset("admissions-banner.png")} alt="British Academy admissions open poster" />
        </div>
        <div className="modal-copy">
          <p className="eyebrow">Admissions Open 2026-27</p>
          <h2>Pre-Nursery to Class 10</h2>
          <p>Smart classrooms, experienced faculty, transport facility and disciplined environment.</p>
          <div className="modal-actions">
            <Link className="btn primary" to="/admissions" onClick={onClose}>Apply Now</Link>
            <a className="btn secondary" href={`tel:+91${school.phones[0]}`}>Call Office</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const activeSlide = heroSlides[slideIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Official School Website | UDISE {school.udise}</p>
            <h1>British Academy Rafiganj</h1>
            <p className="hero-lead">
              {school.tagline} A disciplined, professional learning environment for academics,
              cultural confidence, sports, and value-based growth.
            </p>
            <div className="hero-verification">
              <span>Recognized Private School</span>
              <span>Academic Session 2026-27</span>
              <span>Raja Bagicha, Rafiganj</span>
            </div>
            <div className="hero-actions">
              <Link className="btn primary" to="/admissions">Apply For Admission</Link>
              <Link className="btn secondary" to="/gallery">View Campus Life</Link>
            </div>
            <div className="hero-service-row">
              <Link to="/login">Student ERP</Link>
              <Link to="/notices">Notice Board</Link>
              <Link to="/downloads">Downloads</Link>
              <Link to="/contact">Visit Campus</Link>
            </div>
          </div>
          <div className="hero-board hero-slider">
            <img src={activeSlide.image} alt={activeSlide.title} />
            <div className="hero-notice-card">
              <strong>{activeSlide.title}</strong>
              <span>British Academy | Session 2026-27</span>
            </div>
            <div className="slider-dots" aria-label="Hero slide selector">
              {heroSlides.map((slide, index) => (
                <button
                  aria-label={slide.title}
                  className={index === slideIndex ? "active" : ""}
                  key={slide.title}
                  type="button"
                  onClick={() => setSlideIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="container hero-bottom-strip">
          <span>Admissions Open</span>
          <strong>Pre-Nursery to Class 10</strong>
          <span>Call {school.phones.join(" / ")}</span>
        </div>
      </section>

      <StatsBand />

      <section className="section">
        <div className="container dashboard-grid">
          <div className="principal-card">
            <img src={asset("director-dr-ar-khan.png")} alt="Director Dr. A.R Khan" />
            <div>
              <p className="eyebrow">Director's Message</p>
              <h2>{school.director}</h2>
              <p>
                British Academy works with sincerity, discipline and parent trust. Our aim is to
                help every child grow through steady academics, character, confidence and activity.
              </p>
              <Link className="text-link" to="/about">Read school profile</Link>
            </div>
          </div>
          <div className="notice-panel">
            <div className="panel-title">
              <ClipboardList size={22} />
              <h2>Notice Board</h2>
            </div>
            {notices.slice(0, 4).map((notice) => (
              <Link className="notice-item" to="/notices" key={notice.title}>
                <span>{notice.date}</span>
                <strong>{notice.title}</strong>
                <small>{notice.body}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section muted">
        <div className="container">
          <SectionIntro eyebrow="Academics & Facilities" title="Everything parents expect from a serious school website." />
          <div className="feature-grid">
            {facilities.slice(0, 6).map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid-3">
          {achievements.map((item) => (
            <article className="media-card" key={item.title}>
              <img src={item.image} alt={item.title} />
              <div>
                <span>{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ReviewPreview />
      <AdmissionCta />
    </main>
  );
}

function AboutPage() {
  return (
    <PageShell eyebrow="About British Academy" title="A recognized school serving Rafiganj with discipline and care.">
      <div className="two-column">
        <div className="prose">
          <p>
            British Academy, Rafiganj, Aurangabad (Bihar) is a co-educational private recognized
            institution focused on steady academics, manners, participation and parent communication.
          </p>
          <p>
            The school record lists UDISE Code {school.udise}, operational status, and location in
            Rafiganj block of Aurangabad district. The public website is structured for notices,
            admissions, gallery, achievements, downloads, and future ERP portals.
          </p>
          <div className="info-list">
            <span>Co-ed School</span>
            <span>Private Recognized</span>
            <span>Raja Bagicha, Rafiganj</span>
            <span>Academic Year {school.academicYear}</span>
          </div>
        </div>
        <figure className="official-card">
          <img src={asset("udise-details.png")} alt="UDISE details" />
          <figcaption>Official school details snapshot</figcaption>
        </figure>
      </div>
    </PageShell>
  );
}

function AcademicsPage() {
  return (
    <PageShell eyebrow="Academics" title="Structured learning from early classes to board preparation.">
      <div className="feature-grid">
        {facilities.map((item) => (
          <FeatureCard key={item.title} item={item} />
        ))}
      </div>
      <div className="academic-table">
        {[
          ["Class Range", "Pre-Nursery to Class 10"],
          ["Learning Pattern", "C.B.S.E. curriculum based preparation"],
          ["Focus Areas", "Reading, writing, discipline, assessments, activities"],
          ["Support", "Homework, notice updates, parent communication"],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{label}</strong>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function AdmissionsPage() {
  const [form, setForm] = useState({
    student_name: "",
    class_applied: "Class 1",
    parent_name: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");

  async function submitAdmission(event) {
    event.preventDefault();
    setMessage("Submitting inquiry...");
    try {
      const response = await fetch(`${API_BASE}/admission-inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to submit inquiry");
      setMessage(`Inquiry saved. Reference: ${data.reference_no}`);
      setForm({ student_name: "", class_applied: "Class 1", parent_name: "", phone: "", address: "" });
    } catch (err) {
      setMessage(err.message);
    }
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <PageShell eyebrow="Admissions Open" title="Admission process for Academic Session 2026-27.">
      <div className="admission-layout">
        <div className="admission-box">
          <h2>Pre-Nursery to Class 10</h2>
          <p>
            Parents can contact the school office for admission form, documents, class availability,
            fee details and transport route confirmation.
          </p>
          <div className="call-grid">
            {school.phones.map((phone) => (
              <a href={`tel:+91${phone}`} key={phone}>
                <Phone size={18} />
                {phone}
              </a>
            ))}
          </div>
        </div>
        <ol className="timeline">
          {["Inquiry and campus visit", "Admission form and document check", "Student interaction", "Fee submission and admission number"].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="admission-workspace">
        <form className="admission-form" onSubmit={submitAdmission}>
          <h2>New Admission Inquiry</h2>
          <div className="form-grid">
            <label>
              Student Name
              <input value={form.student_name} onChange={(event) => updateForm("student_name", event.target.value)} required />
            </label>
            <label>
              Class Applied
              <select value={form.class_applied} onChange={(event) => updateForm("class_applied", event.target.value)}>
                {["Pre-Nursery", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Parent Name
              <input value={form.parent_name} onChange={(event) => updateForm("parent_name", event.target.value)} required />
            </label>
            <label>
              Mobile Number
              <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} required />
            </label>
          </div>
          <label>
            Address / Message
            <textarea value={form.address} onChange={(event) => updateForm("address", event.target.value)} rows="4" />
          </label>
          <button className="btn primary" type="submit">Submit Inquiry</button>
          {message && <p className="form-note">{message}</p>}
        </form>
        <div className="fee-card">
          <h2>Fee Structure</h2>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Admission Fee</th>
                  <th>Monthly Fee</th>
                  <th>Exam Fee</th>
                  <th>Transport</th>
                </tr>
              </thead>
              <tbody>
                {feeStructure.map((row) => (
                  <tr key={row.className}>
                    <td>{row.className}</td>
                    <td>{row.admissionFee}</td>
                    <td>{row.monthlyFee}</td>
                    <td>{row.examFee}</td>
                    <td>{row.transport}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function AchievementsPage() {
  return (
    <PageShell eyebrow="Achievements" title="Results, press coverage, competitions and recognition.">
      <div className="content-grid-3">
        {achievements.concat([
          {
            title: "Award & Prize Distribution",
            type: "Event",
            body: "Students are encouraged through regular competitions, certificates and prize distribution.",
            image: "/assets/awards-trophies.png",
          },
        ]).map((item) => (
          <article className="media-card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <span>{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function GalleryPage() {
  const [filter, setFilter] = useState("all");
  const items = useMemo(
    () => (filter === "all" ? galleryItems : galleryItems.filter((item) => item.category === filter)),
    [filter]
  );

  return (
    <PageShell eyebrow="Gallery" title="Events, learning activities, guests, sports and school moments.">
      <div className="filter-tabs">
        {["all", "events", "awards", "learning", "sports", "faculty", "press"].map((item) => (
          <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {items.map((item) => (
          <article key={item.title}>
            <img src={item.image} alt={item.title} />
            <h3>{item.title}</h3>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function NoticePage() {
  return (
    <PageShell eyebrow="Notice Board" title="Latest school updates and circulars.">
      <div className="notice-list">
        {notices.map((notice) => (
          <article key={notice.title}>
            <span>{notice.date}</span>
            <h3>{notice.title}</h3>
            <p>{notice.body}</p>
            <strong>{notice.status}</strong>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function DownloadsPage() {
  return (
    <PageShell eyebrow="Downloads" title="Forms, circulars and school documents.">
      <div className="download-list">
        {downloads.map((item) => (
          <article key={item.title}>
            <FileText size={24} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <button type="button">
              <Download size={18} />
              PDF
            </button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function ReviewsPage() {
  return (
    <PageShell eyebrow="Reviews & Public Presence" title="Google and Justdial review section ready for live connection.">
      <div className="reviews-page-grid">
        {reviewSources.map((source) => (
          <article className="source-card" key={source.name}>
            <div>
              <Star size={24} />
              <h3>{source.name}</h3>
            </div>
            <p>{source.description}</p>
            <a href={source.url} target="_blank" rel="noreferrer">{source.action}</a>
          </article>
        ))}
      </div>
      <div className="review-wall">
        {["Supportive teachers and disciplined school environment.", "Regular activities, competitions and result updates are appreciated.", "Good option for parents looking for school education in Rafiganj."].map((review) => (
          <article key={review}>
            <div className="stars">5.0 / 5</div>
            <p>{review}</p>
            <span>Parent feedback format</span>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell eyebrow="Contact" title="Visit British Academy at Raja Bagicha, Rafiganj.">
      <div className="contact-grid">
        <div className="contact-card">
          <h2>{school.name}</h2>
          <p>{school.address}</p>
          <p>Director: {school.director}</p>
          <div className="call-grid">
            {school.phones.map((phone) => (
              <a href={`tel:+91${phone}`} key={phone}>
                <Phone size={18} />
                {phone}
              </a>
            ))}
          </div>
          <a className="btn primary" href={school.mapUrl} target="_blank" rel="noreferrer">Open Google Map</a>
        </div>
        <iframe
          title="British Academy location map"
          src="https://www.google.com/maps?q=British%20Academy%20Rafiganj%20Aurangabad%20Bihar&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </PageShell>
  );
}

function LoginPage() {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("BA2026001");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const presets = {
    student: ["BA2026001", "student123"],
    teacher: ["TCH001", "teacher123"],
    admin: ["admin", "admin123"],
  };

  function chooseRole(nextRole) {
    setRole(nextRole);
    setUsername(presets[nextRole][0]);
    setPassword("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("ba_token", data.access_token);
      localStorage.setItem("ba_user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      try {
        const localSession = localLogin(role, username, password);
        localStorage.setItem("ba_token", localSession.access_token);
        localStorage.setItem("ba_user", JSON.stringify(localSession.user));
        window.location.href = "/dashboard";
      } catch (localErr) {
        setError(localErr.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell eyebrow="ERP Login" title="Role-based school ERP portals.">
      <div className="login-layout">
        <form className="login-form-panel" onSubmit={handleSubmit}>
          <div className="login-form-head">
            <img src={asset("logo.png")} alt="British Academy logo" />
            <div>
              <span>Secure School Portal</span>
              <strong>{role[0].toUpperCase() + role.slice(1)} Login</strong>
            </div>
          </div>
          <div className="role-tabs">
            {["student", "teacher", "admin"].map((item) => (
              <button className={role === item ? "active" : ""} key={item} type="button" onClick={() => chooseRole(item)}>
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <label>
            Username / Admission Number
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter school ID" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login To Dashboard"}
          </button>
        </form>
        <div className="login-showcase">
          <div className="login-showcase-card">
            <span>British Academy ERP</span>
            <h2>One dashboard for students, teachers and management.</h2>
            <p>Attendance, results, fees, notices, admissions and school communication in a clean role-based portal.</p>
          </div>
          <div className="portal-grid compact">
            {portalCards.map((portal) => (
              <article className="login-card" key={portal.title}>
                <LockKeyhole size={28} />
                <h3>{portal.title}</h3>
                <p>{portal.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function DashboardPage() {
  const [state, setState] = useState({ loading: true, user: null, data: null, error: "" });

  useEffect(() => {
    const token = localStorage.getItem("ba_token");
    if (!token) {
      setState({ loading: false, user: null, data: null, error: "Please login first." });
      return;
    }

    async function loadDashboard() {
      try {
        const localUser = localSessionFromToken(token);
        if (localUser) {
          setState({ loading: false, user: localUser, data: LOCAL_DASHBOARDS[localUser.role], error: "" });
          return;
        }
        const [meResponse, dashboardResponse] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/erp/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const user = await meResponse.json();
        const data = await dashboardResponse.json();
        if (!meResponse.ok) throw new Error(user.detail || "Session expired");
        if (!dashboardResponse.ok) throw new Error(data.detail || "Dashboard unavailable");
        setState({ loading: false, user, data, error: "" });
      } catch (err) {
        const cachedUser = JSON.parse(localStorage.getItem("ba_user") || "null");
        if (cachedUser?.role && LOCAL_DASHBOARDS[cachedUser.role]) {
          setState({ loading: false, user: cachedUser, data: LOCAL_DASHBOARDS[cachedUser.role], error: "" });
          return;
        }
        localStorage.removeItem("ba_token");
        localStorage.removeItem("ba_user");
        setState({ loading: false, user: null, data: null, error: err.message });
      }
    }

    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("ba_token");
    localStorage.removeItem("ba_user");
    window.location.href = "/login";
  }

  if (state.loading) {
    return (
      <PageShell eyebrow="ERP Dashboard" title="Loading dashboard...">
        <p>Fetching secure ERP data.</p>
      </PageShell>
    );
  }

  if (state.error) {
    return (
      <PageShell eyebrow="ERP Dashboard" title="Login required">
        <div className="empty-state">
          <p>{state.error}</p>
          <Link className="btn primary" to="/login">Go To Login</Link>
        </div>
      </PageShell>
    );
  }

  const { user, data } = state;

  return (
    <PageShell eyebrow={`${user.role} Dashboard`} title={`Welcome, ${user.name}`}>
      <div className="dashboard-toolbar">
        <div>
          <strong>{user.role.toUpperCase()}</strong>
          <span>{user.username}</span>
        </div>
        <button className="btn secondary" type="button" onClick={logout}>Logout</button>
      </div>

      <div className="erp-summary-grid">
        {data.summary.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      {user.role === "student" && <StudentDashboard data={data} />}
      {user.role === "teacher" && <TeacherDashboard data={data} />}
      {user.role === "admin" && <AdminDashboard data={data} />}
    </PageShell>
  );
}

function StudentDashboard({ data }) {
  return (
    <div className="erp-grid">
      <ErpTable title="Attendance" rows={data.attendance} />
      <ErpTable title="Fee Receipts" rows={data.fees} />
      <ErpTable title="Results" rows={data.results} />
    </div>
  );
}

function TeacherDashboard({ data }) {
  return (
    <div className="erp-grid">
      <ErpTable title="Assigned Classes" rows={data.classes} />
      <article className="erp-panel">
        <h3>Today's Work</h3>
        {data.today.map((item) => <p key={item}>{item}</p>)}
      </article>
    </div>
  );
}

function AdminDashboard({ data }) {
  return (
    <div className="erp-grid">
      <ErpTable title="Students" rows={data.students} />
      <article className="erp-panel">
        <h3>Modules</h3>
        <div className="module-pills">
          {data.modules.map((item) => <span key={item}>{item}</span>)}
        </div>
      </article>
      <article className="erp-panel">
        <h3>Activity</h3>
        {data.activity.map((item) => <p key={item}>{item}</p>)}
      </article>
    </div>
  );
}

function ErpTable({ title, rows }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return (
    <article className="erp-panel">
      <h3>{title}</h3>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => <td key={column}>{row[column]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function NoticeTicker() {
  return (
    <section className="notice-band" aria-label="Latest notices">
      <div className="container notice-inner">
        <strong>Latest Notice</strong>
        <div className="notice-marquee">
          {[...notices, ...notices].map((notice, index) => (
            <span key={`${notice.title}-${index}`}>{notice.title}: {notice.body}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const icons = [Building2, GraduationCap, Users, Award];
  return (
    <section className="stats-band">
      <div className="container stats-grid">
        {stats.map((item, index) => {
          const Icon = icons[index];
          return (
            <div key={item.label}>
              <Icon size={26} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FeatureCard({ item }) {
  const icons = {
    academics: BookOpen,
    safety: ShieldCheck,
    activity: CalendarDays,
    transport: MapPin,
    results: Award,
    digital: ClipboardList,
  };
  const Icon = icons[item.kind] || CheckCircle2;
  return (
    <article className="feature-card">
      <Icon size={26} />
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </article>
  );
}

function ReviewPreview() {
  return (
    <section className="section reviews-section">
      <div className="container reviews-grid">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2>Google and Justdial ready review display.</h2>
          <p>
            This section is prepared for verified live reviews. Until API/widget access is provided,
            it shows clear source cards and parent feedback formatting without fake scraped reviews.
          </p>
          <Link className="btn secondary" to="/reviews">View Review Page</Link>
        </div>
        <div className="review-card">
          <div className="stars">5.0 / 5</div>
          <strong>Public Review Hub</strong>
          <p>Google Maps and Justdial links can be connected for real-time public trust signals.</p>
        </div>
      </div>
    </section>
  );
}

function AdmissionCta() {
  return (
    <section className="admission-cta">
      <div className="container cta-grid">
        <div>
          <p className="eyebrow">Admissions Open</p>
          <h2>Session 2026-27 applications are open.</h2>
        </div>
        <Link className="btn primary" to="/admissions">Start Admission Process</Link>
      </div>
    </section>
  );
}

function PageShell({ eyebrow, title, children }) {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </section>
      <section className="section">
        <div className="container">{children}</div>
      </section>
    </main>
  );
}

function SectionIntro({ eyebrow, title }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img src={asset("logo.png")} alt="British Academy logo" />
          <h2>{school.name}</h2>
          <p>{school.address}</p>
          <p>UDISE: {school.udise}</p>
        </div>
        <div>
          <h3>Website</h3>
          <Link to="/about">About</Link>
          <Link to="/admissions">Admissions</Link>
          <Link to="/notices">Notice Board</Link>
          <Link to="/downloads">Downloads</Link>
        </div>
        <div>
          <h3>Campus Life</h3>
          <Link to="/achievements">Achievements</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h3>Portals</h3>
          <Link to="/login">Student Login</Link>
          <Link to="/login">Teacher Login</Link>
          <Link to="/login">Admin Login</Link>
        </div>
      </div>
      <div className="footer-bottom">Copyright 2026 British Academy Rafiganj. Official website and ERP foundation.</div>
    </footer>
  );
}
