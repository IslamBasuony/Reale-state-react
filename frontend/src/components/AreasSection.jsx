import React from "react";
import "./AreasSection.css";

const PopularAreas = () => {
  return (
    <section className="popular-areas">
      <h2 className="section-title">مناطق شائعة</h2>

      <div className="areas-grid">
        <div className="area-card">
          <div className="image-wrapper">
            <img src="/images/location1.jpg" alt="التجمع الخامس" loading="lazy" />
            <div className="overlay"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-text">
              <h2>الكمبوندات في التجمع الخامس</h2>
            </div>
          </div>
        </div>
        <div className="area-card">
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
              <button>استكشف المزيد</button>
            </div>
          </div>
        </div>

        <div className="area-card">
          <div className="image-wrapper">
            <img src="/images/location3.jpg" alt="التجمع الخامس" loading="lazy" />
            <div className="overlay"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-text">
              <h2>الكمبوندات في التجمع الخامس</h2>
            </div>
          </div>
        </div>

        <div className="area-card">
          <div className="image-wrapper">
            <img src="/images/location4.jpg" alt="التجمع الخامس" loading="lazy" />
            <div className="overlay"></div>
            <div className="arrow-icon">
              <i className="fa-solid fa-chevron-left"></i>
            </div>
            <div className="card-text">
              <h2>الكمبوندات في التجمع الخامس</h2>
            </div>
          </div>
        </div>
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
          <button className="subscribe-btn">اشترك الآن</button>
        </div>
      </div>
    </section>
  );
};

export default PopularAreas;
