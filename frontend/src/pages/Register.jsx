import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/realestate.css";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO.jsx";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
};

const Register = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName) next.firstName = "الاسم الأول مطلوب.";
    if (!form.lastName) next.lastName = "اسم العائلة مطلوب.";
    if (!form.email) next.email = "البريد الإلكتروني مطلوب.";
    if (!form.phone) next.phone = "رقم الهاتف مطلوب.";
    if (!form.password) next.password = "كلمة المرور مطلوبة.";
    else if (form.password.length < 8)
      next.password = "استخدم 8 أحرف على الأقل.";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "كلمتا المرور غير متطابقتين.";
    if (!form.agreeToTerms)
      next.agreeToTerms = "يجب الموافقة على الشروط للمتابعة.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await signup(form);
      if (result.success) {
        navigate("/login", { replace: true });
      } else {
        setServerError(result.message || "تعذر إنشاء الحساب، حاول مرة أخرى.");
      }
    } catch (error) {
      setServerError(
        error.message || "تعذر إنشاء الحساب، حاول مرة أخرى.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="re-scope">
      <SEO
        title="إنشاء حساب"
        description="سجل حسابك الجديد في عقار ويب وابدأ البحث عن عقاراتك المثالية."
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
            <p className="re-auth-welcome">أنشئ حسابك 👋</p>
            <h2>سجّل لتبدأ رحلة البحث عن عقارك</h2>
            <p className="re-auth-sub">أدخل بياناتك لإنشاء حساب جديد.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="re-auth-grid">
              <div className="re-auth-field">
                <label htmlFor="reg-first">الاسم الأول</label>
                <input
                  id="reg-first"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="أحمد"
                  autoComplete="given-name"
                />
                {errors.firstName && <span className="re-auth-error">{errors.firstName}</span>}
              </div>

              <div className="re-auth-field">
                <label htmlFor="reg-last">اسم العائلة</label>
                <input
                  id="reg-last"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="علي"
                  autoComplete="family-name"
                />
                {errors.lastName && <span className="re-auth-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="re-auth-field">
              <label htmlFor="reg-email">البريد الإلكتروني</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-phone">رقم الهاتف</label>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                autoComplete="tel"
              />
              {errors.phone && <span className="re-auth-error">{errors.phone}</span>}
            </div>

            <div className="re-auth-field">
              <label htmlFor="reg-password">كلمة المرور</label>
              <div className="re-auth-password-wrap">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
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
              {errors.password && <span className="re-auth-error">{errors.password}</span>}
            </div>

            <div className="re-auth-field">
              <label htmlFor="reg-confirm">تأكيد كلمة المرور</label>
              <div className="re-auth-password-wrap">
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="أعد إدخال كلمة المرور"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="re-auth-toggle-pass"
                  aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  onClick={() => setShowConfirm((s) => !s)}
                >
                  <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                </button>
              </div>
              {errors.confirmPassword && <span className="re-auth-error">{errors.confirmPassword}</span>}
            </div>

            <div className="re-auth-field">
              <label className="re-auth-check">
                <input type="checkbox" name="agreeToTerms" checked={form.agreeToTerms} onChange={handleChange} />
                أوافق على الشروط وسياسة الخصوصية
              </label>
              {errors.agreeToTerms && <span className="re-auth-error">{errors.agreeToTerms}</span>}
            </div>

            <button type="submit" className="re-btn re-btn-primary re-auth-submit" disabled={submitting}>
              {submitting ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>

            {serverError && <div className="re-auth-server-error" role="alert">{serverError}</div>}

            <p className="re-auth-switch">
              لديك حساب بالفعل؟{" "}
              <Link to="/login">سجّل الدخول</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
