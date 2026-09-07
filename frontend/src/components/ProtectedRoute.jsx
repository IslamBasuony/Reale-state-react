import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="re-scope">
        <div className="container">
          <div className="state-notice" role="status" aria-live="polite">
            <div className="spinner-border text-primary" role="status" aria-hidden="true" />
            <p>جارٍ التحقق...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
