import React from "react";
import PageBanner from "../components/PageBanner";
import ProjectsSection from "../components/ProjectsSection";
import SEO from "../components/SEO.jsx";

const Projects = () => {
  return (
    <>
      <SEO
        title="المشاريع العقارية"
        description="اكتشف أحدث المشاريع العقارية في مصر على عقار ويب."
      />
      <PageBanner
        title="المشاريع الجديدة"
        subtitle="اكتشف أحدث المشاريع العقارية قيد الإطلاق من كبرى شركات التطوير العقاري في مصر."
      />
      <ProjectsSection />
    </>
  );
};

export default Projects;
