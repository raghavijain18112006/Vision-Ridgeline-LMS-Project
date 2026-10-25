import express from "express";
import cors from "cors";
import crypto from "crypto";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Configurable Razorpay keys (defaults to test mode keys if not provided)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_ridgeline2026";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "ridgeline_secret_key_demo_2026";
const IS_TEST_MODE = !process.env.RAZORPAY_KEY_ID;

app.use(cors());
app.use(express.json());

// Helper to authenticate user from header (simple token/userId header)
function getUser(req) {
  const userId = req.headers["x-user-id"] || "u1";
  return db.getUserById(userId);
}

// Coupons dictionary
const COUPONS = {
  RIDGELINE10: 0.1, // 10% off
  WELCOME20: 0.2 // 20% off
};

// ==================== AUTH & PROFILE ROUTES ====================

app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    // If user does not exist in demo environment, auto-provision user
    user = db.createUser({
      email: email.trim().toLowerCase(),
      name: email.split("@")[0].replace(/[._]/g, " "),
      password: password || "password123",
      role: role || "student"
    });
  } else {
    // Update last login
    db.updateUser(user.id, { lastLogin: new Date().toISOString() });
    user = db.getUserById(user.id);
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended. Please contact admin." });
  }

  res.json({
    user,
    token: `token-${user.id}-${Date.now()}`
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Name and email are required." });
  }
  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }
  const user = db.createUser({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || "password123",
    role: role || "student"
  });
  res.status(201).json({
    user,
    token: `token-${user.id}-${Date.now()}`
  });
});

app.get("/api/auth/me", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "User not found." });
  res.json({ user });
});

app.put("/api/users/profile", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name, phone, bio, avatar, preferences } = req.body;
  if (name && name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }

  const updated = db.updateUser(user.id, {
    ...(name && { name: name.trim() }),
    ...(phone !== undefined && { phone: phone.trim() }),
    ...(bio !== undefined && { bio: bio.trim() }),
    ...(avatar !== undefined && { avatar: avatar.trim() }),
    ...(preferences !== undefined && { preferences })
  });

  res.json({ user: updated, message: "Profile updated successfully." });
});

app.put("/api/users/password", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  if (user.password && currentPassword && user.password !== currentPassword) {
    return res.status(400).json({ error: "Current password does not match." });
  }

  db.updateUser(user.id, { password: newPassword });
  res.json({ message: "Password updated successfully." });
});

app.get("/api/users/all", (req, res) => {
  const users = db.getUsers().map((u) => {
    const { password, ...safe } = u;
    return safe;
  });
  res.json({ users });
});

app.patch("/api/users/:id/status", (req, res) => {
  const { status } = req.body;
  const updated = db.updateUserStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: "User not found." });
  res.json({ user: updated });
});

// ==================== COURSES ROUTES ====================

app.get("/api/courses", (req, res) => {
  const { status, all } = req.query;
  const courses = db.getCourses();
  if (all === "true") {
    return res.json({ courses });
  }
  if (status) {
    return res.json({ courses: courses.filter((c) => c.status === status) });
  }
  // Default: return all courses for studio/admin, frontend filters by approval where needed
  res.json({ courses });
});

app.get("/api/courses/:id", (req, res) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found." });
  res.json({ course });
});

app.post("/api/courses", (req, res) => {
  const user = getUser(req);
  const { title, category, price, description } = req.body;
  if (!title || title.trim().length < 4) {
    return res.status(400).json({ error: "Title must be at least 4 characters." });
  }

  const course = db.createCourse({
    title: title.trim(),
    category: category || "Web Development",
    price: Math.max(0, Number(price) || 0),
    description: description || "A comprehensive course designed for curious minds.",
    instructor: user?.name || "Instructor"
  });

  res.status(201).json({ course, message: "Course created and submitted for review." });
});

app.put("/api/courses/:id", (req, res) => {
  const { title, category, price, description, instructor } = req.body;
  const updated = db.updateCourse(req.params.id, {
    ...(title && { title: title.trim() }),
    ...(category && { category }),
    ...(price !== undefined && { price: Math.max(0, Number(price) || 0) }),
    ...(description !== undefined && { description: description.trim() }),
    ...(instructor && { instructor: instructor.trim() })
  });

  if (!updated) return res.status(404).json({ error: "Course not found." });
  res.json({ course: updated, message: "Course updated successfully." });
});

