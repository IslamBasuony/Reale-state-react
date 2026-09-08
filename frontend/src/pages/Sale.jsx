import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/listing-page.css";
import { useFavorites } from "../context/FavoritesContext";
import { useListings } from "../context/ListingsContext";
import { FALLBACK_LISTINGS } from "../data/fallbackListings";
import useNewsletter from "../hooks/useNewsletter";
import { formatPrice, getPriceRange } from "../utils/priceRange";
import SEO from "../components/SEO.jsx";

const PAGE_SIZE = 9;

/* =========================================
   Icons
========================================= */

function SaleHeartIcon({ filled }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SaleShareIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />

      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SaleSearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function SaleLocationIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/* =========================================
   Property Types
========================================= */

const propertyTypes = [
  { id: "all", label: "الكل" },
  { id: "شقة", label: "شقق", icon: "bi-building" },
  { id: "فيلا", label: "فلل", icon: "bi-house-door" },
  { id: "دوبلكس", label: "دوبلكس", icon: "bi-grid" },
  { id: "بنتهاوس", label: "بنتهاوس", icon: "bi-layers" },
  { id: "استوديو", label: "استوديو", icon: "bi-box" },
  { id: "مكتب", label: "مكاتب", icon: "bi-briefcase" },
  { id: "محل", label: "محلات", icon: "bi-shop" },
  { id: "مخزن", label: "مستودعات", icon: "bi-archive" },
  { id: "أرض", label: "أراضي", icon: "bi-geo" },
];

/* =========================================
   Sale Page
========================================= */

export default function Sale() {
  const [searchParams] = useSearchParams();

  const queryLocation = searchParams.get("location") || "";
  const queryType = searchParams.get("type") || "";
  const queryPrice = searchParams.get("price") || "";
  const initialPriceRange = getPriceRange(queryPrice);

  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeType, setActiveType] = useState(() =>
    queryType && queryType !== "أي نوع" ? queryType : "all"
  );

  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState(() => ({
    location: queryLocation,
    minPrice: initialPriceRange.min,
    maxPrice: initialPriceRange.max,
    search: "",
  }));

  const { listings: contextListings, error: listingsError, refetch } = useListings();
  const newsletter = useNewsletter();

  const listings = contextListings;
  const loadError = listingsError;

  /* =========================================
     Sale-only listings
  ========================================= */

  const sourceListings = listingsError ? FALLBACK_LISTINGS : contextListings;

  const saleProperties = useMemo(
    () => (sourceListings ?? []).filter((property) => property.purpose === "sale"),
    [sourceListings]
  );

  /* =========================================
     Filtering
  ========================================= */

  const filtered = useMemo(() => {
    return saleProperties.filter((property) => {
      /*
       * Type
       */
      if (
        activeType !== "all" &&
        property.type !== activeType
      ) {
        return false;
      }

      /*
       * Location
       */
      if (filters.location) {
        const propertyLocation =
          property.location_text || "";

        if (
          !propertyLocation
            .toLowerCase()
            .includes(filters.location.toLowerCase())
        ) {
          return false;
        }
      }

      /*
       * Search
       */
      if (filters.search) {
        const searchValue =
          filters.search.toLowerCase();

        const title =
          property.title?.toLowerCase() || "";

        const type =
          property.type?.toLowerCase() || "";

        const location =
          property.location_text?.toLowerCase() || "";

        const matchesSearch =
          title.includes(searchValue) ||
          type.includes(searchValue) ||
          location.includes(searchValue);

        if (!matchesSearch) {
          return false;
        }
      }

      /*
       * Minimum Price
       */
      if (
        filters.minPrice &&
        Number(property.price) < Number(filters.minPrice)
      ) {
        return false;
      }

      /*
       * Maximum Price
       */
      if (
        filters.maxPrice &&
        Number(property.price) > Number(filters.maxPrice)
      ) {
        return false;
      }

      return true;
    });
  }, [saleProperties, activeType, filters]);

  /* =========================================
     Pagination
  ========================================= */

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* =========================================
     Share
  ========================================= */

  const handleShare = async (property) => {
    const shareUrl =
      `${window.location.origin}/properties/${property.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: property.title,
          text: `شاهد هذا العقار: ${property.title}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);

        window.alert(
          "تم نسخ رابط العقار"
        );
      }
    } catch (error) {
      /*
       * المستخدم أغلق نافذة المشاركة
       * ولا نحتاج لإظهار Error.
       */
    }
  };

  /* =========================================
     Filters
  ========================================= */

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));

    setPage(1);
  };

  const handleTypeSelect = (type) => {
    setActiveType(type);
    setPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  /* =========================================
     Clear Filters
  ========================================= */

  const clearFilters = () => {
    setActiveType("all");

    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });

    setPage(1);
  };

  /* =========================================
     Page Change
  ========================================= */

  const handlePageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > pageCount
    ) {
      return;
    }

    setPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="sale-page-wrapper">
      <SEO
        title="عقارات للبيع"
        description="تصفح أفضل العقارات للبيع في مصر - شقق وفلل ومكاتب بأفضل الأسعار في القاهرة والزمالك والمعادي."
      />

      {/* =====================================
          Hero
      ====================================== */}

      <section className="sale-hero-section">

        <div className="sale-hero-content">

          <span className="sale-hero-label">
            للبيع
          </span>

          <h1 className="sale-hero-title">
            اكتشف أفضل العقارات
            <br />
            المعروضة للبيع الآن
          </h1>

          <p className="sale-hero-description">
            اكتشف أفضل الفرص العقارية واختر
            العقار المناسب لك بسهولة.
          </p>

        </div>

      </section>

      {/* =====================================
          Search
      ====================================== */}

      <section className="sale-search-section">

        <form
          className="sale-search-form"
          onSubmit={handleSearchSubmit}
        >

          {/* Search */}

          <div className="sale-search-field sale-search-field-wide">

            <label
              htmlFor="sale-search-input"
              className="sale-search-label"
            >
              ابحث في العقارات
            </label>

            <div className="sale-search-input-wrapper">

              <SaleSearchIcon />

              <input
                id="sale-search-input"
                type="text"
                placeholder="ابحث باسم العقار..."
                value={filters.search}
                onChange={handleFilterChange("search")}
              />

            </div>

          </div>

          {/* Location */}

          <div className="sale-search-field">

            <label
              htmlFor="sale-location-input"
              className="sale-search-label"
            >
              الموقع
            </label>

            <div className="sale-search-input-wrapper">

              <SaleLocationIcon />

              <input
                id="sale-location-input"
                type="text"
                placeholder="اسم الموقع"
                value={filters.location}
                onChange={handleFilterChange("location")}
              />

            </div>

          </div>

          {/* Property Type */}

          <div className="sale-search-field">

            <label
              htmlFor="sale-type-input"
              className="sale-search-label"
            >
              نوع العقار
            </label>

            <select
              id="sale-type-input"
              value={activeType}
              onChange={(event) =>
                handleTypeSelect(event.target.value)
              }
            >

              <option value="all">
                جميع الأنواع
              </option>

              {propertyTypes
                .filter(
                  (type) => type.id !== "all"
                )
                .map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.label}
                  </option>
                ))}

            </select>

          </div>

          {/* Minimum Price */}

          <div className="sale-search-field">

            <label
              htmlFor="sale-min-price-input"
              className="sale-search-label"
            >
              الحد الأدنى للسعر
            </label>

            <input
              id="sale-min-price-input"
              type="number"
              min="0"
              placeholder="حد أدنى"
              value={filters.minPrice}
              onChange={handleFilterChange("minPrice")}
            />

          </div>

          {/* Maximum Price */}

          <div className="sale-search-field">

            <label
              htmlFor="sale-max-price-input"
              className="sale-search-label"
            >
              الحد الأقصى للسعر
            </label>

            <input
              id="sale-max-price-input"
              type="number"
              min="0"
              placeholder="حد أقصى"
              value={filters.maxPrice}
              onChange={handleFilterChange("maxPrice")}
            />

          </div>

          {/* Search Button */}

          <button
            type="submit"
            className="sale-search-submit"
          >
            <SaleSearchIcon />
            بحث
          </button>

        </form>

      </section>

      {/* =====================================
          Listings
      ====================================== */}

      <section className="sale-listings-section">

        <div className="sale-listings-heading">

          <div>

            <span className="sale-listings-label">
              أفضل الفرص
            </span>

            <h2 className="sale-listings-title">
              اكتشف أفضل الفرص للبيع
            </h2>

          </div>

          <span className="sale-results-count">
            {filtered.length} عقار
          </span>

        </div>

        {/* ===================================
            Tabs
        ==================================== */}

        <div className="sale-type-tabs">

          {propertyTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`sale-type-tab ${
                activeType === type.id ? "sale-type-tab-active" : ""
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              {type.icon && <i className={`bi ${type.icon}`} />}
              {type.label}
            </button>
          ))}

        </div>

        {/* ===================================
            Cards
        ==================================== */}

        {listings === null && !loadError ? (

          /* =================================
             Loading
          ================================== */

          <div className="sale-empty-results">

            <div
              className="spinner-border text-primary"
              role="status"
              aria-hidden="true"
              data-testid="sale-loading-spinner"
            ></div>

            <h3>
              جارٍ تحميل العقارات المتاحة للبيع...
            </h3>

            <p>
              نحضر لك أحدث العروض الآن.
            </p>

          </div>

        ) : (

          <>

            {loadError && (

              /* =================================
                 Error (content still shown)
              ================================== */

              <div className="sale-empty-results">

                <div className="sale-empty-icon">
                  <SaleSearchIcon />
                </div>

                <h3>
                  تعذر تحميل العقارات حاليًا
                </h3>

                <p>
                  تعرض عقارات تجريبية بدلاً من ذلك.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    refetch()
                  }
                >
                  إعادة المحاولة
                </button>

              </div>

            )}

            {pageItems.length > 0 ? (

          <div className="sale-properties-grid">

            {pageItems.map((property) => {

              const propertyImage =
                Array.isArray(property.images) &&
                property.images.length > 0
                  ? property.images[0]
                  : property.image_url ||
                    "/images/house.jpg";

              const bedrooms =
                property.bedrooms_number ??
                property.bedrooms ??
                property.rooms ??
                0;

              const bathrooms =
                property.bathrooms_number ??
                property.bathrooms ??
                property.baths ??
                0;

              const hasGarage =
                property.hasGarage ??
                property.garage ??
                false;

              const area =
                property.area_size ??
                property.area ??
                null;

              return (

                <article
                  className="sale-property-card"
                  key={property.id}
                >

                  {/* Image */}

                  <div className="sale-property-media">

                    <img
                      src={propertyImage}
                      alt={property.title}
                      loading="lazy"
                    />

                    <span className="sale-property-badge">
                      للبيع
                    </span>

                    <div className="sale-property-actions">

                      <button
                        type="button"
                        className={`sale-property-icon ${
                          isFavorite(property.id)
                            ? "sale-property-icon-favorite"
                            : ""
                        }`}
                        onClick={() =>
                          toggleFavorite(property.id)
                        }
                        aria-label="إضافة للمفضلة"
                      >
                        <SaleHeartIcon
                          filled={
                            isFavorite(property.id)
                          }
                        />
                      </button>

                      <button
                        type="button"
                        className="sale-property-icon"
                        onClick={() =>
                          handleShare(property)
                        }
                        aria-label="مشاركة العقار"
                      >
                        <SaleShareIcon />
                      </button>

                    </div>

                  </div>

                  {/* Card Body */}

                  <div className="sale-property-body">

                    <span className="sale-property-type">
                      {property.type}
                    </span>

                    <h3 className="sale-property-title">
                      {property.title}
                    </h3>

                    {property.location_text && (

                      <div className="sale-property-location">

                        <SaleLocationIcon />

                        <span>
                          {property.location_text}
                        </span>

                      </div>

                    )}

                    {/* Meta */}

                    <div className="sale-property-meta">

                      <span>
                        {bedrooms} غرفة
                      </span>

                      <span>
                        {bathrooms} حمام
                      </span>

                      {hasGarage && (
                        <span>
                          جراج
                        </span>
                      )}

                      {area && (
                        <span>
                          {area} متر مربع
                        </span>
                      )}

                    </div>

                    {/* Bottom */}

                    <div className="sale-property-footer">

                      <div className="sale-property-price-box">

                        <span className="sale-property-price-label">
                          السعر يبدأ من
                        </span>

                        <strong className="sale-property-price">
                          {formatPrice(
                            property.price,
                            property.currency
                          )}
                        </strong>

                      </div>

                      <Link
                        to={`/properties/${property.id}`}
                        className="sale-property-details-button"
                      >
                        استكشف
                      </Link>

                    </div>

                  </div>

                </article>

              );
            })}

          </div>

        ) : (

          /* =================================
             Empty
          ================================== */

          <div className="sale-empty-results">

            <div className="sale-empty-icon">
              <SaleSearchIcon />
            </div>

            <h3>
              {saleProperties.length > 0
                ? "لا توجد عقارات مطابقة لبحثك"
                : "لا توجد عقارات للبيع حاليًا."}
            </h3>

            <p>
              {saleProperties.length > 0
                ? "جرّب تغيير خيارات البحث أو الفلاتر."
                : "ستظهر العقارات المتاحة للبيع هنا فور إضافتها."}
            </p>

            {saleProperties.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
              >
                عرض جميع العقارات
              </button>
            )}

          </div>

          )

          }

          </>

        )}

        {/* ===================================
            Pagination
        ==================================== */}

        {pageCount > 1 && (

          <div className="sale-pagination">

            <button
              type="button"
              className="sale-pagination-arrow"
              disabled={page === 1}
              onClick={() =>
                handlePageChange(page - 1)
              }
            >
              ‹
            </button>

            {Array.from({
              length: pageCount,
            }).map((_, index) => {

              const pageNumber =
                index + 1;

              return (

                <button
                  key={pageNumber}
                  type="button"
                  className={`sale-pagination-number ${
                    page === pageNumber
                      ? "sale-pagination-number-active"
                      : ""
                  }`}
                  onClick={() =>
                    handlePageChange(pageNumber)
                  }
                >
                  {pageNumber}
                </button>

              );
            })}

            <button
              type="button"
              className="sale-pagination-arrow"
              disabled={
                page === pageCount
              }
              onClick={() =>
                handlePageChange(page + 1)
              }
            >
              ›
            </button>

          </div>

        )}

      </section>

      {/* =====================================
          Newsletter
      ====================================== */}

      <section className="sale-newsletter-section">

        <div className="sale-newsletter-content">

          <h3 className="sale-newsletter-title">
            كن على اطلاع دائم بأفضل الفرص
          </h3>

          <p className="sale-newsletter-description">
            اشترك في نشرتنا البريدية وتوصلك أحدث
            العروض والمشاريع الحصرية أولًا بأول
          </p>

          {newsletter.submitted ? (
            <p className="sale-newsletter-form" role="status" aria-live="polite">
              شكراً لك! تم الاشتراك بنجاح.
            </p>
          ) : (
          <form
            className="sale-newsletter-form"
            onSubmit={(event) => newsletter.handleSubmit(event, "sale-newsletter-email")}
          >

            <input
              type="email"
              name="sale-newsletter-email"
              placeholder="ادخل بريدك الإلكتروني"
              required
            />

            <button type="submit" disabled={newsletter.submitting}>
              {newsletter.submitting ? "جارٍ..." : "اشترك الآن"}
            </button>

            {newsletter.error && <p className="re-notice re-notice-error" role="alert">{newsletter.error}</p>}
          </form>
          )}

        </div>

      </section>

    </div>
  );
}