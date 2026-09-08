import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/realestate.css";
import PropertyCard from "../components/PropertyCard";
import StateNotice from "../components/StateNotice";
import { useListings } from "../context/ListingsContext";
import { FALLBACK_LISTINGS } from "../data/fallbackListings";
import { getPriceRange } from "../utils/priceRange";
import SEO from "../components/SEO.jsx";

const PAGE_SIZE = 9;

const PROPERTY_TYPES = ["شقة", "فيلا", "دوبلكس", "بنتهاوس", "استوديو", "مكتب", "محل", "مخزن", "أرض"];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const queryLocation = searchParams.get("location") || "";
  const queryType = searchParams.get("type") || "";
  const queryPurpose = searchParams.get("purpose") || "";
  const initialPriceRange = getPriceRange(searchParams.get("price") || "");

  const { listings: contextListings, error: listingsError, refetch } = useListings();

  const listings = contextListings;
  const loadError = listingsError;

  const [type, setType] = useState(queryType);
  const [purpose, setPurpose] = useState(
    queryPurpose === "rent" ? "rent" : "sale"
  );
  const [location, setLocation] = useState(queryLocation);
  const [text, setText] = useState(query);
  const [minPrice, setMinPrice] = useState(initialPriceRange.min);
  const [maxPrice, setMaxPrice] = useState(initialPriceRange.max);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const sourceListings = listingsError ? FALLBACK_LISTINGS : contextListings;

  const results = useMemo(() => {
    const list = (sourceListings ?? []).filter((property) => {
      if (property.purpose !== purpose) return false;

      if (type && property.type !== type) return false;

      if (location) {
        const propertyLocation = property.location_text || "";
        if (!propertyLocation.toLowerCase().includes(location.toLowerCase())) {
          return false;
        }
      }

      if (text) {
        const searchValue = text.toLowerCase();
        const title = property.title?.toLowerCase() || "";
        const propertyType = property.type?.toLowerCase() || "";
        const propertyLocation = property.location_text?.toLowerCase() || "";
        const matches =
          title.includes(searchValue) ||
          propertyType.includes(searchValue) ||
          propertyLocation.includes(searchValue);
        if (!matches) return false;
      }

      if (minPrice && Number(property.price) < Number(minPrice)) return false;
      if (maxPrice && Number(property.price) > Number(maxPrice)) return false;

      return true;
    });

    const sorted = [...list];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    }
    return sorted;
  }, [sourceListings, purpose, type, location, text, minPrice, maxPrice, sortBy]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getActiveParams = (pageOverride) => {
    const params = new URLSearchParams();
    if (text.trim()) params.set("q", text.trim());
    if (location.trim()) params.set("location", location.trim());
    if (type) params.set("type", type);
    if (purpose && purpose !== "sale") params.set("purpose", purpose);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    if (sortBy && sortBy !== "newest") params.set("sort", sortBy);
    const activePage = pageOverride ?? page;
    if (activePage > 1) params.set("page", String(activePage));
    return params;
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchParams(getActiveParams(1), { replace: true });
  };

  const resetFilters = () => {
    setType("");
    setPurpose("sale");
    setLocation("");
    setText("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const goToPage = (nextPage) => {
    setPage(nextPage);
    setSearchParams(getActiveParams(nextPage), { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const priceRange = getPriceRange(params.get("price") || "");
    const urlType = params.get("type") || "";
    const urlPurpose = params.get("purpose") === "rent" ? "rent" : "sale";
    const urlLocation = params.get("location") || "";
    const urlText = params.get("q") || "";
    const urlMin = params.get("min") || priceRange.min || "";
    const urlMax = params.get("max") || priceRange.max || "";
    const urlSort = params.get("sort") || "newest";
    const urlPage = Math.max(1, Number(params.get("page")) || 1);

    const urlKey = [urlType, urlPurpose, urlLocation, urlText, urlMin, urlMax, urlSort].join("|");
    const stateKey = [type, purpose, location, text, minPrice, maxPrice, sortBy].join("|");
    if (urlKey !== stateKey) {
      setType(urlType);
      setPurpose(urlPurpose);
      setLocation(urlLocation);
      setText(urlText);
      setMinPrice(urlMin);
      setMaxPrice(urlMax);
      setSortBy(urlSort);
    }
    if (page !== urlPage) {
      setPage(urlPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="re-scope search-results-page">
      <SEO
        title="نتائج البحث"
        description="نتائج البحث عن العقارات في عقار ويب."
      />
      <section className="search-results-hero">
        <div className="container">
          <span className="re-eyebrow">نتائج البحث</span>
          <h1>عقارات تناسب اختياراتك</h1>
          <p>
            نتائجك وفق الموقع ونوع العقار ونطاق السعر، مع خيارات ترتيب لمساعدتك
            على المقارنة بسهولة.
          </p>
        </div>
      </section>

      <section className="search-results-filters">
        <div className="container">
          <form className="search-results-form" onSubmit={applyFilters}>
            <div className="re-field">
              <label htmlFor="sr-text">كلمة بحث</label>
              <input
                id="sr-text"
                type="text"
                className="form-control"
                placeholder="اسم العقار أو المنطقة"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>

            <div className="re-field">
              <label htmlFor="sr-location">الموقع</label>
              <input
                id="sr-location"
                type="text"
                className="form-control"
                placeholder="المدينة، الحي..."
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>

            <div className="re-field">
              <label htmlFor="sr-type">نوع العقار</label>
              <select
                id="sr-type"
                className="form-select"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">أي نوع</option>
                {PROPERTY_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="re-field">
              <label htmlFor="sr-purpose">الغرض</label>
              <select
                id="sr-purpose"
                className="form-select"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
              >
                <option value="sale">للبيع</option>
                <option value="rent">للإيجار</option>
              </select>
            </div>

            <div className="re-field">
              <label htmlFor="sr-min">أقل سعر</label>
              <input
                id="sr-min"
                type="number"
                min="0"
                className="form-control"
                placeholder="جنيه"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </div>

            <div className="re-field">
              <label htmlFor="sr-max">أعلى سعر</label>
              <input
                id="sr-max"
                type="number"
                min="0"
                className="form-control"
                placeholder="جنيه"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>

            <div className="re-field">
              <label htmlFor="sr-sort">ترتيب</label>
              <select
                id="sr-sort"
                className="form-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">الأحدث</option>
                <option value="price-asc">الأقل سعرًا</option>
                <option value="price-desc">الأعلى سعرًا</option>
              </select>
            </div>

            <div className="search-results-actions">
              <button type="submit" className="re-btn re-btn-primary">
                <i className="bi bi-search" aria-hidden="true" /> بحث
              </button>
              <button
                type="button"
                className="re-btn re-btn-outline"
                onClick={resetFilters}
              >
                مسح الفلاتر
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="search-results-list">
        <div className="container">
          <div className="search-results-heading">
            <h2>نتائج البحث</h2>
            <span className="search-results-count">{results.length} عقار</span>
          </div>

          {(text || location || type || minPrice || maxPrice) && (
            <div className="search-results-filters-summary">
              {text && <span className="search-results-filter-chip">بحث: {text}</span>}
              {location && <span className="search-results-filter-chip">الموقع: {location}</span>}
              {type && <span className="search-results-filter-chip">النوع: {type}</span>}
              {minPrice && <span className="search-results-filter-chip">من {minPrice} جنيه</span>}
              {maxPrice && <span className="search-results-filter-chip">حتى {maxPrice} جنيه</span>}
            </div>
          )}

          {listings === null && !loadError ? (
            <StateNotice loading />
          ) : loadError ? (
            <>
              <div className="state-notice state-notice--error" role="alert">
                <p>تعذر تحميل العقارات حاليًا، تعرض نتائج تجريبية بدلاً من ذلك.</p>
                <button
                  type="button"
                  className="re-btn re-btn-outline"
                  onClick={() => refetch()}
                >
                  إعادة المحاولة
                </button>
              </div>
              {pageItems.length > 0 && (
                <div className="row g-4">
                  {pageItems.map((property) => (
                    <div className="col-md-6 col-lg-4" key={property.id}>
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : pageItems.length > 0 ? (
            <div className="row g-4">
              {pageItems.map((property) => (
                <div className="col-md-6 col-lg-4" key={property.id}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <div className="re-empty">
              <div className="re-empty-icon">
                <i className="bi bi-search" aria-hidden="true" />
              </div>
              <h3>لا توجد عقارات مطابقة لبحثك</h3>
              <p>جرّب تعديل الفلاتر أو مسح خيارات البحث.</p>
              <button type="button" className="re-btn re-btn-primary" onClick={resetFilters}>
                مسح الفلاتر
              </button>
            </div>
          )}

          {pageCount > 1 && (
            <nav className="re-pagination" aria-label="ترقيم الصفحات">
              <button
                type="button"
                className="re-page-arrow"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }).map((_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  className={`re-page-number ${page === index + 1 ? "re-page-number-active" : ""}`}
                  onClick={() => goToPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                type="button"
                className="re-page-arrow"
                disabled={page === pageCount}
                onClick={() => goToPage(page + 1)}
              >
                ›
              </button>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
