import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
      }}
    >
      <SEO
        title="الصفحة غير موجودة"
        description="الصفحة التي تبحث عنها غير موجودة."
      />
      <h1 style={{ fontSize: "4rem", color: "var(--brand)", margin: 0 }}>404</h1>
      <p style={{ color: "var(--gray-500)", margin: "10px 0 24px" }}>
        عذرًا، الصفحة اللي بتدور عليها مش موجودة.
      </p>
      <Link to="/" className="btn-brand">
        العودة للرئيسية
      </Link>
    </div>
  );
};

export default NotFound;
