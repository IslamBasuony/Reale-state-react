import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/realestate.css";
import { useListings } from "../context/ListingsContext";
import PropertyCard from "../components/PropertyCard";
import { normalizeListings } from "../api/normalize.js";
import fallbackProperties from "../data/fallbackProperties";
import SEO from "../components/SEO.jsx";
import JsonLd from "../components/JsonLd.jsx";

const categories = [
  { icon: "bi-building", title: "شقق", type: "شقة" },
  { icon: "bi-house-door", title: "فلل", type: "فيلا" },
  { icon: "bi-grid", title: "دوبلكس", type: "دوبلكس" },
  { icon: "bi-briefcase", title: "مكاتب", type: "مكتب" },
];

const TYPE_OPTIONS = ["شقة", "فيلا", "مكتب"];

const PRICE_RANGES = [
  "حتى مليون جنيه",
  "1 – 2 مليون جنيه",
  "أكتر من 2 مليون جنيه",
];

/* Fallback featured cards — derived from the single fallback data source
   (never a separate dataset), keeping the original sale/rent hero mix. */
const FALLBACK_FEATURED_IDS = [902, 905, 901];
const FALLBACK_FEATURED = normalizeListings(fallbackProperties)
  .filter((property) => FALLBACK_FEATURED_IDS.includes(property.id))
  .sort(
    (a, b) =>
      FALLBACK_FEATURED_IDS.indexOf(a.id) - FALLBACK_FEATURED_IDS.indexOf(b.id)
  );

const testimonials = [
  {
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "سارة ويتمان",
    role: "مشترية لأول مرة",
    quote:
      "توثيق الحساب خلّى عملية الشراء كلها حاسّاها آمنة من أول يوم. لقينا بيتنا خلال ثلاثة أسابيع.",
    stars: 5,
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "دانيال أوسيه",
    role: "مالك عقار",
    quote:
      "إدراج وحدات الإيجار بتاعتي كان سهل جدًا، وكنت أعرف إن كل استفسار جاي من مستخدم حقيقي وموثّق.",
    stars: 5,
  },
  {
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "ليلى حداد",
    role: "مستأجرة بتنتقل سكن",
    quote:
      "واجهة نظيفة، فلاتر بحث سريعة، والدعم رد عليا في دقايق لما كان عندي أسئلة.",
    stars: 4.5,
  },
];