app.patch("/api/courses/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  const updated = db.updateCourseStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: "Course not found." });
  res.json({ course: updated, message: `Course ${status}.` });
});

// ==================== ENROLLMENT & FREE COURSES ====================

app.get("/api/enrollments", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ enrollments: [] });
  const enrollments = db.getEnrollments(user.id);
  res.json({ enrollments });
});

app.post("/api/courses/:id/enroll", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in to enroll." });

  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (course.status !== "approved") {
    return res.status(400).json({ error: "This course is not available for enrollment." });
  }

  // Prevent duplicate enrollment
  if (db.isEnrolled(user.id, course.id)) {
    return res.status(400).json({ error: "You are already enrolled in this course." });
  }

  // Enforce price check: only free courses can be enrolled directly without payment
  if (course.price > 0) {
    return res.status(400).json({ error: "This is a paid course. Please proceed through checkout." });
  }

  const enrollment = db.addEnrollment(user.id, course.id);

  // Record free order for record-keeping and student invoice
  db.createOrder({
    userId: user.id,
    items: [{ courseId: course.id, title: course.title, price: 0 }],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    currency: "INR",
    status: "paid",
    paymentMethod: "free_enrollment",
    transactionId: `TXN_FREE_${Date.now()}`
  });

  res.json({
    enrollment,
    message: "Enrolled successfully! You can now start learning."
  });
});

// ==================== CART ROUTES ====================

app.get("/api/cart", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ cart: [] });
  const cart = db.getCart(user.id);
  res.json({ cart });
});

app.post("/api/cart/add", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in to add to cart." });

  const { courseId } = req.body;
  const course = db.getCourseById(courseId);
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (course.status !== "approved") {
    return res.status(400).json({ error: "Course is currently unavailable." });
  }
  if (db.isEnrolled(user.id, courseId)) {
    return res.status(400).json({ error: "You are already enrolled in this course." });
  }

  const updatedCart = db.addToCart(user.id, courseId);
  res.json({ cart: updatedCart, message: "Added to cart." });
});

app.delete("/api/cart/:courseId", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ cart: [] });
  const updatedCart = db.removeFromCart(user.id, req.params.courseId);
  res.json({ cart: updatedCart, message: "Removed from cart." });
});

app.delete("/api/cart", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ cart: [] });
  db.clearCart(user.id);
  res.json({ cart: [], message: "Cart cleared." });
});

// ==================== CHECKOUT & ORDERS ====================

app.post("/api/orders/create", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in to checkout." });

  const { courseIds, couponCode, billingDetails } = req.body;
  if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
    return res.status(400).json({ error: "No courses selected for checkout." });
  }

  // Server-side price calculation using trusted database courses
  const allCourses = db.getCourses();
  const selectedCourses = courseIds
    .map((id) => allCourses.find((c) => c.id === id))
    .filter(Boolean);

  if (selectedCourses.length !== courseIds.length) {
    return res.status(400).json({ error: "One or more selected courses are invalid." });
  }

  // Check for already enrolled
  for (const c of selectedCourses) {
    if (db.isEnrolled(user.id, c.id)) {
      return res.status(400).json({ error: `You are already enrolled in "${c.title}".` });
    }
  }

  const subtotal = selectedCourses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  let discountRate = 0;
  if (couponCode && COUPONS[couponCode.trim().toUpperCase()]) {
    discountRate = COUPONS[couponCode.trim().toUpperCase()];
  }
  const discount = Math.round(subtotal * discountRate);
  const total = Math.max(0, subtotal - discount);

  const order = db.createOrder({
    userId: user.id,
    items: selectedCourses.map((c) => ({
      courseId: c.id,
      title: c.title,
      price: c.price,
      instructor: c.instructor,
      category: c.category
    })),
    subtotal,
    discount,
    couponCode: discountRate > 0 ? couponCode.toUpperCase() : null,
    total,
    currency: "INR",
    billingDetails: billingDetails || {
      name: user.name,
      email: user.email,
      phone: user.phone || ""
    }
  });

  res.status(201).json({ order });
});

