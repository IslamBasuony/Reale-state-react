import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const PAGE_TITLES = {
  "/admin": "لوحة التحكم",
  "/admin/reports": "التقارير",
  "/admin/properties": "العقارات",
  "/admin/clients": "المستخدمون",
  "/admin/agents": "الوكلاء",
  "/admin/inquiries": "الطلبات",
  "/admin/contacts": "رسائل التواصل",
  "/admin/subscribers": "المشتركين",
  "/admin/audit-logs": "سجل النشاط",
};

function getPageTitle(pathname) {
  if (pathname.includes("/properties/new")) return "إضافة عقار";
  if (pathname.includes("/properties/") && pathname.includes("/edit")) return "تعديل العقار";
  if (pathname.includes("/clients/")) return "تعديل المستخدم";
  if (pathname.includes("/agents/new")) return "إضافة وسيط";
  if (pathname.includes("/agents/") && pathname.includes("/edit")) return "تعديل الوسيط";
  if (pathname.includes("/settings")) return "الإعدادات";
  return PAGE_TITLES[pathname] || "لوحة التحكم";
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="admin-layout">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{getPageTitle(location.pathname)} | لوحة التحكم</title>
      </Helmet>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminHeader title={getPageTitle(location.pathname)} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
