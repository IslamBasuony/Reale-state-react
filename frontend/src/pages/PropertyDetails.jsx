import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getListing, getSimilarListings } from "../api/api.js";
import { normalizeProperty } from "../api/normalize.js";
import fallbackProperty from "../data/fallbackProperty.js";
import PropertyCard from "../components/PropertyCard.jsx";
import { purposeLabel, formatPrice } from "../utils/formatPrice.js";
import { useFavorites } from "../context/FavoritesContext";
import "../components/PropertyDetails.css";
import SEO from "../components/SEO.jsx";

const FALLBACK_IMAGE = "/images/house.jpg";
const FALLBACK_PROPERTY = normalizeProperty(fallbackProperty);

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

const featureIcon = (icon) =>
  icon && /^[a-z0-9-]+$/.test(icon) ? `bi-${icon}` : "bi-check-circle";

function DetailRow({ label, value }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <tr>
      <td>{label}</td>
      <td>{hasValue ? value : "غير محدد"}</td>
    </tr>
  );
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [property, setProperty] = useState(null);
  const [state, setState] = useState("loading");
  const [loadError, setLoadError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [similar, setSimilar] = useState([]);

  const images =
    property && property.images && property.images.length
      ? property.images
      : [FALLBACK_IMAGE];
  const total = images.length;
  const safeIndex = Math.min(current, total - 1);

  const handleImageError = (event) => {
    const image = event.currentTarget;
    if (image && !image.src.endsWith(FALLBACK_IMAGE)) {
      image.src = FALLBACK_IMAGE;
    }
  };

  const prevImage = () => setCurrent((index) => (index - 1 + total) % total);
  const nextImage = () => setCurrent((index) => (index + 1) % total);

  const onGalleryKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      prevImage();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nextImage();
    }
  };

  useEffect(() => {
    let cancelled = false;
    setCurrent(0);

    const load = async () => {
      try {
        const data = await getListing(id);
        if (cancelled) return;
        if (!data) {
          setState("notFound");
          setProperty(null);
          return;
        }
        setProperty(data);
        setState("ready");
      } catch (error) {
        if (cancelled) return;
        if (String(error?.message ?? "").includes("404")) {
          setState("notFound");
          setProperty(null);
        } else {
          setProperty(FALLBACK_PROPERTY);
          setLoadError(true);
          setState("ready");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!property) {
      return;
    }
    let active = true;
    getSimilarListings(id, property.purpose, property.type, 3)
      .then((data) => {
        if (!active) return;
        setSimilar(data ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, property]);

  if (state === "loading") {
    return (
      <div className="property-page">
        <p className="loading">جارِ تحميل تفاصيل العقار...</p>
      </div>
    );
  }

  if (state === "notFound" || !property) {
    return (
      <div className="property-page not-found">
        <h2>العقار غير موجود</h2>
        <p>عذراً، لم نتمكن من العثور على هذا العقار.</p>
        <Link className="back-link" to="/">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    );
  }

  const locationText = [
    property.location?.name,
    property.location?.city,
  ]
    .filter(Boolean)
    .join(" — ") || property.address;

  const phone = property.contact?.phone;
  const email = property.contact?.email;
  const whatsapp = property.contact?.Whatsapp;

  const contactHref = phone
    ? `tel:${digitsOnly(phone)}`
    : whatsapp
      ? `https://wa.me/${digitsOnly(whatsapp)}`
      : email
        ? `mailto:${email}`
        : null;
  const isExternalLink = Boolean(contactHref && contactHref.startsWith("http"));

  const hasCoords =
    typeof property.location?.latitude === "number" &&
    typeof property.location?.longitude === "number";

  const amenities = property.amenities ?? [];
  const features = property.features ?? [];
  const featureSource = amenities.length
    ? amenities
    : features.map((name) => ({ name, icon: null }));

  const areaValue =
    property.area_size !== null && property.area_size !== undefined
      ? `${property.area_size} م²`
      : null;

  const agent = property.agent;

  return (
    <div className="property-page">
      {property && (
        <SEO
          title={property.title}
          description={property.description || `${property.title} - ${property.type} في ${property.location?.city || ""}`}
          image={property.image_url || (Array.isArray(property.images) && property.images[0])}
          type="article"
          property={{
            title: property.title,
            description: property.description,
            price: property.price,
            currency: property.currency,
            image: property.image_url || (Array.isArray(property.images) && property.images[0]),
            location: property.location?.city || property.address,
          }}
        />
      )}
      {loadError && (
        <div className="re-notice re-notice-error" role="alert">
          <p>حدث خطأ أثناء تحميل بيانات العقار. البيانات المعروضة قد لا تكون محدثة.</p>
        </div>
      )}
      <div className="header">
        <h2 className="property-title">{property.title}</h2>
        <div className="property-badges">
          {property.purpose && (
            <span className="badge-purpose">{purposeLabel(property.purpose)}</span>
          )}
          {property.type && (
            <span className="badge-type">{property.type}</span>
          )}
          {property.status && (
            <span className="badge-status">{property.status}</span>
          )}
        </div>
        <p className="property-location">
          <i className="bi bi-geo-alt" aria-hidden="true" /> {locationText}
        </p>
        <div className="property-header-actions">
          <p className="main-price">
            {formatPrice(property?.price, property.currency || "EGP", {
              monthly: property?.price_period === "monthly",
              yearly: property?.price_period === "yearly",
              fallback: "",
            })}
          </p>
          <button
            type="button"
            className={`property-fav-button${isFavorite(property.id) ? " property-fav-button-active" : ""}`}
            onClick={() => toggleFavorite(property.id)}
            aria-pressed={isFavorite(property.id)}
            aria-label={
              isFavorite(property.id)
                ? "إزالة من المفضلة"
                : "أضف إلى المفضلة"
            }
          >
            <i
              className={`bi ${isFavorite(property.id) ? "bi-heart-fill" : "bi-heart"}`}
              aria-hidden="true"
            />
            {isFavorite(property.id) ? "في المفضلة" : "أضف للمفضلة"}
          </button>
        </div>
      </div>

      <div
        className="images-section"
        role="region"
        aria-label="معرض صور العقار"
        tabIndex={0}
        onKeyDown={onGalleryKeyDown}
      >
        <img
          className="img-bg"
          src={images[safeIndex]}
          alt=""
          aria-hidden="true"
          onError={handleImageError}
        />
        <img
          className="img-front"
          src={images[safeIndex]}
          alt={`صورة ${safeIndex + 1} من ${total} لـ ${property.title}`}
          onError={handleImageError}
        />
        <button
          className="arrow left"
          type="button"
          onClick={prevImage}
          aria-label="الصورة السابقة"
        >
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
        <button
          className="arrow right"
          type="button"
          onClick={nextImage}
          aria-label="الصورة التالية"
        >
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </button>
        <div className="dots">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              className={`dot${index === safeIndex ? " active" : ""}`}
              onClick={() => setCurrent(index)}
              aria-label={`الانتقال إلى الصورة ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="image-thumbs" aria-label="مصغرات صور العقار">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              className={`thumb${index === safeIndex ? " active" : ""}`}
              onClick={() => setCurrent(index)}
              aria-label={`عرض الصورة ${index + 1}`}
            >
              <img src={image} alt="" onError={handleImageError} />
            </button>
          ))}
        </div>
      )}

      <div className="main-section">
        <div className="description-box">
          <h3>نبذة عن العقار</h3>
          <p>{property.description || "لا يوجد وصف لهذا العقار."}</p>
        </div>

        <div className="side-box">
          <div className="side-content">
            <h4 className="side-title">بيانات التواصل</h4>
            <div className="cont-left">
              {phone && (
                <p>
                  <i className="bi bi-telephone" aria-hidden="true" />{" "}
                  <span dir="ltr">{phone}</span>
                </p>
              )}
              {email && (
                <p>
                  <i className="bi bi-envelope" aria-hidden="true" /> {email}
                </p>
              )}
              {whatsapp && (
                <p>
                  <i className="bi bi-whatsapp" aria-hidden="true" />{" "}
                  {whatsapp}
                </p>
              )}
              {!phone && !email && !whatsapp && (
                <p>لا تتوفر بيانات تواصل لهذا العقار.</p>
              )}
            </div>
            <hr className="line" />
            {contactHref ? (
              <a
                className="btn"
                href={contactHref}
                {...(isExternalLink
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                <i className="bi bi-whatsapp" aria-hidden="true" />
                تواصل مع الوكيل الآن
              </a>
            ) : (
              <button className="btn" type="button" disabled>
                تواصل مع الوكيل الآن
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="extra-details">
        <h3>تفاصيل العقار</h3>
        <table className="details-table">
          <tbody>
            <DetailRow label="المساحة" value={areaValue} />
            <DetailRow label="غرف النوم" value={property.bedrooms_number} />
            <DetailRow label="الحمامات" value={property.bathrooms_number} />
            <DetailRow
              label="الطابق"
              value={property.floor_number ?? property.floor}
            />
            <DetailRow
              label="إجمالي الطوابق"
              value={property.total_floors}
            />
            <DetailRow
              label="مواقف السيارات"
              value={property.parking_spaces}
            />
            <DetailRow label="التشطيب" value={property.finishing} />
            <DetailRow label="تاريخ الإضافة" value={property.added_date} />
            <DetailRow label="العنوان" value={property.address} />
            <DetailRow label="الموقع" value={locationText} />
          </tbody>
        </table>
      </div>

      <div className="property-features">
        <h3>مميزات العقار</h3>
        {featureSource.length ? (
          <div className="features-grid">
            {featureSource.map((item, index) => (
              <div className="feature-item" key={index}>
                <i
                  className={`bi ${featureIcon(item.icon)} feature-icon`}
                  aria-hidden="true"
                />
                <span className="feature-text">{item.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-features">
            لا تتوفر بيانات مميزات لهذا العقار.
          </p>
        )}
      </div>

      <div className="agent-wrapper">
        <h3>وكيل العقار</h3>
        {agent ? (
          <>
            <Link className="agent-card" to={`/agents/${agent.id}`}>
              <img
                className="agent-avatar"
                src={agent.profile_image_url || FALLBACK_IMAGE}
                alt={agent.name ?? "وكيل العقار"}
                onError={handleImageError}
              />
              <div className="agent-info">
                <h4 className="agent-name">{agent.name ?? "الوكيل"}</h4>
                {agent.bio && <p className="agent-bio">{agent.bio}</p>}
                {agent.phone && (
                  <p className="agent-contact">
                    <i className="bi bi-telephone" aria-hidden="true" />{" "}
                    <span dir="ltr">{agent.phone}</span>
                  </p>
                )}
                <span className="agent-profile-link">عرض الملف الكامل ←</span>
              </div>
            </Link>
          </>
        ) : (
          <p className="no-features">
            يتواصل المهتمون مع الوكيل عبر بيانات التواصل الموضحة أعلاه.
          </p>
        )}
      </div>

      {hasCoords && (
        <div className="map-section">
          <h3 className="map-title">موقع العقار على الخريطة</h3>
          <div className="map-container">
            <iframe
              title="موقع العقار على الخريطة"
              src={`https://maps.google.com/maps?q=${property.location.latitude},${property.location.longitude}&z=15&output=embed`}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="similar-properties">
          <h3 className="similar-title">عقارات مشابهة</h3>
          <div className="similar-grid">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
