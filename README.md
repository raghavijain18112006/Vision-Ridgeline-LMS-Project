# Ridgeline LMS — Complete Connected Learning Management System

A React + Vite + Node.js/Express Learning Management System (LMS) with course management, profile management, shopping cart, checkout, payment integration, and dashboards for students, instructors, and administrators.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

In the project directory (`lms-project`), run:

```bash
npm install
```

### Running the Project

Run the backend and frontend in separate terminals.

**Terminal 1 — Backend server**

```bash
npm run server
```

**Terminal 2 — Frontend client**

```bash
npm run dev
```

The frontend typically runs at `http://localhost:5173`, and the backend runs at `http://localhost:5000`.

### Production Build

```bash
npm run build
npm run preview
```

### Integration Tests

```bash
node -e "import('./server/index.js').then(() => { setTimeout(() => { import('./test-integration.js').then(() => process.exit(0)); }, 1200); });"
```

Run the integration tests only after checking that the backend and test script are configured as expected.

---

## 2. Key Features

### 2.1 User Profiles
- Profile overview and avatar selection.
- Profile editing with validation.
- User roles and account information.
- Order history and transaction records.
- Enrolled courses and learning progress.
- Certificates for completed courses.
- Password change functionality.

### 2.2 Course Catalog and Management
- Browse and explore available courses.
- Course details and instructor information.
- Student, instructor, and administrator dashboards.
- Course creation and approval workflows.
- Enrollment and progress tracking.

### 2.3 Shopping Cart and Checkout
- Persistent shopping cart.
- Duplicate and enrollment validation.
- Itemized order review.
- Billing details and subtotal calculation.
- Discount coupon support.
- Taxes and GST display.

### 2.4 Payment Integration
- Razorpay order creation through the backend.
- Server-side course price validation.
- Payment signature verification using HMAC-SHA256.
- Test payment flow for demonstration.
- Order confirmation and enrollment updates.

**Important:** Live payments require correctly configured Razorpay credentials and server-side environment variables. Never commit real credentials or secrets to GitHub.

### 2.5 State Synchronization
- Profile updates reflected across relevant UI components.
- Cart, orders, enrollments, and progress managed per user.
- Course approval status reflected in the catalog.
- Backend and local-storage persistence, depending on the configured application flow.

---

## 3. Environment Variables

For live Razorpay integration, configure the required environment variables in a local `.env` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PORT=5000
```

Use placeholder values in documentation. Do not publish real API keys, secrets, passwords, or private credentials.

---

## 4. Test Accounts

Use only the demo accounts configured in the application or its seed data. Check the project's database and authentication code for the current test usernames, passwords, and roles before using them.

---

## 5. Project Structure

```text
lms-project/
├── server/
│   ├── data/
│   ├── db.js
│   └── index.js
├── src/
│   ├── components/
│   ├── context/
│   ├── App.jsx
│   ├── api.js
│   ├── data.js
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── test-integration.js
└── vite.config.js
```

---

## 6. Technologies Used

- React
- Vite
- JavaScript
- Node.js
- Express
- Razorpay integration
- CSS
- Git and GitHub

---

## 7. Development Workflow

This project is maintained collaboratively using Git and GitHub.

1. Pull the latest changes before starting work.
2. Implement and test your changes locally.
3. Commit your changes with a descriptive message.
4. Pull the latest shared changes before pushing.
5. Push your changes to the shared repository.

---

## 8. Production Build

To verify the frontend build:

```bash
npm run build
```

Resolve any build errors before deploying the application.

---

## About

Ridgeline LMS is an online learning platform designed to help students discover courses, enroll, track progress, and manage their learning experience. It also provides course management and dedicated workflows for instructors and administrators.