import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "./AuthContext";

export function AccessDenied() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 0,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
          border: "2px solid #FECACA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          boxShadow: "0 8px 32px rgba(239,68,68,0.15)",
        }}
      >
        <ShieldOff size={44} color="#EF4444" strokeWidth={1.5} />
      </div>

      {/* Error Code */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#EF4444",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 10,
        }}
      >
        403 — Akses Ditolak
      </p>

      {/* Heading */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#0F172A",
          margin: "0 0 12px",
          textAlign: "center",
        }}
      >
        Anda Tidak Memiliki Akses
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: "#64748B",
          textAlign: "center",
          maxWidth: 420,
          lineHeight: 1.7,
          marginBottom: 8,
        }}
      >
        Halaman ini memerlukan izin khusus yang tidak dimiliki oleh role Anda saat ini.
      </p>

      {/* Role info */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 16px",
          borderRadius: 99,
          background: "#F1F5F9",
          border: "1px solid #E2E8F0",
          marginBottom: 36,
        }}
      >
        <span style={{ fontSize: 12, color: "#94A3B8" }}>Role Anda:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0369A1" }}>
          {role?.name || "Viewer"}
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            background: "white",
            color: "#475569",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#CBD5E1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "white";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0";
          }}
        >
          <ArrowLeft size={15} />
          Kembali
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #0C4A6E, #0369A1)",
            color: "white",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
            boxShadow: "0 4px 12px rgba(3,105,161,0.3)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Home size={15} />
          Dashboard
        </button>
      </div>

      {/* Help text */}
      <p style={{ fontSize: 12, color: "#CBD5E1", marginTop: 32, textAlign: "center" }}>
        Hubungi Administrator jika Anda membutuhkan akses ke halaman ini.
      </p>
    </div>
  );
}
