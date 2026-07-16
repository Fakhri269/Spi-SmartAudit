import { useState, useEffect, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { useNavigate } from "react-router-dom";
import {
  Users, Building2, Layers, ClipboardList, FileText, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Activity, Search, Download,
  Plus, TrendingUp, TrendingDown, Shield, BookOpen, FolderOpen,
  FileSignature, BarChart3, Zap, Calendar,
  UserCheck, Briefcase, FileCheck, XCircle, PauseCircle,
  Filter, Loader2,
} from "lucide-react";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/features/auth/AuthContext";

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

// ── Design Tokens ────────────────────────────────────────────────────────
const COLORS = {
  navy:    "#0F1B2D",
  navyMid: "#162235",
  blue:    "#1E6FCC",
  cyan:    "#06B6D4",
  teal:    "#0D9488",
  violet:  "#7C3AED",
  rose:    "#E11D48",
  amber:   "#D97706",
  green:   "#059669",
  slate:   "#64748B",
  border:  "#E8EDF5",
  bg:      "#F5F7FB",
  card:    "#FFFFFF",
  text:    "#0F172A",
  muted:   "#94A3B8",
};

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: COLORS.card,
  borderRadius: 20,
  border: `1px solid ${COLORS.border}`,
  boxShadow: "0 2px 12px rgba(15,27,45,0.06)",
  padding: 24,
  ...extra,
});

const AC: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: "#D1FAE5", color: "#059669" },
  UPDATE: { bg: "#FEF3C7", color: "#D97706" },
  DELETE: { bg: "#FEE2E2", color: "#DC2626" },
  LOGIN:  { bg: "#DBEAFE", color: "#2563EB" },
  UPLOAD: { bg: "#EDE9FE", color: "#7C3AED" },
};

const MN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

