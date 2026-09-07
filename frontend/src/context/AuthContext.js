import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  signup as apiSignup,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
} from "../utils/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // إعادة ملء الجلسة من الـ backend عند التشغيل (الكوكيز هي مصدر الحقيقة).
  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signup = useCallback(async (data) => {
    setLoading(true);
    try {
      const { user: newUser } = await apiSignup(data);
      // الـ backend لا ينشئ جلسة عند التسجيل — يبقى المستخدم غير مسجّل دخول.
      setUser(null);
      return { success: true, user: newUser };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await apiLogin(data);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.isAdmin),
    }),
    [user, loading, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
