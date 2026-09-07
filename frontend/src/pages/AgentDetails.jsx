import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/realestate.css";
import { getBrokers, getListings } from "../api/api";
import PropertyCard from "../components/PropertyCard";
import StateNotice from "../components/StateNotice";

export default function AgentDetails() {
  const { id } = useParams();
  const brokerId = Number(id);

  const [brokers, setBrokers] = useState(null);
  const [brokersError, setBrokersError] = useState(false);
  const [listings, setListings] = useState(null);
  const [listingsError, setListingsError] = useState(false);

  useEffect(() => {
    let active = true;
    getBrokers()
      .then((data) => {
        if (active) setBrokers(data);
      })
      .catch(() => {
        if (active) setBrokersError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getListings()
      .then((data) => {
        if (active) setListings(data);
      })
      .catch(() => {
        if (active) setListingsError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const loading =
    (brokers === null && !brokersError) || (listings === null && !listingsError);

  const sourceBrokers = brokersError ? [] : brokers ?? [];
  const sourceListings = listings ?? [];

  const agent =
    sourceBrokers.find((broker) => broker.id === brokerId) || null;

  const agentListings = agent
    ? sourceListings.filter(
        (property) =>
          property.agent && Number(property.agent.id) === brokerId
      )
    : [];

  if (loading) {
    return (
      <div className="re-scope">
        <div className="container">
          <StateNotice loading />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="re-scope">
        <div className="container re-empty">
          <div className="re-empty-icon">
            <i className="bi bi-person-badge" aria-hidden="true" />
          </div>
          <h3>{brokersError ? "خطأ في تحميل بيانات الوسيط" : "الوسيط غير موجود"}</h3>
          <p>{brokersError ? "حدث خطأ أثناء تحميل بيانات الوسيط. حاول مرة أخرى." : "لم نتمكن من العثور على الوسيط المطلوب."}</p>
          <Link to="/agents" className="re-btn re-btn-primary">
            جميع الوسطاء
          </Link>
        </div>
      </div>
    );
  }

  const agentImage = agent.profile_image_url || "/images/bg-location.jpg";

  return (
    <div className="re-scope agent-details-page">
      <section className="agent-profile-card">
        <div className="container">
          <div className="agent-profile-inner">
            <div className="agent-profile-avatar">
              <img src={agentImage} alt={`${agent.first_name} ${agent.last_name}`} />
            </div>
            <div className="agent-profile-info">
              <h1>
                {agent.first_name} {agent.last_name}
              </h1>
              {agent.bio && <p>{agent.bio}</p>}
            </div>
            <div className="agent-profile-contact">
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="agent-contact-btn">
                  <i className="bi bi-telephone-fill" aria-hidden="true" />
                  <span dir="ltr">{agent.phone}</span>
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="agent-contact-btn">
                  <i className="bi bi-envelope-fill" aria-hidden="true" />
                  <span>{agent.email}</span>
                </a>
              )}
              <span className="agent-listings-count">
                {agentListings.length} عقار نشط
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="agent-listings-section">
        <div className="container">
          <div className="search-results-heading">
            <h2>عقارات الوسيط</h2>
            <span className="search-results-count">{agentListings.length} عقار</span>
          </div>

          {listingsError ? (
            <div className="re-notice re-notice-error" role="alert">
              <p>حدث خطأ أثناء تحميل عقارات الوسيط.</p>
            </div>
          ) : agentListings.length > 0 ? (
            <div className="row g-4">
              {agentListings.map((property) => (
                <div className="col-md-6 col-lg-4" key={property.id}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <div className="re-empty">
              <div className="re-empty-icon">
                <i className="bi bi-house" aria-hidden="true" />
              </div>
              <h3>لا توجد عقارات نشطة حاليًا</h3>
              <p>لا توجد عقارات مدرجة لهذا الوسيط في الوقت الحالي.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
