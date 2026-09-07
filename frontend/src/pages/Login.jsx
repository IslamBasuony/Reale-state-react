import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/realestate.css";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "البريد الإلكتروني مطلوب.";
    if (!form.password) next.password = "كلمة المرور مطلوبة.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate("/");
    } catch (error) {
      setServerError(
        error.message || "تعذر تسجيل الدخول، تحقق من بياناتك وحاول مرة أخرى.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="re-scope">
      <SEO
        title="تسجيل الدخول"
        description="تسجيل الدخول إلى حسابك في عقار ويب."
      />
      <div className="re-auth-wrap">
        {/* Left: image / brand panel */}
        <div className="re-auth-media">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=60"
            alt="عقار سكني فاخر"
            loading="lazy"
          />
          <div className="re-auth-overlay">
            <h2>عقار ويب</h2>
            <p>دليلك الموثوق للبحث عن عقارك</p>
            <p className="re-auth-quote">
              أمانك أولًا — كل إعلان على عقار ويب موثّق، وكل حساب محمي.
            </p>
          </div>
        </div>

        {/* Right: form panel */}
        <div className="re-auth-form-panel">
          <div className="re-auth-head">
            <p className="re-auth-welcome">أهلًا بعودتك! 👋</p>
            <h2>سجّل دخولك لإدارة حسابك</h2>
            <p className="re-auth-sub">أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="re-auth-field">
              <label htmlFor="login-email">البريد الإلكتروني</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <span className="re-auth-error">{errors.email}</span>}
            </div>

            <div className="re-auth-field">
              <label htmlFor="login-password">كلمة المرور</label>
              <div className="re-auth-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {errors.password && <span className="re-auth-error">{errors.password}</span>}
            </div>

            <button type="submit" className="re-btn re-btn-primary re-auth-submit" disabled={submitting}>
              {submitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>

            {serverError && <div className="re-auth-server-error" role="alert">{serverError}</div>}

            <p className="re-auth-switch">
              ليس لديك حساب؟{" "}
              <Link to="/register">أنشئ حسابًا جديدًا</Link>
            </p>
            <p className="re-auth-switch">
              <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
