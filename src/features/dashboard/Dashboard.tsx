import { useState, useEffect, useCallback, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { useNavigate } from "react-router-dom";
import {
  Users, Building2, Layers, ClipboardList, FileText, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Activity, Search, Download,
  TrendingUp, TrendingDown, Shield, FolderOpen, FileSignature,
  BarChart3, UserCheck, Briefcase, FileCheck, XCircle, PauseCircle,
  Loader2, ArrowUpRight, Eye,
} from "lucide-react";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/features/auth/AuthContext";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */
interface DashboardStats {
  totalUsers: number; totalAuditors: number; totalCabang: number; totalBagian: number;
  totalEngagement: number; totalPKPT: number; totalSuratTugas: number;
  totalKKA: number; totalTemuan: number; totalRTL: number; totalLaporan: number;
}
interface FindingStat { status: string; severity: string; branch_id: string | null; created_at: string; financial_impact: number | null; due_date: string | null; }
interface RTLStat { status: string; }
interface PKPTStat { status: string; tahun: string; }
interface EngagementStat { status: string; jenis_audit: string; }
interface TrailItem { id: string; module: string; action: string; doc_id: string; created_at: string; browser?: string; ip_address?: string; device?: string; users?: { display_name: string; email: string } | null; }
interface BranchItem { id: string; name: string; }

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════════ */
const T = {
  text:    "#0F172A",
  text2:   "#475569",
  muted:   "#94A3B8",
  border:  "#CBD5E1",
  bg:      "#F8FAFC",
  card:    "#FFFFFF",
  blue:    "#2563EB",
  teal:    "#0D9488",
  violet:  "#7C3AED",
  rose:    "#E11D48",
  amber:   "#D97706",
  green:   "#059669",
  cyan:    "#0891B2",
  pink:    "#DB2777",
};

const MN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

const TRAIL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  CREATE: { bg: "#DCFCE7", color: "#16A34A", label: "Buat" },
  UPDATE: { bg: "#FEF9C3", color: "#CA8A04", label: "Ubah" },
  DELETE: { bg: "#FEE2E2", color: "#DC2626", label: "Hapus" },
  LOGIN:  { bg: "#DBEAFE", color: "#2563EB", label: "Login" },
  UPLOAD: { bg: "#EDE9FE", color: "#7C3AED", label: "Upload" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   CSS ANIMATIONS (injected once)
   ═══════════════════════════════════════════════════════════════════════════ */
const ANIM_ID = "dashboard-animations";
if (typeof document !== "undefined" && !document.getElementById(ANIM_ID)) {
  const style = document.createElement("style");
  style.id = ANIM_ID;
  style.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes countUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.9); opacity: 0.7; }
      50%  { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .dash-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .dash-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.09);
      border-color: #94A3B8 !important;
    }
    .dash-btn {
      transition: all 0.18s ease;
    }
    .dash-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(0,0,0,0.08);
    }
    .trail-row {
      transition: background 0.15s ease;
    }
    .trail-row:hover {
      background: #F1F5F9 !important;
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER: AnimatedNumber — counts up from 0 to target
   ═══════════════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);
  return <>{display}</>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION WRAPPER — clean box with title + optional subtitle
   ═══════════════════════════════════════════════════════════════════════════ */
