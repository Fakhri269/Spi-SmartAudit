import { useState, useEffect, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { useNavigate } from "react-router-dom";
import {
  Users, Building2, Layers, ClipboardList, FileText, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Activity, Search, Download,
  TrendingUp, TrendingDown, Shield, FolderOpen, FileSignature,
  BarChart3, UserCheck, Briefcase, FileCheck, XCircle, PauseCircle,
  Loader2, ArrowUpRight, ChevronRight,
} from "lucide-react";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/features/auth/AuthContext";

// ─── Types ──────────────────────────────────────────────────────────────────
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

// ─── Constants ──────────────────────────────────────────────────────────────
const C = {
  text:    "#0F172A",
  text2:   "#475569",
  muted:   "#94A3B8",
  border:  "#E2E8F0",
  bg:      "#F8FAFC",
  card:    "#FFFFFF",
  blue:    "#2563EB",
  teal:    "#0D9488",
  violet:  "#7C3AED",
  rose:    "#E11D48",
  amber:   "#D97706",
  green:   "#059669",
};

const MN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

const TRAIL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  CREATE: { bg: "#DCFCE7", color: "#16A34A", label: "Buat" },
  UPDATE: { bg: "#FEF9C3", color: "#CA8A04", label: "Ubah" },
  DELETE: { bg: "#FEE2E2", color: "#DC2626", label: "Hapus" },
  LOGIN:  { bg: "#DBEAFE", color: "#2563EB", label: "Login" },
  UPLOAD: { bg: "#EDE9FE", color: "#7C3AED", label: "Upload" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card, borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, to, delta }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; bg: string; to: string; delta?: number;
}) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        padding: "16px 18px", cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={color} />
        </div>
        <ArrowUpRight size={14} color={C.muted} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
        {delta !== undefined && (
          <span style={{ fontSize: 11, color: delta >= 0 ? C.green : C.rose, fontWeight: 600 }}>
            {delta >= 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, color = C.blue, height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div style={{ background: C.bg, borderRadius: height, height, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export function Dashboard() {
  useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const allUsers   = get(0);
      const allBranches = get(1);
      const findData   = get(6) as FindingStat[];
      const rtlData    = get(7) as RTLStat[];
      const pkptData   = get(3) as PKPTStat[];
      const engData    = get(10) as EngagementStat[];
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

  // ── Derived values ────────────────────────────────────────────────────────
  const openF    = findings.filter(f => f.status === "Open").length;
  const closedF  = findings.filter(f => f.status === "Closed").length;
  const highR    = findings.filter(f => f.severity === "High").length;
  const medR     = findings.filter(f => f.severity === "Medium").length;
  const lowR     = findings.filter(f => f.severity === "Low").length;
  const overdue  = findings.filter(f => f.due_date && new Date(f.due_date) < new Date() && f.status !== "Closed").length;
  const totalFin = findings.reduce((s, f) => s + (f.financial_impact || 0), 0);

  const rtlBelum     = rtls.filter(r => r.status === "Draft").length;
  const rtlProses    = rtls.filter(r => r.status === "In Progress").length;
  const rtlVerif     = rtls.filter(r => r.status === "Pending Verification").length;
  const rtlDitolak   = rtls.filter(r => r.status === "Rejected").length;
  const rtlDisetujui = rtls.filter(r => r.status === "Approved").length;
  const rtlSelesai   = rtls.filter(r => r.status === "Closed").length;
  const rtlPct  = rtls.length > 0 ? Math.round((rtlSelesai / rtls.length) * 100) : 0;
  const pkptPct = pkpts.length > 0 ? Math.round((pkpts.filter(p => p.status === "Selesai").length / pkpts.length) * 100) : 0;
  const engPct  = engagements.length > 0 ? Math.round((engagements.filter(e => e.status === "Completed").length / engagements.length) * 100) : 0;

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: MN[d.getMonth()], m: d.getMonth(), y: d.getFullYear() };
  });
  const findByMonth = last6.map(m => ({
    label: m.label,
    total:  findings.filter(f => { const d = new Date(f.created_at); return d.getMonth() === m.m && d.getFullYear() === m.y; }).length,
    closed: findings.filter(f => { const d = new Date(f.created_at); return d.getMonth() === m.m && d.getFullYear() === m.y && f.status === "Closed"; }).length,
  }));

  const branchFind = branches
    .map(b => ({ name: b.name.length > 14 ? b.name.slice(0, 13) + "…" : b.name, value: findings.filter(f => f.branch_id === b.id).length }))
    .filter(b => b.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  const filteredTrail = trail.filter(t =>
    !trailSearch || (t.module + t.action + ((t.users as any)?.display_name || "") + t.doc_id).toLowerCase().includes(trailSearch.toLowerCase())
  );

  // ── Chart options ─────────────────────────────────────────────────────────
  const sevData = [
    { name: "High",   value: highR, itemStyle: { color: "#FCA5A5" } },
    { name: "Medium", value: medR,  itemStyle: { color: "#FCD34D" } },
    { name: "Low",    value: lowR,  itemStyle: { color: "#86EFAC" } },
  ].filter(d => d.value > 0);

  const engByStatus = ["Planning","Active","On Hold","Completed","Cancelled"].map(s => ({
    name: s, value: engagements.filter(e => e.status === s).length,
  }));

  const barOpt = {
    tooltip: { trigger: "axis", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC", fontSize: 12 } },
    grid: { left: 8, right: 8, bottom: 0, top: 30, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { fontSize: 11, color: C.muted }, data: ["Temuan","Closed"], itemWidth: 12, itemHeight: 8 },
    xAxis: { type: "category", data: last6.map(m => m.label), axisLabel: { fontSize: 11, color: C.muted }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
    yAxis: { type: "value", axisLabel: { fontSize: 11, color: C.muted }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } }, minInterval: 1 },
    series: [
      { name: "Temuan", type: "bar", barWidth: "30%", barGap: "20%", itemStyle: { borderRadius: [4,4,0,0], color: "#FCA5A5" }, data: findByMonth.map(m => m.total) },
      { name: "Closed", type: "bar", barWidth: "30%", itemStyle: { borderRadius: [4,4,0,0], color: "#86EFAC" }, data: findByMonth.map(m => m.closed) },
    ],
  };

  const sevOpt = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 11, color: C.muted }, itemWidth: 10, itemHeight: 10 },
    color: ["#FCA5A5","#FCD34D","#86EFAC"],
    series: [{
      name: "Severity", type: "pie", radius: ["44%","68%"], center: ["50%","42%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      data: sevData.length > 0 ? sevData : [{ name: "No Data", value: 1, itemStyle: { color: C.border } }],
    }],
  };

  const engOpt = {
    tooltip: { trigger: "item", formatter: "{b}: {c}", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    color: ["#93C5FD","#6EE7B7","#FCD34D","#A5B4FC","#FCA5A5"],
    legend: { bottom: 0, left: "center", textStyle: { fontSize: 10, color: C.muted }, itemWidth: 10, itemHeight: 10 },
    series: [{
      name: "Status Audit", type: "pie", radius: ["42%","65%"], center: ["50%","42%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      data: engByStatus.some(e => e.value > 0) ? engByStatus : [{ name: "No Data", value: 1, itemStyle: { color: C.border } }],
    }],
  };

  const branchOpt = {
    tooltip: { trigger: "axis", backgroundColor: "#1E293B", borderColor: "transparent", textStyle: { color: "#F8FAFC" } },
    grid: { left: 10, right: 24, bottom: 0, top: 6, containLabel: true },
    xAxis: { type: "value", axisLabel: { fontSize: 11, color: C.muted }, splitLine: { lineStyle: { color: "#F1F5F9" } }, minInterval: 1 },
    yAxis: { type: "category", data: branchFind.map(b => b.name), axisLabel: { fontSize: 11, color: C.text2 }, axisLine: { lineStyle: { color: C.border } } },
    series: [{ type: "bar", barWidth: 12, itemStyle: { borderRadius: [0,4,4,0], color: "#93C5FD" }, data: branchFind.map(b => b.value), label: { show: true, position: "right", fontSize: 11, color: C.muted } }],
  };

  // export helpers
  const exportExcel = async () => {
    const { utils, writeFile } = await import("xlsx");
    const ws = utils.json_to_sheet([
      { Metric: "Total Users",    Value: stats.totalUsers },
      { Metric: "Total Auditor",  Value: stats.totalAuditors },
      { Metric: "Total PKPT",     Value: stats.totalPKPT },
      { Metric: "Total KKA",      Value: stats.totalKKA },
      { Metric: "Total Temuan",   Value: stats.totalTemuan },
      { Metric: "Open Findings",  Value: openF },
      { Metric: "High Risk",      Value: highR },
      { Metric: "Progress RTL",   Value: `${rtlPct}%` },
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Dashboard");
    writeFile(wb, `Dashboard_SPI_${new Date().getFullYear()}.xlsx`);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: 12 }}>
      <Loader2 size={24} color={C.blue} style={{ animation: "spin 1s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13 }}>Memuat data...</p>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 32 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Dashboard</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>
            PERUMDA Tirta Kahuripan · Satuan Pengawas Internal
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => fetchAll(true)} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text2, fontSize: 12, cursor: "pointer", fontWeight: 500 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <button
            onClick={exportExcel}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #BBF7D0", background: "#F0FDF4", color: C.green, fontSize: 12, cursor: "pointer", fontWeight: 500 }}
          >
            <Download size={13} />Excel
          </button>
        </div>
      </div>

      {/* ── KPI Overview ────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Ringkasan</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard label="Total Pengguna"    value={stats.totalUsers}      icon={Users}         color="#2563EB" bg="#EFF6FF" to="/settings" />
          <StatCard label="Total Temuan"      value={stats.totalTemuan}     icon={AlertTriangle} color="#D97706" bg="#FFFBEB" to="/temuan" />
          <StatCard label="Total KKA"         value={stats.totalKKA}        icon={FolderOpen}    color="#0D9488" bg="#F0FDFA" to="/kka" />
          <StatCard label="Laporan Audit"     value={stats.totalLaporan}    icon={FileText}      color="#7C3AED" bg="#F5F3FF" to="/laporan" />
        </div>
      </div>

      {/* ── KPI Progress Bars ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Progress PKPT",         value: pkptPct, color: C.blue,   sub: `${pkpts.filter(p => p.status === "Selesai").length} dari ${pkpts.length} selesai` },
          { label: "Progress Audit",        value: engPct,  color: C.teal,   sub: `${engagements.filter(e => e.status === "Completed").length} dari ${engagements.length} selesai` },
          { label: "Progress RTL",          value: rtlPct,  color: C.violet, sub: `${rtlSelesai} dari ${rtls.length} selesai` },
        ].map(item => (
          <Card key={item.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}%</span>
            </div>
            <ProgressBar value={item.value} color={item.color} height={7} />
            <p style={{ fontSize: 11, color: C.muted, marginTop: 7 }}>{item.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Data Master & Operasional</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {[
            { label: "Auditor",      value: stats.totalAuditors,   icon: UserCheck,     color: "#0891B2", bg: "#ECFEFF", to: "/master-data/auditor" },
            { label: "Cabang",       value: stats.totalCabang,     icon: Building2,     color: "#7C3AED", bg: "#F5F3FF", to: "/master-data/cabang" },
            { label: "Bagian",       value: stats.totalBagian,     icon: Layers,        color: "#D97706", bg: "#FFFBEB", to: "/master-data" },
            { label: "Engagement",   value: stats.totalEngagement, icon: Briefcase,     color: "#0D9488", bg: "#F0FDFA", to: "/" },
            { label: "PKPT",         value: stats.totalPKPT,       icon: ClipboardList, color: "#2563EB", bg: "#EFF6FF", to: "/pkpt" },
            { label: "Surat Tugas",  value: stats.totalSuratTugas, icon: FileSignature, color: "#DB2777", bg: "#FDF2F8", to: "/surat-tugas" },
            { label: "Total RTL",    value: stats.totalRTL,        icon: CheckCircle,   color: "#059669", bg: "#ECFDF5", to: "/temuan" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label}
                onClick={() => navigate(c.to)}
                style={{
                  background: c.bg, borderRadius: 10, padding: "14px 12px",
                  cursor: "pointer", border: `1px solid ${C.border}`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <Icon size={15} color={c.color} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, letterSpacing: "-0.5px" }}>{c.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 500 }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

      {/* ── Temuan Analytics ────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Analitik Temuan</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Open",           value: openF,   icon: AlertTriangle, color: "#DC2626", bg: "#FFF5F5", border: "#FECACA" },
            { label: "Closed",         value: closedF, icon: CheckCircle,   color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
            { label: "High Risk",      value: highR,   icon: TrendingUp,    color: "#DC2626", bg: "#FFF5F5", border: "#FECACA" },
            { label: "Medium Risk",    value: medR,    icon: BarChart3,     color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
            { label: "Low Risk",       value: lowR,    icon: TrendingDown,  color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
            { label: "Overdue",        value: overdue, icon: Clock,         color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
            { label: "Repeat Finding", value: 0,       icon: RefreshCw,     color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
            { label: "Fin. Impact",    value: `Rp ${(totalFin/1e6).toFixed(1)}M`, icon: BarChart3, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label}
                onClick={() => navigate("/temuan")}
                style={{
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", transition: "transform 0.12s, box-shadow 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <Icon size={16} color={c.color} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: C.text2, marginTop: 3, fontWeight: 500 }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

      {/* ── Charts Row 1 ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 14 }}>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Tren Temuan 6 Bulan</p>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Temuan baru vs closed per bulan</p>
          <ReactECharts option={barOpt} style={{ height: 220 }} />
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Status Audit Engagement</p>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Distribusi status audit berjalan</p>
          <ReactECharts option={engOpt} style={{ height: 220 }} />
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Severity Temuan</p>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Distribusi tingkat risiko</p>
          <ReactECharts option={sevOpt} style={{ height: 220 }} />
        </Card>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Temuan per Cabang</p>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Top 5 cabang dengan temuan terbanyak</p>
          {branchFind.length > 0
            ? <ReactECharts option={branchOpt} style={{ height: 180 }} />
            : <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Belum ada data</div>
          }
        </Card>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>KPI Progress</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { label: "PKPT Selesai",   pct: pkptPct, color: C.blue,   count: `${pkpts.filter(p => p.status === "Selesai").length}/${pkpts.length}` },
              { label: "Audit Selesai",  pct: engPct,  color: C.teal,   count: `${engagements.filter(e => e.status === "Completed").length}/${engagements.length}` },
              { label: "RTL Selesai",    pct: rtlPct,  color: C.violet, count: `${rtlSelesai}/${rtls.length}` },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.text2 }}>{item.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{item.count}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color, minWidth: 36, textAlign: "right" }}>{item.pct}%</span>
                  </div>
                </div>
                <ProgressBar value={item.pct} color={item.color} height={8} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

      {/* ── RTL Section ─────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Tindak Lanjut Rekomendasi (RTL)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {[
            { label: "Belum Ditindaklanjuti", value: rtlBelum,     icon: PauseCircle, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
            { label: "Sedang Diproses",        value: rtlProses,    icon: Clock,       color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
            { label: "Menunggu Verifikasi",    value: rtlVerif,     icon: Activity,    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
            { label: "Ditolak",                value: rtlDitolak,   icon: XCircle,     color: "#DC2626", bg: "#FFF5F5", border: "#FECACA" },
            { label: "Disetujui",              value: rtlDisetujui, icon: CheckCircle, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
            { label: "Selesai",                value: rtlSelesai,   icon: CheckCircle, color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} onClick={() => navigate("/temuan")}
                style={{
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
                  padding: "14px 14px", cursor: "pointer",
                  transition: "transform 0.12s, box-shadow 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <Icon size={15} color={c.color} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 5, fontWeight: 500, lineHeight: 1.4 }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

      {/* ── Quick Actions & Audit Trail ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>Aksi Cepat</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Tambah PKPT",     icon: ClipboardList, to: "/pkpt" },
            { label: "Surat Tugas",     icon: FileSignature,  to: "/surat-tugas" },
            { label: "Input KKA",       icon: FolderOpen,     to: "/kka" },
            { label: "Tambah Temuan",   icon: AlertTriangle,  to: "/temuan" },
            { label: "Generate Laporan",icon: FileCheck,      to: "/laporan" },
            { label: "Tambah Auditor",  icon: UserCheck,      to: "/master-data/auditor" },
            { label: "Tambah Cabang",   icon: Building2,      to: "/master-data/cabang" },
            { label: "Tambah Pegawai",  icon: Briefcase,      to: "/master-data/pegawai" },
            { label: "Manajemen User",  icon: Users,          to: "/settings" },
            { label: "Pengaturan Role", icon: Shield,         to: "/settings" },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 13px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.bg,
                  color: C.text2, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "#EFF6FF"; el.style.borderColor = "#BFDBFE"; el.style.color = C.blue;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = C.bg; el.style.borderColor = C.border; el.style.color = C.text2;
                }}
              >
                <Icon size={13} />{a.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Audit Trail ─────────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Audit Trail</p>
            <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, fontWeight: 500 }}>
              {filteredTrail.length} record
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
            <input
              value={trailSearch} onChange={e => setTrailSearch(e.target.value)}
              placeholder="Cari user, aksi, modul..."
              style={{ paddingLeft: 30, paddingRight: 12, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, outline: "none", width: 210, background: C.bg }}
            />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Waktu","User","Modul","Aksi","Dokumen","IP"].map(h => (
                  <th key={h} style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, padding: "7px 10px", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrail.slice(0, 15).map(t => {
                const ac = TRAIL_BADGE[t.action] || { bg: C.bg, color: C.muted, label: t.action };
                const u = t.users as any;
                return (
                  <tr key={t.id}
                    style={{ borderBottom: `1px solid ${C.bg}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.bg}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ fontSize: 11, color: C.muted, padding: "9px 10px", whiteSpace: "nowrap" }}>{new Date(t.created_at).toLocaleString("id-ID")}</td>
                    <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>{u?.display_name || "System"}</div>
                      <div style={{ fontSize: 10.5, color: C.muted }}>{u?.email || ""}</div>
                    </td>
                    <td style={{ fontSize: 12, color: C.text2, padding: "9px 10px" }}>{t.module}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: ac.bg, color: ac.color }}>{ac.label || t.action}</span>
                    </td>
                    <td style={{ fontSize: 11, color: C.muted, padding: "9px 10px", fontFamily: "monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.doc_id}</td>
                    <td style={{ fontSize: 11, color: C.muted, padding: "9px 10px" }}>{t.ip_address || "—"}</td>
                  </tr>
                );
              })}
              {filteredTrail.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px", color: C.muted, fontSize: 13 }}>Belum ada data audit trail.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredTrail.length > 15 && (
          <button
            onClick={() => navigate("/settings")}
            style={{ display: "flex", alignItems: "center", gap: 5, margin: "14px auto 0", fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            Lihat semua {filteredTrail.length} record <ChevronRight size={13} />
          </button>
        )}
      </Card>
      </div>

    </div>
  );
}
