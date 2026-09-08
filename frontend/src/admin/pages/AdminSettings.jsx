import { useState, useEffect } from "react";
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from "../../api/api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  useEffect(() => {
    let active = true;
    getAdminProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      })
      .catch((err) => { if (active) setProfileError(err.message); })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);
    try {
      await updateAdminProfile({ first_name: firstName, last_name: lastName, email, phone });
      setProfile((p) => ({ ...p, first_name: firstName, last_name: lastName, email, phone }));
      setProfileSuccess("تم تحديث الملف الشخصي بنجاح.");
    } catch (err) {
      setProfileError(err.message || "حدث خطأ أثناء التحديث.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!PASSWORD_REGEX.test(newPw)) {
      setPwError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم وحرف خاص.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSavingPw(true);
    try {
      await changeAdminPassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess("تم تغيير كلمة المرور بنجاح.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwError(err.message || "حدث خطأ أثناء تغيير كلمة المرور.");
    } finally {
      setSavingPw(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>جارٍ تحميل الإعدادات...</p>
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="admin-alert admin-alert--error" style={{ margin: "2rem" }}>
        <i className="fa-solid fa-circle-exclamation" /> {profileError}
      </div>
    );
  }

  return (
    <div className="admin-settings-page">
      <h2>الإعدادات</h2>

      <div className="admin-settings-tabs">
        <button
          type="button"
          className={`admin-settings-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <i className="fa-solid fa-user" /> الملف الشخصي
        </button>
        <button
          type="button"
          className={`admin-settings-tab ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          <i className="fa-solid fa-lock" /> تغيير كلمة المرور
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="admin-settings-panel">
          {profileError && (
            <div className="admin-alert admin-alert--error">
              <i className="fa-solid fa-circle-exclamation" /> {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="admin-alert admin-alert--success">
              <i className="fa-solid fa-circle-check" /> {profileSuccess}
            </div>
          )}
          <form className="admin-form" onSubmit={handleProfileSave}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="adms-first-name">الاسم الأول *</label>
                <input id="adms-first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={50} />
              </div>
              <div className="admin-form-group">
                <label htmlFor="adms-last-name">الاسم الأخير *</label>
                <input id="adms-last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={50} />
              </div>
              <div className="admin-form-group">
                <label htmlFor="adms-email">البريد الإلكتروني *</label>
                <input id="adms-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="admin-form-group">
                <label htmlFor="adms-phone">رقم الهاتف *</label>
                <input id="adms-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={savingProfile}>
                {savingProfile ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "password" && (
        <div className="admin-settings-panel">
          {pwError && (
            <div className="admin-alert admin-alert--error">
              <i className="fa-solid fa-circle-exclamation" /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="admin-alert admin-alert--success">
              <i className="fa-solid fa-circle-check" /> {pwSuccess}
            </div>
          )}
          <form className="admin-form" onSubmit={handlePasswordChange}>
            <div className="admin-form-grid">
              <div className="admin-form-group admin-form-group--full">
                <label htmlFor="adms-current-password">كلمة المرور الحالية *</label>
                <input id="adms-current-password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="admin-form-group admin-form-group--full">
                <label htmlFor="adms-new-password">كلمة المرور الجديدة *</label>
                <input id="adms-new-password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required autoComplete="new-password" aria-describedby="adms-password-hint" />
                <span id="adms-password-hint" className="admin-input-hint">
                  8 أحرف على الأقل، حرف كبير + حرف صغير + رقم + حرف خاص (@$!%*?&)
                </span>
              </div>
              <div className="admin-form-group admin-form-group--full">
                <label htmlFor="adms-confirm-password">تأكيد كلمة المرور الجديدة *</label>
                <input id="adms-confirm-password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" />
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={savingPw}>
                {savingPw ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
