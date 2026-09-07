import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/realestate.css";
import { authRequest } from "../api/api";
import SEO from "../components/SEO.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("البريد الإلكتروني مطلوب.");
      return;
    }
    setSubmitting(true);
    try {
      await authRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "حدث خطأ. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="re-scope">
      <SEO
        title="نسيت كلمة المرور"
        description="استعادة كلمة المرور في عقار ويب."
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
            <p className="re-auth-welcome">نسيت كلمة المرور؟ 🔑</p>
            <h2>أعد تعيين كلمة المرور</h2>
            <p className="re-auth-sub">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>
          </div>

          {success ? (
            <div className="re-notice re-notice-success" role="status" aria-live="polite">
              <p>إذا كان البريد الإلكتروني مسجّلًا، ستتلقى رسالة تحتوي على رابط إعادة تعيين كلمة المرور.</p>
              <Link to="/login" className="re-btn re-btn-primary" style={{ marginTop: 16 }}>
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="re-auth-field">
                <label htmlFor="forgot-email">البريد الإلكتروني</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="re-btn re-btn-primary re-auth-submit" disabled={submitting}>
                {submitting ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>

              {error && <div className="re-auth-server-error" role="alert">{error}</div>}

              <p className="re-auth-switch">
                تذكرت كلمة المرور؟{" "}
                <Link to="/login">سجّل الدخول</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
