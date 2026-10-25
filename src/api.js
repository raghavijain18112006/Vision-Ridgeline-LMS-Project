import { initialCourses, initialUsers } from "./data.js";

const API_BASE = "/api";

// Fallback local storage key
const STORAGE_KEY = "ridgeline_lms_v2_store";

function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Local storage read error", e);
  }
  const defaultStore = {
    users: initialUsers.map((u) => ({
      ...u,
      studentId: u.id === "u1" ? "RL-2026-001" : `RL-2026-00${u.id.replace(/\D/g, "") || "9"}`,
      phone: u.id === "u1" ? "+91 98765 43210" : "+91 98111 22334",
      bio:
        u.id === "u1"
          ? "Aspiring frontend engineer and UI enthusiast. Learning modern full-stack web development."
          : "Learner on Ridgeline.",
      avatar:
        u.id === "u1"
          ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-15T09:30:00.000Z",
      lastLogin: new Date().toISOString(),
      preferences: { smsAlerts: true, emailDigest: true }
    })),
    courses: initialCourses,
    enrollments: [{ id: "enr-1", userId: "u1", courseId: "c1", enrolledAt: "2026-02-01T10:00:00.000Z", status: "active" }],
    carts: { u1: [] },
    orders: [
      {
        id: "ORD-2026-001",
        userId: "u1",
        items: [{ courseId: "c1", title: "React for Interview-Ready Frontends", price: 0 }],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        currency: "INR",
        status: "paid",
        paymentMethod: "free_enrollment",
        transactionId: "TXN_FREE_001",
        createdAt: "2026-02-01T10:00:00.000Z"
      }
    ],
    progress: {
      u1: {
        c1: {
          l1: { watched: 480, complete: true },
          l2: { watched: 240, complete: false }
        }
      }
    }
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore));
  } catch (e) {}
  return defaultStore;
}

function setLocalStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {}
}

async function request(endpoint, options = {}, userId = "u1") {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // If backend isn't reachable, fall back to robust local client storage
    console.warn(`API call ${endpoint} failed, using local offline store:`, err.message);
    return handleOfflineFallback(endpoint, options, userId);
  }
}

