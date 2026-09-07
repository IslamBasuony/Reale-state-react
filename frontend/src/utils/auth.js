// ============================================================
// Authentication Service — حقيقي عبر الـ backend
// ------------------------------------------------------------
// جلسة الـ backend (Passport + Express Session، كوكيز `connect.sid`)
// هي مصدر الحقيقة ولا يوجد أي تخزين في localStorage هنا.
// هذه الطبقة تحافظ على نفس تواقيع الدوال السابقة لاستقرار الاستخدام.
// ============================================================

import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser as apiGetCurrentUser,
} from "../api/api.js";

/**
 * تسجيل مستخدم جديد عبر الـ backend.
 * @param {{ firstName: string, lastName: string, email: string, phone: string, password: string }} data
 * @returns {Promise<{ user: object }>}
 */
export const signup = (data) => apiRegister(data);

/**
 * تسجيل الدخول عبر الـ backend (ينشئ جلسة).
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object }>}
 */
export const login = (data) => apiLogin(data);

/**
 * تسجيل الخروج: يدمر الجلسة في الـ backend.
 * @returns {Promise<void>}
 */
export const logout = () => apiLogout();

/**
 * جلب المستخدم الحالي من الـ backend (إعادة ملء الجلسة بعد التحديث).
 * @returns {Promise<object | null>}
 */
export const getCurrentUser = () => apiGetCurrentUser();
