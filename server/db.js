import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "data", "database.json");

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return {
        users: [],
        courses: [],
        enrollments: [],
        carts: {},
        orders: [],
        payment_transactions: [],
        progress: {}
      };
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return {
      users: [],
      courses: [],
      enrollments: [],
      carts: {},
      orders: [],
      payment_transactions: [],
      progress: {}
    };
  }
}

function writeDB(data) {
  try {
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, DB_PATH);
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

export const db = {
  // Users
  getUsers() {
    return readDB().users;
  },
  getUserById(id) {
    return readDB().users.find((u) => u.id === id) || null;
  },
  getUserByEmail(email) {
    return readDB().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  createUser(userData) {
    const data = readDB();
    const newUser = {
      id: `u${Date.now()}`,
      studentId: `RL-${new Date().getFullYear()}-${String(data.users.length + 1).padStart(3, "0")}`,
      status: "active",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      phone: "",
      bio: "",
      preferences: { smsAlerts: false, emailDigest: true },
      ...userData
    };
    data.users.push(newUser);
    if (!data.carts[newUser.id]) data.carts[newUser.id] = [];
    writeDB(data);
    return newUser;
  },
  updateUser(id, patch) {
    const data = readDB();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    // Disallow role changes via profile update
    const safePatch = { ...patch };
    delete safePatch.role;
    delete safePatch.id;
    delete safePatch.studentId;
    delete safePatch.createdAt;

    data.users[index] = { ...data.users[index], ...safePatch, updatedAt: new Date().toISOString() };
    writeDB(data);
    return data.users[index];
  },
  updateUserStatus(id, status) {
    const data = readDB();
    const user = data.users.find((u) => u.id === id);
    if (user) {
      user.status = status;
      writeDB(data);
      return user;
    }
    return null;
  },

  // Courses
  getCourses() {
    return readDB().courses;
  },
  getCourseById(id) {
    return readDB().courses.find((c) => c.id === id) || null;
  },
  createCourse(courseData) {
    const data = readDB();
    const id = `c${Date.now()}`;
    const newCourse = {
      id,
      rating: 0,
      students: 0,
      status: "pending",
      sections: [
        {
          id: `s-${Date.now()}`,
          title: "Introduction",
          lessons: [{ id: `l-${Date.now()}`, title: "Welcome to the Course", duration: 300, type: "video" }]
        }
      ],
      ...courseData
    };
    data.courses.push(newCourse);
    writeDB(data);
    return newCourse;
  },
  updateCourse(id, patch) {
    const data = readDB();
    const idx = data.courses.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    data.courses[idx] = { ...data.courses[idx], ...patch };
    writeDB(data);
    return data.courses[idx];
  },
  updateCourseStatus(id, status) {
    const data = readDB();
    const course = data.courses.find((c) => c.id === id);
    if (course) {
      course.status = status;
      writeDB(data);
      return course;
    }
    return null;
  },
  incrementCourseLearners(courseId) {
    const data = readDB();
    const course = data.courses.find((c) => c.id === courseId);
    if (course) {
      course.students = (course.students || 0) + 1;
      writeDB(data);
    }
  },

  // Enrollments
  getEnrollments(userId) {
    const data = readDB();
    return data.enrollments.filter((e) => e.userId === userId && e.status === "active");
  },
  isEnrolled(userId, courseId) {
    const data = readDB();
    return data.enrollments.some((e) => e.userId === userId && e.courseId === courseId && e.status === "active");
  },
  addEnrollment(userId, courseId) {
    const data = readDB();
    const existing = data.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
    if (existing) {
      if (existing.status !== "active") {
        existing.status = "active";
        writeDB(data);
      }
      return existing;
    }
    const enrollment = {
      id: `enr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      status: "active"
    };
    data.enrollments.push(enrollment);
    // Remove from cart if present
    if (data.carts[userId]) {
      data.carts[userId] = data.carts[userId].filter((id) => id !== courseId);
    }
    writeDB(data);
    this.incrementCourseLearners(courseId);
    return enrollment;
  },

  // Cart
  getCart(userId) {
    const data = readDB();
    const courseIds = data.carts[userId] || [];
    return data.courses.filter((c) => courseIds.includes(c.id));
  },
  addToCart(userId, courseId) {
    const data = readDB();
    if (!data.carts[userId]) data.carts[userId] = [];
    if (!data.carts[userId].includes(courseId)) {
      data.carts[userId].push(courseId);
      writeDB(data);
    }
    return this.getCart(userId);
  },
  removeFromCart(userId, courseId) {
    const data = readDB();
    if (data.carts[userId]) {
      data.carts[userId] = data.carts[userId].filter((id) => id !== courseId);
      writeDB(data);
    }
    return this.getCart(userId);
  },
  clearCart(userId) {
    const data = readDB();
    data.carts[userId] = [];
    writeDB(data);
    return [];
  },

  // Orders
  createOrder(orderData) {
    const data = readDB();
    const order = {
      id: `ORD-${new Date().getFullYear()}-${String(data.orders.length + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      ...orderData
    };
    data.orders.push(order);
    writeDB(data);
    return order;
  },
  getOrderById(id) {
    return readDB().orders.find((o) => o.id === id) || null;
  },
  updateOrder(id, patch) {
    const data = readDB();
    const idx = data.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    data.orders[idx] = { ...data.orders[idx], ...patch };
    writeDB(data);
    return data.orders[idx];
  },
  getUserOrders(userId) {
    return readDB().orders.filter((o) => o.userId === userId);
  },

  // Transactions
  addTransaction(txData) {
    const data = readDB();
    const tx = {
      id: `TXN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...txData
    };
    data.payment_transactions.push(tx);
    writeDB(data);
    return tx;
  },

  // Progress
  getUserProgress(userId, courseId) {
    const data = readDB();
    return data.progress[userId]?.[courseId] || {};
  },
  getAllUserProgress(userId) {
    const data = readDB();
    return data.progress[userId] || {};
  },
  updateProgress(userId, courseId, lessonId, patch) {
    const data = readDB();
    if (!data.progress[userId]) data.progress[userId] = {};
    if (!data.progress[userId][courseId]) data.progress[userId][courseId] = {};
    data.progress[userId][courseId][lessonId] = {
      ...(data.progress[userId][courseId][lessonId] || {}),
      ...patch,
      updatedAt: new Date().toISOString()
    };
    writeDB(data);
    return data.progress[userId][courseId];
  }
};
