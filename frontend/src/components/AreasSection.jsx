import React from "react";
import { Link } from "react-router-dom";
import "./AreasSection.css";
import useNewsletter from "../hooks/useNewsletter";

const AREA_HREF = (name) => `/areas/${encodeURIComponent(name)}`;

const PopularAreas = () => {
  const newsletter = useNewsletter();

  const handleEmailChange = () => {
    if (newsletter.submitted) newsletter.reset();
  };

  return (
    <section className="popular-areas">
      <h2 className="section-title">مناطق شائعة</h2>

      <div className="areas-grid">
        <Link className="area-card" to={AREA_HREF("التجمع الخامس")}>
          <div className="image-wrapper">
            <img src="/images/location1.jpg" alt="الكمبوندات في التجمع الخامس" loading="lazy" />
            <div className="overlay"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-text">
              <h2>الكمبوندات في التجمع الخامس</h2>
            </div>
          </div>
        </Link>
        <Link className="area-card" to={AREA_HREF("العاصمة الإدارية الجديدة")} aria-label="العاصمة الإدارية الجديدة">
          <div className="image-wrapper">
            <img src="/images/location2.jpg" alt="العاصمة الإدارية" loading="lazy" />
            <div className="overlay-light"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-content">
              <h2>العاصمة الإدارية الجديدة</h2>
              <p>
                استثمر في مستقبل مصر مع مشاريع سكنية وإدارية حديثة في قلب
                العاصمة الجديدة.{" "}
              </p>
              <Link className="explore-area-btn" to={AREA_HREF("العاصمة الإدارية الجديدة")}>
                استكشف المزيد
              </Link>
            </div>
          </div>
        </Link>

        <Link className="area-card" to={AREA_HREF("التجمع الخامس")}>
          <div className="image-wrapper">
            <img src="/images/location3.jpg" alt="الكمبوندات في التجمع الخامس" loading="lazy" />
            <div className="overlay"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-text">
              <h2>الكمبوندات في التجمع الخامس</h2>
            </div>
          </div>
        </Link>

        <Link className="area-card" to={AREA_HREF("التجمع الخامس")}>
          <div className="image-wrapper">
            <img src="/images/location4.jpg" alt="الكمبوندات في التجمع الخامس" loading="lazy" />
            <div className="overlay"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-text">
              <h2>الكمبوندات في التجمع الخامس</h2>
            </div>
          </div>
        </Link>
      </div>

      <div
        className="subscribe-section"
        style={{
          background: `linear-gradient(rgba(0, 128, 128, 0.7), rgba(0, 128, 128, 0.7)), url(${process.env.PUBLIC_URL}/images/bg-location.jpg) center/cover no-repeat`,
        }}>
        <div className="subscribe-content">
          <div className="subscribe-text">
            <h3>
              لا تفوّت فرصة الاستثمار في أحدث المشروعات العقارية — اشترك ليصلك كل جديد مباشرة عبر البريد الإلكتروني
            </h3>
          </div>
          {newsletter.submitted ? (
            <p className="subscribe-success" role="status" aria-live="polite">
              شكراً لك! تم الاشتراك بنجاح.
            </p>
          ) : (
            <form
              className="subscribe-form"
              onSubmit={(event) => newsletter.handleSubmit(event, "areas-newsletter-email")}>
              <input
                type="email"
                name="areas-newsletter-email"
                placeholder="ادخل بريدك الإلكتروني"
                aria-label="البريد الإلكتروني للاشتراك"
                className="subscribe-input"
                required
                onChange={handleEmailChange}
              />
              <button type="submit" className="subscribe-btn" disabled={newsletter.submitting}>
                {newsletter.submitting ? "جارٍ..." : "اشترك الآن"}
              </button>
            </form>
          )}
          {newsletter.error && <p className="subscribe-error" role="alert">{newsletter.error}</p>}
        </div>
      </div>
    </section>
  );
};

export default PopularAreas;