function Stars({ count }) {
  const full = Math.floor(count);
  const half = count % 1 !== 0;
  return (
    <div className="stars">
      {Array.from({ length: full }).map((_, i) => (
        <i key={i} className="bi bi-star-fill" />
      ))}
      {half && <i className="bi bi-star-half" />}
    </div>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const { listings, loading, error } = useListings();

  const featured = listings
    ? listings
        .filter((property) => property.is_featured)
        .slice(0, 3)
    : null;

  const featuredError = error;

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    const appendParam = (key, value) => {
      const cleaned = String(value ?? "").trim();
      if (cleaned) params.set(key, cleaned);
    };
    appendParam("location", formData.get("location"));
    appendParam("type", formData.get("type"));
    appendParam("price", formData.get("price"));
    params.set("purpose", "sale");
    const query = params.toString();
    navigate(query ? `/search-results?${query}` : "/search-results");
  };

  const displayCards = featuredError
    ? FALLBACK_FEATURED
    : loading
      ? null
      : featured;

  return (
    <div className="re-scope">
      <SEO
        title="الرئيسية"
        description="عقار ويب - أكبر منصة عقارات في مصر. ابحث عن شقق وفلل ومكاتب للبيع والإيجار في القاهرة والزمالك والمعادي وأفضل المناطق."
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "عقار ويب",
          url: typeof window !== "undefined" ? window.location.origin : "",
          description: "منصة العقارات الرائدة في مصر",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: typeof window !== "undefined"
                ? `${window.location.origin}/search-results?q={search_term_string}`
                : "/search-results?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* ===== Hero ===== */}
      <header className="re-hero" id="top">
        <div className="container">
          <div className="row align-items-center g-5">

            <div className="col-lg-6">
              <div className="re-hero-image">
                <img
                  src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80"
                  alt="بيت عصري"
                />
                <div className="re-hero-badge">
                  <div className="icon">
                    <i className="bi bi-graph-up-arrow" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="fw-bold text-nowrap">+24% قيمة</div>
                    <div className="text-muted small">متوسط نمو سنتين</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <span className="eyebrow">
                <i className="bi bi-shield-check" aria-hidden="true" /> إعلانات
                موثّقة، صفقات آمنة
              </span>
              <h1>
                دوّر على العنوان
                <br />
                اللي هيبدأ <em>فصلك الجديد</em>.
              </h1>
              <p className="lead">
                تصفّح آلاف البيوت والشقق والمكاتب المدقّقة. كل إعلان في عقار
                ويب موثّق، وكل حساب محمي — عشان تقدر تدور وانت مطمن.
              </p>

              <div className="d-flex gap-3 mt-4 flex-wrap">
                <a href="#properties" className="re-btn re-btn-primary">
                  تصفّح العقارات <i className="bi bi-arrow-up-right" aria-hidden="true" />
                </a>
                <a href="#categories" className="re-btn re-btn-outline">
                  <i className="bi bi-play-circle" aria-hidden="true" /> إزاي
                  بيشتغل
                </a>
              </div>

              <div className="re-hero-stats">
                <div>
                  <div className="num">+12.4 ألف</div>
                  <div className="lbl">إعلان نشط</div>
                </div>
                <div>
                  <div className="num">+8.9 ألف</div>
                  <div className="lbl">عميل سعيد</div>
                </div>
                <div>
                  <div className="num">+120</div>
                  <div className="lbl">مدينة مغطّاة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Search card ===== */}
      <div className="container">
        <div className="re-search-card">
          <div className="re-search-tabs px-2 pt-2">
            <Link to="/sale" className="active">
              شراء
            </Link>
            <Link to="/rent">إيجار</Link>
            <Link to="/projects">مشاريع جديدة</Link>
          </div>
          <form
            className="row gx-0 align-items-center px-2 pb-2"
            onSubmit={handleSearch}>
            <div className="col-md-3 re-field">
              <label htmlFor="home-location">الموقع</label>
              <input
                id="home-location"
                type="text"
                name="location"
                className="form-control"
                placeholder="المدينة، الحي..."
              />
            </div>
            <div className="col-md-3 re-field">
              <label htmlFor="home-type">نوع العقار</label>
              <select
                id="home-type"
                name="type"
                className="form-select"
                defaultValue="">
                <option value="">أي نوع</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 re-field">
              <label htmlFor="home-price">نطاق السعر</label>
              <select
                id="home-price"
                name="price"
                className="form-select"
                defaultValue="">
                <option value="">أي سعر</option>
                {PRICE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex justify-content-center justify-content-md-end mt-3 mt-md-0">
              <button
                type="submit"
                className="re-btn re-btn-primary re-btn-block">
                <i className="bi bi-search" aria-hidden="true" /> بحث
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== Categories ===== */}
      <section className="re-section" id="categories">
        <div className="container">
          <div className="re-section-head">
            <span className="re-eyebrow">التصنيفات</span>
            <h2>تصفّح حسب نوع العقار</h2>
            <p>
              سواء بتحسّن مستواك، أو بتقلل مساحتك، أو بتستثمر — ابدأ بالنوع
              اللي يناسب خطوتك الجاية.
            </p>
          </div>
          <div className="row g-4">
            {categories.map((c) => (
              <div className="col-6 col-lg-3" key={c.title}>
                <Link
                  to={`/sale?type=${encodeURIComponent(c.type)}`}
                  className="re-category">
                  <div className="icon">
                    <i className={`bi ${c.icon}`} aria-hidden="true" />
                  </div>
                  <h4>{c.title}</h4>
                  <span className="re-category-link">
                    تصفّح الآن <i className="bi bi-arrow-right" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Featured properties ===== */}
      <section className="re-section re-section-white pt-0" id="properties">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <span className="re-eyebrow">مميّز</span>
              <h2 className="mb-0">عقارات مختارة بعناية ليك</h2>
            </div>
            <Link to="/sale" className="re-btn re-btn-navy mt-3 mt-md-0">
              اعرض كل العقارات
            </Link>
          </div>

          {displayCards === null ? (
            <div className="row g-4" role="status" aria-live="polite">
              <span className="visually-hidden">
                جارٍ تحميل العقارات المميزة
              </span>
              {[0, 1, 2].map((index) => (
                <div className="col-md-6 col-lg-4" key={index}>
                  <div className="re-property-card re-card-skeleton" aria-hidden="true">
                    <div className="skeleton sk-media" />
                    <div className="re-property-body">
                      <div className="skeleton sk-title" />
                      <div className="skeleton sk-line" />
                      <div className="skeleton sk-line short" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayCards.length === 0 ? (
            <div className="re-empty">
              <div className="re-empty-icon">
                <i className="bi bi-search" aria-hidden="true" />
              </div>
              <h3>لا توجد عقارات مميزة حاليًا</h3>
              <p>تصفّح كل العقارات المتاحة واكتشف الأنسب ليك.</p>
              <Link to="/sale" className="re-btn re-btn-primary">
                استكشف جميع العقارات
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {displayCards.map((p) => (
                <div className="col-md-6 col-lg-4" key={p.id ?? p.title}>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Stats band ===== */}
      <section className="re-section">
        <div className="container">
          <div className="re-stats-band">
            <div className="row text-center g-4">
              <div className="col-6 col-lg-3">
                <div className="num">+15</div>
                <div className="lbl">سنة خبرة في العقارات</div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="num">12,400</div>
                <div className="lbl">عقار مُدرج</div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="num">98%</div>
                <div className="lbl">حسابات موثّقة</div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="num">24/7</div>
                <div className="lbl">دعم آمن</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="re-section re-section-white pt-0" id="testimonials">
        <div className="container">
          <div className="re-section-head">
            <span className="re-eyebrow">آراء العملاء</span>
            <h2>إيه رأي عملائنا</h2>
          </div>
          <div className="row g-4">
            {testimonials.map((t) => (
              <div className="col-md-4" key={t.name}>
                <div className="re-testimonial">
                  <Stars count={t.stars} />
                  <p className="quote">{t.quote}</p>
                  <div className="author">
                    <img src={t.avatar} alt={t.name} loading="lazy" />
                    <div>
                      <h6>{t.name}</h6>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="re-section pt-0" id="contact">
        <div className="container">
          <div className="re-cta text-center">
            <h2>جاهز تلاقي بيتك الجاي؟</h2>
            <p className="mb-4">
              اعمل حساب موثّق ومجاني وابدأ تصفح العقارات المختارة ليك.
            </p>
            <Link to="/register" className="re-btn re-btn-primary">
              ابدأ الآن — مجانًا
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
