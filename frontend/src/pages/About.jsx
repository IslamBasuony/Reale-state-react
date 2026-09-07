import React from "react";
import PageBanner from "../components/PageBanner";
import CaunterBoxes from "../components/Caunter";
import ClientsSection from "../components/ClientsSection";
import SEO from "../components/SEO.jsx";

const values = [
  {
    icon: "fa-solid fa-bolt",
    title: "سرعة في التسليم",
    text: "نلتزم بمواعيد التسليم المتفق عليها مع عملائنا دون تأخير.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "مصداقية في الإعلانات",
    text: "كل عقار معروض على الموقع تم التحقق منه ومن بياناته.",
  },
  {
    icon: "fa-solid fa-headset",
    title: "متابعة ما بعد البيع",
    text: "فريق دعم متكامل يرافقك في كل خطوة حتى بعد إتمام الصفقة.",
  },
  {
    icon: "fa-solid fa-file-shield",
    title: "عقارات موثقة",
    text: "جميع الوحدات المعروضة مضمونة وموثقة قانونيًا.",
  },
];

const About = () => {
  return (
    <>
      <SEO
        title="من نحن"
        description="تعرف على عقار ويب - منصة العقارات الرائدة في مصر التي تساعدك في إيجاد العقار المثالي."
      />
      <PageBanner
        title="عن عقار ويب"
        subtitle="منصتك الأولى للعثور على العقار المناسب في مصر، نجمع بين التكنولوجيا والخبرة العقارية لنقدّم لك تجربة بحث سهلة وموثوقة."
      />

      <section className="page-section">
        <h2 className="page-section-title">قصتنا</h2>
        <p className="page-section-subtitle">
          انطلقت عقار ويب من فكرة بسيطة: تسهيل رحلة البحث عن السكن أو الاستثمار
          العقاري. اليوم نساعد آلاف العملاء سنويًا في العثور على الشقة أو
          الفيلا أو المكتب المناسب، بالتعاون مع نخبة من المطورين والوسطاء
          العقاريين المعتمدين في مختلف المحافظات.
        </p>

        <div className="card-grid">
          {values.map((v) => (
            <div className="simple-card" key={v.title}>
              <div className="simple-card-body" style={{ textAlign: "center" }}>
                <i
                  className={v.icon}
                  style={{ fontSize: "1.8rem", color: "var(--brand)", marginBottom: "12px" }}
                ></i>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CaunterBoxes />
      <ClientsSection />
    </>
  );
};

export default About;
