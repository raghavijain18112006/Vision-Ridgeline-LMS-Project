import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import { flattenLessons, fmtTime, fmtMoney } from "./data.js";
import { ProfileView } from "./components/ProfileView.jsx";
import { Checkout } from "./components/Checkout.jsx";
import { OrderConfirmation } from "./components/OrderConfirmation.jsx";

const nav = {
  student: [
    ["catalog", "Explore"],
    ["my-courses", "My learning"],
    ["cart", "Shopping cart"],
    ["profile", "My profile"],
    ["dashboard", "Analytics"]
  ],
  instructor: [
    ["instructor-courses", "Studio"],
    ["instructor-analytics", "Insights"],
    ["profile", "My profile"]
  ],
  admin: [
    ["admin-approvals", "Approvals"],
    ["admin-users", "Users"],
    ["admin-revenue", "Revenue"],
    ["profile", "My profile"]
  ]
};

const titles = {
  catalog: ["Explore learning", "Build skills that move you forward."],
  "my-courses": ["My learning", "Pick up exactly where you left off."],
  cart: ["Shopping cart", "Review your selected courses."],
  checkout: ["Secure Checkout", "Complete your course purchase via Razorpay."],
  "order-confirmation": ["Order Confirmed", "Your course access is activated."],
  profile: ["My Profile", "Manage your account, view invoices and track learning."],
  dashboard: ["Your progress", "A clear view of your learning momentum."],
  "instructor-courses": ["Creator studio", "Shape memorable learning experiences."],
  "instructor-analytics": ["Learning insights", "Understand engagement at a glance."],
  "admin-approvals": ["Review center", "Keep the learning library trustworthy."],
  "admin-users": ["People & access", "Manage the learning community."],
  "admin-revenue": ["Platform overview", "Real-time course enrollments and revenue."]
};

function Stat({ icon, value, label, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && <div className="trend">{trend}</div>}
    </div>
  );
}

