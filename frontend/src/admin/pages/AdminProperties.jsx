import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminProperties,
  deleteAdminProperty,
} from "../../api/api";

const TYPE_LABELS = {
  apartment: "شقة", villa: "فيلا", duplex: "دوبلكس",
  penthouse: "بنتهاوس", studio: "استوديو", townhouse: "تاون هاوس",
  office: "مكتب", shop: "محل", warehouse: "مخزن", land: "أرض",
};

const STATUS_LABELS = { available: "متاح", sold: "مباع", rented: "مُستأجر" };

export default function AdminProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ lang: "", status: "", purpose: "", type: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchData = useCallback(async (active = true) => {
    if (!active) return;
    setLoading(true);
    if (!active) return;
    setError(null);
    try {
      const data = await getAdminProperties({ page, limit: 15, ...filters });
      if (!active) return;
      setProperties(data.properties);
      if (!active) return;
      setTotal(data.total);
      if (!active) return;
      setTotalPages(data.totalPages);
    } catch (err) {
      if (!active) return;
      setError(err.message || "تعذر تحميل العقارات.");
    } finally {
      if (!active) return;
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    let active = true;
    fetchData(active);
    return () => { active = false; };
  }, [fetchData]);

  const handleFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminProperty(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || "تعذر حذف العقار.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل العقارات...</p>
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

  return (
    <div className="admin-crud">
      <div className="admin-crud-header">
        <h2>العقارات <span className="admin-crud-count">({total})</span></h2>
        <button type="button" className="admin-btn admin-btn-primary admin-btn-lg" onClick={() => navigate("/admin/properties/new")}>
          <i className="fa-solid fa-plus" /> إضافة عقار جديد
        </button>
      </div>

      <div className="admin-filters">
        <select value={filters.lang} onChange={(e) => handleFilter("lang", e.target.value)}>
          <option value="">جميع اللغات</option>
          <option value="ar">عربي</option>
          <option value="en">إنجليزي</option>
        </select>
        <select value={filters.status} onChange={(e) => handleFilter("status", e.target.value)}>
          <option value="">جميع الحالات</option>
          <option value="available">متاح</option>
          <option value="sold">مباع</option>
          <option value="rented">مُستأجر</option>
        </select>
        <select value={filters.purpose} onChange={(e) => handleFilter("purpose", e.target.value)}>
          <option value="">جميع الأغراض</option>
          <option value="sale">بيع</option>
          <option value="rent">إيجار</option>
        </select>
        <select value={filters.type} onChange={(e) => handleFilter("type", e.target.value)}>
          <option value="">جميع الأنواع</option>
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {properties.length === 0 ? (
        <div className="admin-empty">
          <i className="fa-solid fa-building" />
          <p>لا توجد عقارات{Object.values(filters).some(Boolean) ? " تطابق البحث" : ""}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>السعر</th>
                <th>النوع</th>
                <th>الغرض</th>
                <th>الحالة</th>
                <th>اللغة</th>
                <th>الوسيط</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="admin-table-title">{p.title}</td>
                  <td>{Number(p.price).toLocaleString("ar-EG")} ج.م</td>
                  <td>{TYPE_LABELS[p.type] || p.type}</td>
                  <td>{p.purpose === "sale" ? "بيع" : "إيجار"}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${p.status}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td>{p.lang === "ar" ? "عربي" : "إنجليزي"}</td>
                  <td>{p.agent_name || "—"}</td>
                  <td className="admin-table-actions">
                    <button type="button" className="admin-action-btn admin-action-btn--edit" title="تعديل" onClick={() => navigate(`/admin/properties/${p.id}/edit`)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="admin-action-btn admin-action-btn--delete" title="حذف" onClick={() => setDeleteId(p.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <i className="fa-solid fa-chevron-right" />
          </button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <i className="fa-solid fa-chevron-left" />
          </button>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.</p>
            {deleteError && (
              <div className="admin-alert admin-alert--error" style={{ marginBottom: 14 }}>
                <i className="fa-solid fa-circle-exclamation" /> {deleteError}
              </div>
            )}
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-cancel" onClick={() => setDeleteId(null)} disabled={deleting}>إلغاء</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "جارٍ الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
