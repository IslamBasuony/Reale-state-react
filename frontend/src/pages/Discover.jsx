import React from "react";
import PageBanner from "../components/PageBanner";
import AreasSection from "../components/AreasSection";
import SEO from "../components/SEO.jsx";

const Discover = () => {
  return (
    <>
      <SEO
        title="استكشف"
        description="استكشف المناطق والعقارات المميزة في مصر."
      />
      <PageBanner
        title="اكتشف"
        subtitle="جولة سريعة في أبرز المناطق والمشروعات العقارية الرائجة حاليًا في مصر."
      />
      <AreasSection />
    </>
  );
};

export default Discover;
