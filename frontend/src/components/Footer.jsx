import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { subscribeNewsletter } from "../api/api";

const popularAreas = [
  { label: "وسط البلد", location: "وسط البلد" },
  { label: "الزمالك", location: "الزمالك" },
  { label: "المعادي", location: "المعادي" },
  { label: "العاصمة الإدارية الجديدة", location: "العاصمة الإدارية" },
];

const Footer = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (event) => {
    event.preventDefault();
    setSubscribeError("");
    const form = event.target;
    const emailInput = form.elements["footer-newsletter-email"];
    const email = emailInput?.value;
    if (!email) return;

    setSubmitting(true);
    try {
      await subscribeNewsletter(email);
      setSubscribed(true);
    } catch (err) {
      setSubscribeError("تعذر الاشتراك. تحقق من البريد الإلكتروني وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailChange = () => {
    if (subscribed) setSubscribed(false);
  };

  return (
    <footer>
      <div className="footerSection-subscribe">
        <div className="footerSection-subscribe-content">
          <div className="footerSection-subscribe-text">
            <h2>كن على اطلاع دائم بأفضل الفرص</h2>
            <p>
              احصل على أحدث العروض وخطط السوق والعروض الحصرية عبر بريدك الإلكتروني
            </p>
          </div>
          {subscribed ? (
            <p className="footerSection-subscribe-success" role="status" aria-live="polite">
              شكراً لك! تم الاشتراك بنجاح.
            </p>
          ) : (
            <form
              className="footerSection-subscribe-form"
              onSubmit={handleSubscribe}
            >
              <input
                type="email"
                name="footer-newsletter-email"
                placeholder="ادخل بريدك الإلكتروني"
                aria-label="البريد الإلكتروني للاشتراك"
                className="footerSection-input"
                required
                onChange={handleEmailChange}
              />
              <button type="submit" className="footerSection-btn" disabled={submitting}>
                {submitting ? "جارٍ..." : "اشترك الآن"}
              </button>
              {subscribeError && <p className="re-notice re-notice-error" role="alert">{subscribeError}</p>}
            </form>
          )}
        </div>
      </div>

      <div className="footerSection-main">
        <div className="footerSection-columns">
          <div className="footerSection-col">
            <h4>نظرة عامة</h4>
            <ul>
              <li><Link to="/about">من نحن</Link></li>
              <li><Link to="/projects">قائمة المشاريع</Link></li>
              <li><Link to="/sale">العروض</Link></li>
              <li><Link to="/contact">تواصل معنا</Link></li>
            </ul>
          </div>

          <div className="footerSection-col">
            <h4>المناطق الشائعة</h4>
            <ul>
              {popularAreas.map((area) => (
                <li key={area.label}>
                  <Link to={`/search-results?location=${encodeURIComponent(area.location)}`}>
                    {area.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footerSection-col">
            <h4>بيانات التواصل</h4>
            <ul>
              <li>123 شارع الأعمال الجديد</li>
              <li>القاهرة - مصر</li>
              <li><a href="tel:01009088966">0100-9088-966</a></li>
              <li><a href="mailto:info@realestateeg.com">info@realestateeg.com</a></li>
              <li><a href="https://realestate.eg" target="_blank" rel="noreferrer">realestate.eg</a></li>
            </ul>
          </div>

          <div className="footerSection-col footerSection-col-static">
            <h4>الدعم والمساعدة</h4>
            <ul>
              <li>استقبال الشكاوى</li>
              <li>الأسئلة الشائعة</li>
              <li>الشروط والأحكام</li>
              <li>سياسة الخصوصية</li>
            </ul>
          </div>
        </div>

        <div className="footerSection-bottom">
          <p>تابعنا على</p>
          <div className="footerSection-icons" aria-hidden="true">
            <span className="footerSection-icon"><i className="fa-brands fa-facebook-f"></i></span>
            <span className="footerSection-icon"><i className="fa-brands fa-twitter"></i></span>
            <span className="footerSection-icon"><i className="fa-brands fa-instagram"></i></span>
            <span className="footerSection-icon"><i className="fa-brands fa-youtube"></i></span>
          </div>
        </div>

        <div className="footerSection-rights">
          <p>© جميع الحقوق محفوظة 2026 - عقار ويب</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
