import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";
import { getBrokers } from "../api/api";
import SEO from "../components/SEO.jsx";

const FALLBACK_AGENTS = [
  {
    id: 1,
    first_name: "أحمد",
    last_name: "علي",
    phone: "01000000000",
    bio: "مستشار عقاري أول متخصص في القاهرة الجديدة والتجمع الخامس.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
  {
    id: 2,
    first_name: "منى",
    last_name: "السيد",
    phone: "01011112222",
    bio: "مستشارة عقارية متخصصة في الشيخ زايد وأكتوبر.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
  {
    id: 3,
    first_name: "كريم",
    last_name: "فتحي",
    phone: "01023334444",
    bio: "مستشار استثمار عقاري متخصص في الساحل الشمالي.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
  {
    id: 4,
    first_name: "هبة",
    last_name: "عبد الرحمن",
    phone: "01035556666",
    bio: "مستشارة عقارية متخصصة في الإسكندرية.",
    profile_image_url: "https://i.ibb.co/9y1s8mz/avatar.png",
  },
];

const toAgentCard = (agent) => ({
  id: agent.id,
  name: `${agent.first_name} ${agent.last_name}`.trim(),
  bio: agent.bio || agent.area || "",
  phone: agent.phone || "",
  avatar: agent.profile_image_url || "https://i.ibb.co/9y1s8mz/avatar.png",
});

const Agents = () => {
  const [agents, setAgents] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    getBrokers()
      .then((data) => {
        if (active) setAgents(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayAgents = loadError
    ? FALLBACK_AGENTS.map(toAgentCard)
    : (agents ?? []).map(toAgentCard);

  return (
    <>
      <SEO
        title="وُسطاء العقارات"
        description="تعرّف على أفضل وُسطاء العقارات في عقار ويب وتواصل معهم مباشرة."
      />
      <PageBanner
        title="ابحث عن وسيط"
        subtitle="تواصل مع نخبة من المستشارين العقاريين المعتمدين لمساعدتك في اتخاذ القرار الصحيح."
      />

      <section className="page-section">
        {loadError && (
          <p
            style={{
              textAlign: "center",
              color: "var(--muted, #666)",
              marginBottom: "24px",
            }}
          >
            تعذر تحميل قائمة الوسطاء، تعرض بيانات تجريبية بدلاً من ذلك.
          </p>
        )}

        {agents === null && !loadError ? (
          <div className="state-notice" role="status" aria-live="polite">
            <div className="spinner-border text-primary" role="status" aria-hidden="true" />
            <p>جارٍ تحميل الوسطاء…</p>
          </div>
        ) : displayAgents.length === 0 ? (
          <div className="re-empty">
            <div className="re-empty-icon">
              <i className="bi bi-people" aria-hidden="true" />
            </div>
            <h3>لا يوجد وسطاء متاحون حاليًا</h3>
            <p>جرّب العودة لاحقًا أو تواصل معنا لمساعدتك.</p>
          </div>
        ) : (
        <div className="card-grid">
          {displayAgents.map((agent) => (
            <div className="simple-card" key={agent.id} style={{ textAlign: "center" }}>
              <div className="simple-card-body">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  loading="lazy"
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    objectFit: "cover",
                    margin: "0 auto 14px",
                  }}
                />
                <h3>{agent.name}</h3>
                {agent.bio && <p>{agent.bio}</p>}
                <p style={{ marginBottom: "16px" }} dir="ltr">
                  {agent.phone}
                </p>
                <Link to={`/agents/${agent.id}`} className="btn-outline">
                  عرض الملف الشخصي
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>
    </>
  );
};

export default Agents;
