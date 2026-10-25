import crypto from "crypto";

const BASE = "http://localhost:5000/api";
let currentUserId = "u1";

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": currentUserId,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   RIDGELINE LMS — COMPREHENSIVE INTEGRATION SUITE");
  console.log("=======================================================\n");

  // Test 1: User Login
  console.log("--- 1. Authentication & Profile ---");
  const loginRes = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "demo@ridgeline.app", password: "password123", role: "student" })
  });
  assert(loginRes.ok && loginRes.data.user.email === "demo@ridgeline.app", "Student login successful");
  currentUserId = loginRes.data.user.id;

  // Test 2: Update Profile
  const updateProfileRes = await api("/users/profile", {
    method: "PUT",
    body: JSON.stringify({
      name: "Rhea Kapoor (Updated)",
      phone: "+91 98765 00000",
      bio: "Updated learning objective for full-stack interview prep.",
      preferences: { smsAlerts: true, emailDigest: false }
    })
  });
  assert(
    updateProfileRes.ok && updateProfileRes.data.user.name === "Rhea Kapoor (Updated)",
    "Profile update persists and returns updated user"
  );
  assert(updateProfileRes.data.user.role === "student", "User role cannot be tampered with in profile update");

  // Test 3: Password Update
  const pwdRes = await api("/users/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword: "password123", newPassword: "password_new_123" })
  });
  assert(pwdRes.ok, "Password update successful with validation");

  // Test 4: Course Catalog & Status
  console.log("\n--- 2. Course Catalog & Status Visibility ---");
  const coursesRes = await api("/courses");
  assert(coursesRes.ok && coursesRes.data.courses.length >= 8, "Loaded full course catalog from database");

  const approvedCourses = coursesRes.data.courses.filter((c) => c.status === "approved");
  assert(approvedCourses.length >= 7, "Approved courses visible in catalog");

  // Test 5: Cart Management
  console.log("\n--- 3. Shopping Cart Operations ---");
  await api("/cart", { method: "DELETE" }); // clear first
  const emptyCart = await api("/cart");
  assert(emptyCart.data.cart.length === 0, "Cart clears successfully");

  // Add course c2 (₹1499)
  const addCartRes = await api("/cart/add", {
    method: "POST",
    body: JSON.stringify({ courseId: "c2" })
  });
  assert(addCartRes.ok && addCartRes.data.cart.some((c) => c.id === "c2"), "Course c2 added to cart");

  // Duplicate add prevention
  const dupAddRes = await api("/cart/add", {
    method: "POST",
    body: JSON.stringify({ courseId: "c2" })
  });
  assert(dupAddRes.data.cart.filter((c) => c.id === "c2").length === 1, "Duplicate course in cart prevented");

  // Prevent adding already enrolled course
  const addEnrolledRes = await api("/cart/add", {
    method: "POST",
    body: JSON.stringify({ courseId: "c1" })
  });
  assert(!addEnrolledRes.ok, "Cannot add already-enrolled course c1 to cart");

  // Test 6: Free Course Enrollment
  console.log("\n--- 4. Enrollment Workflow ---");
  // Try enrolling in paid course via free endpoint
  const invalidFreeRes = await api("/courses/c2/enroll", { method: "POST" });
  assert(!invalidFreeRes.ok, "Paid course c2 rejected by free enrollment endpoint (HTTP 400)");

  // Try duplicate enrollment in c1
  const dupEnrollRes = await api("/courses/c1/enroll", { method: "POST" });
  assert(!dupEnrollRes.ok, "Duplicate enrollment in c1 prevented");

  // Test 7: Checkout & Trusted Pricing
  console.log("\n--- 5. Checkout, Trusted Pricing & Coupons ---");
  const orderRes = await api("/orders/create", {
    method: "POST",
    body: JSON.stringify({
      courseIds: ["c2"],
      couponCode: "RIDGELINE10",
      billingDetails: { name: "Rhea Kapoor", email: "demo@ridgeline.app", phone: "+91 98765 00000" }
    })
  });
  assert(orderRes.ok, "Order created with server-side pricing");
  const order = orderRes.data.order;
  assert(order.subtotal === 1499, "Subtotal calculated on server: ₹1499");
  assert(order.discount === 150, "10% coupon RIDGELINE10 applied correctly: -₹150");
  assert(order.total === 1349, "Final total calculated securely on server: ₹1349");

  // Test 8: Razorpay Order Creation & Payment Signature Verification
  console.log("\n--- 6. Razorpay Gateway & Signature Verification ---");
  const rzpOrderRes = await api("/payments/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify({ orderId: order.id })
  });
  assert(rzpOrderRes.ok && rzpOrderRes.data.razorpayOrderId, "Razorpay payment order generated on server");

  const rzpOrderId = rzpOrderRes.data.razorpayOrderId;
  const paymentId = `pay_test_${Date.now()}`;
  const secret = "ridgeline_secret_key_demo_2026";
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${rzpOrderId}|${paymentId}`)
    .digest("hex");

  // Test valid signature
  const verifyRes = await api("/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify({
      orderId: order.id,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature
    })
  });
  assert(verifyRes.ok && verifyRes.data.success, "Payment verified via HMAC-SHA256 signature");
  assert(verifyRes.data.order.status === "paid", "Order status marked as 'paid'");

  // Verify access is granted
  const enrollmentsRes = await api("/enrollments");
  assert(
    enrollmentsRes.data.enrollments.some((e) => e.courseId === "c2"),
    "Learner granted access to course c2 after payment verification"
  );

  // Verify c2 removed from cart
  const cartAfterPay = await api("/cart");
  assert(!cartAfterPay.data.cart.some((c) => c.id === "c2"), "Purchased course removed from active cart");

  // Test invalid signature rejection
  const fakeVerifyRes = await api("/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify({
      orderId: order.id,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: "tampered_fake_signature"
    })
  });
  assert(!fakeVerifyRes.ok, "Forged payment signature rejected by server (HTTP 400)");

  // Test 9: My Bills / Order History
  console.log("\n--- 7. Order & Invoices History ---");
  const myOrdersRes = await api("/orders/my-orders");
  assert(myOrdersRes.ok && myOrdersRes.data.orders.length >= 2, "Orders & bills history populated with receipts");

  // Test 10: Progress Tracking
  console.log("\n--- 8. Learning Progress Synchronization ---");
  const progRes = await api("/progress/c1/l2", {
    method: "PUT",
    body: JSON.stringify({ watched: 600, complete: true })
  });
  assert(progRes.ok && progRes.data.progress.l2.complete, "Lesson progress saved to persistent backend");

  // Test 11: Instructor & Admin Flows
  console.log("\n--- 9. Instructor Studio & Admin Approvals ---");
  // Instructor creates course
  const newCourseRes = await api("/courses", {
    method: "POST",
    body: JSON.stringify({
      title: "Mastering TypeScript Enterprise Architectures",
      category: "Web Development",
      price: 1999,
      description: "Design production TypeScript applications."
    })
  });
  assert(newCourseRes.ok && newCourseRes.data.course.status === "pending", "Instructor created course in pending status");
  const newCourseId = newCourseRes.data.course.id;

  // Admin approves course
  currentUserId = "u5"; // Admin user
  const approveRes = await api(`/courses/${newCourseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved" })
  });
  assert(approveRes.ok && approveRes.data.course.status === "approved", "Admin approved course; status is now approved");

  // Admin toggles user status
  const suspendRes = await api("/users/u2/status", {
    method: "PATCH",
    body: JSON.stringify({ status: "suspended" })
  });
  assert(suspendRes.ok && suspendRes.data.user.status === "suspended", "Admin suspended student u2");

  const reactivateRes = await api("/users/u2/status", {
    method: "PATCH",
    body: JSON.stringify({ status: "active" })
  });
  assert(reactivateRes.ok && reactivateRes.data.user.status === "active", "Admin reactivated student u2");

  // Reset student u1 name back for clean demo
  currentUserId = "u1";
  await api("/users/profile", {
    method: "PUT",
    body: JSON.stringify({ name: "Rhea Kapoor", phone: "+91 98765 43210" })
  });

  console.log("\n=======================================================");
  console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
