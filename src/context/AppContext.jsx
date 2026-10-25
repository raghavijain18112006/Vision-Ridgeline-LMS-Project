import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  loginApi,
  registerApi,
  getMeApi,
  updateProfileApi,
  updatePasswordApi,
  fetchUsersApi,
  updateUserStatusApi,
  fetchCourses,
  createCourseApi,
  updateCourseApi,
  updateCourseStatusApi,
  fetchEnrollmentsApi,
  enrollFreeCourseApi,
  fetchCartApi,
  addToCartApi,
  removeFromCartApi,
  clearCartApi,
  createOrderApi,
  fetchMyOrdersApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  reportPaymentFailedApi,
  fetchAllProgressApi,
  updateProgressApi
} from "../api.js";
import { initialCourses, initialUsers } from "../data.js";

const AppContext = createContext(null);

const AUTH_STORAGE_KEY = "ridgeline_auth_user";

export function AppProvider({ children }) {
  // 1. Auth state (persisted to localStorage)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default demo student user
    return {
      id: "u1",
      name: "Rhea Kapoor",
      email: "demo@ridgeline.app",
      role: "student",
      status: "active",
      phone: "+91 98765 43210",
      bio: "Aspiring frontend engineer and UI enthusiast. Learning modern full-stack web development.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      studentId: "RL-2026-001",
      createdAt: "2026-01-15T09:30:00.000Z",
      lastLogin: new Date().toISOString(),
      preferences: { smsAlerts: true, emailDigest: true }
    };
  });

  // 2. Main data states
  const [courses, setCourses] = useState(initialCourses);
  const [cart, setCart] = useState([]);
  const [enrollments, setEnrollments] = useState(["c1"]);
  const [orders, setOrders] = useState([]);
  const [progress, setProgress] = useState({ c1: { l1: { complete: true, watched: 480 } } });
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // Sync user with localStorage
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {}
    }
  }, [user]);

  // Load all user data when user changes or app boots
  const loadUserData = useCallback(async (activeUserId) => {
    if (!activeUserId) return;
    try {
      setLoading(true);
      const [fetchedCourses, fetchedCart, fetchedEnrollments, fetchedOrders, fetchedProgress, fetchedUsers] =
        await Promise.all([
          fetchCourses(activeUserId),
          fetchCartApi(activeUserId),
          fetchEnrollmentsApi(activeUserId),
          fetchMyOrdersApi(activeUserId),
          fetchAllProgressApi(activeUserId),
          fetchUsersApi(activeUserId)
        ]);

      if (fetchedCourses && fetchedCourses.length > 0) setCourses(fetchedCourses);
      setCart(fetchedCart || []);
      setEnrollments(fetchedEnrollments || ["c1"]);
      setOrders(fetchedOrders || []);
      setProgress(fetchedProgress || {});
      if (fetchedUsers?.users) setUsers(fetchedUsers.users);
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadUserData(user.id);
    }
  }, [user?.id, loadUserData]);

  // Auth actions
  const login = useCallback(
    async ({ email, password, role }) => {
      try {
        const res = await loginApi(email, password, role);
        if (res.user) {
          setUser(res.user);
          notify(`Welcome back, ${res.user.name}!`);
          return { success: true, user: res.user };
        }
      } catch (err) {
        notify(err.message || "Failed to sign in.");
        return { success: false, error: err.message };
      }
    },
    [notify]
  );

  const register = useCallback(
    async ({ name, email, password, role }) => {
      try {
        const res = await registerApi(name, email, password, role);
        if (res.user) {
          setUser(res.user);
          notify(`Account created successfully! Welcome, ${res.user.name}.`);
          return { success: true, user: res.user };
        }
      } catch (err) {
        notify(err.message || "Failed to create account.");
        return { success: false, error: err.message };
      }
    },
    [notify]
  );

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    setEnrollments([]);
    setOrders([]);
    setProgress({});
    notify("Signed out successfully.");
  }, [notify]);

  // Switch workspace role directly
  const switchRole = useCallback(
    (newRole) => {
      if (!user) return;
      const updated = { ...user, role: newRole };
      setUser(updated);
      notify(`Switched to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} view.`);
    },
    [user, notify]
  );

  // Profile actions
  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return;
      try {
        const res = await updateProfileApi(user.id, patch);
        if (res.user) {
          setUser(res.user);
          // Also update users list for admin sync
          setUsers((prev) => prev.map((u) => (u.id === res.user.id ? { ...u, ...res.user } : u)));
          notify("Profile updated successfully!");
          return { success: true, user: res.user };
        }
      } catch (err) {
        notify(err.message || "Failed to update profile.");
        return { success: false, error: err.message };
      }
    },
    [user, notify]
  );

  const updatePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!user) return;
      try {
        await updatePasswordApi(user.id, currentPassword, newPassword);
        notify("Password changed successfully.");
        return { success: true };
      } catch (err) {
        notify(err.message || "Failed to change password.");
        return { success: false, error: err.message };
      }
    },
    [user, notify]
  );

  // Cart actions
  const addToCart = useCallback(
    async (course) => {
      if (!user) {
        notify("Please sign in to add courses to your cart.");
        return;
      }
      if (enrollments.includes(course.id)) {
        notify("You are already enrolled in this course!");
        return;
      }
      if (cart.some((item) => item.id === course.id)) {
        notify("Course is already in your cart.");
        return;
      }
      try {
        const updatedCart = await addToCartApi(user.id, course.id);
        setCart(updatedCart);
        notify(`Added "${course.title}" to cart.`);
      } catch (err) {
        notify(err.message || "Failed to add to cart.");
      }
    },
    [user, enrollments, cart, notify]
  );

  const removeFromCart = useCallback(
    async (courseId) => {
      if (!user) return;
      try {
        const updatedCart = await removeFromCartApi(user.id, courseId);
        setCart(updatedCart);
        notify("Item removed from cart.");
      } catch (err) {
        notify(err.message || "Failed to remove item.");
      }
    },
    [user, notify]
  );

  const clearCart = useCallback(async () => {
    if (!user) return;
    try {
      await clearCartApi(user.id);
      setCart([]);
      notify("Cart cleared.");
    } catch (err) {
      notify(err.message || "Failed to clear cart.");
    }
  }, [user, notify]);

  // Derived cart totals
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0), 0), [cart]);

  // Enrollment actions
  const enrollFreeCourse = useCallback(
    async (courseId) => {
      if (!user) {
        notify("Please sign in to enroll.");
        return { success: false };
      }
      if (enrollments.includes(courseId)) {
        notify("You are already enrolled in this course!");
        return { success: false };
      }
      try {
        const res = await enrollFreeCourseApi(user.id, courseId);
        setEnrollments((prev) => [...prev, courseId]);
        // Update course student count
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, students: (c.students || 0) + 1 } : c))
        );
        // Refresh orders list for profile bills
        const freshOrders = await fetchMyOrdersApi(user.id);
        setOrders(freshOrders);
        notify(res.message || "Course added to My Learning!");
        return { success: true };
      } catch (err) {
        notify(err.message || "Failed to enroll.");
        return { success: false, error: err.message };
      }
    },
    [user, enrollments, notify]
  );

  // Checkout & Payment actions
  const createOrder = useCallback(
    async ({ courseIds, couponCode, billingDetails }) => {
      if (!user) throw new Error("Please sign in to checkout.");
      const res = await createOrderApi(user.id, { courseIds, couponCode, billingDetails });
      return res.order;
    },
    [user]
  );

  const createRazorpayOrder = useCallback(
    async (orderId) => {
      if (!user) throw new Error("Unauthorized");
      return await createRazorpayOrderApi(user.id, orderId);
    },
    [user]
  );

  const verifyPayment = useCallback(
    async (paymentPayload) => {
      if (!user) throw new Error("Unauthorized");
      const res = await verifyRazorpayPaymentApi(user.id, paymentPayload);
      if (res.success) {
        // Add new enrollments
        if (res.order?.items) {
          const newIds = res.order.items.map((i) => i.courseId);
          setEnrollments((prev) => Array.from(new Set([...prev, ...newIds])));
          // Remove from local cart state
          setCart((prev) => prev.filter((item) => !newIds.includes(item.id)));
          // Increment learner count on courses
          setCourses((prev) =>
            prev.map((c) => (newIds.includes(c.id) ? { ...c, students: (c.students || 0) + 1 } : c))
          );
        }
        // Refresh orders
        const freshOrders = await fetchMyOrdersApi(user.id);
        setOrders(freshOrders);
        notify("Payment verified! Course access granted.");
        return res;
      }
    },
    [user, notify]
  );

  const recordPaymentFailed = useCallback(
    async (orderId, errorReason) => {
      if (!user) return;
      await reportPaymentFailedApi(user.id, orderId, errorReason);
      notify("Payment cancelled or failed. Your cart was preserved.");
    },
    [user, notify]
  );

  // Lesson progress actions
  const updateProgress = useCallback(
    async (courseId, lessonId, patch) => {
      if (!user) return;
      // Optimistic update
      setProgress((prev) => ({
        ...prev,
        [courseId]: {
          ...(prev[courseId] || {}),
          [lessonId]: {
            ...(prev[courseId]?.[lessonId] || {}),
            ...patch
          }
        }
      }));
      try {
        await updateProgressApi(user.id, courseId, lessonId, patch);
      } catch (err) {
        console.error("Failed to save progress to server:", err);
      }
    },
    [user]
  );

  // Instructor course actions
  const createCourse = useCallback(
    async (courseData) => {
      if (!user) return;
      try {
        const res = await createCourseApi(courseData, user.id);
        if (res.course) {
          setCourses((prev) => [...prev, res.course]);
          notify("Course created and sent for admin approval.");
          return { success: true, course: res.course };
        }
      } catch (err) {
        notify(err.message || "Failed to create course.");
        return { success: false, error: err.message };
      }
    },
    [user, notify]
  );

  const updateCourse = useCallback(
    async (courseId, patch) => {
      if (!user) return;
      try {
        const res = await updateCourseApi(courseId, patch, user.id);
        if (res.course) {
          setCourses((prev) => prev.map((c) => (c.id === courseId ? res.course : c)));
          notify("Course changes saved successfully.");
          return { success: true, course: res.course };
        }
      } catch (err) {
        notify(err.message || "Failed to update course.");
        return { success: false, error: err.message };
      }
    },
    [user, notify]
  );

  // Admin actions
  const updateCourseStatus = useCallback(
    async (courseId, status) => {
      if (!user || user.role !== "admin") return;
      try {
        const res = await updateCourseStatusApi(courseId, status, user.id);
        if (res.course) {
          setCourses((prev) => prev.map((c) => (c.id === courseId ? res.course : c)));
          notify(`Course has been ${status}.`);
        }
      } catch (err) {
        notify(err.message || "Failed to update course status.");
      }
    },
    [user, notify]
  );

  const toggleUserStatus = useCallback(
    async (targetUserId) => {
      if (!user || user.role !== "admin") return;
      const target = users.find((u) => u.id === targetUserId);
      if (!target) return;
      const nextStatus = target.status === "active" ? "suspended" : "active";
      try {
        const res = await updateUserStatusApi(user.id, targetUserId, nextStatus);
        if (res.user) {
          setUsers((prev) => prev.map((u) => (u.id === targetUserId ? res.user : u)));
          notify(`User account is now ${nextStatus}.`);
        }
      } catch (err) {
        notify(err.message || "Failed to update user status.");
      }
    },
    [user, users, notify]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      courses,
      cart,
      enrollments,
      orders,
      progress,
      users,
      toast,
      total,
      notify,
      login,
      register,
      logout,
      switchRole,
      updateProfile,
      updatePassword,
      addToCart,
      removeFromCart,
      clearCart,
      enrollFreeCourse,
      createOrder,
      createRazorpayOrder,
      verifyPayment,
      recordPaymentFailed,
      updateProgress,
      createCourse,
      updateCourse,
      updateCourseStatus,
      toggleUserStatus,
      loadUserData
    }),
    [
      user,
      loading,
      courses,
      cart,
      enrollments,
      orders,
      progress,
      users,
      toast,
      total,
      notify,
      login,
      register,
      logout,
      switchRole,
      updateProfile,
      updatePassword,
      addToCart,
      removeFromCart,
      clearCart,
      enrollFreeCourse,
      createOrder,
      createRazorpayOrder,
      verifyPayment,
      recordPaymentFailed,
      updateProgress,
      createCourse,
      updateCourse,
      updateCourseStatus,
      toggleUserStatus,
      loadUserData
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