function Section({ title, subtitle, children, delay = 0, actions }: {
  title: string; subtitle?: string; children: React.ReactNode; delay?: number;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{
      background: T.card, borderRadius: 14, border: `2px solid ${T.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      padding: "22px 24px",
      animation: `fadeInUp 0.5s ease ${delay}s both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: subtitle ? 4 : 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h2>
        {actions}
      </div>
      {subtitle && <p style={{ fontSize: 12, color: T.muted, marginBottom: 18, marginTop: 0 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════════════════ */
function ProgressBar({ value, color = T.blue, height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <div style={{ background: "#F1F5F9", borderRadius: height, height, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(value, 100)}%`, height: "100%",
        background: color, borderRadius: height,
        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function Dashboard() {
  useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [trailSearch, setTrailSearch] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers:0, totalAuditors:0, totalCabang:0, totalBagian:0,
    totalEngagement:0, totalPKPT:0, totalSuratTugas:0,
    totalKKA:0, totalTemuan:0, totalRTL:0, totalLaporan:0,
  });
  const [findings,    setFindings]    = useState<FindingStat[]>([]);
  const [rtls,        setRTLs]        = useState<RTLStat[]>([]);
  const [pkpts,       setPKPTs]       = useState<PKPTStat[]>([]);
  const [engagements, setEngagements] = useState<EngagementStat[]>([]);
  const [trail,       setTrail]       = useState<TrailItem[]>([]);
  const [branches,    setBranches]    = useState<BranchItem[]>([]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabase.from("users").select("id,role_id").is("deleted_at", null),
        supabase.from("branches").select("id,name").is("deleted_at", null),
        supabase.from("departments").select("id").is("deleted_at", null),
        supabase.from("pkpt").select("id,status,tahun").is("deleted_at", null),
        supabase.from("surat_tugas").select("id,status").is("deleted_at", null),
        supabase.from("kka").select("id,status").is("deleted_at", null),
        supabase.from("findings").select("id,status,severity,branch_id,created_at,financial_impact,due_date").is("deleted_at", null),
        supabase.from("rtl").select("id,status").is("deleted_at", null),
        supabase.from("audit_reports").select("id").is("deleted_at", null),
        supabase.from("audit_trail").select("id,module,action,doc_id,created_at,browser,ip_address,device,users(display_name,email)").order("created_at", { ascending: false }).limit(100),
        supabase.from("audit_engagement").select("id,status,jenis_audit").is("deleted_at", null),
      ]);
      const get = (i: number) => results[i].status === "fulfilled" ? (results[i] as any).value.data || [] : [];
      const allUsers    = get(0);
      const allBranches = get(1);
      const findData    = get(6) as FindingStat[];
      const rtlData     = get(7) as RTLStat[];
      const pkptData    = get(3) as PKPTStat[];
      const engData     = get(10) as EngagementStat[];
      setBranches(allBranches);
      setFindings(findData);
      setRTLs(rtlData);
      setPKPTs(pkptData);
      setEngagements(engData);
      setTrail(get(9) as TrailItem[]);
      setStats({
        totalUsers: allUsers.length,
        totalAuditors: allUsers.filter((u: any) => ["auditor","ketua_tim","auditor_senior"].includes(u.role_id)).length,
        totalCabang: allBranches.length,
        totalBagian: get(2).length,
        totalEngagement: engData.length,
        totalPKPT: pkptData.length,
        totalSuratTugas: get(4).length,
        totalKKA: get(5).length,
        totalTemuan: findData.length,
        totalRTL: rtlData.length,
        totalLaporan: get(8).length,
      });
    } catch(e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Derived ──────────────────────────────────────────────────────────── */
  const openF    = findings.filter(f => f.status === "Open").length;
  const closedF  = findings.filter(f => f.status === "Closed").length;
  const highR    = findings.filter(f => f.severity === "High").length;
  const medR     = findings.filter(f => f.severity === "Medium").length;
  const lowR     = findings.filter(f => f.severity === "Low").length;
  const overdue  = findings.filter(f => f.due_date && new Date(f.due_date) < new Date() && f.status !== "Closed").length;
  const totalFin = findings.reduce((s, f) => s + (f.financial_impact || 0), 0);

  const rtlSelesai = rtls.filter(r => r.status === "Closed").length;
  const rtlPct  = rtls.length > 0 ? Math.round((rtlSelesai / rtls.length) * 100) : 0;
  const pkptSelesai = pkpts.filter(p => p.status === "Selesai").length;
  const pkptPct = pkpts.length > 0 ? Math.round((pkptSelesai / pkpts.length) * 100) : 0;
  const engSelesai = engagements.filter(e => e.status === "Completed").length;
  const engPct  = engagements.length > 0 ? Math.round((engSelesai / engagements.length) * 100) : 0;

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: MN[d.getMonth()], m: d.getMonth(), y: d.getFullYear() };
  });
  const findByMonth = last6.map(m => ({
    label: m.label,
    total:  findings.filter(f => { const d = new Date(f.created_at); return d.getMonth() === m.m && d.getFullYear() === m.y; }).length,
    closed: findings.filter(f => { const d = new Date(f.created_at); return d.getMonth() === m.m && d.getFullYear() === m.y && f.status === "Closed"; }).length,
  }));

  const sevData = [
    { name: "High",   value: highR, itemStyle: { color: "#F87171" } },
    { name: "Medium", value: medR,  itemStyle: { color: "#FBBF24" } },
    { name: "Low",    value: lowR,  itemStyle: { color: "#34D399" } },
  ].filter(d => d.value > 0);

  const engByStatus = ["Planning","Active","On Hold","Completed","Cancelled"].map(s => ({
    name: s, value: engagements.filter(e => e.status === s).length,
  }));

  const branchFind = branches
    .map(b => ({ name: b.name.length > 14 ? b.name.slice(0, 13) + "…" : b.name, value: findings.filter(f => f.branch_id === b.id).length }))
    .filter(b => b.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  const filteredTrail = trail.filter(t =>
    !trailSearch || (t.module + t.action + ((t.users as any)?.display_name || "") + t.doc_id).toLowerCase().includes(trailSearch.toLowerCase())
  );

  /* ── Chart configs ────────────────────────────────────────────────────── */
  const barOpt = {
    tooltip: { trigger: "axis" as const, backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC", fontSize: 12 } },
    grid: { left: 8, right: 8, bottom: 0, top: 30, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { fontSize: 11, color: T.muted }, data: ["Temuan","Closed"], itemWidth: 12, itemHeight: 8 },
    xAxis: { type: "category" as const, data: last6.map(m => m.label), axisLabel: { fontSize: 11, color: T.muted }, axisLine: { lineStyle: { color: T.border } }, axisTick: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { fontSize: 11, color: T.muted }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } }, minInterval: 1 },
    animationDuration: 1200,
    animationEasing: "cubicOut" as const,
    series: [
      { name: "Temuan", type: "bar" as const, barWidth: "30%", barGap: "20%", itemStyle: { borderRadius: [4,4,0,0], color: "#F87171" }, data: findByMonth.map(m => m.total) },
      { name: "Closed", type: "bar" as const, barWidth: "30%", itemStyle: { borderRadius: [4,4,0,0], color: "#34D399" }, data: findByMonth.map(m => m.closed) },
    ],
  };

  const sevOpt = {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 11, color: T.muted }, itemWidth: 10, itemHeight: 10 },
    animationDuration: 1200,
    series: [{
      name: "Severity", type: "pie" as const, radius: ["44%","68%"], center: ["50%","42%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { scaleSize: 8 },
      data: sevData.length > 0 ? sevData : [{ name: "No Data", value: 1, itemStyle: { color: "#F1F5F9" } }],
    }],
  };

  const engOpt = {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c}", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    color: ["#60A5FA","#34D399","#FBBF24","#A78BFA","#F87171"],
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 10, color: T.muted }, itemWidth: 10, itemHeight: 10 },
    animationDuration: 1200,
    series: [{
      name: "Status", type: "pie" as const, radius: ["42%","65%"], center: ["50%","42%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { scaleSize: 8 },
      data: engByStatus.some(e => e.value > 0) ? engByStatus : [{ name: "No Data", value: 1, itemStyle: { color: "#F1F5F9" } }],
    }],
  };

  const branchOpt = {
    tooltip: { trigger: "axis" as const, backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    grid: { left: 10, right: 24, bottom: 0, top: 6, containLabel: true },
    xAxis: { type: "value" as const, axisLabel: { fontSize: 11, color: T.muted }, splitLine: { lineStyle: { color: "#F1F5F9" } }, minInterval: 1 },
    yAxis: { type: "category" as const, data: branchFind.map(b => b.name), axisLabel: { fontSize: 11, color: T.text2 }, axisLine: { lineStyle: { color: T.border } } },
    animationDuration: 1200,
    series: [{ type: "bar" as const, barWidth: 14, itemStyle: { borderRadius: [0,4,4,0], color: "#60A5FA" }, data: branchFind.map(b => b.value), label: { show: true, position: "right" as const, fontSize: 11, color: T.muted } }],
  };

  /* ── Export ────────────────────────────────────────────────────────────── */
  const exportExcel = async () => {
    const { utils, writeFile } = await import("xlsx");
    const ws = utils.json_to_sheet([
      { Metric: "Total Users", Value: stats.totalUsers },
      { Metric: "Auditor", Value: stats.totalAuditors },
      { Metric: "PKPT", Value: stats.totalPKPT },
      { Metric: "KKA", Value: stats.totalKKA },
      { Metric: "Temuan", Value: stats.totalTemuan },
      { Metric: "Open", Value: openF },
      { Metric: "High Risk", Value: highR },
      { Metric: "RTL %", Value: `${rtlPct}%` },
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Dashboard");
    writeFile(wb, `Dashboard_SPI_${new Date().getFullYear()}.xlsx`);
  };

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "70vh", gap: 14,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: "#EFF6FF",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={22} color={T.blue} style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>Memuat data dashboard...</p>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        animation: "fadeInUp 0.4s ease both",
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.3px" }}>
            Dashboard
          </h1>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
            PERUMDA Tirta Kahuripan · Satuan Pengawas Internal
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dash-btn"
            onClick={() => fetchAll(true)} disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 36,
              padding: "0 16px", borderRadius: 9,
              border: `2px solid ${T.border}`, background: T.card,
              color: T.text2, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <button className="dash-btn"
            onClick={exportExcel}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 36,
              padding: "0 16px", borderRadius: 9,
              border: "2px solid #BBF7D0", background: "#F0FDF4",
              color: T.green, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
            }}
          >
            <Download size={13} />Export Excel
          </button>
        </div>
      </div>

      {/* ═══ KPI CARDS ════════════════════════════════════════════════════ */}
      <Section title="Ringkasan Utama" subtitle="Statistik penting sistem audit" delay={0.05}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { label: "Total Pengguna",  value: stats.totalUsers,  icon: Users,         color: T.blue,   bg: "#EFF6FF", to: "/settings" },
            { label: "Total Temuan",    value: stats.totalTemuan, icon: AlertTriangle, color: T.amber,  bg: "#FFFBEB", to: "/temuan" },
            { label: "Kertas Kerja",    value: stats.totalKKA,    icon: FolderOpen,    color: T.teal,   bg: "#F0FDFA", to: "/kka" },
            { label: "Laporan Audit",   value: stats.totalLaporan,icon: FileText,      color: T.violet, bg: "#F5F3FF", to: "/laporan" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="dash-card"
                onClick={() => navigate(c.to)}
                style={{
                  background: T.card, borderRadius: 12, border: `2px solid ${T.border}`,
                  padding: "18px 20px", cursor: "pointer",
                  animation: `fadeInUp 0.4s ease ${0.1 + i * 0.06}s both`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: c.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  <ArrowUpRight size={14} color={T.muted} />
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: "-1px", lineHeight: 1 }}>
                  <AnimatedNumber value={c.value} />
                </div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6, fontWeight: 500 }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ PROGRESS SECTION ════════════════════════════════════════════ */}
      <Section title="Progres Kegiatan" subtitle="Tingkat penyelesaian program kerja" delay={0.15}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "PKPT",         pct: pkptPct, color: T.blue,   done: pkptSelesai,  total: pkpts.length },
            { label: "Audit Engagement", pct: engPct, color: T.teal, done: engSelesai,   total: engagements.length },
            { label: "RTL",          pct: rtlPct,  color: T.violet, done: rtlSelesai,    total: rtls.length },
          ].map((item, i) => (
            <div key={item.label} style={{
              background: T.bg, borderRadius: 10, padding: "16px 18px",
              border: `1px solid #F1F5F9`,
              animation: `fadeInUp 0.4s ease ${0.2 + i * 0.06}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
                  <AnimatedNumber value={item.pct} />%
                </span>
              </div>
              <ProgressBar value={item.pct} color={item.color} />
              <p style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>{item.done} dari {item.total} selesai</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ MASTER DATA ROW ═════════════════════════════════════════════ */}
      <Section title="Data Master & Operasional" subtitle="Jumlah data dalam sistem" delay={0.25}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {[
            { label: "Auditor",     value: stats.totalAuditors,   icon: UserCheck,     color: T.cyan,   bg: "#ECFEFF", to: "/master-data/auditor" },
            { label: "Cabang",      value: stats.totalCabang,     icon: Building2,     color: T.violet, bg: "#F5F3FF", to: "/master-data/cabang" },
            { label: "Bagian",      value: stats.totalBagian,     icon: Layers,        color: T.amber,  bg: "#FFFBEB", to: "/master-data" },
            { label: "Engagement",  value: stats.totalEngagement, icon: Briefcase,     color: T.teal,   bg: "#F0FDFA", to: "/" },
            { label: "PKPT",        value: stats.totalPKPT,       icon: ClipboardList, color: T.blue,   bg: "#EFF6FF", to: "/pkpt" },
            { label: "Surat Tugas", value: stats.totalSuratTugas, icon: FileSignature, color: T.pink,   bg: "#FDF2F8", to: "/surat-tugas" },
            { label: "Total RTL",   value: stats.totalRTL,        icon: CheckCircle,   color: T.green,  bg: "#ECFDF5", to: "/temuan" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="dash-card"
                onClick={() => navigate(c.to)}
                style={{
                  background: c.bg, borderRadius: 10, padding: "14px 12px",
                  cursor: "pointer", border: `2px solid ${T.border}`,
                  animation: `scaleIn 0.35s ease ${0.3 + i * 0.04}s both`,
                }}
              >
                <Icon size={15} color={c.color} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, letterSpacing: "-0.5px" }}>
                  <AnimatedNumber value={c.value} />
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontWeight: 500 }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ TEMUAN ANALYTICS ════════════════════════════════════════════ */}
      <Section title="Analitik Temuan" subtitle="Rangkuman status & risiko temuan audit" delay={0.35}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Open",        value: openF,   icon: AlertTriangle, color: "#DC2626", bg: "#FFF5F5", bd: "#FECACA" },
            { label: "Closed",      value: closedF, icon: CheckCircle,   color: "#059669", bg: "#F0FDF4", bd: "#BBF7D0" },
            { label: "High Risk",   value: highR,   icon: TrendingUp,    color: "#DC2626", bg: "#FFF5F5", bd: "#FECACA" },
            { label: "Medium Risk", value: medR,    icon: BarChart3,     color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
            { label: "Low Risk",    value: lowR,    icon: TrendingDown,  color: "#059669", bg: "#F0FDF4", bd: "#BBF7D0" },
            { label: "Overdue",     value: overdue, icon: Clock,         color: "#B45309", bg: "#FFFBEB", bd: "#FDE68A" },
            { label: "Repeat Find", value: 0,       icon: RefreshCw,     color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
            { label: "Fin. Impact", value: `Rp ${(totalFin/1e6).toFixed(1)}M`, icon: BarChart3, color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="dash-card"
                onClick={() => navigate("/temuan")}
                style={{
                  background: c.bg, border: `2px solid ${c.bd}`, borderRadius: 10,
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer",
                  animation: `fadeInUp 0.35s ease ${0.4 + i * 0.04}s both`,
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 9, background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <Icon size={16} color={c.color} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color, lineHeight: 1 }}>
                    {typeof c.value === "number" ? <AnimatedNumber value={c.value} /> : c.value}
                  </div>
                  <div style={{ fontSize: 11, color: T.text2, marginTop: 3, fontWeight: 500 }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ CHARTS ══════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 16 }}>
        <Section title="Tren Temuan 6 Bulan" subtitle="Temuan baru vs closed per bulan" delay={0.45}>
          <ReactECharts option={barOpt} style={{ height: 230 }} />
        </Section>
        <Section title="Status Audit Engagement" subtitle="Distribusi status audit berjalan" delay={0.5}>
          <ReactECharts option={engOpt} style={{ height: 230 }} />
        </Section>
        <Section title="Severity Temuan" subtitle="Distribusi tingkat risiko" delay={0.55}>
          <ReactECharts option={sevOpt} style={{ height: 230 }} />
        </Section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Section title="Temuan per Cabang" subtitle="Top 5 cabang dengan temuan terbanyak" delay={0.6}>
          {branchFind.length > 0
            ? <ReactECharts option={branchOpt} style={{ height: 190 }} />
            : <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13 }}>Belum ada data</div>
          }
        </Section>
        <Section title="KPI Progress" delay={0.65}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { label: "PKPT Selesai",  pct: pkptPct, color: T.blue,   count: `${pkptSelesai}/${pkpts.length}` },
              { label: "Audit Selesai", pct: engPct,  color: T.teal,   count: `${engSelesai}/${engagements.length}` },
              { label: "RTL Selesai",   pct: rtlPct,  color: T.violet, count: `${rtlSelesai}/${rtls.length}` },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: T.text2 }}>{item.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: T.muted }}>{item.count}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>
                      <AnimatedNumber value={item.pct} />%
                    </span>
                  </div>
                </div>
                <ProgressBar value={item.pct} color={item.color} />
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ═══ RTL STATUS ══════════════════════════════════════════════════ */}
      <Section title="Tindak Lanjut Rekomendasi (RTL)" subtitle="Status penyelesaian rekomendasi audit" delay={0.7}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {[
            { label: "Belum Ditindaklanjuti", value: rtls.filter(r => r.status === "Draft").length,                icon: PauseCircle, color: "#64748B", bg: "#F8FAFC", bd: "#E2E8F0" },
            { label: "Sedang Diproses",       value: rtls.filter(r => r.status === "In Progress").length,          icon: Clock,       color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
            { label: "Menunggu Verifikasi",   value: rtls.filter(r => r.status === "Pending Verification").length, icon: Activity,    color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
            { label: "Ditolak",               value: rtls.filter(r => r.status === "Rejected").length,             icon: XCircle,     color: "#DC2626", bg: "#FFF5F5", bd: "#FECACA" },
            { label: "Disetujui",             value: rtls.filter(r => r.status === "Approved").length,             icon: CheckCircle, color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
            { label: "Selesai",               value: rtlSelesai,                                                     icon: CheckCircle, color: "#059669", bg: "#F0FDF4", bd: "#BBF7D0" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="dash-card"
                onClick={() => navigate("/temuan")}
                style={{
                  background: c.bg, border: `2px solid ${c.bd}`, borderRadius: 10,
                  padding: "14px", cursor: "pointer",
                  animation: `scaleIn 0.35s ease ${0.75 + i * 0.04}s both`,
                }}
              >
                <Icon size={15} color={c.color} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1 }}>
                  <AnimatedNumber value={c.value} />
                </div>
                <div style={{ fontSize: 10.5, color: T.muted, marginTop: 6, fontWeight: 500, lineHeight: 1.4 }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ QUICK ACTIONS ═══════════════════════════════════════════════ */}
      <Section title="Aksi Cepat" subtitle="Pintasan ke halaman yang sering digunakan" delay={0.8}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Tambah PKPT",      icon: ClipboardList, to: "/pkpt" },
            { label: "Surat Tugas",      icon: FileSignature,  to: "/surat-tugas" },
            { label: "Input KKA",        icon: FolderOpen,     to: "/kka" },
            { label: "Tambah Temuan",    icon: AlertTriangle,  to: "/temuan" },
            { label: "Generate Laporan", icon: FileCheck,      to: "/laporan" },
            { label: "Tambah Auditor",   icon: UserCheck,      to: "/master-data/auditor" },
            { label: "Tambah Cabang",    icon: Building2,      to: "/master-data/cabang" },
            { label: "Tambah Pegawai",   icon: Briefcase,      to: "/master-data/pegawai" },
            { label: "Manajemen User",   icon: Users,          to: "/settings" },
            { label: "Pengaturan Role",  icon: Shield,         to: "/settings" },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <button key={a.label} className="dash-btn"
                onClick={() => navigate(a.to)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 14px", borderRadius: 9,
                  border: `2px solid ${T.border}`, background: T.bg,
                  color: T.text2, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  animation: `fadeIn 0.3s ease ${0.85 + i * 0.03}s both`,
                }}
              >
                <Icon size={13} />{a.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ═══ AUDIT TRAIL ═════════════════════════════════════════════════ */}
      <Section title="Audit Trail" delay={0.9}
        subtitle="Log aktivitas terbaru dalam sistem"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20,
              background: T.bg, color: T.muted, border: `1px solid ${T.border}`, fontWeight: 600,
            }}>
              {filteredTrail.length} record
            </span>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.muted }} />
              <input
                value={trailSearch} onChange={e => setTrailSearch(e.target.value)}
                placeholder="Cari user, aksi, modul..."
                style={{
                  paddingLeft: 30, paddingRight: 12, height: 34, borderRadius: 8,
                  border: `2px solid ${T.border}`, fontSize: 12, color: T.text,
                  outline: "none", width: 220, background: T.bg,
                }}
              />
            </div>
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {["Waktu","User","Modul","Aksi","Dokumen","IP"].map(h => (
                  <th key={h} style={{
                    fontSize: 10.5, fontWeight: 700, color: T.muted, padding: "8px 10px",
                    textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrail.slice(0, 15).map((t, i) => {
                const ac = TRAIL_BADGE[t.action] || { bg: T.bg, color: T.muted, label: t.action };
                const u = t.users as any;
                return (
                  <tr key={t.id} className="trail-row"
                    style={{
                      borderBottom: `1px solid #F1F5F9`,
                      animation: `slideInLeft 0.3s ease ${0.95 + i * 0.02}s both`,
                    }}
                  >
                    <td style={{ fontSize: 11, color: T.muted, padding: "10px", whiteSpace: "nowrap" }}>
                      {new Date(t.created_at).toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>{u?.display_name || "System"}</div>
                      <div style={{ fontSize: 10.5, color: T.muted }}>{u?.email || ""}</div>
                    </td>
                    <td style={{ fontSize: 12, color: T.text2, padding: "10px" }}>{t.module}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "3px 9px", borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                        background: ac.bg, color: ac.color,
                      }}>{ac.label || t.action}</span>
                    </td>
                    <td style={{
                      fontSize: 11, color: T.muted, padding: "10px",
                      fontFamily: "monospace", maxWidth: 120,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{t.doc_id}</td>
                    <td style={{ fontSize: 11, color: T.muted, padding: "10px" }}>{t.ip_address || "—"}</td>
                  </tr>
                );
              })}
              {filteredTrail.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: T.muted, fontSize: 13 }}>
                  Belum ada data audit trail.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredTrail.length > 15 && (
          <button className="dash-btn"
            onClick={() => navigate("/settings")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              margin: "16px auto 0", fontSize: 12.5, color: T.blue,
              background: "#EFF6FF", border: `2px solid #BFDBFE`,
              borderRadius: 8, padding: "8px 18px",
              cursor: "pointer", fontWeight: 600,
            }}
          >
            <Eye size={14} /> Lihat semua {filteredTrail.length} record
          </button>
        )}
      </Section>

    </div>
  );
}
