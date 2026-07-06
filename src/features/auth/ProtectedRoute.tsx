import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F1F5F9",
        gap: 16
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #E2E8F0",
          borderTopColor: "#0369A1",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "#94A3B8", fontSize: 14 }}>Memuat sesi...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
