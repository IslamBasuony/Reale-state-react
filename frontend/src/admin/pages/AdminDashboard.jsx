import { useState, useEffect } from "react";
import { getAdminStats, getAdminAnalytics } from "../../api/api";
import { DonutChart } from "../components/charts";
import { BarChart } from "../components/charts";
import { LineChart } from "../components/charts";

const TYPE_LABELS = {
  apartment: "شقة", villa: "فيلا", duplex: "دوبلكس",
  penthouse: "بنتهاوس", studio: "استوديو", townhouse: "تاون هاوس",
  office: "مكتب", shop: "محل", warehouse: "مخزن", land: "أرض",
};

const STATUS_LABELS = { available: "متاح", sold: "مباع", rented: "مُستأجر", pending: "قيد الانتظار" };

const STATUS_COLORS = { available: "#4caf50", sold: "#f44336", rented: "#ff9800", pending: "#ffc107" };

function formatMonth(ym) {
  const [y, m] = ym.split("-");
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${months[Number(m) - 1]} ${y}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, analyticsData] = await Promise.all([
        getAdminStats(),
        getAdminAnalytics(),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || "تعذر تحميل بيانات لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, analyticsData] = await Promise.all([
          getAdminStats(),
          getAdminAnalytics(),
        ]);
        if (active) {
          setStats(statsData);
          setAnalytics(analyticsData);
        }
      } catch (err) {
        if (active) setError(err.message || "تعذر تحميل بيانات لوحة التحكم.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <i className="fa-solid fa-triangle-exclamation" />
        <p>{error}</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={fetchData}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "إجمالي العقارات", value: stats.totalProperties, icon: "fa-solid fa-building", color: "#36b095" },
    { label: "عقارات للبيع", value: stats.saleProperties, icon: "fa-solid fa-tag", color: "#2196f3" },
    { label: "عقارات للإيجار", value: stats.rentProperties, icon: "fa-solid fa-key", color: "#ff9800" },
    { label: "إجمالي العملاء", value: stats.totalClients, icon: "fa-solid fa-users", color: "#9c27b0" },
    { label: "إجمالي الوكلاء", value: stats.totalAgents, icon: "fa-solid fa-user-tie", color: "#e91e63" },
    { label: "الاشتراكات", value: stats.totalSubscribers, icon: "fa-solid fa-bell", color: "#00bcd4" },
    { label: "الطلبات", value: stats.totalInquiries, icon: "fa-solid fa-file-invoice", color: "#795548" },
    { label: "رسائل التواصل", value: stats.totalContacts, icon: "fa-solid fa-envelope", color: "#607d8b" },
  ];

  const saleRentData = [
    { label: "بيع", value: stats.saleProperties },
    { label: "إيجار", value: stats.rentProperties },
  ].filter((d) => d.value > 0);

  const statusData = (analytics.propertiesByStatus || []).map((d) => ({
    label: STATUS_LABELS[d.status] || d.status,
    value: d.count,
  }));

  const statusColors = (analytics.propertiesByStatus || []).map(
    (d) => STATUS_COLORS[d.status] || "#999"
  );

  const typeData = (analytics.propertiesByType || []).map((d) => ({
    label: TYPE_LABELS[d.type] || d.type,
    value: d.count,
  }));

  const growthData = (analytics.propertiesByMonth || []).map((d) => ({
    label: formatMonth(d.month),
    value: d.count,
  }));

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: card.color }}>
              <i className={card.icon} />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{card.value.toLocaleString("ar-EG")}</span>
              <span className="admin-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-charts-grid">
        {saleRentData.length > 0 && (
          <DonutChart data={saleRentData} title="العقارات حسب الغرض" colors={["#2196f3", "#ff9800"]} />
        )}
        {statusData.length > 0 && (
          <DonutChart data={statusData} title="العقارات حسب الحالة" colors={statusColors} />
        )}
        {typeData.length > 0 && (
          <BarChart data={typeData} title="العقارات حسب النوع" horizontal />
        )}
        {growthData.length > 1 && (
          <LineChart data={growthData} title="نمو العقارات الشهرية" />
        )}
      </div>

      {analytics.activeAgents !== undefined && (
        <div className="admin-dashboard-section">
          <div className="admin-agent-stats-row">
            <div className="admin-mini-stat">
              <span className="admin-mini-stat-value">{analytics.totalAgents}</span>
              <span className="admin-mini-stat-label">إجمالي الوكلاء</span>
            </div>
            <div className="admin-mini-stat">
              <span className="admin-mini-stat-value">{analytics.activeAgents}</span>
              <span className="admin-mini-stat-label">وكلاء نشطون</span>
            </div>
            <div className="admin-mini-stat">
              <span className="admin-mini-stat-value">{analytics.totalAgents - analytics.activeAgents}</span>
              <span className="admin-mini-stat-label">وكلاء غير نشطين</span>
            </div>
          </div>
        </div>
      )}

      <div className="admin-dashboard-tables">
        {stats.recentProperties.length > 0 && (
          <div className="admin-recent-section">
            <h2>أحدث العقارات</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>السعر</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>الغرض</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentProperties.map((p) => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{Number(p.price).toLocaleString("ar-EG")} ج.م</td>
                      <td>{TYPE_LABELS[p.type] || p.type}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${p.status}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td>{p.purpose === "sale" ? "بيع" : "إيجار"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stats.recentUsers.length > 0 && (
          <div className="admin-recent-section">
            <h2>أحدث المستخدمين</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الدور</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.email}</td>
                      <td>
                        {u.is_admin ? (
                          <span className="admin-badge admin-badge--admin">مسؤول</span>
                        ) : (
                          <span className="admin-badge admin-badge--user">مستخدم</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
