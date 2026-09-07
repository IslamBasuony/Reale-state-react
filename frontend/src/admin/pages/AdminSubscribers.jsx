import { useState, useEffect, useCallback } from "react";
import { getAdminSubscribers } from "../../api/api";

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (active = true) => {
    if (!active) return;
    setLoading(true);
    if (!active) return;
    setError(null);
    try {
      const data = await getAdminSubscribers({ page, limit: 15 });
      if (!active) return;
      setSubscribers(data.subscribers);
      if (!active) return;
      setTotal(data.total);
      if (!active) return;
      setTotalPages(data.totalPages);
    } catch (err) {
      if (!active) return;
      setError(err.message || "تعذر تحميل المشتركين.");
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
        <p>جارٍ تحميل المشتركين...</p>
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
        <h2>المشتركين <span className="admin-crud-count">({total})</span></h2>
      </div>

      {subscribers.length === 0 ? (
        <div className="admin-empty">
          <i className="fa-solid fa-bell" />
          <p>لا يوجد مشتركون حالياً</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>البريد الإلكتروني</th>
                <th>الحالة</th>
                <th>تاريخ الاشتراك</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.email}</td>
                  <td>
                    {s.is_active ? (
                      <span className="admin-badge admin-badge--admin">نشط</span>
                    ) : (
                      <span className="admin-badge admin-badge--user">غير نشط</span>
                    )}
                  </td>
                  <td>{new Date(s.created_at).toLocaleDateString("ar-EG")}</td>
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
    </div>
  );
}
