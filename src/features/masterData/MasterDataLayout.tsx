import { Outlet, NavLink, Navigate } from "react-router-dom";
import { GitBranch, Layers, Users, ShieldCheck, FileCode, AlertOctagon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const ALL_NAV_ITEMS = [
  { name: "Cabang", path: "/master-data/cabang", icon: GitBranch, permission: "master.view" },
  { name: "Bagian", path: "/master-data/bagian", icon: Layers, permission: "master.view" },
  { name: "Pegawai", path: "/master-data/pegawai", icon: Users, permission: "master.view" },
  { name: "Auditor", path: "/master-data/auditor", icon: ShieldCheck, permission: "master.view" },
  { name: "SOP & Peraturan", path: "/master-data/sop", icon: FileCode, permission: "master.view" },
  { name: "Risiko", path: "/master-data/risiko", icon: AlertOctagon, permission: "master.view" },
  { name: "Pengguna", path: "/master-data/pengguna", icon: Users, permission: "user.view" },
];

export function MasterDataLayout() {
  const { hasPermission } = useAuth();
  const navItems = ALL_NAV_ITEMS.filter((item) => hasPermission(item.permission));

  // If no items available at all, redirect (shouldn't happen because PermissionRoute already guards)
  if (navItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div className="rounded-2xl text-white relative overflow-hidden"
        style={{
          padding: 24,
          background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
          boxShadow: "0 4px 20px rgba(12,74,110,0.18)",
        }}
      >
        <div style={{ position: "absolute", right: -32, top: -32, width: 128, height: 128, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 32, bottom: -24, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", zIndex: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Master Data</h2>
          <p style={{ color: "#BAE6FD", fontSize: 14, margin: "4px 0 0" }}>Kelola data referensi utama sistem audit.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Sidebar Navigation */}
        <aside style={{ width: 230, flexShrink: 0 }}>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              padding: 12,
              boxShadow: "0 2px 12px rgba(12,74,110,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    borderRadius: 10,
                    transition: "all 0.15s",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    color: isActive ? "white" : "#64748B",
                    background: isActive ? "linear-gradient(135deg, #0EA5E9, #0284C7)" : "transparent",
                    boxShadow: isActive ? "0 2px 8px rgba(3,105,161,0.25)" : "none",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: isActive ? "#BAE6FD" : "#94A3B8",
                          transition: "color 0.15s"
                        }}
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Content Panel */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            padding: 32,
            boxShadow: "0 2px 12px rgba(12,74,110,0.06)",
            minWidth: 0
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
