import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmtMoney, flattenLessons } from "../data.js";

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
];

export function ProfileView({ onOpenCourse, onNavigate }) {
  const { user, updateProfile, updatePassword, courses, enrollments, orders, progress } = useApp();

  const [activeTab, setActiveTab] = useState("overview"); // overview, courses, orders, certificates
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0]);
  const [smsAlerts, setSmsAlerts] = useState(user?.preferences?.smsAlerts ?? true);
  const [emailDigest, setEmailDigest] = useState(user?.preferences?.emailDigest ?? true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Bills filter state
  const [billsFilter, setBillsFilter] = useState("all");

  if (!user) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
        <h2>Sign in to view your profile</h2>
        <p className="muted">Your learning history, enrolled courses, and account details live here.</p>
      </div>
    );
  }

  // Calculate student statistics
  const enrolledCoursesList = courses.filter((c) => enrollments.includes(c.id));
  const completedCoursesList = enrolledCoursesList.filter((c) => {
    const lessons = flattenLessons(c);
    if (lessons.length === 0) return false;
    const completedCount = lessons.filter((l) => progress[c.id]?.[l.id]?.complete).length;
    return completedCount === lessons.length;
  });

  const totalLessonsDone = Object.values(progress).reduce(
    (acc, courseProg) => acc + Object.values(courseProg).filter((l) => l.complete).length,
    0
  );

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Full name must be at least 2 characters.");
      return;
    }
    setFormError("");
    setIsSaving(true);
    await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatar,
      preferences: { smsAlerts, emailDigest }
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordError("");
    setPasswordSaving(true);
    const res = await updatePassword(currentPassword, newPassword);
    setPasswordSaving(false);
    if (res?.success) {
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(res?.error || "Failed to update password.");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (billsFilter === "paid") return o.total > 0 && o.status === "paid";
    if (billsFilter === "free") return o.total === 0;
    return true;
  });

  return (
    <div className="profile-page-container">
      {/* Profile Header Tabs */}
      <div className="profile-nav-tabs">
        <button
          className={`profile-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Profile Overview
        </button>
        {user.role === "student" && (
          <>
            <button
              className={`profile-tab ${activeTab === "courses" ? "active" : ""}`}
              onClick={() => setActiveTab("courses")}
            >
              Enrolled Courses ({enrolledCoursesList.length})
            </button>
            <button
              className={`profile-tab ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              Payment & Invoices ({orders.length})
            </button>
            <button
              className={`profile-tab ${activeTab === "certificates" ? "active" : ""}`}
              onClick={() => setActiveTab("certificates")}
            >
              Certificates ({completedCoursesList.length})
            </button>
          </>
        )}
      </div>

      {/* Main Grid: Inspired directly by reference image */}
      <div className="profile-grid">
        {/* ================= LEFT CARD: MY PROFILE ================= */}
        <div className="panel profile-main-card">
          <div className="profile-hero-image-wrap">
            <img src={avatar} alt={user.name} className="profile-hero-image" />
            {isEditing && (
              <div className="avatar-picker-row">
                {AVATAR_OPTIONS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`avatar-option-btn ${avatar === url ? "selected" : ""}`}
                    onClick={() => setAvatar(url)}
                  >
                    <img src={url} alt={`Option ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="profile-card-meta-header">
            <div>
              <span className="eyebrow">MY PROFILE</span>
              <h2>{user.name}</h2>
            </div>
            <div className="profile-system-meta">
              <small>
                Last login: {new Date(user.lastLogin || Date.now()).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </small>
              <small>Windows · New Delhi (IN)</small>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-details-form">
            <div className="form-row-duo">
              <label>
                Full Name
                <input
                  type="text"
                  value={name}
                  disabled={!isEditing}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  value={phone}
                  disabled={!isEditing}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>

            <label>
              Email Address
              <input type="email" value={user.email} disabled title="Email address cannot be changed" />
            </label>

            <label>
              Bio / Learning Objective
              <textarea
                rows="2"
                value={bio}
                disabled={!isEditing}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your learning goals or background..."
              />
            </label>

            {/* Notification Toggles — matching reference image */}
            <div className="profile-toggle-row">
              <div className="toggle-label-wrap">
                <b>SMS alerts activation</b>
                <small>Get payment and course unlock reminders via SMS</small>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  disabled={!isEditing}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                />
                <span className="slider round" />
              </label>
            </div>

            <div className="profile-toggle-row">
              <div className="toggle-label-wrap">
                <b>Email digest & updates</b>
                <small>Weekly learning momentum and course announcements</small>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={emailDigest}
                  disabled={!isEditing}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                />
                <span className="slider round" />
              </label>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <div className="profile-actions-bottom">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                      setPhone(user.phone || "");
                      setBio(user.bio || "");
                      setAvatar(user.avatar || AVATAR_OPTIONS[0]);
                      setFormError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes →"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn secondary" onClick={() => setShowPasswordModal(true)}>
                    Change password
                  </button>
                  <button type="button" className="btn" onClick={() => setIsEditing(true)}>
                    ✎ Edit profile
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* ================= RIGHT COLUMN: ACCOUNT CARDS & BILLS ================= */}
        <div className="profile-side-column">
          {/* Card 1: Account Overview */}
          <div className="panel profile-side-card">
            <div className="panel-title">
              <div>
                <span className="eyebrow">WORKSPACE ACCOUNT</span>
                <h2>{user.role === "student" ? "My Learning Hub" : user.role === "instructor" ? "Creator Studio" : "Administration"}</h2>
              </div>
              <span className="badge green">● Active account</span>
            </div>

            <div className="profile-account-details">
              <div className="account-detail-item">
                <span className="muted">Student / ID</span>
                <b>{user.studentId || `RL-${user.id.toUpperCase()}`}</b>
              </div>
              <div className="account-detail-item">
                <span className="muted">Account Role</span>
                <span className="badge gold">{user.role.toUpperCase()}</span>
              </div>
              <div className="account-detail-item">
                <span className="muted">Enrolled Courses</span>
                <b>{enrolledCoursesList.length} courses</b>
              </div>
              <div className="account-detail-item">
                <span className="muted">Lessons Completed</span>
                <b>{totalLessonsDone} lessons</b>
              </div>
              <div className="account-detail-item">
                <span className="muted">Learning Streak</span>
                <b>4 days 🔥</b>
              </div>
              <div className="account-detail-item">
                <span className="muted">Certificates</span>
                <b>{completedCoursesList.length} earned</b>
              </div>
            </div>
          </div>

          {/* Card 2: "My bills" / Payment History — matching reference image! */}
          <div className="panel profile-side-card bills-card">
            <div className="panel-title">
              <div>
                <span className="eyebrow">TRANSACTIONS & RECEIPTS</span>
                <h2>My bills & orders</h2>
              </div>
              <div className="bills-filter-group">
                <button
                  className={`filter-chip ${billsFilter === "all" ? "active" : ""}`}
                  onClick={() => setBillsFilter("all")}
                >
                  All
                </button>
                <button
                  className={`filter-chip ${billsFilter === "paid" ? "active" : ""}`}
                  onClick={() => setBillsFilter("paid")}
                >
                  Paid
                </button>
                <button
                  className={`filter-chip ${billsFilter === "free" ? "active" : ""}`}
                  onClick={() => setBillsFilter("free")}
                >
                  Free
                </button>
              </div>
            </div>

            <div className="bills-list">
              {filteredOrders.length === 0 ? (
                <div className="empty-bills-note">
                  <p className="muted">No orders matching this filter.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div className="bill-item-row" key={order.id}>
                    <div className="bill-status-dot">
                      <span className={`status-indicator ${order.status === "paid" ? "paid" : "pending"}`} />
                    </div>
                    <div className="bill-info">
                      <b>{order.items?.map((i) => i.title).join(", ") || "Course Purchase"}</b>
                      <small>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}{" "}
                        · Ref: {order.transactionId || order.id}
                      </small>
                    </div>
                    <div className="bill-amount">
                      <strong>{fmtMoney(order.total)}</strong>
                      <span className={`badge ${order.status === "paid" ? "green" : "gold"}`}>
                        {order.status === "paid" ? "Bill paid" : "Pending"}
                      </span>
                    </div>
                    <button
                      className="text-btn receipt-btn"
                      onClick={() => setSelectedReceipt(order)}
                      title="View full receipt"
                    >
                      Receipt ↗
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECONDARY TABS CONTENT ================= */}

      {/* Enrolled Courses Tab */}
      {activeTab === "courses" && (
        <div className="panel profile-tab-panel" style={{ marginTop: 24 }}>
          <div className="panel-title">
            <h2>My Enrolled Courses</h2>
            <span className="badge">{enrolledCoursesList.length} active</span>
          </div>

          {enrolledCoursesList.length === 0 ? (
            <div className="empty-tab-state">
              <p className="muted">You haven't enrolled in any courses yet.</p>
              <button className="btn" onClick={() => onNavigate("catalog")}>
                Explore catalogue →
              </button>
            </div>
          ) : (
            <div className="course-grid">
              {enrolledCoursesList.map((c) => {
                const lessons = flattenLessons(c);
                const done = lessons.filter((l) => progress[c.id]?.[l.id]?.complete).length;
                const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
                return (
                  <div className="course-card" key={c.id}>
                    <div className={`cover cover-${c.id}`}>
                      <span>{c.category}</span>
                      <b>{c.id === "c1" ? "REACT" : c.id === "c2" ? "API" : "DATA"}</b>
                      <i>✦</i>
                    </div>
                    <div className="course-body">
                      <h3>{c.title}</h3>
                      <div className="progress-row" style={{ margin: "14px 0" }}>
                        <div className="row-title">
                          <span>{pct}% complete</span>
                          <small>
                            {done}/{lessons.length} lessons
                          </small>
                        </div>
                        <div className="progress">
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="course-bottom">
                        <button className="btn" onClick={() => onOpenCourse(c.id)}>
                          Continue learning →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === "certificates" && (
        <div className="panel profile-tab-panel" style={{ marginTop: 24 }}>
          <div className="panel-title">
            <h2>Certificates of Completion</h2>
            <span className="badge green">{completedCoursesList.length} earned</span>
          </div>

          {completedCoursesList.length === 0 ? (
            <div className="empty-tab-state">
              <p className="muted">
                Complete 100% of the lessons and assessments in any course to unlock your verified Certificate of
                Completion!
              </p>
            </div>
          ) : (
            <div className="certificates-grid">
              {completedCoursesList.map((c) => (
                <div className="certificate-card" key={c.id}>
                  <div className="certificate-badge-icon">🎖</div>
                  <h3>{c.title}</h3>
                  <p className="muted">Awarded to {user.name} for successful completion.</p>
                  <button className="btn secondary" onClick={() => setSelectedCertificate(c)}>
                    View Certificate ↗
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="panel profile-tab-panel" style={{ marginTop: 24 }}>
          <div className="panel-title">
            <h2>Billing & Payment History</h2>
            <span className="badge">{orders.length} total</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Course(s)</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <b>{order.id}</b>
                    <small>{order.transactionId || "N/A"}</small>
                  </td>
                  <td>{order.items?.map((i) => i.title).join(", ") || "Courses"}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <strong>{fmtMoney(order.total)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${order.status === "paid" ? "green" : "gold"}`}>{order.status}</span>
                  </td>
                  <td>
                    <button className="text-btn" onClick={() => setSelectedReceipt(order)}>
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= RECEIPT MODAL ================= */}
      {selectedReceipt && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedReceipt(null)}>
          <div className="panel receipt-modal">
            <div className="panel-title">
              <div>
                <span className="eyebrow">ORDER INVOICE</span>
                <h2>Receipt #{selectedReceipt.id}</h2>
              </div>
              <button className="text-btn" onClick={() => setSelectedReceipt(null)}>
                ✕ Close
              </button>
            </div>

            <div className="receipt-details">
              <div className="receipt-line">
                <span>Date</span>
                <b>{new Date(selectedReceipt.createdAt).toLocaleString()}</b>
              </div>
              <div className="receipt-line">
                <span>Customer</span>
                <b>{selectedReceipt.billingDetails?.name || user.name}</b>
              </div>
              <div className="receipt-line">
                <span>Payment Reference</span>
                <b>{selectedReceipt.transactionId || selectedReceipt.id}</b>
              </div>
              <div className="receipt-line">
                <span>Payment Status</span>
                <span className="badge green">PAID & VERIFIED</span>
              </div>
              <hr className="receipt-divider" />
              <h3>Purchased Courses</h3>
              {selectedReceipt.items?.map((item, idx) => (
                <div className="receipt-line" key={idx}>
                  <span>{item.title}</span>
                  <b>{fmtMoney(item.price)}</b>
                </div>
              ))}
              <hr className="receipt-divider" />
              <div className="receipt-line">
                <span>Subtotal</span>
                <span>{fmtMoney(selectedReceipt.subtotal)}</span>
              </div>
              {selectedReceipt.discount > 0 && (
                <div className="receipt-line" style={{ color: "var(--green)" }}>
                  <span>Discount ({selectedReceipt.couponCode || "Coupon"})</span>
                  <span>- {fmtMoney(selectedReceipt.discount)}</span>
                </div>
              )}
              <div className="receipt-total-line">
                <strong>Total Paid</strong>
                <strong>{fmtMoney(selectedReceipt.total)}</strong>
              </div>
            </div>

            <div className="receipt-actions">
              <button className="btn" onClick={() => window.print()}>
                🖨 Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CERTIFICATE MODAL ================= */}
      {selectedCertificate && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedCertificate(null)}
        >
          <div className="panel certificate-modal">
            <div className="certificate-frame">
              <div className="brand" style={{ color: "#20243a", padding: "10px 0" }}>
                <span>R</span> Ridgeline <small>LEARN</small>
              </div>
              <span className="badge green">VERIFIED CREDENTIAL</span>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 28, margin: "20px 0 10px" }}>
                Certificate of Completion
              </h1>
              <p className="muted">This is proudly presented to</p>
              <h2 style={{ fontSize: 26, color: "var(--purple)", margin: "10px 0" }}>{user.name}</h2>
              <p className="muted" style={{ maxWidth: 440, margin: "auto" }}>
                for successfully completing all curriculum requirements, video lessons, and practical assessments in
              </p>
              <h3 style={{ fontSize: 20, margin: "16px 0" }}>{selectedCertificate.title}</h3>
              <div className="cert-signature-row">
                <div>
                  <b>{selectedCertificate.instructor}</b>
                  <small className="muted">Course Instructor</small>
                </div>
                <div>
                  <b>{new Date().toLocaleDateString()}</b>
                  <small className="muted">Issue Date</small>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", marginTop: 18 }}>
              <button className="btn secondary" onClick={() => setSelectedCertificate(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      {showPasswordModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}
        >
          <form className="panel password-modal" onSubmit={handlePasswordSubmit}>
            <div className="panel-title">
              <h2>Change Password</h2>
              <button type="button" className="text-btn" onClick={() => setShowPasswordModal(false)}>
                ✕ Close
              </button>
            </div>
            <label>
              Current Password
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </label>
            {passwordError && <div className="form-error">{passwordError}</div>}
            <div className="editor-actions">
              <button type="button" className="btn secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={passwordSaving}>
                {passwordSaving ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
