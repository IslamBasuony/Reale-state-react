import React from "react";
import { Link } from "react-router-dom";
import "./ProjectsSection.css";
import projects from "../data/projects";

const ProjectsSection = () => {
  return (
    <section className="projects-section">
      <p className="subtitle">آخر الأخبار</p>
      <div className="projects-header">
        <h1 className="title">استكشف المشاريع الجديدة</h1>
        <Link to="/projects" className="btn-more">
          عرض المزيد ←
        </Link>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <div className="project-card" key={project.id}>
            <img src={project.image} alt={project.title} className="project-img" loading="lazy" />
            <div className="project-date">{project.status}</div>
            <div className="project-body">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <Link
                to={`/projects/${project.id}`}
                className="read-more-btn"
                aria-label={`اقرأ المزيد عن ${project.title}`}
              >
                اقرأ المزيد ←
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
