import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminHeader({ title, onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header-right">
        <button
          type="button"
          className="admin-header-menu-btn"
          onClick={onMenuToggle}
          aria-label="فتح القائمة"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <h1 className="admin-header-title">{title}</h1>
      </div>

      <div className="admin-header-left">
        <Link to="/" className="admin-header-return-link">
          <i className="fa-solid fa-arrow-up-right-from-square" />
          <span>العودة للموقع</span>
        </Link>
        <div className="admin-header-user">
          <span className="admin-header-user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="admin-header-admin-badge">مسؤول</span>
        </div>
        <button
          type="button"
          className="admin-header-logout"
          onClick={logout}
        >
          <i className="fa-solid fa-right-from-bracket" />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
