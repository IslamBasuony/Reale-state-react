import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAdminProperty,
  getAdminAgents,
  createAdminProperty,
  updateAdminProperty,
  uploadPropertyImagesApi,
  deletePropertyImageApi,
  setPropertyImagePrimaryApi,
} from "../../api/api";

const EMPTY = {
  title: "", price: "", currency: "EGP", price_period: "monthly",
  description: "", address: "", status: "available", purpose: "sale",
  bedrooms_number: "", bathrooms_number: "", area_size: "",
  lang: "ar", type: "apartment", agent_id: "", parking_spaces: "",
  floor_number: "", total_floors: "", is_featured: false,
};

const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة" }, { value: "villa", label: "فيلا" },
  { value: "duplex", label: "دوبلكس" }, { value: "penthouse", label: "بنتهاوس" },
  { value: "studio", label: "استوديو" }, { value: "townhouse", label: "تاون هاوس" },
  { value: "office", label: "مكتب" }, { value: "shop", label: "محل" },
  { value: "warehouse", label: "مخزن" }, { value: "land", label: "أرض" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function AdminPropertyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [agentsError, setAgentsError] = useState(false);

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      setNewPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p));
        return [];
      });
    };
  }, []);

  useEffect(() => {
    let active = true;
    getAdminAgents({ limit: 200 })
      .then((d) => { if (active) setAgents(d.agents || []); })
      .catch(() => { if (active) setAgentsError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    setLoading(true);
    getAdminProperty(id)
      .then((data) => {
        if (!active) return;
        setForm({
          title: data.title || "",
          price: data.price || "",
          currency: data.currency || "EGP",
          price_period: data.price_period || "monthly",
          description: data.description || "",
          address: data.address || "",
          status: data.status || "available",
          purpose: data.purpose || "sale",
          bedrooms_number: data.bedrooms_number ?? "",
          bathrooms_number: data.bathrooms_number ?? "",
          area_size: data.area_size ?? "",
          lang: data.lang || "ar",
          type: data.type || "apartment",
          agent_id: data.agent_id || "",
          parking_spaces: data.parking_spaces ?? "",
          floor_number: data.floor_number ?? "",
          total_floors: data.total_floors ?? "",
          is_featured: data.is_featured || false,
        });
        setExistingImages(data.images || []);
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
      const payload = {
        ...form,
        price: Number(form.price),
        agent_id: Number(form.agent_id),
        bedrooms_number: form.bedrooms_number !== "" ? Number(form.bedrooms_number) : undefined,
        bathrooms_number: form.bathrooms_number !== "" ? Number(form.bathrooms_number) : undefined,
        area_size: form.area_size !== "" ? Number(form.area_size) : undefined,
        parking_spaces: form.parking_spaces !== "" ? Number(form.parking_spaces) : 0,
        floor_number: form.floor_number !== "" ? Number(form.floor_number) : undefined,
        total_floors: form.total_floors !== "" ? Number(form.total_floors) : undefined,
      };
      if (isEdit) {
        await updateAdminProperty(id, payload);
      } else {
        const created = await createAdminProperty(payload);
        if (newFiles.length > 0 && created && created.id) {
          await uploadPropertyImagesApi(created.id, newFiles);
        }
      }
      navigate("/admin/properties");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "صيغة الملف غير مدعومة — يُسمح فقط بـ JPEG، PNG، WEBP";
    }
    if (file.size > MAX_SIZE) {
      return "حجم الملف يتجاوز 5 ميجابايت";
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const errors = [];
    const valid = [];
    for (const f of files) {
      const err = validateFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
      else valid.push(f);
    }
    if (errors.length > 0) {
      setUploadError(errors.join("\n"));
    } else {
      setUploadError(null);
    }
    setNewFiles((prev) => [...prev, ...valid]);
    const previews = valid.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewFile = (idx) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadNew = async () => {
    if (!isEdit || newFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const images = await uploadPropertyImagesApi(id, newFiles);
      setExistingImages((prev) => [...prev, ...images]);
      newPreviews.forEach((p) => URL.revokeObjectURL(p));
      setNewFiles([]);
      setNewPreviews([]);
    } catch (err) {
      setUploadError(err.message || "تعذر رفع الصور.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deletePropertyImageApi(id, deleteId);
      setExistingImages((prev) => prev.filter((img) => img.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setUploadError(err.message || "تعذر حذف الصورة.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await setPropertyImagePrimaryApi(id, imageId);
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
    } catch {
      /* silent */
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل بيانات العقار...</p>
      </div>
    );
  }

  return (
    <div className="admin-form-page">
      <div className="admin-form-header">
        <button type="button" className="admin-btn-back" onClick={() => navigate("/admin/properties")}>
          <i className="fa-solid fa-arrow-right" /> العقارات
        </button>
        <h2>{isEdit ? "تعديل العقار" : "إضافة عقار جديد"}</h2>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div className="admin-form-group admin-form-group--full">
            <label>العنوان *</label>
            <input type="text" value={form.title} onChange={set("title")} required maxLength={255} />
          </div>

          <div className="admin-form-group">
            <label>السعر *</label>
            <input type="number" value={form.price} onChange={set("price")} min="1" step="any" required />
          </div>

          <div className="admin-form-group">
            <label>العملة</label>
            <select value={form.currency} onChange={set("currency")}>
              <option value="EGP">ج.م (EGP)</option>
              <option value="USD">$ (USD)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>فترة السعر</label>
            <select value={form.price_period} onChange={set("price_period")}>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
              <option value="one_time">دفعة واحدة</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>نوع العقار *</label>
            <select value={form.type} onChange={set("type")} required>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label>الغرض *</label>
            <select value={form.purpose} onChange={set("purpose")} required>
              <option value="sale">بيع</option>
              <option value="rent">إيجار</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>الحالة</label>
            <select value={form.status} onChange={set("status")}>
              <option value="available">متاح</option>
              <option value="sold">مباع</option>
              <option value="rented">مُستأجر</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>اللغة *</label>
            <select value={form.lang} onChange={set("lang")} required>
              <option value="ar">عربي</option>
              <option value="en">إنجليزي</option>
            </select>
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label>العنوان الفعلي *</label>
            <input type="text" value={form.address} onChange={set("address")} required maxLength={255} />
          </div>

          <div className="admin-form-group admin-form-group--full">
            <label>الوصف</label>
            <textarea value={form.description} onChange={set("description")} rows={4} />
          </div>

          <div className="admin-form-group">
            <label>غرف النوم</label>
            <input type="number" value={form.bedrooms_number} onChange={set("bedrooms_number")} min="0" />
          </div>

          <div className="admin-form-group">
            <label>دورات المياه</label>
            <input type="number" value={form.bathrooms_number} onChange={set("bathrooms_number")} min="0" />
          </div>

          <div className="admin-form-group">
            <label>المساحة (م²)</label>
            <input type="number" value={form.area_size} onChange={set("area_size")} min="0" step="any" />
          </div>

          <div className="admin-form-group">
            <label>مواقف السيارات</label>
            <input type="number" value={form.parking_spaces} onChange={set("parking_spaces")} min="0" />
          </div>

          <div className="admin-form-group">
            <label>رقم الطابق</label>
            <input type="number" value={form.floor_number} onChange={set("floor_number")} min="0" />
          </div>

          <div className="admin-form-group">
            <label>إجمالي الطوابق</label>
            <input type="number" value={form.total_floors} onChange={set("total_floors")} min="0" />
          </div>

          <div className="admin-form-group">
            <label>الوسيط *</label>
            {agentsError ? (
              <span className="admin-alert admin-alert--error" style={{ padding: "8px 12px" }}>
                تعذر تحميل قائمة الوكلاء
              </span>
            ) : (
              <select value={form.agent_id} onChange={set("agent_id")} required>
                <option value="">— اختر وسيطًا —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={form.is_featured} onChange={set("is_featured")} />
              عقار مميز
            </label>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-cancel" onClick={() => navigate("/admin/properties")} disabled={saving}>
            إلغاء
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة العقار"}
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="admin-images-section">
          <h3>صور العقار</h3>

          {existingImages.length > 0 && (
            <div className="admin-images-grid">
              {existingImages.map((img) => (
                <div key={img.id} className={`admin-image-thumb ${img.is_primary ? "admin-image-thumb--primary" : ""}`}>
                  <img src={img.image_url} alt={img.caption || "صورة العقار"} />
                  <div className="admin-image-actions">
                    {!img.is_primary && (
                      <button type="button" className="admin-action-btn admin-action-btn--edit" title="تعيين كصورة رئيسية" onClick={() => handleSetPrimary(img.id)}>
                        <i className="fa-solid fa-star" />
                      </button>
                    )}
                    <button type="button" className="admin-action-btn admin-action-btn--delete" title="حذف" onClick={() => setDeleteId(img.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                  {img.is_primary && <span className="admin-image-badge">رئيسية</span>}
                </div>
              ))}
            </div>
          )}

          {existingImages.length === 0 && newFiles.length === 0 && (
            <div className="admin-empty" style={{ padding: "24px" }}>
              <i className="fa-solid fa-images" />
              <p>لا توجد صور لهذا العقار</p>
            </div>
          )}

          {newPreviews.length > 0 && (
            <div className="admin-images-grid admin-images-grid--new">
              {newPreviews.map((src, idx) => (
                <div key={idx} className="admin-image-thumb admin-image-thumb--new">
                  <img src={src} alt={`معاينة ${idx + 1}`} />
                  <button type="button" className="admin-action-btn admin-action-btn--delete" title="إزالة" onClick={() => removeNewFile(idx)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="admin-upload-row">
            <label className="admin-btn admin-btn-primary" style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-cloud-arrow-up" /> اختيار صور
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </label>
            {newFiles.length > 0 && (
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleUploadNew} disabled={uploading}>
                {uploading ? "جارٍ الرفع..." : `رفع ${newFiles.length} صورة`}
              </button>
            )}
          </div>

          {uploadError && (
            <div className="admin-alert admin-alert--error" style={{ whiteSpace: "pre-line" }}>
              <i className="fa-solid fa-circle-exclamation" /> {uploadError}
            </div>
          )}

          <p className="admin-upload-hint">الصيغ المدعومة: JPEG، PNG، WEBP — الحد الأقصى: 5 ميجابايت لكل صورة — حد أقصى 10 صور</p>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذه الصورة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-cancel" onClick={() => setDeleteId(null)} disabled={deleting}>إلغاء</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={handleDeleteImage} disabled={deleting}>
                {deleting ? "جارٍ الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