// Client-side fallback handler for total resilience
function handleOfflineFallback(endpoint, options, userId) {
  const store = getLocalStore();
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};

  if (endpoint === "/auth/login") {
    let user = store.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user) {
      user = {
        id: `u${Date.now()}`,
        name: body.name || body.email.split("@")[0],
        email: body.email,
        role: body.role || "student",
        status: "active",
        studentId: `RL-2026-${String(store.users.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        phone: "",
        bio: "",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        preferences: { smsAlerts: false, emailDigest: true }
      };
      store.users.push(user);
      store.carts[user.id] = [];
      setLocalStore(store);
    }
    return { user, token: `local-token-${user.id}` };
  }

  if (endpoint === "/auth/register") {
    const user = {
      id: `u${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role || "student",
      status: "active",
      studentId: `RL-2026-${String(store.users.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      phone: "",
      bio: "",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      preferences: { smsAlerts: false, emailDigest: true }
    };
    store.users.push(user);
    store.carts[user.id] = [];
    setLocalStore(store);
    return { user, token: `local-token-${user.id}` };
  }

  if (endpoint === "/users/profile" && method === "PUT") {
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      if (body.name) user.name = body.name;
      if (body.phone !== undefined) user.phone = body.phone;
      if (body.bio !== undefined) user.bio = body.bio;
      if (body.avatar !== undefined) user.avatar = body.avatar;
      if (body.preferences !== undefined) user.preferences = body.preferences;
      setLocalStore(store);
      return { user, message: "Profile updated." };
    }
  }

  if (endpoint === "/users/all") {
    return { users: store.users };
  }

  if (endpoint.startsWith("/users/") && endpoint.endsWith("/status")) {
    const id = endpoint.split("/")[2];
    const user = store.users.find((u) => u.id === id);
    if (user) {
      user.status = body.status;
      setLocalStore(store);
      return { user };
    }
  }

  if (endpoint === "/courses" && method === "GET") {
    return { courses: store.courses };
  }

  if (endpoint === "/courses" && method === "POST") {
    const course = {
      id: `course-${Date.now()}`,
      title: body.title,
      category: body.category || "Web Development",
      price: Number(body.price) || 0,
      instructor: body.instructor || "Instructor",
      status: "pending",
      rating: 0,
      students: 0,
      description: body.description || "",
      sections: [{ id: `s-${Date.now()}`, title: "Course Introduction", lessons: [{ id: `l-${Date.now()}`, title: "Welcome", duration: 300, type: "video" }] }]
    };
    store.courses.push(course);
    setLocalStore(store);
    return { course, message: "Course created." };
  }

  if (endpoint.startsWith("/courses/") && method === "PUT") {
    const id = endpoint.split("/")[2];
    const idx = store.courses.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.courses[idx] = { ...store.courses[idx], ...body };
      setLocalStore(store);
      return { course: store.courses[idx], message: "Course updated." };
    }
  }

  if (endpoint.startsWith("/courses/") && endpoint.endsWith("/status") && method === "PATCH") {
    const id = endpoint.split("/")[2];
    const c = store.courses.find((x) => x.id === id);
    if (c) {
      c.status = body.status;
      setLocalStore(store);
      return { course: c };
    }
  }

  if (endpoint === "/enrollments") {
    return { enrollments: store.enrollments.filter((e) => e.userId === userId && e.status === "active") };
  }

  if (endpoint.startsWith("/courses/") && endpoint.endsWith("/enroll") && method === "POST") {
    const courseId = endpoint.split("/")[2];
    const enr = { id: `enr-${Date.now()}`, userId, courseId, enrolledAt: new Date().toISOString(), status: "active" };
    if (!store.enrollments.some((e) => e.userId === userId && e.courseId === courseId)) {
      store.enrollments.push(enr);
      const c = store.courses.find((x) => x.id === courseId);
      if (c) c.students = (c.students || 0) + 1;
      setLocalStore(store);
    }
    return { enrollment: enr, message: "Enrolled successfully!" };
  }

  if (endpoint === "/cart" && method === "GET") {
    const ids = store.carts[userId] || [];
    return { cart: store.courses.filter((c) => ids.includes(c.id)) };
  }

  if (endpoint === "/cart/add" && method === "POST") {
    if (!store.carts[userId]) store.carts[userId] = [];
    if (!store.carts[userId].includes(body.courseId)) {
      store.carts[userId].push(body.courseId);
      setLocalStore(store);
    }
    const ids = store.carts[userId];
    return { cart: store.courses.filter((c) => ids.includes(c.id)), message: "Added to cart." };
  }

  if (endpoint.startsWith("/cart/") && method === "DELETE") {
    const courseId = endpoint.split("/")[2];
    if (store.carts[userId]) {
      store.carts[userId] = store.carts[userId].filter((id) => id !== courseId);
      setLocalStore(store);
    }
    const ids = store.carts[userId] || [];
    return { cart: store.courses.filter((c) => ids.includes(c.id)), message: "Removed from cart." };
  }

  if (endpoint === "/cart" && method === "DELETE") {
    store.carts[userId] = [];
    setLocalStore(store);
    return { cart: [] };
  }

  if (endpoint === "/orders/create" && method === "POST") {
    const items = body.courseIds.map((id) => store.courses.find((c) => c.id === id)).filter(Boolean);
    const subtotal = items.reduce((s, c) => s + (Number(c.price) || 0), 0);
    const discount = body.couponCode === "RIDGELINE10" ? Math.round(subtotal * 0.1) : body.couponCode === "WELCOME20" ? Math.round(subtotal * 0.2) : 0;
    const total = Math.max(0, subtotal - discount);
    const order = {
      id: `ORD-2026-${String(store.orders.length + 1).padStart(4, "0")}`,
      userId,
      items: items.map((c) => ({ courseId: c.id, title: c.title, price: c.price, category: c.category, instructor: c.instructor })),
      subtotal,
      discount,
      total,
      currency: "INR",
      status: "pending",
      createdAt: new Date().toISOString(),
      billingDetails: body.billingDetails || {}
    };
    store.orders.push(order);
    setLocalStore(store);
    return { order };
  }

  if (endpoint === "/orders/my-orders") {
    return { orders: (store.orders || []).filter((o) => o.userId === userId).reverse() };
  }

  if (endpoint === "/payments/razorpay/create-order") {
    const order = store.orders.find((o) => o.id === body.orderId);
    return {
      orderId: body.orderId,
      razorpayOrderId: `order_sim_${Date.now()}`,
      amount: Math.round((order?.total || 0) * 100),
      currency: "INR",
      keyId: "rzp_test_ridgeline2026",
      isTestMode: true,
      customer: { name: "Learner", email: "learner@ridgeline.app", phone: "+91 98765 43210" }
    };
  }

  if (endpoint === "/payments/razorpay/verify") {
    const order = store.orders.find((o) => o.id === body.orderId);
    if (order) {
      order.status = "paid";
      order.transactionId = body.razorpay_payment_id || `TXN_${Date.now()}`;
      order.paidAt = new Date().toISOString();
      order.items.forEach((item) => {
        if (!store.enrollments.some((e) => e.userId === userId && e.courseId === item.courseId)) {
          store.enrollments.push({
            id: `enr-${Date.now()}-${item.courseId}`,
            userId,
            courseId: item.courseId,
            enrolledAt: new Date().toISOString(),
            status: "active"
          });
          const c = store.courses.find((x) => x.id === item.courseId);
          if (c) c.students = (c.students || 0) + 1;
        }
      });
      // Remove from cart
      if (store.carts[userId]) {
        store.carts[userId] = store.carts[userId].filter((id) => !order.items.some((item) => item.courseId === id));
      }
      setLocalStore(store);
      return { success: true, order, enrollments: store.enrollments.filter((e) => e.userId === userId) };
    }
  }

  if (endpoint === "/progress/all") {
    return { progress: store.progress[userId] || {} };
  }

  if (endpoint.startsWith("/progress/") && method === "PUT") {
    const parts = endpoint.split("/");
    const courseId = parts[2];
    const lessonId = parts[3];
    if (!store.progress[userId]) store.progress[userId] = {};
    if (!store.progress[userId][courseId]) store.progress[userId][courseId] = {};
    store.progress[userId][courseId][lessonId] = {
      ...(store.progress[userId][courseId][lessonId] || {}),
      ...body
    };
    setLocalStore(store);
    return { progress: store.progress[userId][courseId] };
  }

  return {};
}

// ==================== EXPORTED API METHODS ====================

export async function loginApi(email, password, role) {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }) });
}

export async function registerApi(name, email, password, role) {
  return request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role }) });
}

export async function getMeApi(userId) {
  return request("/auth/me", {}, userId);
}

export async function updateProfileApi(userId, patch) {
  return request("/users/profile", { method: "PUT", body: JSON.stringify(patch) }, userId);
}

export async function updatePasswordApi(userId, currentPassword, newPassword) {
  return request("/users/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) }, userId);
}

export async function fetchUsersApi(userId) {
  return request("/users/all", {}, userId);
}

export async function updateUserStatusApi(adminUserId, targetUserId, status) {
  return request(`/users/${targetUserId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, adminUserId);
}

export async function fetchCourses(userId) {
  const data = await request("/courses", {}, userId);
  return data.courses || [];
}

export async function fetchCourseById(courseId, userId) {
  const data = await request(`/courses/${courseId}`, {}, userId);
  return data.course;
}

export async function createCourseApi(courseData, userId) {
  return request("/courses", { method: "POST", body: JSON.stringify(courseData) }, userId);
}

export async function updateCourseApi(courseId, patch, userId) {
  return request(`/courses/${courseId}`, { method: "PUT", body: JSON.stringify(patch) }, userId);
}

export async function updateCourseStatusApi(courseId, status, adminUserId) {
  return request(`/courses/${courseId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, adminUserId);
}

export async function fetchEnrollmentsApi(userId) {
  const data = await request("/enrollments", {}, userId);
  return (data.enrollments || []).map((e) => e.courseId);
}

export async function enrollFreeCourseApi(userId, courseId) {
  return request(`/courses/${courseId}/enroll`, { method: "POST" }, userId);
}

export async function fetchCartApi(userId) {
  const data = await request("/cart", {}, userId);
  return data.cart || [];
}

export async function addToCartApi(userId, courseId) {
  const data = await request("/cart/add", { method: "POST", body: JSON.stringify({ courseId }) }, userId);
  return data.cart || [];
}

export async function removeFromCartApi(userId, courseId) {
  const data = await request(`/cart/${courseId}`, { method: "DELETE" }, userId);
  return data.cart || [];
}

export async function clearCartApi(userId) {
  const data = await request("/cart", { method: "DELETE" }, userId);
  return data.cart || [];
}

export async function createOrderApi(userId, { courseIds, couponCode, billingDetails }) {
  return request("/orders/create", { method: "POST", body: JSON.stringify({ courseIds, couponCode, billingDetails }) }, userId);
}

export async function fetchMyOrdersApi(userId) {
  const data = await request("/orders/my-orders", {}, userId);
  return data.orders || [];
}

export async function createRazorpayOrderApi(userId, orderId) {
  return request("/payments/razorpay/create-order", { method: "POST", body: JSON.stringify({ orderId }) }, userId);
}

export async function verifyRazorpayPaymentApi(userId, paymentPayload) {
  return request("/payments/razorpay/verify", { method: "POST", body: JSON.stringify(paymentPayload) }, userId);
}

export async function reportPaymentFailedApi(userId, orderId, errorReason) {
  return request("/payments/razorpay/failed", { method: "POST", body: JSON.stringify({ orderId, errorReason }) }, userId);
}

export async function fetchAllProgressApi(userId) {
  const data = await request("/progress/all", {}, userId);
  return data.progress || {};
}

export async function updateProgressApi(userId, courseId, lessonId, patch) {
  return request(`/progress/${courseId}/${lessonId}`, { method: "PUT", body: JSON.stringify(patch) }, userId);
}
