import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./admin/components/AdminRoute.jsx";
import AdminLayout from "./admin/components/AdminLayout.jsx";
import "../src/admin/styles/admin.css";

const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard.jsx"));
const AdminProperties = lazy(() => import("./admin/pages/AdminProperties.jsx"));
const AdminPropertyForm = lazy(() => import("./admin/pages/AdminPropertyForm.jsx"));
const AdminClients = lazy(() => import("./admin/pages/AdminClients.jsx"));
const AdminClientDetail = lazy(() => import("./admin/pages/AdminClientDetail.jsx"));
const AdminAgents = lazy(() => import("./admin/pages/AdminAgents.jsx"));
const AdminAgentForm = lazy(() => import("./admin/pages/AdminAgentForm.jsx"));
const AdminInquiries = lazy(() => import("./admin/pages/AdminInquiries.jsx"));
const AdminContacts = lazy(() => import("./admin/pages/AdminContacts.jsx"));
const AdminSubscribers = lazy(() => import("./admin/pages/AdminSubscribers.jsx"));
const AdminReports = lazy(() => import("./admin/pages/AdminReports.jsx"));
const AdminSettings = lazy(() => import("./admin/pages/AdminSettings.jsx"));
const AdminAuditLogs = lazy(() => import("./admin/pages/AdminAuditLogs.jsx"));

const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const News = lazy(() => import("./pages/News.jsx"));
const Projects = lazy(() => import("./pages/Projects.jsx"));
const Sale = lazy(() => import("./pages/Sale.jsx"));
const Rent = lazy(() => import("./pages/Rent.jsx"));
const Agents = lazy(() => import("./pages/Agents.jsx"));
const Discover = lazy(() => import("./pages/Discover.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails.jsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.jsx"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails.jsx"));
const NewsDetails = lazy(() => import("./pages/NewsDetails.jsx"));
const Favorites = lazy(() => import("./pages/Favorites.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const AgentDetails = lazy(() => import("./pages/AgentDetails.jsx"));
const AreaDetails = lazy(() => import("./pages/AreaDetails.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const ADMIN_PREFIXES = ["/admin"];

function App() {
  const location = useLocation();
  const hideChrome =
    AUTH_PATHS.includes(location.pathname) ||
    ADMIN_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <Suspense fallback={null}>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetails />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/sale" element={<Sale />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/:id" element={<AgentDetails />} />
        <Route path="/areas/:name" element={<AreaDetails />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<AdminPropertyForm />} />
          <Route path="properties/:id/edit" element={<AdminPropertyForm />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
          <Route path="agents" element={<AdminAgents />} />
          <Route path="agents/new" element={<AdminAgentForm />} />
          <Route path="agents/:id/edit" element={<AdminAgentForm />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideChrome && <Footer />}
    </Suspense>
  );
}

export default App;