function Progress({ value = 0 }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Badge({ children, type = "" }) {
  return <span className={`badge ${type}`}>{children}</span>;
}

function CourseCard({ c, enrolled, onEnroll, onOpen, onAddToCart, onBuyNow, isInCart = false }) {
  return (
    <article className="course-card">
      <div className={`cover cover-${c.id}`}>
        <span>{c.category}</span>
        <b>{c.id === "c1" ? "REACT" : c.id === "c2" ? "API" : c.id === "c4" ? "UX" : c.id === "c5" ? "PY" : "CODE"}</b>
        <i>✦</i>
      </div>
      <div className="course-body">
        <div className="course-top">
          <Badge>{c.category}</Badge>
          <span className="rating">★ {c.rating || 4.5}</span>
        </div>
        <h3>{c.title}</h3>
        <p>{c.description}</p>
        <div className="course-meta">
          <span>◷ {flattenLessons(c).length} lessons</span>
          <span>◉ {c.students} learners</span>
        </div>
        <div className="course-bottom">
          <strong>{fmtMoney(c.price)}</strong>
          {enrolled ? (
            <button className="btn" onClick={() => onOpen(c.id)}>
              Continue →
            </button>
          ) : c.price === 0 ? (
            <>
              <button className="btn" onClick={() => onEnroll(c.id)}>
                Enroll Free →
              </button>
              <button className="text-btn" onClick={() => onOpen(c.id)}>
                Preview
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => onBuyNow(c.id)}>
                Buy Now →
              </button>
              {onAddToCart && (
                <button className="text-btn" onClick={() => onAddToCart(c)} disabled={isInCart}>
                  {isInCart ? "✓ In cart" : "+ Add to cart"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function FormField({ label, error, ...props }) {
  return (
    <label>
      {label}
      <input aria-invalid={Boolean(error)} aria-describedby={error ? `${props.name}-error` : undefined} {...props} />
      {error && (
        <small className="field-error" id={`${props.name}-error`}>
          {error}
        </small>
      )}
    </label>
  );
}

function LoginScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (mode === "signup" && name.trim().length < 2) next.name = "Enter your full name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setFieldErrors(next);
    if (Object.keys(next).length) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setError("");

    if (mode === "login") {
      const res = await onLogin({ email: email.trim(), password, role });
      if (!res?.success) setError(res?.error || "Login failed.");
    } else {
      const res = await onRegister({ name: name.trim(), email: email.trim(), password, role });
      if (!res?.success) setError(res?.error || "Sign up failed.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="brand auth-brand">
          <span>R</span> Ridgeline <small>LEARN</small>
        </div>
        <div className="auth-copy">
          <Badge type="gold">✦ THE FUTURE OF LEARNING</Badge>
          <h1>
            Learn boldly.
            <br />
            <span>Build brilliantly.</span>
          </h1>
          <p>A premium learning workspace for ambitious students, creators and teams.</p>
          <div className="auth-proof">
            <b>12k+</b>
            <span>learners growing their skills</span>
          </div>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-card-head">
          <span className="eyebrow">WELCOME TO RIDGELINE</span>
          <h2>{mode === "login" ? "Sign in to Ridgeline" : "Create your account"}</h2>
          <p>{mode === "login" ? "Continue your learning journey." : "Start building your future today."}</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <FormField
              label="Full name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              error={fieldErrors.name}
            />
          )}
          <FormField
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            error={fieldErrors.password}
          />
          <label>
            Workspace role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn auth-submit">{mode === "login" ? "Sign in →" : "Create account →"}</button>
        </form>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button
          className="social-btn"
          onClick={() =>
            onLogin({ email: "demo@ridgeline.app", password: "password123", role: "student" })
          }
        >
          ◉ Continue with demo account (Rhea Kapoor)
        </button>
        <p className="auth-switch">
          {mode === "login" ? "New to Ridgeline?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
        <small className="auth-note">Frontend demo with live Express backend & persistent data storage</small>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
    switchRole,
    courses,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    total,
    enrollments,
    enrollFreeCourse,
    progress,
    updateProgress,
    users,
    toggleUserStatus,
    createCourse,
    updateCourse,
    updateCourseStatus,
    toast,
    notify
  } = useApp();

  const role = user?.role || "student";

  const routeViews = {
    "/": "catalog",
    "/explore": "catalog",
    "/my-learning": "my-courses",
    "/cart": "cart",
    "/checkout": "checkout",
    "/profile": "profile",
    "/dashboard": "dashboard",
    "/studio": "instructor-courses",
    "/insights": "instructor-analytics",
    "/admin/approvals": "admin-approvals",
    "/admin/users": "admin-users",
    "/admin/revenue": "admin-revenue"
  };

  const pathViews = {
    catalog: "/explore",
    "my-courses": "/my-learning",
    cart: "/cart",
    checkout: "/checkout",
    profile: "/profile",
    dashboard: "/dashboard",
    "instructor-courses": "/studio",
    "instructor-analytics": "/insights",
    "admin-approvals": "/admin/approvals",
    "admin-users": "/admin/users",
    "admin-revenue": "/admin/revenue"
  };

  const [view, setView] = useState(routeViews[location.pathname] || "catalog");
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [checkoutCourseId, setCheckoutCourseId] = useState(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Instructor Course Editor modal
  const [courseEditor, setCourseEditor] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "Web Development",
    price: "0",
    description: "",
    instructor: user?.name || "Instructor"
  });

  // Sync URL routing
  useEffect(() => {
    const match = location.pathname.match(/^\/courses\/([^/]+)$/);
    if (match) {
      setActiveCourseId(decodeURIComponent(match[1]));
      setView("course-detail");
    } else {
      setView(routeViews[location.pathname] || "catalog");
      if (location.pathname !== "/courses") setActiveCourseId(null);
    }
  }, [location.pathname]);

  const go = (v) => {
    setView(v);
    if (v !== "course-detail") setActiveCourseId(null);
    if (pathViews[v]) navigate(pathViews[v]);
  };

  const openCourse = (id) => {
    setActiveCourseId(id);
    setView("course-detail");
    navigate(`/courses/${encodeURIComponent(id)}`);
  };

  const handleBuyNow = (id) => {
    setCheckoutCourseId(id);
    setView("checkout");
    navigate("/checkout");
  };

  const selectedCourse = courses.find((c) => c.id === activeCourseId);
  const isEnrolledInSelected = selectedCourse ? enrollments.includes(selectedCourse.id) : false;

  const heading = titles[view] || ["Course workspace", "Learn at your pace."];

  // User initials
  const initials = (user?.name || "RL")
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="brand">
          <span>R</span> Ridgeline <small>LEARN</small>
        </div>

        <button
          className="workspace workspace-button"
          onClick={() => go(role === "student" ? "catalog" : nav[role][0][0])}
          title="Open your learning hub"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }}
            />
          ) : (
            <span className="avatar">{initials}</span>
          )}
          <div>
            <b>{user?.name || "Learning Hub"}</b>
            <small>
              {role === "student"
                ? "Your learning space"
                : role === "instructor"
                ? "Creator workspace"
                : "Administration"}
            </small>
          </div>
          <span>↗</span>
        </button>

        <div className="nav-label">WORKSPACE</div>
        {nav[role]?.map(([id, label]) => (
          <button key={id} className={view === id ? "nav active" : "nav"} onClick={() => go(id)}>
            <span>
              {id === "catalog"
                ? "⌘"
                : id === "my-courses"
                ? "▣"
                : id === "cart"
                ? "🛒"
                : id === "profile"
                ? "👤"
                : id === "dashboard"
                ? "◒"
                : id === "instructor-courses"
                ? "✎"
                : id === "instructor-analytics"
                ? "◈"
                : id === "admin-approvals"
                ? "✓"
                : id === "admin-users"
                ? "♙"
                : "▥"}
            </span>
            {label}
            {id === "cart" && cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="mini-progress">
            <span>Weekly momentum</span>
            <b>4 / 5 hours</b>
            <Progress value={80} />
          </div>

          <button className="nav" onClick={() => notify("Help center: support@ridgeline.app")}>
            ? Help center
          </button>

          <button className="profile" onClick={() => setShowProfileMenu((v) => !v)}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }}
              />
            ) : (
              <span className="avatar">{initials}</span>
            )}
            <div>
              <b>{user?.name || "User"}</b>
              <small>{role.charAt(0).toUpperCase() + role.slice(1)} account</small>
            </div>
            <span>⋯</span>
          </button>

          {showProfileMenu && (
            <div className="popover profile-popover">
              <b>{user?.name}</b>
              <p>ID: {user?.studentId || "RL-2026"}</p>
              <p>Enrolled courses: {enrollments.length}</p>
              <p>
                Completed lessons:{" "}
                {Object.values(progress).reduce(
                  (n, c) => n + Object.values(c).filter((x) => x.complete).length,
                  0
                )}
              </p>
              <p>Streak: 4 days 🔥</p>
              <button
                className="text-btn"
                onClick={() => {
                  setShowProfileMenu(false);
                  go("profile");
                }}
              >
                View profile details →
              </button>
              <button
                className="text-btn danger-text"
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
              >
                Sign out ↗
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main">
        <header className="header">
          <div>
            <div className="eyebrow">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              }).toUpperCase()}
            </div>
            <h1>{heading[0]}</h1>
            <p>{heading[1]}</p>
          </div>

          <div className="header-actions">
            <div className="search">
              <span>⌕</span>
              <input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="notification-wrap">
              <button className="icon-button" onClick={() => setShowNotifications((v) => !v)}>
                ♢<em>2</em>
              </button>
              {showNotifications && (
                <div className="popover notification-popover">
                  <b>Notifications</b>
                  <p>🎉 Welcome to Ridgeline LMS!</p>
                  <p>📚 Enrolled in {enrollments.length} courses.</p>
                  <p>🔥 4-day learning streak active.</p>
                  <button
                    className="text-btn"
                    onClick={() => {
                      setShowNotifications(false);
                      notify("Notifications marked as read");
                    }}
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </div>

            <select
              value={role}
              onChange={(e) => {
                switchRole(e.target.value);
                go(nav[e.target.value][0][0]);
              }}
            >
              <option value="student">Student view</option>
              <option value="instructor">Instructor view</option>
              <option value="admin">Admin view</option>
            </select>
          </div>
        </header>

        {toast && <div className="toast">{toast}</div>}

        <section className="content">
          {/* ================= CATALOG VIEW ================= */}
          {view === "catalog" && (
            <>
              <div className="hero">
                <div>
                  <Badge type="gold">✦ PERSONALIZED FOR YOU</Badge>
                  <h2>
                    Learn something
                    <br />
                    <span>worth knowing.</span>
                  </h2>
                  <p>Curated courses, practical projects and progress that keeps you moving forward.</p>
                  <button className="btn light" onClick={() => go("my-courses")}>
                    Resume learning ↗
                  </button>
                </div>
                <div className="hero-art">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="hero-card">
                    <span>YOUR NEXT SKILL</span>
                    <b>
                      Build. Ship.
                      <br />
                      Grow.
                    </b>
                    <small>01 / 04</small>
                  </div>
                </div>
              </div>

              <div className="section-head">
                <div>
                  <h2>Explore courses</h2>
                  <p>Designed for curious minds and ambitious builders.</p>
                </div>
                <Badge>{courses.filter((c) => c.status === "approved").length} available</Badge>
              </div>

              <div className="filters">
                {["All", "Web Development", "Backend", "Design", "Data & AI", "Programming", "Cloud", "Career Skills"].map(
                  (cat) => (
                    <button
                      key={cat}
                      className={`filter ${category === cat ? "active" : ""}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat === "All" ? "All courses" : cat}
                    </button>
                  )
                )}
              </div>

              <div className="course-grid">
                {courses
                  .filter(
                    (c) =>
                      c.status === "approved" &&
                      (category === "All" || c.category === category) &&
                      `${c.title} ${c.category} ${c.instructor}`.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((c) => (
                    <CourseCard
                      key={c.id}
                      c={c}
                      enrolled={enrollments.includes(c.id)}
                      onEnroll={(id) => enrollFreeCourse(id)}
                      onOpen={(id) => openCourse(id)}
                      onAddToCart={(course) => addToCart(course)}
                      onBuyNow={(id) => handleBuyNow(id)}
                      isInCart={cart.some((item) => item.id === c.id)}
                    />
                  ))}
              </div>
            </>
          )}

          {/* ================= MY COURSES ================= */}
          {view === "my-courses" && (
            <>
              <div className="stats">
                <Stat icon="◈" value={enrollments.length} label="Active courses" trend="+1 this month" />
                <Stat icon="◷" value="4h 20m" label="Learning time" trend="+18% this week" />
                <Stat icon="✦" value="4" label="Day streak" trend="Keep it going" />
                <Stat
                  icon="✓"
                  value={
                    courses.filter((c) => {
                      if (!enrollments.includes(c.id)) return false;
                      const ls = flattenLessons(c);
                      return ls.length > 0 && ls.every((l) => progress[c.id]?.[l.id]?.complete);
                    }).length
                  }
                  label="Certificates"
                  trend="Earned"
                />
              </div>

              <div className="section-head">
                <div>
                  <h2>Continue learning</h2>
                  <p>Your active learning queue.</p>
                </div>
              </div>

              {courses.filter((c) => enrollments.includes(c.id)).length === 0 ? (
                <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
                  <h2>You haven't enrolled in any courses yet</h2>
                  <p className="muted">Explore our catalog and start learning today.</p>
                  <button className="btn" onClick={() => go("catalog")}>
                    Browse courses →
                  </button>
                </div>
              ) : (
                <div className="course-grid">
                  {courses
                    .filter((c) => enrollments.includes(c.id))
                    .map((c) => (
                      <CourseCard
                        key={c.id}
                        c={c}
                        enrolled
                        onOpen={(id) => openCourse(id)}
                        onEnroll={() => {}}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {/* ================= SHOPPING CART ================= */}
          {view === "cart" && (
            <>
              <div className="section-head">
                <div>
                  <h2>Your learning cart</h2>
                  <p>Review courses before proceeding to secure checkout.</p>
                </div>
                <Badge>
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </Badge>
              </div>

              {cart.length === 0 ? (
                <div className="panel empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <h2>Your cart is currently empty</h2>
                  <p className="muted">Explore the catalogue and add a course to start learning.</p>
                  <button className="btn" onClick={() => go("catalog")}>
                    Explore courses →
                  </button>
                </div>
              ) : (
                <div className="cart-layout">
                  <div className="panel cart-items">
                    {cart.map((item) => (
                      <div className="cart-item" key={item.id}>
                        <div className="cart-thumb">✦</div>
                        <div className="cart-item-info">
                          <b>{item.title}</b>
                          <small>
                            {item.category} · {item.instructor}
                          </small>
                          <button
                            className="text-btn danger-text"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <strong>{fmtMoney(item.price)}</strong>
                      </div>
                    ))}
                    <button className="text-btn" onClick={clearCart} style={{ marginTop: 14 }}>
                      Clear cart
                    </button>
                  </div>

                  <div className="panel cart-summary">
                    <span className="eyebrow">ORDER SUMMARY</span>
                    <h2>Summary</h2>
                    <div className="summary-line">
                      <span>Courses</span>
                      <b>{cart.length}</b>
                    </div>
                    <div className="summary-line">
                      <span>Subtotal</span>
                      <b>{fmtMoney(total)}</b>
                    </div>
                    <div className="summary-line">
                      <span>Estimated Taxes</span>
                      <Badge type="green">Included</Badge>
                    </div>
                    <div className="summary-total">
                      <span>Total</span>
                      <strong>{fmtMoney(total)}</strong>
                    </div>
                    <p className="muted">Official Razorpay checkout with server-verified signature.</p>
                    <button
                      className="btn auth-submit"
                      onClick={() => {
                        setCheckoutCourseId(null);
                        go("checkout");
                      }}
                    >
                      Proceed to Checkout →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= CHECKOUT VIEW ================= */}
          {view === "checkout" && (
            <Checkout
              courseId={checkoutCourseId}
              onCancel={() => go(cart.length > 0 ? "cart" : "catalog")}
              onOrderSuccess={(orderId) => {
                setConfirmedOrderId(orderId);
                go("order-confirmation");
              }}
            />
          )}

          {/* ================= ORDER CONFIRMATION VIEW ================= */}
          {view === "order-confirmation" && (
            <OrderConfirmation
              orderId={confirmedOrderId}
              onOpenCourse={(cid) => openCourse(cid)}
              onGoToLearning={() => go("my-courses")}
            />
          )}

          {/* ================= PROFILE VIEW (REFERENCE IMAGE ALIGNED) ================= */}
          {view === "profile" && (
            <ProfileView onOpenCourse={(cid) => openCourse(cid)} onNavigate={(v) => go(v)} />
          )}

          {/* ================= DASHBOARD VIEW ================= */}
          {view === "dashboard" && (
            <>
              <div className="stats">
                <Stat icon="◒" value="34%" label="Average completion" trend="+12% this week" />
                <Stat icon="▣" value={enrollments.length} label="Active enrolments" />
                <Stat
                  icon="✦"
                  value={
                    courses.filter((c) => {
                      if (!enrollments.includes(c.id)) return false;
                      const ls = flattenLessons(c);
                      return ls.length > 0 && ls.every((l) => progress[c.id]?.[l.id]?.complete);
                    }).length
                  }
                  label="Certificates earned"
                />
                <Stat icon="♧" value="4 days" label="Current streak" />
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-title">
                    <h2>Learning momentum</h2>
                    <Badge type="green">This month ↗</Badge>
                  </div>
                  <div className="chart">
                    <div className="chart-value">
                      4.2 <small>hours</small>
                    </div>
                    <div className="bars">
                      {[35, 55, 42, 70, 48, 82, 64, 90, 52, 76, 68, 94].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }}>
                          <i />
                        </span>
                      ))}
                    </div>
                    <div className="chart-labels">
                      <small>Week 1</small>
                      <small>Week 2</small>
                      <small>Week 3</small>
                      <small>Week 4</small>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">
                    <h2>Course progress</h2>
                    <button className="text-btn" onClick={() => go("my-courses")}>
                      View all →
                    </button>
                  </div>
                  {courses
                    .filter((c) => enrollments.includes(c.id))
                    .map((c) => {
                      const ls = flattenLessons(c);
                      const d = ls.filter((l) => progress[c.id]?.[l.id]?.complete).length;
                      const p = ls.length ? Math.round((d / ls.length) * 100) : 0;
                      return (
                        <div className="progress-row" key={c.id}>
                          <div className="row-title">
                            <b>{c.title}</b>
                            <span>{p}%</span>
                          </div>
                          <Progress value={p} />
                          <small>
                            {d} of {ls.length} lessons completed
                          </small>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          {/* ================= COURSE DETAILS / WORKSPACE ================= */}
          {view === "course-detail" && !selectedCourse && (
            <div className="panel">
              <h2>Course not found</h2>
              <p className="muted">This course may have been removed or the URL is incorrect.</p>
              <button className="btn" onClick={() => go("catalog")}>
                Back to courses
              </button>
            </div>
          )}

          {view === "course-detail" && selectedCourse && isEnrolledInSelected && (
            <CourseWorkspace
              course={selectedCourse}
              progress={progress[selectedCourse.id] || {}}
              onBack={() => go("my-courses")}
              onUpdate={(lid, patch) => updateProgress(selectedCourse.id, lid, patch)}
              notify={notify}
            />
          )}

          {view === "course-detail" && selectedCourse && !isEnrolledInSelected && (
            <div className="panel course-preview-panel">
              <button className="text-btn" onClick={() => go("catalog")} style={{ marginBottom: 14 }}>
                ← Back to catalogue
              </button>
              <div className="course-top">
                <Badge>{selectedCourse.category}</Badge>
                <span className="rating">★ {selectedCourse.rating || 4.5}</span>
              </div>
              <h2 style={{ fontSize: 28, margin: "14px 0" }}>{selectedCourse.title}</h2>
              <p className="muted" style={{ fontSize: 15, maxWidth: 700 }}>
                {selectedCourse.description}
              </p>

              <div className="course-info-strip" style={{ margin: "24px 0" }}>
                <b>Instructor: {selectedCourse.instructor}</b>
                <span>👥 {selectedCourse.students} learners</span>
                <span>📚 {flattenLessons(selectedCourse).length} lessons</span>
                <span>Price: {fmtMoney(selectedCourse.price)}</span>
              </div>

              <div style={{ margin: "24px 0", display: "flex", gap: 14 }}>
                {selectedCourse.price === 0 ? (
                  <button className="btn" onClick={() => enrollFreeCourse(selectedCourse.id)}>
                    Enroll Now for Free →
                  </button>
                ) : (
                  <>
                    <button className="btn" onClick={() => handleBuyNow(selectedCourse.id)}>
                      Buy Course ({fmtMoney(selectedCourse.price)}) →
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => addToCart(selectedCourse)}
                      disabled={cart.some((item) => item.id === selectedCourse.id)}
                    >
                      {cart.some((item) => item.id === selectedCourse.id) ? "✓ Already in cart" : "+ Add to cart"}
                    </button>
                  </>
                )}
              </div>

              <div className="curriculum-preview">
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Curriculum Overview</h3>
                {selectedCourse.sections?.map((sec) => (
                  <div key={sec.id} style={{ marginBottom: 14, background: "#fafbfe", border: "1px solid var(--line)", padding: 16, borderRadius: 12 }}>
                    <b>{sec.title}</b>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                      {sec.lessons?.map((l) => (
                        <li key={l.id} style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0" }}>
                          {l.title} {l.duration ? `(${fmtTime(l.duration)})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= INSTRUCTOR STUDIO ================= */}
          {view === "instructor-courses" && (
            <>
              <div className="stats">
                <Stat icon="▣" value={courses.length} label="Total courses" />
                <Stat
                  icon="♧"
                  value={courses.reduce((sum, c) => sum + (c.students || 0), 0)}
                  label="Total learners"
                />
                <Stat icon="◒" value="84%" label="Avg. completion" />
              </div>

              <div className="panel">
                <div className="panel-title">
                  <h2>Course studio</h2>
                  <button
                    className="btn"
                    onClick={() => {
                      setCourseForm({
                        title: "",
                        category: "Web Development",
                        price: "0",
                        description: "",
                        instructor: user?.name || "Instructor"
                      });
                      setCourseEditor({ mode: "create" });
                    }}
                  >
                    + New course
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Learners</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <b>{c.title}</b>
                          <small>{c.category}</small>
                        </td>
                        <td>
                          <Badge type={c.status === "approved" ? "green" : c.status === "pending" ? "gold" : "red"}>
                            {c.status}
                          </Badge>
                        </td>
                        <td>{c.students}</td>
                        <td>{fmtMoney(c.price)}</td>
                        <td>
                          <button
                            className="text-btn"
                            onClick={() => {
                              setCourseForm({
                                title: c.title,
                                category: c.category,
                                price: String(c.price),
                                description: c.description,
                                instructor: c.instructor
                              });
                              setCourseEditor({ mode: "edit", id: c.id });
                            }}
                          >
                            Edit →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ================= INSTRUCTOR ANALYTICS ================= */}
          {view === "instructor-analytics" && (
            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-title">
                  <h2>Engagement snapshot</h2>
                </div>
                <div className="big-number">
                  78.4% <small>+8.2%</small>
                </div>
                <p className="muted">Average learner engagement across published courses.</p>
                <div className="fake-line">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">
                  <h2>Top performing lessons</h2>
                </div>
                {["State vs. props", "Why component trees matter", "useEffect and cleanup"].map((x, i) => (
                  <div className="list-item" key={x}>
                    <b>{i + 1}</b>
                    <span>{x}</span>
                    <Badge type="green">{[94, 89, 82][i]}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= ADMIN APPROVALS ================= */}
          {view === "admin-approvals" && (
            <AdminTable
              courses={courses}
              onApprove={(id) => updateCourseStatus(id, "approved")}
              onReject={(id) => updateCourseStatus(id, "rejected")}
            />
          )}

          {/* ================= ADMIN USERS ================= */}
          {view === "admin-users" && (
            <div className="panel">
              <div className="panel-title">
                <h2>User management</h2>
                <Badge>{users.length} users</Badge>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.name}</b>
                        <small>{u.email}</small>
                      </td>
                      <td>{u.role}</td>
                      <td>
                        <Badge type={u.status === "active" ? "green" : "red"}>{u.status}</Badge>
                      </td>
                      <td>
                        <button className="text-btn" onClick={() => toggleUserStatus(u.id)}>
                          {u.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= ADMIN REVENUE ================= */}
          {view === "admin-revenue" && (
            <>
              <div className="stats">
                <Stat
                  icon="₹"
                  value={fmtMoney(
                    courses.filter((c) => c.status === "approved").reduce((s, c) => s + c.price * (c.students || 0), 0)
                  )}
                  label="Gross revenue"
                  trend="+14.8%"
                />
                <Stat
                  icon="♧"
                  value={courses.reduce((s, c) => s + (c.students || 0), 0)}
                  label="Total enrolments"
                />
                <Stat
                  icon="▣"
                  value={courses.filter((c) => c.status === "approved").length}
                  label="Live courses"
                />
              </div>

              <div className="panel">
                <div className="panel-title">
                  <h2>Revenue by course</h2>
                  <Badge type="green">Live database calculation</Badge>
                </div>
                {courses
                  .filter((c) => c.price > 0)
                  .map((c) => (
                    <div className="bar-row" key={c.id}>
                      <span>{c.title}</span>
                      <Progress value={Math.min(100, Math.round(((c.students || 1) / 300) * 100))} />
                      <b>{fmtMoney(c.price * (c.students || 0))}</b>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* ================= INSTRUCTOR COURSE EDITOR MODAL ================= */}
          {courseEditor && (
            <div
              className="modal-backdrop"
              onMouseDown={(e) => e.target === e.currentTarget && setCourseEditor(null)}
            >
              <form
                className="course-editor panel"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const title = courseForm.title.trim();
                  if (title.length < 4) {
                    notify("Course title must contain at least 4 characters.");
                    return;
                  }
                  const price = Math.max(0, Number(courseForm.price) || 0);

                  if (courseEditor.mode === "create") {
                    await createCourse({
                      title,
                      category: courseForm.category,
                      price,
                      description: courseForm.description.trim(),
                      instructor: courseForm.instructor.trim() || user?.name || "Instructor"
                    });
                  } else {
                    await updateCourse(courseEditor.id, {
                      title,
                      category: courseForm.category,
                      price,
                      description: courseForm.description.trim(),
                      instructor: courseForm.instructor.trim() || user?.name || "Instructor"
                    });
                  }
                  setCourseEditor(null);
                }}
              >
                <div className="panel-title">
                  <div>
                    <span className="eyebrow">CREATOR STUDIO</span>
                    <h2>{courseEditor.mode === "create" ? "Create a course" : "Edit course"}</h2>
                  </div>
                  <button type="button" className="text-btn" onClick={() => setCourseEditor(null)}>
                    ✕ Close
                  </button>
                </div>

                <label>
                  Course title
                  <input
                    required
                    minLength={4}
                    value={courseForm.title}
                    onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Modern React Essentials"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {[
                      "Web Development",
                      "Backend",
                      "Design",
                      "Data & AI",
                      "Programming",
                      "Cloud",
                      "Career Skills"
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Price (₹) - 0 for free
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </label>

                <label>
                  Instructor
                  <input
                    required
                    value={courseForm.instructor}
                    onChange={(e) => setCourseForm((f) => ({ ...f, instructor: e.target.value }))}
                  />
                </label>

                <label>
                  Description
                  <textarea
                    rows="3"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What will students learn in this course?"
                  />
                </label>

                <div className="editor-actions">
                  <button type="button" className="btn secondary" onClick={() => setCourseEditor(null)}>
                    Cancel
                  </button>
                  <button className="btn" type="submit">
                    {courseEditor.mode === "create" ? "Create course →" : "Save changes →"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CourseWorkspace({ course, progress, onBack, onUpdate, notify }) {
  const lessons = flattenLessons(course);
  const [current, setCurrent] = useState(lessons.find((l) => !progress[l.id]?.complete) || lessons[0]);
  const [watched, setWatched] = useState(progress[current?.id]?.watched || 0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    if (current?.id) {
      setWatched(progress[current.id]?.watched || 0);
      setSubmitted(false);
      setAnswers({});
      setQuizScore(null);
    }
  }, [current?.id, progress]);

  const idx = lessons.findIndex((l) => l.id === current?.id);
  const completed = lessons.filter((l) => progress[l.id]?.complete).length;

  const next = () => {
    if (idx < lessons.length - 1) {
      setCurrent(lessons[idx + 1]);
    }
  };

  if (!current) {
    return <div className="panel">No lessons available in this course.</div>;
  }

  return (
    <div className="workspace-grid">
      <aside className="lesson-sidebar">
        <button className="text-btn" onClick={onBack}>
          ← Back to courses
        </button>
        <h2>{course.title}</h2>
        <div className="course-progress">
          <b>{Math.round((completed / (lessons.length || 1)) * 100)}% complete</b>
          <Progress value={(completed / (lessons.length || 1)) * 100} />
        </div>
        {lessons.map((l, i) => (
          <button
            key={l.id}
            className={`lesson-link ${current.id === l.id ? "selected" : ""} ${
              progress[l.id]?.complete ? "done" : ""
            }`}
            onClick={() => setCurrent(l)}
          >
            <span>{progress[l.id]?.complete ? "✓" : i + 1}</span>
            <div>
              <b>{l.title}</b>
              <small>{l.type === "quiz" ? "Quiz" : fmtTime(l.duration)}</small>
            </div>
          </button>
        ))}
      </aside>

      <div className="lesson-main">
        <div className="lesson-head">
          <Badge>{current.type === "quiz" ? "KNOWLEDGE CHECK" : "VIDEO LESSON"}</Badge>
          <span>
            Lesson {idx + 1} of {lessons.length}
          </span>
        </div>

        <div className="course-info-strip">
          <b>{course.instructor}</b>
          <span>★ {course.rating || 4.5}</span>
          <span>👥 {course.students} students</span>
          <span>📚 {lessons.length} lessons</span>
        </div>

        {current.type === "video" ? (
          <>
            <div className="video">
              <div className="video-grid" />
              <div className="play">▶</div>
              <div className="video-label">
                <span>RIDGELINE ORIGINALS</span>
                <b>{current.title}</b>
              </div>
              <div className="video-time">
                {fmtTime(watched)} / {fmtTime(current.duration)}
              </div>
            </div>

            <div className="video-controls">
              <button
                className="btn"
                onClick={() => {
                  const w = Math.min(current.duration, watched + Math.ceil(current.duration * 0.25));
                  setWatched(w);
                  const isDone = w >= current.duration * 0.9;
                  onUpdate(current.id, { watched: w, complete: isDone });
                  if (isDone) notify("Lesson completed! Next lesson unlocked.");
                }}
              >
                {watched >= current.duration * 0.9 ? "✓ Lesson completed" : "▶ Watch +25% progress"}
              </button>
              <span>{Math.round((watched / (current.duration || 1)) * 100)}% watched</span>
            </div>

            <h2>{current.title}</h2>
            <p className="muted">
              Interactive video lesson with progress synchronization. Watch at least 90% to mark complete and unlock your
              completion certificate.
            </p>
          </>
        ) : (
          <>
            <div className="quiz-banner">
              ✦ <b>Knowledge check</b>
              <span>Test your understanding before advancing.</span>
            </div>
            <h2>{current.title}</h2>
            {current.questions?.map((q, i) => (
              <div className="quiz" key={i}>
                <b>
                  {i + 1}. {q.q}
                </b>
                {q.options.map((o, j) => (
                  <label key={j} className={submitted && j === q.answer ? "correct" : ""}>
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={answers[i] === j}
                      disabled={submitted}
                      onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                    />
                    {o}
                  </label>
                ))}
              </div>
            ))}

            {submitted && (
              <div className={`quiz-feedback ${quizScore >= 60 ? "pass" : "retry"}`} role="status">
                <b>{quizScore >= 60 ? "Great job — you passed!" : "Score below 60% — please review and retry."}</b>
                <span>Your score: {quizScore}%</span>
              </div>
            )}

            {!submitted ? (
              <button
                className="btn"
                onClick={() => {
                  const questions = current.questions || [];
                  if (questions.some((_, i) => answers[i] === undefined)) {
                    notify("Please answer every question first.");
                    return;
                  }
                  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
                  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
                  setQuizScore(score);
                  setSubmitted(true);
                  onUpdate(current.id, { complete: score >= 60, quizScore: score });
                  notify(score >= 60 ? "Quiz passed — lesson completed!" : "Quiz submitted. Retry to pass.");
                }}
              >
                Submit answers →
              </button>
            ) : quizScore >= 60 ? (
              <button className="btn" onClick={next}>
                Next lesson →
              </button>
            ) : (
              <button
                className="btn"
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setQuizScore(null);
                }}
              >
                Retry quiz ↻
              </button>
            )}
          </>
        )}

        <div className="lesson-footer">
          <button className="btn secondary" onClick={onBack}>
            Exit lesson
          </button>
          <button
            className="btn"
            onClick={next}
            disabled={idx === lessons.length - 1 || (current.type === "quiz" && quizScore < 60)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminTable({ courses, onApprove, onReject }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <h2>Pending approvals</h2>
        <Badge type="gold">{courses.filter((c) => c.status === "pending").length} pending</Badge>
      </div>
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Instructor</th>
            <th>Status</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td>
                <b>{c.title}</b>
                <small>{c.category}</small>
              </td>
              <td>{c.instructor}</td>
              <td>
                <Badge
                  type={c.status === "approved" ? "green" : c.status === "pending" ? "gold" : "red"}
                >
                  {c.status}
                </Badge>
              </td>
              <td>
                {c.status === "pending" ? (
                  <>
                    <button className="text-btn" onClick={() => onApprove(c.id)}>
                      Approve
                    </button>{" "}
                    <button className="text-btn danger-text" onClick={() => onReject(c.id)}>
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="muted">Reviewed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const { user, login, register } = useApp();
  return user ? <AppShell /> : <LoginScreen onLogin={login} onRegister={register} />;
}
