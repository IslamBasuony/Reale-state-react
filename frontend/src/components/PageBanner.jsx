import React from "react";
import { Link } from "react-router-dom";
import "./PageBanner.css";


const PageBanner = ({ title, subtitle }) => {
  return (
    <div className="page-banner">
      <div className="page-banner-content">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        <div className="page-banner-crumb">
          <Link to="/">الرئيسية</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
};

export default PageBanner;
