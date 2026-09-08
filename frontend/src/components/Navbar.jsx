import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { favorites } = useFavorites();
  const mobileMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const navLinks = [
    { path: "/", label: "الرئيسية" },
    { path: "/about", label: "عن عقار" },
    { path: "/news", label: "الأخبار" },
    { path: "/projects", label: "المشاريع الجديدة" },
    { path: "/sale", label: "للبيع" },
    { path: "/rent", label: "للإيجار" },
    { path: "/agents", label: "ابحث عن وسيط" },
    { path: "/discover", label: "اكتشف" },
    { path: "/contact", label: "تواصل معنا" },
  ];

  return (
    <>
      <section className="nav top-nav">
        <div className="nav-contaner">
          <div className="social-icons" aria-hidden="true">
            <span><i className="fa-brands fa-instagram"></i></span>
            <span><i className="fa-brands fa-linkedin-in"></i></span>
            <span><i className="fa-brands fa-youtube"></i></span>
            <span><i className="fa-brands fa-facebook-f"></i></span>
            <span><i className="fa-brands fa-twitter"></i></span>
          </div>

          <div className="nav-login">
            <Link to="/favorites" className="nav-link nav-favorites" aria-label="المفضلة">
              <i className="fa-regular fa-heart"></i> المفضلة
              {favorites.size > 0 && <span className="nav-favorites-count">{favorites.size}</span>}
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="nav-link nav-admin-link">
                    <i className="fa-solid fa-gauge-high"></i> لوحة التحكم
                  </Link>
                )}
                <Link to="/profile" className="nav-link">
                  <i className="fa-regular fa-user"></i>
                  {user.firstName || user.name}
                </Link>
                <button
                  type="button"
                  className="nav-link nav-logout"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                  onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket"></i> خروج
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="nav-link">
                  <i className="fa-solid fa-user-plus"></i> إنشاء حساب
                </Link>
                <Link to="/login" className="nav-link">
                  <i className="fa-solid fa-right-to-bracket"></i> تسجيل دخول
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="nav bottom-nav white">
        <div className="nav-contaner">
          <div className="logo desktop-left">
            <p className="Aqarweb">عقار ويب</p>
          </div>

          <ul className="nav-links desktop">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink to={link.path} end={link.path === "/"}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="search desktop-right">
            <Link to="/search-results" className="nav-search" aria-label="بحث">
              <i className="fa-solid fa-magnifying-glass"></i>
            </Link>
          </div>

          <div className="tablet-slider" role="navigation" aria-label="روابط التنقل">
            <ul className="tablet-links">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.path === "/"}
                    className="slide-link">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-container" ref={mobileMenuRef}>
            <button
              type="button"
              className="hamburger mobile-left"
              aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsOpen((open) => !open)}>
              <i
                className={
                  isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"
                } aria-hidden="true"></i>
            </button>

            <div className="logo mobile-center">
              <p className="Aqarweb">عقار ويب</p>
            </div>

            <div className="search mobile-right">
              <Link to="/search-results" className="nav-search" aria-label="بحث">
                <i className="fa-solid fa-magnifying-glass"></i>
              </Link>
            </div>

            <div
              id="mobile-menu"
              className={`links ${isOpen ? "open" : ""}`}>
              <ul className="nav-links mobile">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      end={link.path === "/"}
                      onClick={() => setIsOpen(false)}>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Navbar;
