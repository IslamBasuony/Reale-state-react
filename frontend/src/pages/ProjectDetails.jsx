import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/realestate.css";
import { getProjectById } from "../data/projects";
import { formatPrice } from "../utils/formatPrice";
import { submitProjectInquiry } from "../api/api";
import SEO from "../components/SEO.jsx";

export default function ProjectDetails() {
  const { id } = useParams();
  const project = getProjectById(id);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  if (!project) {
    return (
      <div className="re-scope">
        <div className="container re-empty">
          <div className="re-empty-icon">
            <i className="bi bi-building" aria-hidden="true" />
          </div>
          <h3>المشروع غير موجود</h3>
          <p>لم نتمكن من العثور على المشروع المطلوب.</p>
          <Link to="/projects" className="re-btn re-btn-primary">
            العودة إلى المشاريع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="re-scope project-details-page">
      <SEO
        title={`${project.title} — عقار ويب`}
        description={`تعرف على مشروع ${project.title} في ${project.location} بالتفصيل — الموقع، المطور، الأسعار والفئات المتاحة.`}
      />
      <section className="project-details-hero">
        <div className="container">
          <Link to="/projects" className="project-back-link">
            <i className="bi bi-arrow-right" aria-hidden="true" /> جميع المشاريع
          </Link>
          <div className="project-details-header">
            <div>
              <span className="project-status-badge">{project.status}</span>
              <h1>{project.title}</h1>
              <p className="project-details-location">
                <i className="bi bi-geo-alt" aria-hidden="true" /> {project.location}
              </p>
              <p className="project-details-developer">
                المطور: <strong>{project.developer}</strong>
              </p>
            </div>
            <div className="project-price-block">
              <span className="project-price-label">الأسعار تبدأ من</span>
              <strong className="project-price">{formatPrice(project.priceFrom)}</strong>
              <span className="project-price-to">حتى {formatPrice(project.priceTo)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="project-details-main">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="project-details-image">
                <img src={project.image} alt={project.title} />
              </div>
              <div className="project-details-section">
                <h2>عن المشروع</h2>
                <p>{project.description}</p>
                <div className="project-details-meta">
                  <div>
                    <span>النوع</span>
                    <strong>{project.type}</strong>
                  </div>
                  <div>
                    <span>الموقع</span>
                    <strong>{project.location}</strong>
                  </div>
                  <div>
                    <span>التسليم</span>
                    <strong>{project.delivery}</strong>
                  </div>
                  <div>
                    <span>الحالة</span>
                    <strong>{project.status}</strong>
                  </div>
                </div>
              </div>

              <div className="project-details-section">
                <h2>مميزات المشروع</h2>
                <ul className="project-features-list">
                  {project.features.map((feature) => (
                    <li key={feature}>
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-lg-4">
              <aside className="project-inquiry-card">
                <h3>استفسر عن المشروع</h3>
                <p>
                  تواصل معنا لمعرفة توافر الوحدات وأنظمة السداد المتاحة في هذا
                  المشروع.
                </p>
                {inquirySubmitted ? (
                  <div className="re-notice re-notice-success" role="status" aria-live="polite">
                    <p>شكراً لك! تم استلام استفسارك وسنتواصل معك قريبًا.</p>
                  </div>
                ) : (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setInquiryError("");
                    const form = event.target;
                    const nameInput = form.elements["inquiry-name"];
                    const phoneInput = form.elements["inquiry-phone"];
                    const emailInput = form.elements["inquiry-email"];
                    const name = nameInput?.value?.trim();
                    const phone = phoneInput?.value?.trim();
                    const email = emailInput?.value?.trim();
                    if (!name || !phone || !email) return;
                    setInquirySubmitting(true);
                    try {
                      await submitProjectInquiry(id, { name, email, phone });
                      setInquirySubmitted(true);
                    } catch {
                      setInquiryError("تعذر إرسال الاستفسار. حاول مرة أخرى.");
                    } finally {
                      setInquirySubmitting(false);
                    }
                  }}
                  className="project-inquiry-form"
                >
                  <input name="inquiry-name" type="text" placeholder="الاسم" aria-label="الاسم" className="form-control" required />
                  <input name="inquiry-phone" type="tel" placeholder="رقم الهاتف" aria-label="رقم الهاتف" className="form-control" required />
                  <input name="inquiry-email" type="email" placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" className="form-control" required />
                  {inquiryError && <p className="re-notice re-notice-error" role="alert">{inquiryError}</p>}
                  <button type="submit" className="re-btn re-btn-primary re-btn-block" disabled={inquirySubmitting}>
                    {inquirySubmitting ? "جارٍ..." : "اطلب معاينة"}
                  </button>
                </form>
                )}
                <Link to="/sale" className="re-btn re-btn-outline re-btn-block">
                  تصفّح عقارات مماثلة
                </Link>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
