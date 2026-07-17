import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Database, FileText, AlertTriangle, ClipboardList,
  LogOut, Menu, Bell, Settings, ChevronRight, FileSignature, FolderOpen,
  Search, X, Users, Building2, Shield, BookOpen, UserCheck, Briefcase,
  FileCheck, BarChart3, Layers, FolderKanban, ScrollText, ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { AIChatWidget } from "../components/AIChatWidget";

// ─── All searchable items across the entire app ─────────────────────────────
const ALL_SEARCH_ITEMS = [
  // Navigation
  { label: "Dashboard", desc: "Halaman utama & statistik", to: "/", icon: LayoutDashboard, category: "Halaman" },
  { label: "Master Data", desc: "Kelola data utama sistem", to: "/master-data", icon: Database, category: "Halaman" },
  { label: "PKPT", desc: "Program Kerja Pemeriksaan Tahunan", to: "/pkpt", icon: ClipboardList, category: "Halaman" },
  { label: "Surat Tugas", desc: "Manajemen surat penugasan audit", to: "/surat-tugas", icon: FileSignature, category: "Halaman" },
  { label: "Kertas Kerja (KKA)", desc: "Kertas kerja pemeriksaan", to: "/kka", icon: FolderOpen, category: "Halaman" },
  { label: "Temuan 5C", desc: "Manajemen temuan audit", to: "/temuan", icon: AlertTriangle, category: "Halaman" },
  { label: "Laporan Audit", desc: "Laporan hasil pemeriksaan", to: "/laporan", icon: FileText, category: "Halaman" },
  { label: "Pengaturan", desc: "Konfigurasi akun & sistem", to: "/settings", icon: Settings, category: "Halaman" },
  // Master Data sub-pages
  { label: "Data Pegawai", desc: "Kelola data pegawai PDAM", to: "/master-data/pegawai", icon: Users, category: "Master Data" },
  { label: "Data Auditor", desc: "Kelola data auditor internal", to: "/master-data/auditor", icon: UserCheck, category: "Master Data" },
  { label: "Data Cabang", desc: "Kelola data cabang PDAM", to: "/master-data/cabang", icon: Building2, category: "Master Data" },
  { label: "Data Bagian", desc: "Kelola data departemen/bagian", to: "/master-data/bagian", icon: Layers, category: "Master Data" },
  { label: "Data SOP", desc: "Standar Operasional Prosedur", to: "/master-data/sop", icon: BookOpen, category: "Master Data" },
  { label: "Data Risiko", desc: "Register risiko organisasi", to: "/master-data/risiko", icon: Shield, category: "Master Data" },
  // Settings sub-pages
  { label: "Manajemen Role", desc: "Kelola role & hak akses", to: "/settings/roles", icon: FolderKanban, category: "Pengaturan" },
  { label: "Audit Trail", desc: "Log aktivitas pengguna sistem", to: "/settings", icon: ScrollText, category: "Pengaturan" },
  { label: "Manajemen User", desc: "Kelola pengguna aplikasi", to: "/settings", icon: Users, category: "Pengaturan" },
  // Quick actions
  { label: "Tambah PKPT Baru", desc: "Buat program kerja baru", to: "/pkpt", icon: ClipboardList, category: "Aksi Cepat" },
  { label: "Buat Surat Tugas", desc: "Buat surat penugasan audit", to: "/surat-tugas", icon: FileSignature, category: "Aksi Cepat" },
  { label: "Tambah Temuan", desc: "Catat temuan audit baru", to: "/temuan", icon: AlertTriangle, category: "Aksi Cepat" },
  { label: "Generate Laporan", desc: "Buat laporan audit baru", to: "/laporan", icon: FileCheck, category: "Aksi Cepat" },
  { label: "Input KKA", desc: "Input kertas kerja audit", to: "/kka", icon: FolderOpen, category: "Aksi Cepat" },
  { label: "Lihat Statistik", desc: "Statistik dan grafik audit", to: "/", icon: BarChart3, category: "Aksi Cepat" },
  { label: "Tambah Cabang", desc: "Daftarkan cabang baru", to: "/master-data/cabang", icon: Building2, category: "Aksi Cepat" },
  { label: "Tambah Auditor", desc: "Daftarkan auditor baru", to: "/master-data/auditor", icon: UserCheck, category: "Aksi Cepat" },
  { label: "Tambah Pegawai", desc: "Daftarkan pegawai baru", to: "/master-data/pegawai", icon: Briefcase, category: "Aksi Cepat" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Halaman": "#2563EB",
  "Master Data": "#0D9488",
  "Pengaturan": "#7C3AED",
  "Aksi Cepat": "#D97706",
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { profile, role, hasPermission, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Global keyboard shortcut: Ctrl+K or /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else { setSearchQuery(""); setSelectedIndex(0); }
  }, [searchOpen]);

  const filteredItems = searchQuery.trim()
    ? ALL_SEARCH_ITEMS.filter(
        item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_SEARCH_ITEMS.slice(0, 8);

  const handleSearchSelect = (to: string) => {
    navigate(to);
    setSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filteredItems[selectedIndex]) handleSearchSelect(filteredItems[selectedIndex].to);
  };

  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

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
        ...(hasPermission("kka.view") ? [{ to: "/kka", icon: FolderOpen, label: "Kertas Kerja" }] : []),
        ...(hasPermission("finding.view") ? [{ to: "/temuan", icon: AlertTriangle, label: "Temuan 5C" }] : []),
      ],
    },
    {
      group: "Laporan & Sistem",
      items: [
        ...(hasPermission("report.view") ? [{ to: "/laporan", icon: FileText, label: "Laporan Audit" }] : []),
        { to: "/settings", icon: Settings, label: "Pengaturan" },
      ],
    },
  ].filter(g => g.items.length > 0);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const currentPage = NAV_ITEMS.flatMap((g) => g.items).find((i) => isActive(i.to));

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const SIDEBAR_WIDTH = 248;
  const SIDEBAR_COLLAPSED = 64;

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", overflow: "hidden", background: "#F8FAFC" }}>

      {/* ─── GLOBAL SEARCH OVERLAY ──────────────────────────────── */}
      {searchOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: "12vh",
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 600,
              background: "white",
              borderRadius: 16,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px",
              borderBottom: "1px solid #F1F5F9",
            }}>
              <Search size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari halaman, fitur, atau aksi..."
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 15, color: "#0F172A", background: "transparent",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <kbd style={{
                  padding: "2px 7px", borderRadius: 5,
                  background: "#F1F5F9", border: "1px solid #E2E8F0",
                  fontSize: 11, color: "#64748B", fontFamily: "inherit",
                }}>ESC</kbd>
                <button
                  onClick={() => setSearchOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                  Tidak ada hasil untuk "<strong>{searchQuery}</strong>"
                </div>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    const catColor = CATEGORY_COLORS[item.category] || "#64748B";
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={`${item.to}-${item.label}`}
                        onClick={() => handleSearchSelect(item.to)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 18px",
                          cursor: "pointer",
                          background: isSelected ? "#F8FAFC" : "transparent",
                          borderLeft: isSelected ? `3px solid ${catColor}` : "3px solid transparent",
                          transition: "all 0.1s",
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `${catColor}15`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={16} color={catColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>{item.desc}</div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px",
                          borderRadius: 6, background: `${catColor}15`, color: catColor,
                          flexShrink: 0,
                        }}>{item.category}</span>
                        {isSelected && <ChevronRight size={14} color="#94A3B8" style={{ flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div style={{
              padding: "10px 18px",
              borderTop: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", gap: 16,
              background: "#FAFAFA",
            }}>
              {[
                { key: "↑↓", label: "Navigasi" },
                { key: "Enter", label: "Buka" },
                { key: "ESC", label: "Tutup" },
              ].map(h => (
                <div key={h.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94A3B8" }}>
                  <kbd style={{ padding: "1px 6px", borderRadius: 4, background: "#F1F5F9", border: "1px solid #E2E8F0", fontSize: 10, color: "#64748B" }}>{h.key}</kbd>
                  {h.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          minWidth: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          background: "#1E293B",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          zIndex: 30,
        }}
      >
        {/* ── Brand */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 16px", height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "white", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0, overflow: "hidden", padding: 3,
          }}>
            <img src="/PdamLogo.png" alt="PDAM" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap", overflow: "hidden" }}>
            <p style={{ fontWeight: 700, color: "#F8FAFC", fontSize: 14, lineHeight: 1.2 }}>Smart Audit SPI</p>
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>Tirta Kahuripan</p>
          </div>
        </div>

        {/* ── Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 0" }}>
          {NAV_ITEMS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: gi < NAV_ITEMS.length - 1 ? 4 : 0 }}>
              {sidebarOpen && (
                <div style={{ padding: "8px 16px 4px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569" }}>
                    {group.group}
                  </span>
                </div>
              )}
              {!sidebarOpen && <div style={{ height: 8 }} />}

              {group.items.map(({ to, icon: Icon, label }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    title={!sidebarOpen ? label : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      margin: "1px 8px",
                      padding: sidebarOpen ? "8px 12px" : "8px 0",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      borderRadius: 8, textDecoration: "none",
                      background: active ? "#2563EB" : "transparent",
                      color: active ? "#FFFFFF" : "#94A3B8",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLElement).style.color = "#E2E8F0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                      }
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }} />
                    {sidebarOpen && (
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: "nowrap", flex: 1 }}>
                        {label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── User Area */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 8px", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            borderRadius: 8, padding: "8px 10px", marginBottom: 6,
            background: "rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}>
            <div style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
              background: "#2563EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white",
            }}>
              {initials}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile?.displayName || "User"}
                </p>
                <p style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                  {role?.name || "Viewer"}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: 8, padding: "7px 10px", borderRadius: 8,
              fontSize: 12.5, fontWeight: 500,
              border: "none", cursor: "pointer",
              color: "#64748B", background: "transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#64748B";
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
        <header style={{
          flexShrink: 0, display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px", height: 60,
          background: "white",
          borderBottom: "1px solid #E2E8F0",
        }}>
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: 7, borderRadius: 7, border: "none", cursor: "pointer",
                color: "#64748B", background: "transparent", display: "flex", alignItems: "center",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Menu size={17} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <span style={{ color: "#94A3B8" }}>SPI</span>
              <ChevronRight size={12} style={{ color: "#CBD5E1" }} />
              <span style={{ fontWeight: 600, color: "#0F172A" }}>{currentPage?.label || "Pengaturan"}</span>
            </div>
          </div>

          {/* Center - Global Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              height: 36, padding: "0 14px", borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#94A3B8", fontSize: 13,
              cursor: "pointer",
              minWidth: 240,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#CBD5E1";
              (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0";
              (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC";
            }}
          >
            <Search size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>Cari halaman atau fitur...</span>
            <kbd style={{
              padding: "1px 6px", borderRadius: 5,
              background: "white", border: "1px solid #E2E8F0",
              fontSize: 10, color: "#94A3B8", fontFamily: "inherit",
            }}>Ctrl K</kbd>
          </button>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              style={{
                position: "relative", padding: 7, borderRadius: 7,
                border: "none", cursor: "pointer", color: "#64748B",
                background: "transparent", display: "flex", alignItems: "center",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Bell size={16} />
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 6, height: 6, background: "#EF4444", borderRadius: "50%",
                border: "1.5px solid white",
              }} />
            </button>

            <div style={{ width: 1, height: 18, background: "#E2E8F0", margin: "0 2px" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#2563EB",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.2 }}>
                  {profile?.displayName || "User"}
                </p>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
                  {role?.name || "Viewer"}
                </p>
              </div>
              <ChevronDown size={13} color="#94A3B8" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24, background: "#F8FAFC" }}>
          <Outlet />
        </main>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}
