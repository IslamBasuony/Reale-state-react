import { NavLink, Link } from "react-router-dom";

const MENU_ITEMS = [
  { path: "/admin", label: "لوحة التحكم", icon: "fa-solid fa-gauge-high", exact: true },
  { path: "/admin/reports", label: "التقارير", icon: "fa-solid fa-chart-pie" },
  { path: "/admin/properties", label: "العقارات", icon: "fa-solid fa-building" },
  { path: "/admin/clients", label: "المستخدمون", icon: "fa-solid fa-users" },
  { path: "/admin/agents", label: "الوكلاء", icon: "fa-solid fa-user-tie" },
  { path: "/admin/inquiries", label: "الطلبات", icon: "fa-solid fa-file-invoice" },
  { path: "/admin/contacts", label: "رسائل التواصل", icon: "fa-solid fa-envelope" },
  { path: "/admin/subscribers", label: "المشتركين", icon: "fa-solid fa-bell" },
  { path: "/admin/audit-logs", label: "سجل النشاط", icon: "fa-solid fa-clock-rotate-left" },
  { path: "/admin/settings", label: "الإعدادات", icon: "fa-solid fa-gear" },
];

export default function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="admin-sidebar-overlay" onClick={onClose} />}
      <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">عقار ويب</span>
          <span className="admin-sidebar-badge">لوحة الإدارة</span>
        </div>

        <nav className="admin-sidebar-nav">
          {MENU_ITEMS.map((item) =>
            item.disabled ? (
              <span key={item.path} className="admin-sidebar-link admin-sidebar-link--disabled" title="قريبًا">
                <i className={item.icon} />
                <span>{item.label}</span>
                <span className="admin-sidebar-soon">قريبًا</span>
              </span>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? "admin-sidebar-link--active" : ""}`
                }
                onClick={onClose}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-link admin-sidebar-link--site" onClick={onClose}>
            <i className="fa-solid fa-arrow-up-right-from-square" />
            <span>العودة للموقع</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
