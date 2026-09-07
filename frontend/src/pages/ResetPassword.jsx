import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/realestate.css";
import { authRequest } from "../api/api";
import SEO from "../components/SEO.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("الرمز غير موجود. تحقق من الرابط.");
      return;
    }
    if (!password) {
      setError("كلمة المرور مطلوبة.");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    try {
      await authRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "الرمز غير صالح أو منتهي الصلاحية.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="re-scope">
      <SEO
        title="إعادة تعيين كلمة المرور"
        description="عيّن كلمة مرور جديدة لحسابك في عقار ويب."
      />
      <div className="re-auth-wrap">
        <div className="re-auth-media">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=60"
            alt="عقار سكني فاخر"
            loading="lazy"
          />
          <div className="re-auth-overlay">
            <h2>عقار ويب</h2>
            <p>أمانك أولًا — كل حساب محمي.</p>
          </div>
        </div>
        <div className="re-auth-form-panel">
          <div className="re-auth-head">
            <p className="re-auth-welcome">كلمة مرور جديدة 🔒</p>
            <h2>أعد تعيين كلمة المرور</h2>
            <p className="re-auth-sub">أدخل كلمة المرور الجديدة.</p>
          </div>

          {success ? (
            <div className="re-notice re-notice-success" role="status" aria-live="polite">
              <p>تم إعادة تعيين كلمة المرور بنجاح.</p>
              <Link to="/login" className="re-btn re-btn-primary" style={{ marginTop: 16 }}>
                سجّل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {!token && (
                <div className="re-notice re-notice-error" role="alert">
                  <p>رابط إعادة التعيين غير صالح أو منتهي الصلاحية.</p>
                </div>
              )}

              <div className="re-auth-field">
                <label htmlFor="reset-password">كلمة المرور الجديدة</label>
                <div className="re-auth-password-wrap">
                  <input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="re-auth-toggle-pass"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="re-auth-field">
                <label htmlFor="reset-confirm">تأكيد كلمة المرور</label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="re-btn re-btn-primary re-auth-submit" disabled={submitting || !token}>
                {submitting ? "جارٍ..." : "إعادة التعيين"}
              </button>

              {error && <div className="re-auth-server-error" role="alert">{error}</div>}

              <p className="re-auth-switch">
                <Link to="/login">العودة لتسجيل الدخول</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
