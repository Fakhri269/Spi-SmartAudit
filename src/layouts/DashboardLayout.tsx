import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  FileText,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Menu,
  Bell,
  Settings,
  ChevronRight,
  FileSignature,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { AIChatWidget } from "../components/AIChatWidget";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, role, hasPermission, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const NAV_ITEMS = [
    {
      group: "Beranda",
      items: [
        ...(hasPermission("dashboard.view") ? [{ to: "/", icon: LayoutDashboard, label: "Dashboard" }] : [])
      ],
    },
    {
      group: "Data",
      items: [
        ...(hasPermission("master.view") ? [{ to: "/master-data", icon: Database, label: "Master Data" }] : [])
      ],
    },
    {
      group: "Perencanaan",
      items: [
        ...(hasPermission("pkpt.view") ? [{ to: "/pkpt", icon: ClipboardList, label: "PKPT" }] : []),
        ...(hasPermission("assignment.view") ? [{ to: "/surat-tugas", icon: FileSignature, label: "Surat Tugas" }] : []),
      ],
    },
    {
      group: "Pelaksanaan",
      items: [
        ...(hasPermission("kka.view") ? [{ to: "/kka", icon: FolderOpen, label: "Kertas Kerja (KKA)" }] : []),
        ...(hasPermission("finding.view") ? [{ to: "/temuan", icon: AlertTriangle, label: "Temuan 5C" }] : []),
      ],
    },
    {
      group: "Laporan & Sistem",
      items: [
        ...(hasPermission("report.view") ? [{ to: "/laporan", icon: FileText, label: "Laporan Audit" }] : []),
        { to: "/settings", icon: Settings, label: "Pengaturan" }, // Everyone can see personal settings
      ],
    },
  ].filter(g => g.items.length > 0);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const currentPage = NAV_ITEMS.flatMap((g) => g.items).find((i) => isActive(i.to));

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const SIDEBAR_WIDTH = 260;
  const SIDEBAR_COLLAPSED = 68;

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", overflow: "hidden", background: "#F1F5F9" }}>

      {/* ─── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          minWidth: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          background: "linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%)",
          borderRight: "none",
          boxShadow: "4px 0 24px rgba(2,132,199,0.15)",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          zIndex: 30,
          position: "relative",
        }}
      >
        {/* ── Brand ─────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
            height: 64,
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            flexShrink: 0,
          }}
        >
          {/* Logo image restored */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              padding: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src="/PdamLogo.png"
              alt="Tirta Kahuripan"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div
            style={{
              opacity: sidebarOpen ? 1 : 0,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <p style={{ fontWeight: 800, color: "#FFFFFF", fontSize: 15, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Smart Audit SPI</p>
            <p style={{ fontSize: 11.5, color: "#E0F2FE", marginTop: 2, fontWeight: 500 }}>Tirta Kahuripan</p>
          </div>
        </div>

        {/* ── Nav ───────────────────────────────── */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px 0",
          }}
        >
          {NAV_ITEMS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: gi < NAV_ITEMS.length - 1 ? 8 : 0 }}>
              {/* Group label */}
              <div
                style={{
                  padding: sidebarOpen ? "8px 20px 6px" : "8px 0 6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
              >
                {sidebarOpen ? (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {group.group}
                  </span>
                ) : (
                  <div style={{ width: 24, height: 2, background: "rgba(255,255,255,0.2)", borderRadius: 1 }} />
                )}
              </div>

              {/* Nav items */}
              {group.items.map(({ to, icon: Icon, label }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    title={!sidebarOpen ? label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      margin: "2px 12px",
                      padding: sidebarOpen ? "9px 14px" : "9px 0",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      borderRadius: 10,
                      textDecoration: "none",
                      position: "relative",
                      background: active
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid transparent",
                      color: active ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                        (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                        (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                      }
                    }}
                  >
                    {/* Active left bar */}
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          left: -13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: 20,
                          borderRadius: "0 4px 4px 0",
                          background: "#FFFFFF",
                          boxShadow: "0 0 8px rgba(255,255,255,0.5)",
                        }}
                      />
                    )}
                    <Icon
                      size={17}
                      style={{
                        color: active ? "#FFFFFF" : "inherit",
                        flexShrink: 0,
                      }}
                    />
                    {sidebarOpen && (
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: active ? 600 : 500,
                          whiteSpace: "nowrap",
                          flex: 1,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {label}
                      </span>
                    )}
                    {active && sidebarOpen && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          boxShadow: "0 0 6px rgba(255,255,255,0.5)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── User Area ─────────────────────────── */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            padding: 12,
            flexShrink: 0,
          }}
        >
          {/* User card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 10,
              padding: "8px 10px",
              marginBottom: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#0284C7",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {initials}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                  }}
                >
                  {profile?.displayName || "User"}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.8)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 1,
                  }}
                >
                  {role?.name || profile?.roleId || "Viewer"}
                </p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              color: "#FFFFFF",
              background: "rgba(255,255,255,0.1)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.9)";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid #EF4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.2)";
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Topbar */}
        <header
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 64,
            background: "white",
            borderBottom: "1px solid #E2E8F0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                color: "#64748B",
                background: "transparent",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <span style={{ color: "#94A3B8" }}>SPI</span>
              <ChevronRight size={13} style={{ color: "#CBD5E1" }} />
              <span style={{ fontWeight: 600, color: "#0F172A" }}>
                {currentPage?.label || "Settings"}
              </span>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Bell */}
            <button
              style={{
                position: "relative",
                padding: 8,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                color: "#64748B",
                background: "transparent",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Bell size={17} />
              <span
                className="pulse-dot"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  background: "#EF4444",
                  borderRadius: "50%",
                }}
              />
            </button>

            <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0EA5E9, #0891B2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", lineHeight: 1.2 }}>
                  {profile?.displayName || "User"}
                </p>
                <p style={{ fontSize: 11.5, color: "#0284C7", marginTop: 1 }}>
                  {role?.name || profile?.roleId || "Viewer"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <Outlet />
        </main>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}
