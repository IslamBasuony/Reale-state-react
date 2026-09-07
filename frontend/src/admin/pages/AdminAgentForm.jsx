import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAdminAgent,
  createAdminAgent,
  updateAdminAgent,
} from "../../api/api";

const EMPTY = {
  first_name: "", last_name: "", email: "", phone: "",
  password: "", bio: "", profile_image_url: "", is_active: true,
};

export default function AdminAgentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    setLoading(true);
    getAdminAgent(id)
      .then((data) => {
        if (!active) return;
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          password: "",
          bio: data.bio || "",
          profile_image_url: data.profile_image_url || "",
          is_active: data.is_active !== undefined ? data.is_active : true,
        });
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isEdit]);

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (!payload.bio) delete payload.bio;
      if (!payload.profile_image_url) delete payload.profile_image_url;
      if (isEdit) {
        await updateAdminAgent(id, payload);
      } else {
        await createAdminAgent(payload);
      }
      navigate("/admin/agents");
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
        <p>جارٍ تحميل بيانات الوسيط...</p>
      </div>
    );
  }

  return (
    <div className="admin-form-page">
      <div className="admin-form-header">
        <button type="button" className="admin-btn-back" onClick={() => navigate("/admin/agents")}>
          <i className="fa-solid fa-arrow-right" /> الوكلاء
        </button>
        <h2>{isEdit ? "تعديل الوسيط" : "إضافة وسيط جديد"}</h2>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>الاسم الأول *</label>
            <input type="text" value={form.first_name} onChange={set("first_name")} required maxLength={50} />
          </div>

          <div className="admin-form-group">
            <label>الاسم الأخير *</label>
            <input type="text" value={form.last_name} onChange={set("last_name")} required maxLength={50} />
          </div>

          <div className="admin-form-group">
            <label>البريد الإلكتروني *</label>
            <input type="email" value={form.email} onChange={set("email")} required />
          </div>

          <div className="admin-form-group">
            <label>الهاتف *</label>
            <input type="text" value={form.phone} onChange={set("phone")} required />
          </div>

          <div className="admin-form-group">
            <label>{isEdit ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء)" : "كلمة المرور *}"}  </label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              required={!isEdit}
              minLength={isEdit ? 0 : 8}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={form.is_active} onChange={set("is_active")} />
              حساب نشط
            </label>
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label>رابط صورة الملف الشخصي</label>
            <input type="url" value={form.profile_image_url} onChange={set("profile_image_url")} placeholder="https://..." />
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label>نبذة تعريفية</label>
            <textarea value={form.bio} onChange={set("bio")} rows={3} />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-cancel" onClick={() => navigate("/admin/agents")} disabled={saving}>
            إلغاء
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الوسيط"}
          </button>
        </div>
      </form>
    </div>
  );
}
