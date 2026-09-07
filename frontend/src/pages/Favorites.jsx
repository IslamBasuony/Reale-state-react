import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/realestate.css";
import { getListings } from "../api/api";
import { normalizeListings } from "../api/normalize";
import fallbackProperties from "../data/fallbackProperties";
import { useFavorites } from "../context/FavoritesContext";
import PropertyCard from "../components/PropertyCard";
import StateNotice from "../components/StateNotice";
import SEO from "../components/SEO.jsx";

const FALLBACK_LISTINGS = normalizeListings(fallbackProperties);

export default function Favorites() {
  const { favorites, clearFavorites } = useFavorites();
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
  const favoriteProperties = (sourceListings ?? []).filter((property) =>
    favorites.has(property.id)
  );

  return (
    <div className="re-scope favorites-page">
      <SEO
        title="المفضلة"
        description="عقاراتك المفضلة في عقار ويب."
      />
      <section className="favorites-hero">
        <div className="container">
          <span className="re-eyebrow">المفضلة</span>
          <h1>العقارات المحفوظة</h1>
          <p>
            احتفظ بالعقارات التي أعجبتك هنا، وارجع إليها في أي وقت للمقارنة أو
            التواصل.
          </p>
        </div>
      </section>

      <section className="favorites-list">
        <div className="container">
          <div className="favorites-heading">
            <h2>قائمة المفضلة</h2>
            <div className="favorites-actions">
              <span className="search-results-count">
                {favoriteProperties.length} عقار
              </span>
              {favoriteProperties.length > 0 && (
                <button
                  type="button"
                  className="re-btn re-btn-outline"
                  onClick={clearFavorites}
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>

          {listings === null && !loadError ? (
            <StateNotice loading />
          ) : loadError ? (
            <>
              <div className="re-notice re-notice-error" role="alert">
                <p>حدث خطأ أثناء تحميل بيانات العقارات. البيانات المعروضة قد لا تكون محدثة.</p>
              </div>
              {favoriteProperties.length > 0 ? (
                <div className="row g-4">
                  {favoriteProperties.map((property) => (
                    <div className="col-md-6 col-lg-4" key={property.id}>
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="re-empty">
                  <div className="re-empty-icon">
                    <i className="bi bi-heart" aria-hidden="true" />
                  </div>
                  <h3>لا توجد عقارات في المفضلة بعد</h3>
                  <p>
                    اضغط على أيقونة القلب في أي عقار لإضافته إلى قائمتك هنا.
                  </p>
                  <Link to="/sale" className="re-btn re-btn-primary">
                    تصفّح العقارات
                  </Link>
                </div>
              )}
            </>
          ) : favoriteProperties.length > 0 ? (
            <div className="row g-4">
              {favoriteProperties.map((property) => (
                <div className="col-md-6 col-lg-4" key={property.id}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <div className="re-empty">
              <div className="re-empty-icon">
                <i className="bi bi-heart" aria-hidden="true" />
              </div>
              <h3>لا توجد عقارات في المفضلة بعد</h3>
              <p>
                اضغط على أيقونة القلب في أي عقار لإضافته إلى قائمتك هنا.
              </p>
              <Link to="/sale" className="re-btn re-btn-primary">
                تصفّح العقارات
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
