import { useState, useEffect, useRef } from "react";
import { getAdminStats, getAdminAnalytics } from "../../api/api";
import { DonutChart, BarChart, LineChart } from "../components/charts";

const TYPE_LABELS = {
  apartment: "شقة", villa: "فيلا", duplex: "دوبلكس",
  penthouse: "بنتهاوس", studio: "استوديو", townhouse: "تاون هاوس",
  office: "مكتب", shop: "محل", warehouse: "مخزن", land: "أرض",
};

const STATUS_LABELS = { available: "متاح", sold: "مباع", rented: "مُستأجر", pending: "قيد الانتظار" };
const STATUS_COLORS = { available: "#4caf50", sold: "#f44336", rented: "#ff9800", pending: "#ffc107" };
const LANG_LABELS = { ar: "عربي", en: "إنجليزي" };
const LANG_COLORS = { ar: "#36b095", en: "#2196f3" };

function formatMonth(ym) {
  if (!ym || typeof ym !== "string") return "";
  const parts = ym.split("-");
  if (parts.length < 2) return ym;
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${months[Number(parts[1]) - 1] || parts[1]} ${parts[0]}`;
}

const num = (v) => (v == null ? 0 : Number(v));

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRef = useRef(true);

  const fetchData = async () => {
    if (!activeRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const [statsData, analyticsData] = await Promise.all([
        getAdminStats(),
        getAdminAnalytics(),
      ]);
      if (!activeRef.current) return;
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      if (!activeRef.current) return;
      setError(err.message || "تعذر تحميل التقارير.");
    } finally {
      if (!activeRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => { activeRef.current = false; };
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل التقارير...</p>
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

  if (!stats || !analytics) {
    return (
      <div className="admin-dashboard-error">
        <i className="fa-solid fa-triangle-exclamation" />
        <p>تعذر تحميل بيانات التقارير.</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={fetchData}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const saleRentData = [
    { label: "بيع", value: num(stats.saleProperties) },
    { label: "إيجار", value: num(stats.rentProperties) },
  ].filter((d) => d.value > 0);

  const statusData = (analytics.propertiesByStatus || []).map((d) => ({
    label: STATUS_LABELS[d.status] || d.status,
    value: num(d.count),
  }));

  const statusColors = (analytics.propertiesByStatus || []).map(
    (d) => STATUS_COLORS[d.status] || "#999"
  );

  const typeData = (analytics.propertiesByType || []).map((d) => ({
    label: TYPE_LABELS[d.type] || d.type,
    value: num(d.count),
  }));

  const langData = (analytics.propertiesByLang || []).map((d) => ({
    label: LANG_LABELS[d.lang] || d.lang,
    value: num(d.count),
  }));

  const langColors = (analytics.propertiesByLang || []).map(
    (d) => LANG_COLORS[d.lang] || "#999"
  );

  const propertiesGrowth = (analytics.propertiesByMonth || []).map((d) => ({
    label: formatMonth(d.month),
    value: num(d.count),
  }));

  const clientsGrowth = (analytics.clientsByMonth || []).map((d) => ({
    label: formatMonth(d.month),
    value: num(d.count),
  }));

  return (
    <div className="admin-reports">
      <div className="admin-reports-grid">
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#36b095" }}>
            <i className="fa-solid fa-building" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.totalProperties).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">إجمالي العقارات</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#2196f3" }}>
            <i className="fa-solid fa-tag" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.saleProperties).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">عقارات للبيع</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#ff9800" }}>
            <i className="fa-solid fa-key" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.rentProperties).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">عقارات للإيجار</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#9c27b0" }}>
            <i className="fa-solid fa-users" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.totalClients).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">إجمالي العملاء</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#e91e63" }}>
            <i className="fa-solid fa-user-tie" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(analytics.activeAgents)}/{num(analytics.totalAgents)}</span>
            <span className="admin-report-label">الوكلاء النشطون</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#795548" }}>
            <i className="fa-solid fa-file-invoice" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.totalInquiries).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">الطلبات</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#607d8b" }}>
            <i className="fa-solid fa-envelope" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.totalContacts).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">رسائل التواصل</span>
          </div>
        </div>
        <div className="admin-report-card">
          <div className="admin-report-icon" style={{ background: "#00bcd4" }}>
            <i className="fa-solid fa-bell" />
          </div>
          <div className="admin-report-info">
            <span className="admin-report-value">{num(stats.totalSubscribers).toLocaleString("ar-EG")}</span>
            <span className="admin-report-label">المشتركين</span>
          </div>
        </div>
      </div>

      <div className="admin-reports-charts">
        <div className="admin-reports-charts-row">
          {saleRentData.length > 0 && (
            <DonutChart data={saleRentData} title="التوزيع حسب الغرض" colors={["#2196f3", "#ff9800"]} />
          )}
          {statusData.length > 0 && (
            <DonutChart data={statusData} title="التوزيع حسب الحالة" colors={statusColors} />
          )}
          {langData.length > 0 && (
            <DonutChart data={langData} title="التوزيع حسب اللغة" colors={langColors} />
          )}
        </div>

        <div className="admin-reports-charts-row">
          {typeData.length > 0 && (
            <BarChart data={typeData} title="العقارات حسب النوع" horizontal />
          )}
        </div>

        <div className="admin-reports-charts-row">
          {propertiesGrowth.length > 1 && (
            <LineChart data={propertiesGrowth} title="نمو العقارات الشهرية" color="#36b095" />
          )}
          {clientsGrowth.length > 1 && (
            <LineChart data={clientsGrowth} title="نمو المستخدمين الشهرية" color="#9c27b0" />
          )}
        </div>
      </div>

      {analytics.agentPerformance && analytics.agentPerformance.length > 0 && (
        <div className="admin-reports-section">
          <h2 className="admin-reports-section-title">
            <i className="fa-solid fa-user-tie" /> أداء الوكلاء
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الوسيط</th>
                  <th>العقارات</th>
                  <th>مباع</th>
                  <th>مُستأجر</th>
                  <th>المشاهدات</th>
                  <th>التقييم</th>
                </tr>
              </thead>
              <tbody>
                {analytics.agentPerformance.map((a) => (
                  <tr key={a.id}>
                    <td className="admin-table-title">{a.agent_name}</td>
                    <td>{num(a.total_properties)}</td>
                    <td>{num(a.properties_sold)}</td>
                    <td>{num(a.properties_rented)}</td>
                    <td>{num(a.total_viewings)}</td>
                    <td>
                      {a.average_rating ? (
                        <span className="admin-rating">
                          <i className="fa-solid fa-star" style={{ color: "#ffc107" }} />{" "}
                          {Number(a.average_rating).toFixed(1)}
                        </span>
                      ) : (
                        "—"
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
  );
}
