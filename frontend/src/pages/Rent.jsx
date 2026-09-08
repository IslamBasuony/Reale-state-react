import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/listing-page.css";
import { useFavorites } from "../context/FavoritesContext";
import { useListings } from "../context/ListingsContext";
import { FALLBACK_LISTINGS } from "../data/fallbackListings";
import useNewsletter from "../hooks/useNewsletter";
import { formatPrice } from "../utils/priceRange";
import SEO from "../components/SEO.jsx";

/* =========================================
   Constants
========================================= */

const RENT_PAGE_SIZE = 9;

/* =========================================
   Icons
========================================= */

function RentHeartIcon({ filled }) {
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

function RentShareIcon() {
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

function RentSearchIcon() {
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

function RentLocationIcon() {
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

const rentPropertyTypes = [
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
   Rent Page
========================================= */

export default function Rent() {
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeType, setActiveType] = useState("all");

  const [rentPage, setRentPage] = useState(1);

  const [rentFilters, setRentFilters] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });

  const { listings: contextListings, error: listingsError, refetch } = useListings();
  const newsletter = useNewsletter();

  const rentListings = contextListings;
  const rentLoadError = listingsError;

  /* =========================================
     Rent-only listings
  ========================================= */

  const sourceRentListings = listingsError
    ? FALLBACK_LISTINGS
    : contextListings;

  const rentProperties = useMemo(
    () =>
      (sourceRentListings ?? []).filter(
        (property) => property.purpose === "rent"
      ),
    [sourceRentListings]
  );

  /* =========================================
     Filtering
  ========================================= */

  const filteredRentProperties = useMemo(() => {
    return rentProperties.filter((property) => {
      /* Type */

      if (
        activeType !== "all" &&
        property.type !== activeType
      ) {
        return false;
      }

      /* Location */

      if (rentFilters.location) {
        const propertyLocation =
          property.location_text || "";

        if (
          !propertyLocation
            .toLowerCase()
            .includes(
              rentFilters.location.toLowerCase()
            )
        ) {
          return false;
        }
      }

      /* Search */

      if (rentFilters.search) {
        const searchValue =
          rentFilters.search.toLowerCase();

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

      /* Minimum Price */

      if (
        rentFilters.minPrice &&
        Number(property.price) <
          Number(rentFilters.minPrice)
      ) {
        return false;
      }

      /* Maximum Price */

      if (
        rentFilters.maxPrice &&
        Number(property.price) >
          Number(rentFilters.maxPrice)
      ) {
        return false;
      }

      return true;
    });
  }, [rentProperties, activeType, rentFilters]);

  /* =========================================
     Pagination
  ========================================= */

  const rentPageCount = Math.max(
    1,
    Math.ceil(
      filteredRentProperties.length /
        RENT_PAGE_SIZE
    )
  );

  const rentPageItems =
    filteredRentProperties.slice(
      (rentPage - 1) * RENT_PAGE_SIZE,
      rentPage * RENT_PAGE_SIZE
    );

  /* =========================================
     Share
  ========================================= */

  const handleRentShare = async (property) => {
    const shareUrl =
      `${window.location.origin}/properties/${property.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: property.title,
          text: `شاهد هذا العقار للإيجار: ${property.title}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          shareUrl
        );

        window.alert(
          "تم نسخ رابط العقار"
        );
      }
    } catch {
      /*
       * المستخدم أغلق نافذة المشاركة.
       */
    }
  };

  /* =========================================
     Filter Change
  ========================================= */

  const handleRentFilterChange =
    (field) => (event) => {
      setRentFilters((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));

      setRentPage(1);
    };

  /* =========================================
     Type Select
  ========================================= */

  const handleRentTypeSelect = (type) => {
    setActiveType(type);
    setRentPage(1);
  };

  /* =========================================
     Search Submit
  ========================================= */

  const handleRentSearchSubmit = (event) => {
    event.preventDefault();
    setRentPage(1);
  };

  /* =========================================
     Clear Filters
  ========================================= */

  const clearRentFilters = () => {
    setActiveType("all");

    setRentFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });

    setRentPage(1);
  };

  /* =========================================
     Pagination
  ========================================= */

  const handleRentPageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > rentPageCount
    ) {
      return;
    }

    setRentPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="rent-page-wrapper">
      <SEO
        title="عقارات للإيجار"
        description="اكتشف العقارات للإيجار في مصر - شقق وفلل ومكاتب بأسعار إيجار مناسبة في أفضل المناطق."
      />

      {/* =====================================
          HERO
      ====================================== */}

      <section className="rent-hero-section">

        <div className="rent-hero-content">

          <span className="rent-hero-label">
            للإيجار
          </span>

          <h1 className="rent-hero-title">
            اكتشف أفضل العقارات
            <br />
            المتاحة للإيجار الآن
          </h1>

          <p className="rent-hero-description">
            ابحث عن العقار المثالي للإيجار
            واختر المكان المناسب لاحتياجاتك.
          </p>

        </div>

      </section>

      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="rent-search-section">

        <form
          className="rent-search-form"
          onSubmit={handleRentSearchSubmit}
        >

          {/* Search */}

          <div className="rent-search-field rent-search-field-wide">

            <label
              htmlFor="rent-search-input"
              className="rent-search-label"
            >
              ابحث في العقارات
            </label>

            <div className="rent-search-input-wrapper">

              <RentSearchIcon />

              <input
                id="rent-search-input"
                type="text"
                placeholder="ابحث باسم العقار..."
                value={rentFilters.search}
                onChange={handleRentFilterChange(
                  "search"
                )}
              />

            </div>

          </div>

          {/* Location */}

          <div className="rent-search-field">

            <label
              htmlFor="rent-location-input"
              className="rent-search-label"
            >
              الموقع
            </label>

            <div className="rent-search-input-wrapper">

              <RentLocationIcon />

              <input
                id="rent-location-input"
                type="text"
                placeholder="اسم الموقع"
                value={rentFilters.location}
                onChange={handleRentFilterChange(
                  "location"
                )}
              />

            </div>

          </div>

          {/* Type */}

          <div className="rent-search-field">

            <label
              htmlFor="rent-type-input"
              className="rent-search-label"
            >
              نوع العقار
            </label>

            <select
              id="rent-type-input"
              value={activeType}
              onChange={(event) =>
                handleRentTypeSelect(
                  event.target.value
                )
              }
            >

              <option value="all">
                جميع الأنواع
              </option>

              {rentPropertyTypes
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

          {/* Minimum Rent */}

          <div className="rent-search-field">

            <label
              htmlFor="rent-min-price-input"
              className="rent-search-label"
            >
              الحد الأدنى للإيجار
            </label>

            <input
              id="rent-min-price-input"
              type="number"
              min="0"
              placeholder="حد أدنى"
              value={rentFilters.minPrice}
              onChange={handleRentFilterChange(
                "minPrice"
              )}
            />

          </div>

          {/* Maximum Rent */}

          <div className="rent-search-field">

            <label
              htmlFor="rent-max-price-input"
              className="rent-search-label"
            >
              الحد الأقصى للإيجار
            </label>

            <input
              id="rent-max-price-input"
              type="number"
              min="0"
              placeholder="حد أقصى"
              value={rentFilters.maxPrice}
              onChange={handleRentFilterChange(
                "maxPrice"
              )}
            />

          </div>

          {/* Search Button */}

          <button
            type="submit"
            className="rent-search-submit"
          >
            <RentSearchIcon />
            بحث
          </button>

        </form>

      </section>

      {/* =====================================
          LISTINGS
      ====================================== */}

      <section className="rent-listings-section">

        <div className="rent-listings-heading">

          <div>

            <span className="rent-listings-label">
              أفضل الخيارات
            </span>

            <h2 className="rent-listings-title">
              اكتشف أفضل العقارات للإيجار
            </h2>

          </div>

          <span className="rent-results-count">
            {filteredRentProperties.length} عقار
          </span>

        </div>

        {/* ===================================
            TABS
        ==================================== */}

        <div className="rent-type-tabs">

          {rentPropertyTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`rent-type-tab ${
                activeType === type.id ? "rent-type-tab-active" : ""
              }`}
              onClick={() => handleRentTypeSelect(type.id)}
            >
              {type.icon && <i className={`bi ${type.icon}`} />}
              {type.label}
            </button>
          ))}

        </div>

        {/* ===================================
            CARDS
        ==================================== */}

        {rentListings === null && !rentLoadError ? (

          /* =================================
             LOADING
          ================================== */

          <div className="rent-empty-results">

            <div
              className="spinner-border text-primary"
              role="status"
              aria-hidden="true"
              data-testid="rent-loading-spinner"
            ></div>

            <h3>
              جارٍ تحميل العقارات المتاحة للإيجار...
            </h3>

            <p>
              نحضر لك أحدث الخيارات الآن.
            </p>

          </div>

        ) : (

          <>

            {rentLoadError && (

              /* =================================
                 ERROR (content still shown)
              ================================== */

              <div className="rent-empty-results">

                <div className="rent-empty-icon">
                  <RentSearchIcon />
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

            {rentPageItems.length > 0 ? (

          <div className="rent-properties-grid">

            {rentPageItems.map((property) => {

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
                  className="rent-property-card"
                  key={property.id}
                >

                  {/* Image */}

                  <div className="rent-property-media">

                    <img
                      src={propertyImage}
                      alt={property.title}
                      loading="lazy"
                    />

                    <span className="rent-property-badge">
                      للإيجار
                    </span>

                    <div className="rent-property-actions">

                      <button
                        type="button"
                        className={`rent-property-icon ${
                          isFavorite(property.id)
                            ? "rent-property-icon-favorite"
                            : ""
                        }`}
                        onClick={() =>
                          toggleFavorite(
                            property.id
                          )
                        }
                        aria-label="إضافة للمفضلة"
                      >
                        <RentHeartIcon
                          filled={
                            isFavorite(
                              property.id
                            )
                          }
                        />
                      </button>

                      <button
                        type="button"
                        className="rent-property-icon"
                        onClick={() =>
                          handleRentShare(
                            property
                          )
                        }
                        aria-label="مشاركة العقار"
                      >
                        <RentShareIcon />
                      </button>

                    </div>

                  </div>

                  {/* Body */}

                  <div className="rent-property-body">

                    <span className="rent-property-type">
                      {property.type}
                    </span>

                    <h3 className="rent-property-title">
                      {property.title}
                    </h3>

                    {property.location_text && (

                      <div className="rent-property-location">

                        <RentLocationIcon />

                        <span>
                          {property.location_text}
                        </span>

                      </div>

                    )}

                    {/* Meta */}

                    <div className="rent-property-meta">

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

                    {/* Footer */}

                    <div className="rent-property-footer">

                      <div className="rent-property-price-box">

                        <span className="rent-property-price-label">
                          الإيجار الشهري
                        </span>

                        <strong className="rent-property-price">
                          {formatPrice(
                            property.price,
                            property.currency,
                            { monthly: true }
                          )}
                        </strong>

                      </div>

                      <Link
                        to={`/properties/${property.id}`}
                        className="rent-property-details-button"
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
             EMPTY
          ================================== */

          <div className="rent-empty-results">

            <div className="rent-empty-icon">
              <RentSearchIcon />
            </div>

            <h3>
              {rentProperties.length > 0
                ? "لا توجد عقارات مطابقة لبحثك"
                : "لا توجد عقارات للإيجار حاليًا."}
            </h3>

            <p>
              {rentProperties.length > 0
                ? "جرّب تغيير خيارات البحث أو الفلاتر."
                : "ستظهر العقارات المتاحة للإيجار هنا فور إضافتها."}
            </p>

            {rentProperties.length > 0 && (
              <button
                type="button"
                onClick={clearRentFilters}
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
            PAGINATION
        ==================================== */}

        {rentPageCount > 1 && (

          <div className="rent-pagination">

            <button
              type="button"
              className="rent-pagination-arrow"
              disabled={rentPage === 1}
              onClick={() =>
                handleRentPageChange(
                  rentPage - 1
                )
              }
            >
              ‹
            </button>

            {Array.from({
              length: rentPageCount,
            }).map((_, index) => {

              const pageNumber =
                index + 1;

              return (

                <button
                  key={pageNumber}
                  type="button"
                  className={`rent-pagination-number ${
                    rentPage === pageNumber
                      ? "rent-pagination-number-active"
                      : ""
                  }`}
                  onClick={() =>
                    handleRentPageChange(
                      pageNumber
                    )
                  }
                >
                  {pageNumber}
                </button>

              );
            })}

            <button
              type="button"
              className="rent-pagination-arrow"
              disabled={
                rentPage === rentPageCount
              }
              onClick={() =>
                handleRentPageChange(
                  rentPage + 1
                )
              }
            >
              ›
            </button>

          </div>

        )}

      </section>

      {/* =====================================
          NEWSLETTER
      ====================================== */}

      <section className="rent-newsletter-section">

        <div className="rent-newsletter-content">

          <h3 className="rent-newsletter-title">
            لا تفوت أفضل عقارات الإيجار
          </h3>

          <p className="rent-newsletter-description">
            اشترك في نشرتنا البريدية ليصلك أحدث
            العقارات المتاحة للإيجار والعروض الحصرية.
          </p>

          {newsletter.submitted ? (
            <p className="rent-newsletter-form" role="status" aria-live="polite">
              شكراً لك! تم الاشتراك بنجاح.
            </p>
          ) : (
          <form
            className="rent-newsletter-form"
            onSubmit={(event) => newsletter.handleSubmit(event, "rent-newsletter-email")}
          >

            <input
              type="email"
              name="rent-newsletter-email"
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
