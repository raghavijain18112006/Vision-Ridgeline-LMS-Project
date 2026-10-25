import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmtMoney } from "../data.js";

// Helper to dynamically load the Razorpay checkout script if not already on page
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function Checkout({ courseId, onCancel, onOrderSuccess }) {
  const { user, courses, cart, createOrder, createRazorpayOrder, verifyPayment, recordPaymentFailed, notify } = useApp();

  // If a single courseId was passed, checkout just that course; otherwise checkout all items in cart
  const checkoutCourses = courseId
    ? courses.filter((c) => c.id === courseId)
    : cart.length > 0
    ? cart
    : [];

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscountRate, setCouponDiscountRate] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");

  // Billing form
  const [billingName, setBillingName] = useState(user?.name || "");
  const [billingEmail, setBillingEmail] = useState(user?.email || "");
  const [billingPhone, setBillingPhone] = useState(user?.phone || "+91 98765 43210");
  const [billingState, setBillingState] = useState("Delhi");

  // Payment processing & simulation state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showTestGatewayModal, setShowTestGatewayModal] = useState(false);
  const [activeRazorpayData, setActiveRazorpayData] = useState(null);

  const subtotal = checkoutCourses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const discountAmount = Math.round(subtotal * couponDiscountRate);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const applyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (clean === "RIDGELINE10") {
      setAppliedCoupon(clean);
      setCouponDiscountRate(0.1);
      setCouponMsg("Coupon applied! 10% discount.");
    } else if (clean === "WELCOME20") {
      setAppliedCoupon(clean);
      setCouponDiscountRate(0.2);
      setCouponMsg("Coupon applied! 20% discount.");
    } else {
      setCouponMsg("Invalid coupon code. Try RIDGELINE10 or WELCOME20.");
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!billingName.trim() || !billingEmail.trim()) {
      setError("Please complete all required billing fields.");
      return;
    }

    if (checkoutCourses.length === 0) {
      setError("No courses selected for checkout.");
      return;
    }

    try {
      setProcessing(true);

      // Step 1: Create order on server with trusted pricing
      const order = await createOrder({
        courseIds: checkoutCourses.map((c) => c.id),
        couponCode: appliedCoupon || null,
        billingDetails: {
          name: billingName.trim(),
          email: billingEmail.trim(),
          phone: billingPhone.trim(),
          state: billingState
        }
      });

      // Step 2: Create Razorpay order on server
      const rzpData = await createRazorpayOrder(order.id);

      // If order amount is 0 (100% coupon or free)
      if (rzpData.zeroAmount) {
        notify("Order confirmed for free! Course added to My Learning.");
        onOrderSuccess(order.id);
        return;
      }

      // Step 3: Attempt to launch official Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay && !rzpData.isTestMode) {
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: "Ridgeline LMS",
          description: `Enrollment in ${checkoutCourses.map((c) => c.title).join(", ")}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: billingName,
            email: billingEmail,
            contact: billingPhone
          },
          theme: { color: "#6857f5" },
          handler: async function (response) {
            try {
              const verifyRes = await verifyPayment({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verifyRes.success) {
                onOrderSuccess(order.id);
              }
            } catch (vErr) {
              setError("Payment verification failed on server: " + vErr.message);
            }
          },
          modal: {
            ondismiss: function () {
              recordPaymentFailed(order.id, "User closed payment window");
              setProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Step 4: Built-in Razorpay Test Gateway Modal for local development & demonstration
        setActiveRazorpayData({ order, rzpData });
        setShowTestGatewayModal(true);
      }
    } catch (err) {
      setError(err.message || "Failed to initiate payment. Please try again.");
      setProcessing(false);
    }
  };

  // Simulated Test Gateway handlers
  const handleTestPaymentSuccess = async () => {
    if (!activeRazorpayData) return;
    const { order, rzpData } = activeRazorpayData;
    setShowTestGatewayModal(false);
    try {
      const simulatedPaymentId = `pay_test_${Date.now()}`;
      // Generate signature acceptable in test mode
      const simulatedSignature = `test_sig_${Date.now()}`;
      const verifyRes = await verifyPayment({
        orderId: order.id,
        razorpay_order_id: rzpData.razorpayOrderId,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: simulatedSignature
      });
      if (verifyRes.success) {
        onOrderSuccess(order.id);
      }
    } catch (err) {
      setError("Payment verification failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTestPaymentFailure = async () => {
    if (!activeRazorpayData) return;
    setShowTestGatewayModal(false);
    setProcessing(false);
    setError("Bank payment declined or insufficient funds. Your cart remains intact.");
    await recordPaymentFailed(activeRazorpayData.order.id, "Simulated card failure");
  };

  const handleTestPaymentCancel = async () => {
    if (!activeRazorpayData) return;
    setShowTestGatewayModal(false);
    setProcessing(false);
    setError("Payment cancelled. You can retry when you are ready.");
    await recordPaymentFailed(activeRazorpayData.order.id, "Simulated user cancellation");
  };

  if (checkoutCourses.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
        <h2>No courses to checkout</h2>
        <p className="muted">Please select a course or add items to your cart first.</p>
        <button className="btn" onClick={onCancel}>
          Return to catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="section-head">
        <div>
          <button className="text-btn" onClick={onCancel} style={{ marginBottom: 8 }}>
            ← Back to courses
          </button>
          <h2>Secure Checkout</h2>
          <p>Complete your enrollment through official Razorpay checkout.</p>
        </div>
        <span className="badge green">256-BIT ENCRYPTION</span>
      </div>

      <div className="checkout-layout">
        {/* Left: Billing Form */}
        <div className="panel checkout-form-panel">
          <form onSubmit={handleCheckoutSubmit}>
            <div className="panel-title">
              <div>
                <span className="eyebrow">STEP 1 OF 2</span>
                <h2>Billing & Learner Information</h2>
              </div>
            </div>

            <div className="form-row-duo">
              <label>
                Full Name *
                <input
                  type="text"
                  required
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="e.g. Rhea Kapoor"
                />
              </label>

              <label>
                Email Address *
                <input
                  type="email"
                  required
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="form-row-duo">
              <label>
                Phone Number *
                <input
                  type="tel"
                  required
                  value={billingPhone}
                  onChange={(e) => setBillingPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label>
                State / Region (India) *
                <select value={billingState} onChange={(e) => setBillingState(e.target.value)}>
                  {["Delhi", "Maharashtra", "Karnataka", "Punjab", "Haryana", "Tamil Nadu", "Telangana", "West Bengal", "Gujarat", "Other"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            {/* Coupon Code Section */}
            <div className="coupon-box">
              <span className="eyebrow">HAVE A COUPON CODE?</span>
              <div className="coupon-input-row">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Try RIDGELINE10 or WELCOME20"
                />
                <button type="button" className="btn secondary" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              {couponMsg && (
                <small className={couponDiscountRate > 0 ? "coupon-success" : "field-error"}>{couponMsg}</small>
              )}
            </div>

            {error && <div className="form-error" style={{ margin: "16px 0" }}>{error}</div>}

            <div className="payment-security-notice">
              <span>🔒</span>
              <div>
                <b>Official Razorpay Integration</b>
                <p className="muted" style={{ margin: 0, fontSize: 11 }}>
                  Payments are processed securely via Razorpay. We do not store raw card numbers, CVV, or banking
                  credentials.
                </p>
              </div>
            </div>

            <button type="submit" className="btn auth-submit" disabled={processing} style={{ marginTop: 20 }}>
              {processing ? "Connecting to payment gateway..." : `Pay ${fmtMoney(totalAmount)} with Razorpay →`}
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="panel checkout-summary-panel">
          <span className="eyebrow">ORDER SUMMARY</span>
          <h2>Selected Course{checkoutCourses.length > 1 ? "s" : ""}</h2>

          <div className="checkout-items-list">
            {checkoutCourses.map((c) => (
              <div className="checkout-item" key={c.id}>
                <div className="cart-thumb">✦</div>
                <div className="cart-item-info">
                  <b>{c.title}</b>
                  <small>{c.category} · {c.instructor}</small>
                </div>
                <strong>{fmtMoney(c.price)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-line">
            <span>Course Subtotal</span>
            <b>{fmtMoney(subtotal)}</b>
          </div>

          {discountAmount > 0 && (
            <div className="summary-line" style={{ color: "var(--green)" }}>
              <span>Discount ({appliedCoupon})</span>
              <b>- {fmtMoney(discountAmount)}</b>
            </div>
          )}

          <div className="summary-line">
            <span>Taxes & GST (18%)</span>
            <span className="badge green">Included in price</span>
          </div>

          <div className="summary-total">
            <span>Total Payable</span>
            <strong>{fmtMoney(totalAmount)}</strong>
          </div>

          <div className="checkout-perks">
            <div>✓ Immediate lifetime course access</div>
            <div>✓ Verified certificate upon completion</div>
            <div>✓ Quizzes and downloadable resources</div>
          </div>
        </div>
      </div>

      {/* ================= RAZORPAY TEST GATEWAY MODAL ================= */}
      {showTestGatewayModal && activeRazorpayData && (
        <div className="modal-backdrop">
          <div className="panel razorpay-modal">
            <div className="razorpay-modal-header">
              <div className="razorpay-brand">
                <span className="rzp-logo-badge">R</span>
                <div>
                  <b>Razorpay Checkout</b>
                  <small>Test Gateway Environment</small>
                </div>
              </div>
              <button className="text-btn danger-text" onClick={handleTestPaymentCancel}>
                ✕ Cancel
              </button>
            </div>

            <div className="razorpay-amount-box">
              <span>Amount Payable</span>
              <strong>{fmtMoney(activeRazorpayData.order.total)}</strong>
              <small>Order ID: {activeRazorpayData.rzpData.razorpayOrderId}</small>
            </div>

            <div className="razorpay-test-options">
              <p className="muted" style={{ fontSize: 12 }}>
                This test checkout simulates the real Razorpay payment dialogue and triggers server-side signature
                verification upon completion.
              </p>

              <button className="btn rzp-pay-btn" onClick={handleTestPaymentSuccess}>
                ✓ Simulate Successful Payment (UPI / Card)
              </button>

              <button className="btn secondary rzp-fail-btn" onClick={handleTestPaymentFailure}>
                ✕ Simulate Bank Failure / Decline
              </button>

              <button className="text-btn" onClick={handleTestPaymentCancel}>
                Cancel and return to checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
