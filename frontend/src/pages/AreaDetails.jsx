import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/realestate.css";
import { getListings } from "../api/api";
import { normalizeListings } from "../api/normalize";
import fallbackProperties from "../data/fallbackProperties";
import PropertyCard from "../components/PropertyCard";
import StateNotice from "../components/StateNotice";
import { formatPrice } from "../utils/formatPrice";

const FALLBACK_LISTINGS = normalizeListings(fallbackProperties);

const POINTS_OF_INTEREST = [
  "مدارس وجامعات قريبة",
  "مراكز تسوق وخدمات يومية",
  "مساحات خضراء وحدائق",
  "خدمات نقل عام متاحة",
];

export default function AreaDetails() {
  const { name } = useParams();
  const areaName = decodeURIComponent(name || "");

  const [listings, setListings] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    getListings()
      .then((data) => {
        if (active) setListings(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const sourceListings = loadError ? FALLBACK_LISTINGS : listings;

  const areaProperties = useMemo(
    () =>
      (sourceListings ?? []).filter((property) =>
        (property.location_text || "").toLowerCase().includes(areaName.toLowerCase())
      ),
    [sourceListings, areaName]
  );

  const statsByPurpose = useMemo(() => {
    const build = (prices) => {
      if (prices.length === 0) return null;
      const total = prices.reduce((sum, price) => sum + price, 0);
      return {
        count: prices.length,
        average: total / prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    };

    const salePrices = [];
    const rentPrices = [];
    areaProperties.forEach((property) => {
      const price = Number(property.price);
      if (!price || price <= 0) return;
      if (property.purpose === "sale") {
        salePrices.push(price);
      } else if (property.purpose === "rent") {
        rentPrices.push(price);
      }
    });

    return {
      sale: build(salePrices),
      rent: build(rentPrices),
    };
  }, [areaProperties]);

  const hasStats = Boolean(statsByPurpose.sale || statsByPurpose.rent);

  const purposeGroups = [
    { key: "sale", title: "عقارات للبيع", monthly: false },
    { key: "rent", title: "عقارات للإيجار", monthly: true },
  ];

  return (
    <div className="re-scope area-details-page">
      <section className="area-details-hero">
        <div className="container">
          <span className="re-eyebrow">دليل المناطق</span>
          <h1>{areaName}</h1>
          <p>نظرة عامة على العقارات المتاحة في هذه المنطقة واتجاهات الأسعار.</p>
        </div>
      </section>

      <section className="area-details-main">
        <div className="container">
          {listings === null && !loadError ? (
            <StateNotice loading />
          ) : hasStats ? (
            <>
              {purposeGroups.map((group) => {
                const stat = statsByPurpose[group.key];
                if (!stat) return null;
                return (
                  <div key={group.key} className="area-stats-group">
                    <div className="search-results-heading">
                      <h2>{group.title}</h2>
                      <span className="search-results-count">{stat.count} عقار</span>
                    </div>
                    <div className="area-stats-grid">
                      <div className="area-stat-card">
                        <span>متوسط السعر</span>
                        <strong>
                          {formatPrice(stat.average, undefined, { monthly: group.monthly })}
                        </strong>
                      </div>
                      <div className="area-stat-card">
                        <span>أقل سعر</span>
                        <strong>
                          {formatPrice(stat.min, undefined, { monthly: group.monthly })}
                        </strong>
                      </div>
                      <div className="area-stat-card">
                        <span>أعلى سعر</span>
                        <strong>
                          {formatPrice(stat.max, undefined, { monthly: group.monthly })}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="area-poi-card">
                <h3>
                  <i className="bi bi-info-circle" aria-hidden="true" /> لمحة عن {areaName}
                </h3>
                <p>
                  تعرف على أبرز ما يبحث عنه الباحثون في هذه المنطقة قبل اتخاذ
                  قرار الشراء أو الإيجار.
                </p>
                <ul className="area-poi-list">
                  {POINTS_OF_INTEREST.map((item) => (
                    <li key={item}>
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="search-results-heading">
                <h2>عقارات في {areaName}</h2>
                <span className="search-results-count">{areaProperties.length} عقار</span>
              </div>

              <div className="row g-4">
                {areaProperties.map((property) => (
                  <div className="col-md-6 col-lg-4" key={property.id}>
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="re-empty">
              <div className="re-empty-icon">
                <i className="bi bi-geo-alt" aria-hidden="true" />
              </div>
              <h3>لا توجد عقارات في هذه المنطقة حاليًا</h3>
              <p>جرّب البحث في مناطق أخرى أو تصفّح جميع العقارات المتاحة.</p>
              <Link to="/search-results" className="re-btn re-btn-primary">
                بحث متقدم
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
