import { useState, useEffect, useCallback } from "react";
import { getAdminAuditLogs, getAdminAuditLogById } from "../../api/api";

const ACTION_LABELS = {
  CREATE_PROPERTY: "إضافة عقار",
  UPDATE_PROPERTY: "تعديل عقار",
  DELETE_PROPERTY: "حذف عقار",
  CREATE_AGENT: "إضافة وكيل",
  UPDATE_AGENT: "تعديل وكيل",
  DELETE_AGENT: "حذف وكيل",
  UPDATE_CLIENT: "تعديل عميل",
  DELETE_CLIENT: "حذف عميل",
  UPLOAD_PROPERTY_IMAGE: "رفع صورة عقار",
  DELETE_PROPERTY_IMAGE: "حذف صورة عقار",
  SET_PRIMARY_PROPERTY_IMAGE: "تعيين الصورة الرئيسية",
  UPDATE_ADMIN_PROFILE: "تعديل الملف الشخصي",
  CHANGE_ADMIN_PASSWORD: "تغيير كلمة المرور",
  ADMIN_LOGIN_SUCCESS: "تسجيل دخول المسؤول",
};

const ENTITY_LABELS = {
  property: "عقار",
  client: "عميل/مسؤول",
  agent: "وكيل",
};

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
const ENTITY_OPTIONS = Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }));

function formatAction(action) {
  return ACTION_LABELS[action] || action;
}

function formatEntity(type) {
  return ENTITY_LABELS[type] || type;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAuditLogs({
        page,
        limit: 20,
        action: filterAction || undefined,
        entity_type: filterEntity || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || "تعذر تحميل سجل النشاط.");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity, startDate, endDate, search]);

  useEffect(() => {
    fetchData();
    // Close detail modal when filters/page change
    setDetailId(null);
    setDetail(null);
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const openDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await getAdminAuditLogById(id);
      setDetail(data);
    } catch (err) {
      setDetailError(err.message || "تعذر تحميل التفاصيل.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل سجل النشاط...</p>
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
        <h2>سجل النشاط <span className="admin-crud-count">({total})</span></h2>
      </div>

      <div className="admin-audit-filters">
        <form className="admin-search-bar" onSubmit={handleSearch} style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="بحث في الوصف أو البريد الإلكتروني..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="admin-btn admin-btn-primary">
            <i className="fa-solid fa-search" /> بحث
          </button>
        </form>

        <div className="admin-audit-filter-row">
          <select value={filterAction} onChange={handleFilterChange(setFilterAction)}>
            <option value="">جميع العمليات</option>
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select value={filterEntity} onChange={handleFilterChange(setFilterEntity)}>
            <option value="">جميع الأنواع</option>
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="admin-audit-date-group">
            <label>من</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          </div>

          <div className="admin-audit-date-group">
            <label>إلى</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="admin-empty">
          <i className="fa-solid fa-clock-rotate-left" />
          <p>لا توجد سجلات نشاط.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المسؤول</th>
                <th>العملية</th>
                <th>النوع</th>
                <th>المعرف</th>
                <th>الوصف</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="admin-audit-row" onClick={() => openDetail(log.id)}>
                  <td className="admin-audit-date">
                    {new Date(log.created_at).toLocaleDateString("ar-EG", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td>{log.admin_email || "—"}</td>
                  <td>
                    <span className="admin-badge admin-badge--info">
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td>{formatEntity(log.entity_type)}</td>
                  <td>{log.entity_id != null ? `#${log.entity_id}` : "—"}</td>
                  <td className="admin-audit-desc">{log.description}</td>
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

      {detailId && (
        <div className="admin-modal-overlay" onClick={closeDetail}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <h3>تفاصيل السجل</h3>

            {detailLoading && (
              <div className="admin-loading" style={{ padding: "20px" }}>
                <div className="admin-loading-spinner" />
              </div>
            )}

            {detailError && (
              <div className="admin-alert admin-alert--error">
                <i className="fa-solid fa-circle-exclamation" /> {detailError}
              </div>
            )}

            {detail && (
              <div className="admin-audit-detail">
                <div className="admin-audit-detail-grid">
                  <div className="admin-audit-detail-item">
                    <span className="admin-audit-detail-label">المسؤول</span>
                    <span>{detail.admin_email || "—"}</span>
                  </div>
                  <div className="admin-audit-detail-item">
                    <span className="admin-audit-detail-label">العملية</span>
                    <span className="admin-badge admin-badge--info">{formatAction(detail.action)}</span>
                  </div>
                  <div className="admin-audit-detail-item">
                    <span className="admin-audit-detail-label">نوع العنصر</span>
                    <span>{formatEntity(detail.entity_type)}</span>
                  </div>
                  <div className="admin-audit-detail-item">
                    <span className="admin-audit-detail-label">معرف العنصر</span>
                    <span>{detail.entity_id != null ? `#${detail.entity_id}` : "—"}</span>
                  </div>
                  <div className="admin-audit-detail-item admin-audit-detail-item--full">
                    <span className="admin-audit-detail-label">الوصف</span>
                    <span>{detail.description}</span>
                  </div>
                  <div className="admin-audit-detail-item">
                    <span className="admin-audit-detail-label">التاريخ</span>
                    <span>
                      {new Date(detail.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric", month: "long", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="admin-audit-detail-item">
                    <span className="admin-audit-detail-label">العنوان IP</span>
                    <span>{detail.ip_address || "—"}</span>
                  </div>
                </div>

                {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                  <div className="admin-audit-metadata">
                    <span className="admin-audit-detail-label">بيانات وصفية</span>
                    <pre className="admin-audit-metadata-pre">
                      {JSON.stringify(detail.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-cancel" onClick={closeDetail}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
