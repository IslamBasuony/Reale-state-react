import React, { useState } from "react";
import PageBanner from "../components/PageBanner";
import "./Contact.css";
import { submitContact } from "../api/api";
import SEO from "../components/SEO.jsx";

const initialForm = { name: "", email: "", phone: "", message: "" };

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "الاسم مطلوب";
    if (!form.email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";
    if (!form.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!form.message.trim()) newErrors.message = "الرسالة مطلوبة";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSubmitting(true);
      try {
        await submitContact(form);
        setSubmitted(true);
        setForm(initialForm);
      } catch (err) {
        setServerError(err.message || "تعذر إرسال الرسالة. حاول مرة أخرى.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <>
      <SEO
        title="اتصل بنا"
        description="تواصل مع فريق عقار ويب.نحن هنا لمساعدتك في العثور على عقاراتك المثالية."
      />
      <PageBanner
        title="تواصل معنا"
        subtitle="فريقنا جاهز للإجابة على استفساراتك ومساعدتك في اختيار العقار المناسب."
      />

      <section className="page-section">
        <div className="contact-grid">
          <div className="simple-card">
            <div className="simple-card-body">
              <h3 style={{ marginBottom: "16px" }}>بيانات التواصل</h3>
              <p>📍 123 شارع الأعمال الجديد، القاهرة - مصر</p>
              <p><a href="tel:01009088966">📞 0100-9088-966</a></p>
              <p><a href="mailto:info@realestateeg.com">✉️ info@realestateeg.com</a></p>
              <p><a href="https://realestate.eg" target="_blank" rel="noreferrer">🌐 realestate.eg</a></p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleSubmit} noValidate>
            {submitted && (
              <p className="form-success" role="status" aria-live="polite">تم إرسال رسالتك بنجاح، سنتواصل معك قريبًا.</p>
            )}

            {serverError && (
              <p className="form-error" role="alert">{serverError}</p>
            )}

            <div className="form-field">
              <label htmlFor="contact-name">الاسم</label>
              <input id="contact-name" name="name" value={form.name} onChange={handleChange} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="contact-email">البريد الإلكتروني</label>
              <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="contact-phone">رقم الهاتف</label>
              <input id="contact-phone" name="phone" value={form.phone} onChange={handleChange} />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="contact-message">الرسالة</label>
              <textarea
                id="contact-message"
                name="message"
                rows="4"
                value={form.message}
                onChange={handleChange}
              ></textarea>
              {errors.message && <p className="form-error">{errors.message}</p>}
            </div>

            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? "جارٍ الإرسال..." : "إرسال الرسالة"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Contact;