app.get("/api/orders/my-orders", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ orders: [] });
  const orders = db.getUserOrders(user.id);
  res.json({ orders: orders.reverse() });
});

// ==================== RAZORPAY PAYMENT FLOW ====================

app.post("/api/payments/razorpay/create-order", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { orderId } = req.body;
  const order = db.getOrderById(orderId);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status === "paid") {
    return res.status(400).json({ error: "This order has already been paid." });
  }

  const amountInPaise = Math.round(order.total * 100);

  // If order amount is 0 (e.g. 100% coupon), handle immediately
  if (amountInPaise === 0) {
    order.status = "paid";
    order.transactionId = `TXN_ZERO_${Date.now()}`;
    db.updateOrder(order.id, order);
    order.items.forEach((item) => db.addEnrollment(user.id, item.courseId));
    db.clearCart(user.id);
    return res.json({
      zeroAmount: true,
      order,
      message: "Order completed with 100% discount."
    });
  }

  const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  db.updateOrder(order.id, { razorpayOrderId });

  res.json({
    orderId: order.id,
    razorpayOrderId,
    amount: amountInPaise,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID,
    isTestMode: IS_TEST_MODE,
    customer: {
      name: user.name,
      email: user.email,
      phone: user.phone || ""
    }
  });
});

app.post("/api/payments/razorpay/verify", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const order = db.getOrderById(orderId);
  if (!order) return res.status(404).json({ error: "Order not found." });

  // Verification:
  // In official Razorpay, signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  // In test mode, allow verification with either valid HMAC or simulated test payment signature
  const isMatch =
    expectedSignature === razorpay_signature ||
    (IS_TEST_MODE && razorpay_signature?.startsWith("test_sig_"));

  if (!isMatch) {
    db.addTransaction({
      orderId: order.id,
      userId: user.id,
      amount: order.total,
      currency: "INR",
      provider: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "failed",
      verified: false
    });
    return res.status(400).json({ error: "Payment signature verification failed." });
  }

  // Payment is verified! Mark order as paid
  const updatedOrder = db.updateOrder(order.id, {
    status: "paid",
    paymentMethod: "razorpay",
    transactionId: razorpay_payment_id,
    paidAt: new Date().toISOString()
  });

  // Record transaction
  db.addTransaction({
    orderId: order.id,
    userId: user.id,
    amount: order.total,
    currency: "INR",
    provider: "razorpay",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    status: "success",
    verified: true
  });

  // Create enrollments for all courses in order
  const newEnrollments = [];
  for (const item of order.items) {
    const enr = db.addEnrollment(user.id, item.courseId);
    newEnrollments.push(enr);
  }

  // Clear purchased courses from active cart
  for (const item of order.items) {
    db.removeFromCart(user.id, item.courseId);
  }

  res.json({
    success: true,
    order: updatedOrder,
    enrollments: newEnrollments,
    message: "Payment verified successfully. Courses are now available in My Learning!"
  });
});

app.post("/api/payments/razorpay/failed", (req, res) => {
  const user = getUser(req);
  const { orderId, errorReason } = req.body;
  if (orderId) {
    db.updateOrder(orderId, { status: "failed", failureReason: errorReason || "Cancelled by user" });
  }
  res.json({ success: true, message: "Payment failure recorded. Cart preserved." });
});

// ==================== PROGRESS ====================

app.get("/api/progress/all", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ progress: {} });
  res.json({ progress: db.getAllUserProgress(user.id) });
});

app.get("/api/progress/:courseId", (req, res) => {
  const user = getUser(req);
  if (!user) return res.json({ progress: {} });
  res.json({ progress: db.getUserProgress(user.id, req.params.courseId) });
});

app.put("/api/progress/:courseId/:lessonId", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { watched, complete, quizScore } = req.body;
  const courseProgress = db.updateProgress(user.id, req.params.courseId, req.params.lessonId, {
    ...(watched !== undefined && { watched }),
    ...(complete !== undefined && { complete }),
    ...(quizScore !== undefined && { quizScore })
  });

  res.json({ progress: courseProgress });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Ridgeline LMS] Server running on http://localhost:${PORT}`);
});
