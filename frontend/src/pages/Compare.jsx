import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/realestate.css";
import { getListings } from "../api/api";
import { normalizeListings } from "../api/normalize";
import fallbackProperties from "../data/fallbackProperties";
import StateNotice from "../components/StateNotice";
import { formatPrice, purposeLabel } from "../utils/formatPrice";
import SEO from "../components/SEO.jsx";

const FALLBACK_LISTINGS = normalizeListings(fallbackProperties);
const STORAGE_KEY = "realEstateCompare";
const MAX_COMPARE = 3;

function readStoredSlots() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) return stored.filter(Boolean).slice(0, MAX_COMPARE);
  } catch {
    /* تجاهل بيانات غير صالحة */
  }
  return [];
}

export default function Compare() {
  const [listings, setListings] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [slots, setSlots] = useState(readStoredSlots);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch {
      /* تجاهل أخطاء التخزين المحلي */
    }
  }, [slots]);

  const sourceListings = loadError ? FALLBACK_LISTINGS : listings;

  const selectProperty = (slotIndex) => (event) => {
    const value = event.target.value;
    setSlots((previous) => {
      const next = [...previous];
      if (value) {
        next[slotIndex] = Number(value);
      } else {
        next[slotIndex] = null;
      }
      return next;
    });
  };

  const clearSlots = () => setSlots([]);

  const compared = slots
    .filter((id) => id != null)
    .map((id) => (sourceListings ?? []).find((property) => property.id === id))
    .filter(Boolean);

  const usedIds = new Set(slots.filter((id) => id != null));

  return (
    <div className="re-scope compare-page">
      <SEO
        title="مقارنة العقارات"
        description="قارن بين العقارات المختلفة واختر الأنسب لك."
      />
      <section className="compare-hero">
        <div className="container">
          <span className="re-eyebrow">المقارنة</span>
          <h1>قارن بين العقارات</h1>
          <p>
            اختر حتى {MAX_COMPARE} عقارات بجانب بعضها لاتخاذ قرار أكثر وضوحًا.
          </p>
        </div>
      </section>

      <section className="compare-main">
        <div className="container">
          <div className="compare-pickers">
            {Array.from({ length: MAX_COMPARE }).map((_, index) => (
              <div className="compare-picker" key={index}>
                <label htmlFor={`compare-slot-${index}`}>
                  العقار {index + 1}
                </label>
                <select
                  id={`compare-slot-${index}`}
                  className="form-select"
                  value={slots[index] ?? ""}
                  onChange={selectProperty(index)}
                >
                  <option value="">اختر عقارًا…</option>
                  {(sourceListings ?? []).map((property) => (
                    <option
                      key={property.id}
                      value={property.id}
                      disabled={usedIds.has(property.id) && slots[index] !== property.id}
                    >
                      {property.title} — {property.location_text || ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button type="button" className="re-btn re-btn-outline" onClick={clearSlots}>
              مسح المقارنة
            </button>
          </div>

          {listings === null && !loadError ? (
            <StateNotice loading />
          ) : loadError ? (
            <div className="re-notice re-notice-error" role="alert">
              <p>حدث خطأ أثناء تحميل بيانات العقارات. يرجى المحاولة مرة أخرى.</p>
            </div>
          ) : compared.length === 0 ? (
            <div className="re-empty">
              <div className="re-empty-icon">
                <i className="bi bi-columns-gap" aria-hidden="true" />
              </div>
              <h3>لا توجد عقارات للمقارنة</h3>
              <p>اختر من القوائم أعلاه حتى {MAX_COMPARE} عقارات للمقارنة بينها.</p>
              <Link to="/search-results" className="re-btn re-btn-primary">
                تصفح العقارات
              </Link>
            </div>
          ) : (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <caption className="visually-hidden">مقارنة بين العقارات</caption>
                <tbody>
                  <tr>
                    <th className="compare-label-col">العقار</th>
                    {compared.map((property) => (
                      <td key={property.id}>
                        <Link to={`/properties/${property.id}`} className="compare-property-link">
                          <img
                            src={
                              (Array.isArray(property.images) && property.images[0]) ||
                              property.image_url ||
                              "/images/house.jpg"
                            }
                            alt={property.title}
                          />
                          <span>{property.title}</span>
                        </Link>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">الغرض</th>
                    {compared.map((property) => (
                      <td key={property.id}>{purposeLabel(property.purpose)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">نوع العقار</th>
                    {compared.map((property) => (
                      <td key={property.id}>{property.type}</td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">السعر</th>
                    {compared.map((property) => (
                      <td key={property.id}>
                        <strong>
                          {formatPrice(property.price, property.currency, {
                            monthly: property.purpose === "rent",
                          })}
                        </strong>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">الموقع</th>
                    {compared.map((property) => (
                      <td key={property.id}>{property.location_text || "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">المساحة</th>
                    {compared.map((property) => {
                      const area = property.area_size ?? property.area;
                      return (
                        <td key={property.id}>
                          {area != null ? `${area} متر مربع` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th className="compare-label-col">غرف النوم</th>
                    {compared.map((property) => (
                      <td key={property.id}>
                        {property.bedrooms_number ?? property.bedrooms ?? property.rooms ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">الحمامات</th>
                    {compared.map((property) => (
                      <td key={property.id}>
                        {property.bathrooms_number ?? property.bathrooms ?? property.baths ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="compare-label-col">الجراج</th>
                    {compared.map((property) => (
                      <td key={property.id}>
                        {property.hasGarage ?? property.garage ?? false ? "متوفر" : "غير متوفر"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
