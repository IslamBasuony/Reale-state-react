import { useState, useEffect, useCallback } from "react";
import { getAdminContacts } from "../../api/api";

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchData = useCallback(async (active = true) => {
    if (!active) return;
    setLoading(true);
    if (!active) return;
    setError(null);
    try {
      const data = await getAdminContacts({ page, limit: 15 });
      if (!active) return;
      setContacts(data.contacts);
      if (!active) return;
      setTotal(data.total);
      if (!active) return;
      setTotalPages(data.totalPages);
    } catch (err) {
      if (!active) return;
      setError(err.message || "تعذر تحميل رسائل التواصل.");
    } finally {
      if (!active) return;
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    let active = true;
    fetchData(active);
    return () => { active = false; };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل رسائل التواصل...</p>
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
        <h2>رسائل التواصل <span className="admin-crud-count">({total})</span></h2>
      </div>

      {contacts.length === 0 ? (
        <div className="admin-empty">
          <i className="fa-solid fa-envelope" />
          <p>لا توجد رسائل تواصل حالياً</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الرسالة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td className="admin-table-text-cell">{c.message}</td>
                  <td>{new Date(c.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="admin-table-actions">
                    <button type="button" className="admin-action-btn admin-action-btn--edit" title="عرض التفاصيل" onClick={() => setDetail(c)}>
                      <i className="fa-solid fa-eye" />
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

      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تفاصيل الرسالة</h3>
            <div className="admin-detail-grid">
              <div className="admin-detail-row">
                <span className="admin-detail-label">رقم الرسالة</span>
                <span>{detail.id}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">الاسم</span>
                <span>{detail.name}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">البريد الإلكتروني</span>
                <span>{detail.email}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">الهاتف</span>
                <span>{detail.phone}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">التاريخ</span>
                <span>{new Date(detail.created_at).toLocaleString("ar-EG")}</span>
              </div>
              <div className="admin-detail-row admin-detail-row--full">
                <span className="admin-detail-label">الرسالة</span>
                <p className="admin-detail-message">{detail.message}</p>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-cancel" onClick={() => setDetail(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
