import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAdminClient,
  updateAdminClient,
} from "../../api/api";

export default function AdminClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", is_admin: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminClient(id)
      .then((data) => {
        if (!active) return;
        setClient(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          is_admin: data.is_admin || false,
        });
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateAdminClient(id, form);
      navigate("/admin/clients");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  return (
    <div className="admin-form-page">
      <div className="admin-form-header">
        <button type="button" className="admin-btn-back" onClick={() => navigate("/admin/clients")}>
          <i className="fa-solid fa-arrow-right" /> المستخدمون
        </button>
        <h2>تعديل المستخدم</h2>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      <div className="admin-detail-info">
        <div className="admin-detail-item">
          <span className="admin-detail-label">تاريخ التسجيل:</span>
          <span>{client ? new Date(client.created_at).toLocaleDateString("ar-EG") : "—"}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">آخر تحديث:</span>
          <span>{client?.updated_at ? new Date(client.updated_at).toLocaleDateString("ar-EG") : "—"}</span>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>الاسم الأول *</label>
            <input type="text" value={form.first_name} onChange={set("first_name")} required />
          </div>

          <div className="admin-form-group">
            <label>الاسم الأخير *</label>
            <input type="text" value={form.last_name} onChange={set("last_name")} required />
          </div>

          <div className="admin-form-group">
            <label>البريد الإلكتروني *</label>
            <input type="email" value={form.email} onChange={set("email")} required />
          </div>

          <div className="admin-form-group">
            <label>الهاتف</label>
            <input type="text" value={form.phone} onChange={set("phone")} />
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={form.is_admin} onChange={set("is_admin")} />
              حساب مسؤول
            </label>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-cancel" onClick={() => navigate("/admin/clients")} disabled={saving}>
            إلغاء
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </div>
  );
}
