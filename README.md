# Ridgeline LMS — Complete Connected Learning Management System

A production-grade, beautifully integrated React + Vite + Node.js/Express Learning Management System (LMS) with full Razorpay checkout integration, persistent multi-user data storage, complete profile management with order history and certificates, and real-time state synchronization across all modules.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v24.20.0)
- npm (tested on npm 11.19.0)

### Installation
In the project directory (`lms-project`):

```bash
npm install
```

### Running the Project

You can run both the Express backend and the Vite frontend:

#### Option A: Run Backend & Frontend in separate terminals
**Terminal 1 (Backend Server on http://localhost:5000):**
```bash
npm run server
```

**Terminal 2 (Frontend Client on http://localhost:5173):**
```bash
npm run dev
```

#### Option B: Offline / Standalone Client
If the backend server is not running, the frontend automatically falls back to its built-in local persistent store, so all features (profile, cart, payments, checkout, enrollments, certificates) continue to function seamlessly!

### Automated Integration Test Suite
To execute the end-to-end integration test suite verifying authentication, cart operations, server-side pricing, Razorpay HMAC-SHA256 signature verification, course enrollment, and admin approvals:

```bash
node -e "import('./server/index.js').then(() => { setTimeout(() => { import('./test-integration.js').then(() => process.exit(0)); }, 1200); });"
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 2. Key Features Implemented

### 2.1 Complete Profile Experience (Guided by Reference Image)
- **Profile Overview**: Displays full name, high-resolution avatar with an in-place selector, Student/User ID (`RL-2026-001`), role badge, last login timestamp, and device metadata (`Windows · New Delhi, India`).
- **Profile Editing**: Edit name, phone number, bio, and avatar with real-time validation. Role escalation is blocked server-side.
- **SMS & Email Alerts**: Interactive switches for SMS alerts and email digest activation directly matching the reference layout.
- **"My bills & orders"**: Clean transaction ledger matching the reference image's "My bills" card:
  - Filter by All, Paid, or Free.
  - Emerald green status dot and `Bill paid` badge.
  - Printable invoice/receipt view modal with itemized pricing, customer info, and transaction reference.
- **Learning Tabs**:
  - Enrolled courses with visual completion progress.
  - Verified Certificates of Completion for courses with 100% progress, complete with certificate modal view.
- **Authenticated Password Change**: Change password modal with current password verification and length validation.

### 2.2 Shopping Cart & Checkout
- **Persistent Cart**: Isolated per user and synced with the backend and local storage across page refreshes.
- **Validation**:
  - Prevents adding courses already enrolled.
  - Prevents duplicate items.
  - Rejects unapproved/pending courses.
- **Itemized Pricing**: Course thumbnails, category, instructor, item removal, and subtotal calculation.
- **Checkout Workflow**:
  - Itemized order review.
  - Billing details form (Name, Email, Phone, State).
  - Discount coupons (`RIDGELINE10` for 10% off, `WELCOME20` for 20% off).
  - Taxes/GST clearly shown.

### 2.3 Official Razorpay Gateway & Verification
- **Server-Side Price Calculation**: Prices are looked up strictly from trusted database courses; client-submitted prices are never trusted.
- **Razorpay Order Creation**: `/api/payments/razorpay/create-order` creates orders on the server.
- **Signature Verification**: Verifies payment integrity using HMAC-SHA256 with the secret key (`crypto.createHmac('sha256', secret)`).
- **Test Gateway Mode**: Built-in interactive Razorpay modal allows demonstration of successful payment, bank failure, and user cancellation with full backend signature verification without requiring live bank credentials.
- **Post-Payment Transition**: Automatically marks order as paid, enrolls student, cleanses purchased items from the active cart, updates student counts, and redirects to Order Confirmation.

### 2.4 Global State Synchronization
- **Instant Updates**: Editing a profile immediately updates the sidebar card, header initials, account popover, and admin user table.
- **Course Catalog**: Only approved courses appear in the catalog. Instructor-created courses default to "pending" and appear only after admin approval.
- **Multi-User Isolation**: Signing out and logging in as another user switches cart, enrollments, orders, and progress cleanly without data leakage.

---

## 3. Environment Variables (Optional)

To configure live Razorpay credentials instead of test mode:

```bash
# In your terminal or .env file:
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PORT=5000
```

---

## 4. Test Accounts

| Name | Email | Password | Role |
| --- | --- | --- | --- |
| Rhea Kapoor | `demo@ridgeline.app` | `password123` | Student |
| Dev Malhotra | `dev@ridgeline.app` | `password123` | Student |
| Ananya Rao | `ananya@ridgeline.app` | `password123` | Instructor |
| Vikram Shah | `vikram@ridgeline.app` | `password123` | Instructor |
| Admin User | `admin@ridgeline.app` | `password123` | Admin |
