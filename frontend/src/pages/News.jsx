import React from "react";
import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";
import news from "../data/news";
import { formatDate } from "../utils/formatPrice";
import SEO from "../components/SEO.jsx";

const News = () => {
  return (
    <>
      <SEO
        title="أخبار العقارات"
        description="آخر أخبار ومقالات سوق العقارات في مصر."
      />
      <PageBanner
        title="الأخبار"
        subtitle="تابع أحدث أخبار السوق العقاري في مصر، من إطلاق المشاريع الجديدة إلى تحركات الأسعار والاستثمارات."
      />

      <section className="page-section">
        <div className="card-grid">
          {news.map((item) => (
            <article className="simple-card" key={item.id}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <div className="simple-card-body">
                <p style={{ color: "var(--brand)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "6px" }}>
                  {formatDate(item.date)}
                </p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <Link to={`/news/${item.id}`} className="btn-outline">
                  اقرأ المزيد ←
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};

export default News;
