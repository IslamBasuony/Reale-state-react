import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/realestate.css";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import SEO from "../components/SEO.jsx";

const COMPARE_STORAGE_KEY = "realEstateCompare";

function getCompareCount() {
  try {
    const stored = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY));
    if (Array.isArray(stored)) return stored.filter(Boolean).length;
  } catch {
    /* تجاهل بيانات غير صالحة */
  }
  return 0;
}

export default function Profile() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const [compareCount] = useState(getCompareCount);

  if (loading) {
    return (
      <div className="re-scope">
        <div className="container">
          <div className="state-notice" role="status" aria-live="polite">
            <div className="spinner-border text-primary" role="status" aria-hidden="true" />
            <p>جارٍ تحميل حسابك…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="re-scope profile-page">
        <div className="container">
          <div className="re-empty">
            <div className="re-empty-icon">
              <i className="bi bi-person" aria-hidden="true" />
            </div>
            <h3>أنت غير مسجّل الدخول</h3>
            <p>سجّل الدخول لعرض بيانات حسابك وعقاراتك المفضلة.</p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to="/login" className="re-btn re-btn-primary">
                تسجيل الدخول
              </Link>
              <Link to="/register" className="re-btn re-btn-outline">
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="re-scope profile-page">
      <SEO
        title="الملف الشخصي"
        description="إدارة ملفك الشخصي في عقار ويب."
      />
      <section className="profile-hero">
        <div className="container">
          <span className="re-eyebrow">الحساب الشخصي</span>
          <h1>مرحبًا، {user.firstName}</h1>
          <p>إدارة بياناتك وعقاراتك المفضلة من مكان واحد.</p>
        </div>
      </section>

      <section className="profile-main">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <aside className="profile-card">
                <div className="profile-avatar">
                  <i className="bi bi-person-fill" aria-hidden="true" />
                </div>
                <h2>
                  {user.firstName} {user.lastName}
                  {user.isAdmin && (
                    <span className="badge bg-warning text-dark ms-2" style={{ fontSize: "0.5em" }}>
                      مسؤول
                    </span>
                  )}
                </h2>
                <p className="profile-email">{user.email}</p>
                <button
                  type="button"
                  className="re-btn re-btn-outline re-btn-block"
                  onClick={logout}
                >
                  <i className="bi bi-box-arrow-right" aria-hidden="true" /> تسجيل الخروج
                </button>
              </aside>
            </div>

            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-sm-6">
                  <Link to="/favorites" className="profile-stat-card">
                    <div className="profile-stat-icon">
                      <i className="bi bi-heart-fill" aria-hidden="true" />
                    </div>
                    <div>
                      <strong>{favorites.size}</strong>
                      <span>عقار مفضل</span>
                    </div>
                    <i className="bi bi-arrow-right profile-stat-arrow" aria-hidden="true" />
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/compare" className="profile-stat-card">
                    <div className="profile-stat-icon">
                      <i className="bi bi-columns-gap" aria-hidden="true" />
                    </div>
                    <div>
                      <strong>{compareCount}</strong>
                      <span>عقار قيد المقارنة</span>
                    </div>
                    <i className="bi bi-arrow-right profile-stat-arrow" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="profile-info-card">
                <h3>بيانات الحساب</h3>
                <div className="profile-info-row">
                  <span>الاسم الكامل</span>
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                </div>
                <div className="profile-info-row">
                  <span>البريد الإلكتروني</span>
                  <strong>{user.email}</strong>
                </div>
                <div className="profile-info-row">
                  <span>رقم الهاتف</span>
                  <strong dir="ltr">{user.phone || "—"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
