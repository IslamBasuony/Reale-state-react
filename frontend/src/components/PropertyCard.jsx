import React from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { formatPrice, purposeLabel } from "../utils/formatPrice";

function HeartIcon({ filled }) {
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

function ShareIcon() {
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

function LocationIcon() {
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

const PropertyCard = React.memo(function PropertyCard({ property, priceLabel }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const propertyImage =
    (Array.isArray(property.images) && property.images[0]) ||
    property.image_url ||
    property.image ||
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

  const hasGarage = property.hasGarage ?? property.garage ?? false;
  const area = property.area_size ?? property.area ?? null;
  const favorite = isFavorite(property.id);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/properties/${property.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.title,
          text: `شاهد هذا العقار: ${property.title}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        window.alert("تم نسخ رابط العقار");
      }
    } catch {
      /* المستخدم ألغى المشاركة */
    }
  };

  const isRent = property.purpose === "rent";

  return (
    <article className="property-card">
      <div className="property-card-media">
        <img src={propertyImage} alt={property.title} loading="lazy" decoding="async" />
        <span className="property-card-badge">{purposeLabel(property.purpose)}</span>
        <div className="property-card-actions">
          <button
            type="button"
            className={`property-card-icon ${favorite ? "property-card-icon-favorite" : ""}`}
            onClick={() => toggleFavorite(property.id)}
            aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            aria-pressed={favorite}
          >
            <HeartIcon filled={favorite} />
          </button>
          <button
            type="button"
            className="property-card-icon"
            onClick={handleShare}
            aria-label="مشاركة العقار"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      <div className="property-card-body">
        <span className="property-card-type">{property.type}</span>
        <h3 className="property-card-title">{property.title}</h3>

        {property.location_text && (
          <div className="property-card-location">
            <LocationIcon />
            <span>{property.location_text}</span>
          </div>
        )}

        <div className="property-card-meta">
          <span>{bedrooms} غرفة</span>
          <span>{bathrooms} حمام</span>
          {hasGarage && <span>جراج</span>}
          {area && <span>{area} متر مربع</span>}
        </div>

        <div className="property-card-footer">
          <div className="property-card-price-box">
            <span className="property-card-price-label">
              {priceLabel ?? (isRent ? "الإيجار الشهري" : "السعر")}
            </span>
            <strong className="property-card-price">
              {formatPrice(property.price, property.currency, {
                monthly: isRent,
              })}
            </strong>
          </div>
          <Link to={`/properties/${property.id}`} className="property-card-details-button">
            استكشف
          </Link>
        </div>
      </div>
    </article>
  );
});

export default PropertyCard;
