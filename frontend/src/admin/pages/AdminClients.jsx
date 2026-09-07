import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminClients,
  deleteAdminClient,
} from "../../api/api";

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchData = useCallback(async (active = true) => {
    if (!active) return;
    setLoading(true);
    if (!active) return;
    setError(null);
    try {
      const data = await getAdminClients({ page, limit: 15, search: search || undefined });
      if (!active) return;
      setClients(data.clients);
      if (!active) return;
      setTotal(data.total);
      if (!active) return;
      setTotalPages(data.totalPages);
    } catch (err) {
      if (!active) return;
      setError(err.message || "تعذر تحميل المستخدمين.");
    } finally {
      if (!active) return;
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    let active = true;
    fetchData(active);
    return () => { active = false; };
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminClient(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || "تعذر حذف المستخدم.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل المستخدمين...</p>
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
        <h2>المستخدمون <span className="admin-crud-count">({total})</span></h2>
      </div>

      <form className="admin-search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="بحث بالاسم أو البريد الإلكتروني..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="admin-btn admin-btn-primary">
          <i className="fa-solid fa-search" /> بحث
        </button>
      </form>

      {clients.length === 0 ? (
        <div className="admin-empty">
          <i className="fa-solid fa-users" />
          <p>لا يوجد مستخدمون{search ? " يطابقون البحث" : ""}</p>
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
                <th>الدور</th>
                <th>تاريخ التسجيل</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.first_name} {c.last_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || "—"}</td>
                  <td>
                    {c.is_admin ? (
                      <span className="admin-badge admin-badge--admin">مسؤول</span>
                    ) : (
                      <span className="admin-badge admin-badge--user">مستخدم</span>
                    )}
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="admin-table-actions">
                    <button type="button" className="admin-action-btn admin-action-btn--edit" title="تعديل" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="admin-action-btn admin-action-btn--delete" title="حذف" onClick={() => setDeleteId(c.id)}>
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
            <p>هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