export function Dashboard() {
  useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [trailSearch, setTrailSearch] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers:0, totalAuditors:0, totalCabang:0, totalBagian:0,
    totalEngagement:0, totalPKPT:0, totalSuratTugas:0,
    totalKKA:0, totalTemuan:0, totalRTL:0, totalLaporan:0,
  });
  const [findings, setFindings] = useState<FindingStat[]>([]);
  const [rtls, setRTLs] = useState<RTLStat[]>([]);
  const [pkpts, setPKPTs] = useState<PKPTStat[]>([]);
  const [engagements, setEngagements] = useState<EngagementStat[]>([]);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);

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
      const allUsers = get(0);
      const allBranches = get(1);
      const findData = get(6) as FindingStat[];
      const rtlData = get(7) as RTLStat[];
      const pkptData = get(3) as PKPTStat[];
      const engData = get(10) as EngagementStat[];
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

  // ── Derived values ──────────────────────────────────────────────────────
  const openF = findings.filter(f => f.status === "Open").length;
  const closedF = findings.filter(f => f.status === "Closed").length;
  const highR = findings.filter(f => f.severity === "High").length;
  const medR = findings.filter(f => f.severity === "Medium").length;
  const lowR = findings.filter(f => f.severity === "Low").length;
  const overdue = findings.filter(f => f.due_date && new Date(f.due_date) < new Date() && f.status !== "Closed").length;
  const totalFin = findings.reduce((s, f) => s + (f.financial_impact || 0), 0);
  const rtlBelum = rtls.filter(r => r.status === "Draft").length;
  const rtlProses = rtls.filter(r => r.status === "In Progress").length;
  const rtlVerif = rtls.filter(r => r.status === "Pending Verification").length;
  const rtlDitolak = rtls.filter(r => r.status === "Rejected").length;
  const rtlDisetujui = rtls.filter(r => r.status === "Approved").length;
  const rtlSelesai = rtls.filter(r => r.status === "Closed").length;
  const rtlPct = rtls.length > 0 ? Math.round((rtlSelesai / rtls.length) * 100) : 0;
  const pkptPct = pkpts.length > 0 ? Math.round((pkpts.filter(p => p.status === "Selesai").length / pkpts.length) * 100) : 0;
  const engPct = engagements.length > 0 ? Math.round((engagements.filter(e => e.status === "Completed").length / engagements.length) * 100) : 0;

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: MN[d.getMonth()], m: d.getMonth(), y: d.getFullYear() };
  });

  const findByMonth = last6.map(m => ({
    label: m.label,
    total: findings.filter(f => { const d = new Date(f.created_at); return d.getMonth() === m.m && d.getFullYear() === m.y; }).length,
    closed: findings.filter(f => { const d = new Date(f.created_at); return d.getMonth() === m.m && d.getFullYear() === m.y && f.status === "Closed"; }).length,
  }));

  const sevData = [
    { name: "High", value: highR, itemStyle: { color: "#E11D48" } },
    { name: "Medium", value: medR, itemStyle: { color: "#F59E0B" } },
    { name: "Low", value: lowR, itemStyle: { color: "#10B981" } },
  ].filter(d => d.value > 0);

  const engByStatus = ["Planning","Active","On Hold","Completed","Cancelled"].map(s => ({
    name: s, value: engagements.filter(e => e.status === s).length,
  }));

  const branchFind = branches
    .map(b => ({ name: b.name.length > 14 ? b.name.slice(0, 14) + "..." : b.name, value: findings.filter(f => f.branch_id === b.id).length }))
    .filter(b => b.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  const filteredTrail = trail.filter(t =>
    !trailSearch || (t.module + t.action + ((t.users as any)?.display_name || "") + t.doc_id).toLowerCase().includes(trailSearch.toLowerCase())
  );

  // ── ECharts Options ─────────────────────────────────────────────────────
  const barOpt = {
    tooltip: { trigger: "axis", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC", fontSize: 12 } },
    grid: { left: 10, right: 10, bottom: 0, top: 32, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { fontSize: 11, color: COLORS.slate }, data: ["Temuan","Closed"] },
    xAxis: { type: "category", data: last6.map(m => m.label), axisLabel: { fontSize: 11, color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.border } } },
    yAxis: { type: "value", axisLabel: { fontSize: 11, color: COLORS.muted }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } }, minInterval: 1 },
    series: [
      { name: "Temuan", type: "bar", barWidth: "32%", itemStyle: { borderRadius: [6,6,0,0], color: { type:"linear",x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:"#FB7185"},{offset:1,color:"#E11D48"}] } }, data: findByMonth.map(m => m.total) },
      { name: "Closed", type: "bar", barWidth: "32%", itemStyle: { borderRadius: [6,6,0,0], color: { type:"linear",x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:"#34D399"},{offset:1,color:"#059669"}] } }, data: findByMonth.map(m => m.closed) },
    ],
  };

  const sevOpt = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 11, color: COLORS.slate } },
    series: [{
      name: "Severity", type: "pie", radius: ["44%","70%"], center: ["50%","44%"],
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
      data: sevData.length > 0 ? sevData : [{ name: "No Data", value: 1, itemStyle: { color: COLORS.border } }],
    }],
  };

  const engOpt = {
    tooltip: { trigger: "item", formatter: "{b}: {c}", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    color: ["#3B82F6","#06B6D4","#F59E0B","#10B981","#E11D48"],
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 10, color: COLORS.slate } },
    series: [{
      name: "Status Audit", type: "pie", radius: ["42%","67%"], center: ["50%","42%"],
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      data: engByStatus.some(e => e.value > 0) ? engByStatus : [{ name: "No Data", value: 1, itemStyle: { color: COLORS.border } }],
    }],
  };

  const branchOpt = {
    tooltip: { trigger: "axis", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    grid: { left: 10, right: 30, bottom: 0, top: 10, containLabel: true },
    xAxis: { type: "value", axisLabel: { fontSize: 11, color: COLORS.muted }, splitLine: { lineStyle: { color: "#F1F5F9" } }, minInterval: 1 },
    yAxis: { type: "category", data: branchFind.map(b => b.name), axisLabel: { fontSize: 11, color: "#475569" }, axisLine: { lineStyle: { color: COLORS.border } } },
    series: [{ type: "bar", barWidth: 14, itemStyle: { borderRadius: [0,6,6,0], color: { type:"linear",x:0,y:0,x2:1,y2:0,colorStops:[{offset:0,color:"#1E6FCC"},{offset:1,color:"#06B6D4"}] } }, data: branchFind.map(b => b.value) }],
  };

  const gaugeOpt = {
    series: [{ type: "gauge", radius: "92%", startAngle: 200, endAngle: -20, min: 0, max: 100,
      axisLine: { lineStyle: { width: 18, color: [[rtlPct / 100, "#0D9488"],[1, "#E8EDF5"]] } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false },
      detail: { formatter: "{value}%", fontSize: 26, fontWeight: "bold", color: COLORS.text, offsetCenter: [0,"10%"] },
      title: { show: true, offsetCenter: [0,"32%"], fontSize: 11, color: COLORS.muted },
      data: [{ value: rtlPct, name: "RTL Selesai" }],
    }],
  };

  const kpiOpt = {
    tooltip: { trigger: "axis", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    grid: { left: 10, right: 50, bottom: 0, top: 10, containLabel: true },
    xAxis: { type: "value", max: 100, axisLabel: { fontSize: 11, color: COLORS.muted, formatter: "{value}%" }, splitLine: { lineStyle: { color: "#F1F5F9" } } },
    yAxis: { type: "category", data: ["PKPT","Audit","RTL"], axisLabel: { fontSize: 11, color: "#475569" }, axisLine: { lineStyle: { color: COLORS.border } } },
    series: [{ type: "bar", barWidth: 20,
      itemStyle: { borderRadius: [0,6,6,0], color: (p: any) => ["#1E6FCC","#0D9488","#7C3AED"][p.dataIndex] },
      data: [pkptPct, engPct, rtlPct],
      label: { show: true, position: "right", formatter: "{c}%", fontSize: 11, color: COLORS.slate },
    }],
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const exportExcel = async () => {
    const { utils, writeFile } = await import("xlsx");
    const ws = utils.json_to_sheet([
      { Metric: "Total Users", Value: stats.totalUsers },
      { Metric: "Total Auditor", Value: stats.totalAuditors },
      { Metric: "Total Cabang", Value: stats.totalCabang },
      { Metric: "Total PKPT", Value: stats.totalPKPT },
      { Metric: "Total KKA", Value: stats.totalKKA },
      { Metric: "Total Temuan", Value: stats.totalTemuan },
      { Metric: "Open Findings", Value: openF },
      { Metric: "Closed Findings", Value: closedF },
      { Metric: "High Risk", Value: highR },
      { Metric: "Total RTL", Value: stats.totalRTL },
      { Metric: "RTL Selesai (%)", Value: rtlPct },
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Dashboard");
    writeFile(wb, `Dashboard_SPI_${filterYear}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Dashboard SPI SmartAudit", 14, 20);
    doc.setFontSize(11); doc.text(`Tahun: ${filterYear} | Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 30);
    autoTable(doc, { startY: 38, head: [["Metrik","Nilai"]], body: [
      ["Total Users", stats.totalUsers], ["Total Auditor", stats.totalAuditors],
      ["Total Temuan", stats.totalTemuan], ["Open Findings", openF],
      ["High Risk", highR], ["Progress RTL", `${rtlPct}%`],
    ]});
    doc.save(`Dashboard_SPI_${filterYear}.pdf`);
  };

  const QUICK = [
    { label: "Tambah User", icon: Users, color: "#1E6FCC", to: "/settings" },
    { label: "Tambah PKPT", icon: ClipboardList, color: "#0D9488", to: "/pkpt" },
    { label: "Surat Tugas", icon: FileSignature, color: "#7C3AED", to: "/surat-tugas" },
    { label: "Tambah KKA", icon: FolderOpen, color: "#0891B2", to: "/kka" },
    { label: "Tambah Temuan", icon: AlertTriangle, color: "#D97706", to: "/temuan" },
    { label: "Tambah RTL", icon: CheckCircle, color: "#059669", to: "/temuan" },
    { label: "Tambah SOP", icon: BookOpen, color: "#DB2777", to: "/master-data" },
    { label: "Tambah Cabang", icon: Building2, color: "#9333EA", to: "/master-data/cabang" },
    { label: "Tambah Pegawai", icon: Briefcase, color: "#1E6FCC", to: "/master-data/pegawai" },
    { label: "Tambah Auditor", icon: UserCheck, color: "#0D9488", to: "/master-data/auditor" },
    { label: "Generate Laporan", icon: FileCheck, color: "#DC2626", to: "/laporan" },
    { label: "Master Data", icon: Layers, color: "#64748B", to: "/master-data" },
    { label: "Audit Trail", icon: Shield, color: "#475569", to: "/settings" },
  ];

  // ── Quick Stats config ──────────────────────────────────────────────────
  const STAT_CARDS = [
    { label: "Total User",    value: stats.totalUsers,      icon: Users,         grad: "linear-gradient(135deg,#1E40AF,#3B82F6)", to: "/settings" },
    { label: "Auditor",       value: stats.totalAuditors,   icon: UserCheck,     grad: "linear-gradient(135deg,#0E7490,#06B6D4)", to: "/master-data/auditor" },
    { label: "Cabang",        value: stats.totalCabang,     icon: Building2,     grad: "linear-gradient(135deg,#6D28D9,#8B5CF6)", to: "/master-data/cabang" },
    { label: "Bagian",        value: stats.totalBagian,     icon: Layers,        grad: "linear-gradient(135deg,#7C3AED,#A855F7)", to: "/master-data" },
    { label: "Engagement",    value: stats.totalEngagement, icon: Briefcase,     grad: "linear-gradient(135deg,#0F766E,#0D9488)", to: "/" },
    { label: "Total PKPT",    value: stats.totalPKPT,       icon: ClipboardList, grad: "linear-gradient(135deg,#1E4E8C,#1E6FCC)", to: "/pkpt" },
    { label: "Surat Tugas",   value: stats.totalSuratTugas, icon: FileSignature, grad: "linear-gradient(135deg,#9D174D,#DB2777)", to: "/surat-tugas" },
    { label: "Total KKA",     value: stats.totalKKA,        icon: FolderOpen,    grad: "linear-gradient(135deg,#0EA5E9,#0284C7)", to: "/kka" },
    { label: "Temuan",        value: stats.totalTemuan,     icon: AlertTriangle, grad: "linear-gradient(135deg,#92400E,#D97706)", to: "/temuan" },
    { label: "Total RTL",     value: stats.totalRTL,        icon: CheckCircle,   grad: "linear-gradient(135deg,#065F46,#059669)", to: "/temuan" },
    { label: "Laporan",       value: stats.totalLaporan,    icon: FileText,      grad: "linear-gradient(135deg,#1E3A8A,#2563EB)", to: "/laporan" },
    { label: "Total SOP",     value: 0,                     icon: BookOpen,      grad: "linear-gradient(135deg,#064E3B,#10B981)", to: "/master-data" },
    { label: "Regulasi",      value: 0,                     icon: Shield,        grad: "linear-gradient(135deg,#1E293B,#475569)", to: "/master-data" },
    { label: "Audit Case",    value: 0,                     icon: BarChart3,     grad: "linear-gradient(135deg,#881337,#E11D48)", to: "/" },
  ] as const;

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#1E6FCC,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(30,111,204,0.3)" }}>
        <Loader2 size={28} style={{ color: "white", animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ color: COLORS.muted, fontSize: 14, fontWeight: 500 }}>Memuat dashboard...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, margin: 0, letterSpacing: "-0.5px" }}>
            Dashboard Administrator
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
            PERUMDA Tirta Kahuripan · Satuan Pengawas Internal
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, border: `1px solid ${showFilters ? "#BFDBFE" : COLORS.border}`, background: showFilters ? "#EFF6FF" : "#F8FAFC", color: showFilters ? "#1E6FCC" : COLORS.slate, fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "all 0.15s" }}>
            <Filter size={14} />Filter
          </button>
          <button onClick={() => fetchAll(true)} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F8FAFC", color: COLORS.slate, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh
          </button>
          <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#059669", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <Download size={14} />Excel
          </button>
          <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid #FECACA", background: "#FFF5F5", color: "#DC2626", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <Download size={14} />PDF
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      {showFilters && (
        <div style={card({ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", padding: "16px 20px" })}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Filter:</span>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: "#334155", background: "#F8FAFC" }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: "#334155", background: "#F8FAFC" }}>
            <option value="">Semua Bulan</option>
            {MN.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: "#334155", background: "#F8FAFC" }}>
            <option value="">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => { setFilterYear(String(new Date().getFullYear())); setFilterMonth(""); setFilterBranch(""); }} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#F1F5F9", color: COLORS.slate, fontSize: 13, cursor: "pointer" }}>
            Reset
          </button>
        </div>
      )}

      {/* ── Quick Stats (14 cards) ─────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick Statistics</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
          {STAT_CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} onClick={() => navigate(c.to)}
                style={{ background: c.grad, borderRadius: 16, padding: "16px 14px", color: "white", cursor: "pointer", position: "relative", overflow: "hidden", transition: "transform 0.18s, box-shadow 0.18s", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px) scale(1.02)"; el.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0) scale(1)"; el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}>
                <div style={{ position: "absolute", right: -10, top: -10, width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ position: "absolute", right: 10, bottom: -14, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                <Icon size={16} style={{ opacity: 0.9, marginBottom: 10 }} />
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: "-1px" }}>{c.value}</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 6, fontWeight: 600, lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 18 }}>
        <div style={card()}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>Status Audit Engagement</p>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Distribusi per status</p>
          <ReactECharts option={engOpt} style={{ height: 240 }} />
        </div>
        <div style={card()}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>Tren Temuan 6 Bulan</p>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Temuan baru vs closed</p>
          <ReactECharts option={barOpt} style={{ height: 240 }} />
        </div>
        <div style={card()}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>Severity Temuan</p>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>Distribusi risiko</p>
          <ReactECharts option={sevOpt} style={{ height: 240 }} />
        </div>
      </div>

      {/* ── Temuan Analytics ──────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Analitik Temuan Audit</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {([
            { label: "Open Finding",   value: openF,   color: "#E11D48", bg: "#FFF1F3", border: "#FECDD3", icon: AlertTriangle },
            { label: "Closed Finding", value: closedF, color: "#059669", bg: "#F0FDF4", border: "#A7F3D0", icon: CheckCircle },
            { label: "High Risk",      value: highR,   color: "#DC2626", bg: "#FFF5F5", border: "#FECACA", icon: TrendingUp },
            { label: "Medium Risk",    value: medR,    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: Activity },
            { label: "Low Risk",       value: lowR,    color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: TrendingDown },
            { label: "Overdue",        value: overdue, color: "#B45309", bg: "#FFF7ED", border: "#FED7AA", icon: Clock },
            { label: "Repeat Finding", value: 0,       color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: RefreshCw },
            { label: "Fin. Impact",    value: `Rp ${(totalFin / 1e6).toFixed(1)}M`, color: "#1E6FCC", bg: "#EFF6FF", border: "#BFDBFE", icon: BarChart3 },
          ] as const).map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} onClick={() => navigate("/temuan")}
                style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                  <Icon size={18} style={{ color: c.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color, lineHeight: 1, letterSpacing: "-0.5px" }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 600 }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={card()}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>Temuan per Cabang</p>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Top 5 cabang</p>
          {branchFind.length > 0
            ? <ReactECharts option={branchOpt} style={{ height: 200 }} />
            : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted, fontSize: 13 }}>Belum ada data temuan per cabang</div>
          }
        </div>
        <div style={card()}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>KPI Progress</p>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Pencapaian PKPT, Audit dan RTL</p>
          <ReactECharts option={kpiOpt} style={{ height: 200 }} />
        </div>
      </div>

      {/* ── RTL Section ───────────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Tindak Lanjut Rekomendasi (RTL)</p>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 18 }}>
          <div style={card({ display: "flex", flexDirection: "column", alignItems: "center", padding: 18 })}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, alignSelf: "flex-start", marginBottom: 4 }}>Progress RTL</p>
            <ReactECharts option={gaugeOpt} style={{ height: 170, width: "100%" }} />
            <p style={{ fontSize: 11, color: COLORS.muted }}>{rtlSelesai} dari {rtls.length} selesai</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {([
              { label: "Belum Ditindaklanjuti", value: rtlBelum,    color: "#94A3B8", icon: PauseCircle },
              { label: "Sedang Diproses",        value: rtlProses,   color: "#1E6FCC", icon: Clock },
              { label: "Menunggu Verifikasi",    value: rtlVerif,    color: "#D97706", icon: Activity },
              { label: "Ditolak",                value: rtlDitolak,  color: "#E11D48", icon: XCircle },
              { label: "Disetujui",              value: rtlDisetujui,color: "#7C3AED", icon: CheckCircle },
              { label: "Selesai",                value: rtlSelesai,  color: "#059669", icon: CheckCircle },
            ] as const).map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} onClick={() => navigate("/temuan")} style={card({ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "transform 0.15s" })}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}>
                  <Icon size={20} style={{ color: c.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: c.color, lineHeight: 1, letterSpacing: "-0.5px" }}>{c.value}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 3, fontWeight: 500 }}>{c.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Master Data Stats ─────────────────────────────────────────── */}
      <div style={card()}>
        <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Statistik Master Data</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {([
            { label: "Cabang",    value: stats.totalCabang,   color: "#7C3AED" },
            { label: "Bagian",    value: stats.totalBagian,   color: "#1E6FCC" },
            { label: "Pegawai",   value: 0,                   color: "#0D9488" },
            { label: "Auditor",   value: stats.totalAuditors, color: "#D97706" },
            { label: "Role",      value: 0,                   color: "#64748B" },
            { label: "Permission",value: 0,                   color: "#94A3B8" },
            { label: "KKA",       value: stats.totalKKA,      color: "#0891B2" },
            { label: "SOP",       value: 0,                   color: "#DB2777" },
            { label: "Regulasi",  value: 0,                   color: "#374151" },
            { label: "Laporan",   value: stats.totalLaporan,  color: "#1D4ED8" },
          ] as const).map((c) => (
            <div key={c.label} style={{ background: COLORS.bg, borderRadius: 14, padding: "16px", border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color, letterSpacing: "-0.5px" }}>{c.value}</div>
              <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 600, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1E6FCC,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} style={{ color: "white" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Quick Actions</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {QUICK.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F8FAFC", color: "#334155", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.18s" }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = a.color; el.style.color = "white"; el.style.borderColor = a.color; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "#F8FAFC"; el.style.color = "#334155"; el.style.borderColor = COLORS.border; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>
                <Plus size={12} /><Icon size={13} />{a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recent Activity + Calendar ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={card()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1E6FCC,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Activity size={13} style={{ color: "white" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Aktivitas Terbaru</p>
            </div>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", color: "#059669", fontWeight: 700, border: "1px solid #A7F3D0" }}>● Live</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {trail.slice(0, 8).map((t, i) => {
              const ac = AC[t.action] || { bg: "#F1F5F9", color: COLORS.slate };
              const u = t.users as any;
              return (
                <div key={t.id} style={{ display: "flex", gap: 10, paddingBottom: i < 7 ? 14 : 0, position: "relative" }}>
                  {i < 7 && <div style={{ position: "absolute", left: 13, top: 28, bottom: 0, width: 1, background: COLORS.border }} />}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: ac.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${ac.color}40` }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: ac.color }}>{t.action?.slice(0, 3)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{u?.display_name || "System"}</div>
                    <div style={{ fontSize: 12, color: COLORS.slate }}>{t.action} — {t.module}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 1 }}>{new Date(t.created_at).toLocaleString("id-ID")}</div>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: ac.bg, color: ac.color, height: "fit-content", flexShrink: 0 }}>{t.action}</span>
                </div>
              );
            })}
            {trail.length === 0 && <p style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0" }}>Belum ada aktivitas tercatat.</p>}
          </div>
        </div>

        <div style={card()}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={13} style={{ color: "white" }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Jadwal Audit</p>
          </div>
          <div style={{ background: COLORS.bg, borderRadius: 14, padding: 14, border: `1px solid ${COLORS.border}` }}>
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
              {today.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 10 }}>
              {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(d => (
                <div key={d} style={{ fontSize: 10, fontWeight: 600, color: COLORS.muted, textAlign: "center" }}>{d}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - startDay + 1;
                const isToday = dayNum === today.getDate();
                const isValid = dayNum > 0 && dayNum <= daysInMonth;
                return (
                  <div key={i} style={{ height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: isToday ? 700 : 400, background: isToday ? "linear-gradient(135deg,#1E6FCC,#06B6D4)" : "transparent", color: isToday ? "white" : isValid ? "#475569" : "transparent", cursor: isValid ? "pointer" : "default", boxShadow: isToday ? "0 2px 8px rgba(30,111,204,0.4)" : "none" }}>
                    {isValid ? dayNum : ""}
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>PKPT Aktif</p>
              {pkpts.filter(p => p.status !== "Selesai").slice(0, 3).map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg,#1E6FCC,#06B6D4)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: COLORS.slate }}>PKPT {p.tahun} — {p.status}</span>
                </div>
              ))}
              {pkpts.filter(p => p.status !== "Selesai").length === 0 && <p style={{ fontSize: 12, color: COLORS.muted }}>Tidak ada jadwal aktif.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Audit Trail Table ─────────────────────────────────────────── */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1E293B,#475569)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={13} style={{ color: "white" }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Audit Trail</p>
            <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#EFF6FF", color: "#1E6FCC", fontWeight: 700 }}>{filteredTrail.length} records</span>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.muted }} />
            <input value={trailSearch} onChange={e => setTrailSearch(e.target.value)} placeholder="Cari user, aksi, modul..." style={{ paddingLeft: 32, paddingRight: 12, height: 34, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: "#334155", outline: "none", width: 220, background: "#F8FAFC" }} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                {["Waktu","User","Modul","Aksi","Dokumen","Browser","IP","Device"].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, color: COLORS.muted, padding: "8px 10px", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrail.slice(0, 20).map(t => {
                const ac = AC[t.action] || { bg: "#F1F5F9", color: COLORS.slate };
                const u = t.users as any;
                return (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${COLORS.bg}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = COLORS.bg}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                    <td style={{ fontSize: 11, color: COLORS.slate, padding: "9px 10px", whiteSpace: "nowrap" }}>{new Date(t.created_at).toLocaleString("id-ID")}</td>
                    <td style={{ fontSize: 12, padding: "9px 10px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>{u?.display_name || "System"}</div>
                      <div style={{ color: COLORS.muted, fontSize: 11 }}>{u?.email || ""}</div>
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 500, color: "#475569", padding: "9px 10px" }}>{t.module}</td>
                    <td style={{ padding: "9px 10px" }}><span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: ac.bg, color: ac.color }}>{t.action}</span></td>
                    <td style={{ fontSize: 11, color: COLORS.muted, padding: "9px 10px", fontFamily: "monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.doc_id}</td>
                    <td style={{ fontSize: 11, color: COLORS.muted, padding: "9px 10px", whiteSpace: "nowrap" }}>{t.browser || "—"}</td>
                    <td style={{ fontSize: 11, color: COLORS.muted, padding: "9px 10px", whiteSpace: "nowrap" }}>{t.ip_address || "—"}</td>
                    <td style={{ fontSize: 11, color: COLORS.muted, padding: "9px 10px", whiteSpace: "nowrap" }}>{t.device || "—"}</td>
                  </tr>
                );
              })}
              {filteredTrail.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: COLORS.muted, fontSize: 13 }}>Belum ada data audit trail.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredTrail.length > 20 && <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 12, textAlign: "center" }}>Menampilkan 20 dari {filteredTrail.length} records.</p>}
      </div>

    </div>
  );
}
