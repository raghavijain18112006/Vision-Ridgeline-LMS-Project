import React from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmtMoney } from "../data.js";

export function OrderConfirmation({ orderId, onOpenCourse, onGoToLearning }) {
  const { orders, courses } = useApp();

  const order = orders.find((o) => o.id === orderId) || orders[0];

  return (
    <div className="order-confirmation-container">
      <div className="panel order-confirmation-card">
        <div className="confirmation-icon">🎉</div>
        <span className="badge green">PAYMENT SUCCESSFUL</span>
        <h2>Congratulations! You're Enrolled.</h2>
        <p className="muted" style={{ maxWidth: 460, margin: "10px auto 24px" }}>
          Your payment has been verified and your course access has been activated immediately. A confirmation receipt
          has been saved to your profile.
        </p>

        {order && (
          <div className="order-receipt-summary">
            <div className="summary-line">
              <span>Order ID</span>
              <b>{order.id}</b>
            </div>
            <div className="summary-line">
              <span>Transaction Reference</span>
              <b>{order.transactionId || "TXN_VERIFIED"}</b>
            </div>
            <div className="summary-line">
              <span>Total Paid</span>
              <strong>{fmtMoney(order.total)}</strong>
            </div>
            <div className="summary-line">
              <span>Payment Date</span>
              <b>{new Date(order.createdAt).toLocaleDateString()}</b>
            </div>

            <div className="confirmed-courses-list">
              <h3>Your Purchased Courses</h3>
              {order.items?.map((item) => (
                <div className="confirmed-course-row" key={item.courseId}>
                  <div>
                    <b>{item.title}</b>
                    <small className="muted">{item.category || "Online Course"}</small>
                  </div>
                  <button className="btn small" onClick={() => onOpenCourse(item.courseId)}>
                    Start Learning →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="confirmation-actions">
          <button className="btn" onClick={onGoToLearning}>
            Go to My Learning ↗
          </button>
        </div>
      </div>
    </div>
  );
}
