import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminAgents,
  deleteAdminAgent,
} from "../../api/api";

export default function AdminAgents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
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
      const data = await getAdminAgents({ page, limit: 15, search: search || undefined });
      if (!active) return;
      setAgents(data.agents);
      if (!active) return;
      setTotal(data.total);
      if (!active) return;
      setTotalPages(data.totalPages);
    } catch (err) {
      if (!active) return;
      setError(err.message || "تعذر تحميل الوكلاء.");
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
      await deleteAdminAgent(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || "تعذر حذف الوسيط.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل الوكلاء...</p>
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
        <h2>الوكلاء <span className="admin-crud-count">({total})</span></h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => navigate("/admin/agents/new")}>
          <i className="fa-solid fa-plus" /> إضافة وسيط
        </button>
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

      {agents.length === 0 ? (
        <div className="admin-empty">
          <i className="fa-solid fa-user-tie" />
          <p>لا يوجد وكلاء{search ? " يطابقون البحث" : ""}</p>
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
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>
                    <div className="admin-agent-name">
                      {a.profile_image_url && (
                        <img src={a.profile_image_url} alt="" className="admin-agent-avatar" />
                      )}
                      {a.first_name} {a.last_name}
                    </div>
                  </td>
                  <td>{a.email}</td>
                  <td>{a.phone || "—"}</td>
                  <td>
                    {a.is_active ? (
                      <span className="admin-badge admin-badge--available">نشط</span>
                    ) : (
                      <span className="admin-badge admin-badge--sold">غير نشط</span>
                    )}
                  </td>
                  <td>{new Date(a.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="admin-table-actions">
                    <button type="button" className="admin-action-btn admin-action-btn--edit" title="تعديل" onClick={() => navigate(`/admin/agents/${a.id}/edit`)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="admin-action-btn admin-action-btn--delete" title="حذف" onClick={() => setDeleteId(a.id)}>
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
            <p>هل أنت متأكد من حذف هذا الوسيط؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
