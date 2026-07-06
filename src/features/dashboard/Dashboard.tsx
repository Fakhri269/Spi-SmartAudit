import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  ChevronRight,
  Droplets,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { KKA } from "../kka/KKAList";
import type { Temuan } from "../findings/TemuanList";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPKPT: 0, auditBerjalan: 0, temuanTerbuka: 0, rtlSelesai: 0,
  });
  const [pieData, setPieData] = useState<{ value: number; name: string }[]>([]);
  const [barData, setBarData] = useState<{ labels: string[]; temuan: number[]; rtl: number[] }>({
    labels: [], temuan: [], rtl: [],
  });
  const [branchSummaries, setBranchSummaries] = useState<
    { name: string; temuan: number; rtl: number }[]
  >([]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [branchesSnap, kkaSnap, findingsSnap] = await Promise.all([
        getDocs(collection(db, "branches")),
        getDocs(collection(db, "kka")),
        getDocs(collection(db, "findings")),
      ]);

      const branches = branchesSnap.docs.map((d) => ({ id: d.id, name: d.data().name }));
      const kkas = kkaSnap.docs.map((d) => ({ id: d.id, ...d.data() } as KKA));
      const findings = findingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Temuan));

      // Stats
      const totalPKPT = kkas.length;
      const auditBerjalan = kkas.filter((k) => k.status !== "Selesai").length;
      const temuanTerbuka = findings.filter((f) => f.status !== "Closed").length;
      const totalF = findings.length;
      const rtlSelesai = totalF > 0
        ? Math.round((findings.filter((f) => f.status === "Closed").length / totalF) * 100)
        : 0;
      setStats({ totalPKPT, auditBerjalan, temuanTerbuka, rtlSelesai });

      // Pie
      const counts = { Selesai: 0, Review: 0, Draft: 0 };
      kkas.forEach((k) => { if (counts[k.status as keyof typeof counts] !== undefined) counts[k.status as keyof typeof counts]++; });
      const pie = [
        { value: counts.Selesai, name: "Selesai" },
        { value: counts.Review, name: "Review" },
        { value: counts.Draft, name: "Draft" },
      ].filter((d) => d.value > 0);
      setPieData(pie);

      // Bar – last 6 months
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      const now = new Date();
      const last6 = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { month: d.getMonth(), year: d.getFullYear(), label: months[d.getMonth()] };
      });

      const byMonth = last6.map((m) => {
        const inMonth = findings.filter((f) => {
          if (!f.createdAt) return false;
          const d = new Date(f.createdAt);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        });
        return { total: inMonth.length, closed: inMonth.filter((f) => f.status === "Closed").length };
      });
      setBarData({ labels: last6.map((m) => m.label), temuan: byMonth.map((m) => m.total), rtl: byMonth.map((m) => m.closed) });

      // Branch summaries
      const summaries = branches.map((b) => {
        const bKkas = kkas.filter((k) => k.branchId === b.id);
        const ids = bKkas.map((k) => k.id);
        const bFindings = findings.filter((f) => ids.includes(f.kkaId));
        const total = bFindings.length;
        const closed = bFindings.filter((f) => f.status === "Closed").length;
        return { name: b.name, temuan: total, rtl: total > 0 ? Math.round((closed / total) * 100) : 0 };
      }).sort((a, b) => b.temuan - a.temuan).slice(0, 5);
      setBranchSummaries(summaries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const CARDS = [
    {
      label: "Total PKPT",
      value: stats.totalPKPT,
      suffix: "",
      icon: ClipboardList,
      grad: "linear-gradient(135deg,#0C4A6E,#0369A1)",
      shadow: "rgba(3,105,161,0.35)",
      note: "KKA terdaftar",
      up: true,
    },
    {
      label: "Audit Berjalan",
      value: stats.auditBerjalan,
      suffix: "",
      icon: Clock,
      grad: "linear-gradient(135deg,#0891B2,#06B6D4)",
      shadow: "rgba(8,145,178,0.35)",
      note: "Draft & Review",
      up: true,
    },
    {
      label: "Temuan Terbuka",
      value: stats.temuanTerbuka,
      suffix: "",
      icon: AlertTriangle,
      grad: "linear-gradient(135deg,#B45309,#D97706)",
      shadow: "rgba(180,83,9,0.35)",
      note: "Belum ditindaklanjuti",
      up: false,
    },
    {
      label: "RTL Selesai",
      value: stats.rtlSelesai,
      suffix: "%",
      icon: CheckCircle,
      grad: "linear-gradient(135deg,#0D9488,#14B8A6)",
      shadow: "rgba(13,148,136,0.35)",
      note: "Dari total temuan",
      up: true,
    },
  ];

  const pieOpt = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, left: "center", textStyle: { color: "#64748B", fontSize: 11, fontFamily: "Inter" } },
    color: ["#0D9488", "#0369A1", "#94A3B8"],
    series: [{
      name: "Status KKA",
      type: "pie",
      radius: ["42%", "68%"],
      center: ["50%", "42%"],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: "bold", color: "#0C4A6E", fontFamily: "Inter" } },
      labelLine: { show: false },
      data: pieData.length > 0
        ? pieData
        : [{ value: 1, name: "Belum ada KKA", itemStyle: { color: "#E2E8F0" } }],
    }],
  };

  const barOpt = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 10, right: 10, bottom: 0, top: 30, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { color: "#64748B", fontSize: 11, fontFamily: "Inter" }, data: ["Temuan Baru", "RTL Selesai"] },
    xAxis: {
      type: "category",
      data: barData.labels,
      axisLine: { lineStyle: { color: "#E2E8F0" } },
      axisLabel: { color: "#94A3B8", fontSize: 11, fontFamily: "Inter" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
      axisLabel: { color: "#94A3B8", fontSize: 11, fontFamily: "Inter" },
      minInterval: 1,
    },
    series: [
      {
        name: "Temuan Baru",
        type: "bar",
        barWidth: "32%",
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#0369A1" }, { offset: 1, color: "#BAE6FD" }] },
        },
        data: barData.temuan,
      },
      {
        name: "RTL Selesai",
        type: "bar",
        barWidth: "32%",
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#0D9488" }, { offset: 1, color: "#CCFBF1" }] },
        },
        data: barData.rtl,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "70vh", gap: 12 }}>
        <div
          className="animate-spin rounded-full"
          style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#0369A1" }}
        />
        <p style={{ color: "#94A3B8", fontSize: 14 }}>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 24 }}>

      {/* ─ Page Header ─ */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Droplets size={16} style={{ color: "#0369A1" }} />
            <h1 className="font-bold text-xl" style={{ color: "#0F172A" }}>Dashboard SPI</h1>
          </div>
          <p style={{ color: "#94A3B8", fontSize: 13 }}>
            PERUMDA Tirta Kahuripan &nbsp;·&nbsp; Satuan Pengawas Internal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#E2E8F0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; }}
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#EFF6FF", color: "#0369A1", border: "1px solid #DBEAFE" }}
          >
            <Activity size={11} />
            {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* ─ Stat Cards ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
        {CARDS.map((c) => {
          const Icon = c.icon;
          const Trend = c.up ? TrendingUp : TrendingDown;
          return (
            <div
              key={c.label}
              className="card-hover rounded-2xl text-white relative overflow-hidden flex flex-col"
              style={{ background: c.grad, boxShadow: `0 8px 24px ${c.shadow}`, minHeight: 180, padding: 24 }}
            >
              <div className="absolute -right-6 -top-6 rounded-full" style={{ width: 120, height: 120, background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute right-4 -bottom-6 rounded-full" style={{ width: 70, height: 70, background: "rgba(255,255,255,0.08)" }} />
              
              <div className="relative z-10 flex flex-col" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "auto" }}>
                  <div className="rounded-2xl" style={{ background: "rgba(255,255,255,0.15)", padding: 12 }}>
                    <Icon size={22} />
                  </div>
                  <div className="rounded-lg" style={{ background: "rgba(255,255,255,0.1)", padding: 6 }}>
                    <Trend size={14} style={{ opacity: 0.9 }} />
                  </div>
                </div>
                
                <div style={{ marginTop: 32 }}>
                  <p className="font-extrabold tracking-tight" style={{ fontSize: 38, lineHeight: 1.1 }}>
                    {c.value}{c.suffix}
                  </p>
                  <p className="font-semibold opacity-95" style={{ fontSize: 15, marginTop: 6 }}>{c.label}</p>
                  <p className="opacity-60 font-medium" style={{ fontSize: 12, marginTop: 6 }}>{c.note}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─ Charts ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Bar */}
        <div
          className="rounded-2xl bg-white"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", padding: 24 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <p className="font-bold text-base" style={{ color: "#0F172A" }}>Tren Temuan & RTL</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>6 bulan terakhir</p>
            </div>
          </div>
          <ReactECharts option={barOpt} style={{ height: 260 }} />
        </div>

        {/* Pie */}
        <div
          className="rounded-2xl bg-white flex flex-col"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", padding: 24 }}
        >
          <p className="font-bold text-base" style={{ color: "#0F172A", marginBottom: 4 }}>Status Audit</p>
          <p className="text-xs" style={{ color: "#94A3B8", marginBottom: 24 }}>Distribusi KKA</p>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ReactECharts option={pieOpt} style={{ height: 260, width: "100%" }} />
          </div>
        </div>
      </div>

      {/* ─ Bottom Row ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Activity */}
        <div
          className="rounded-2xl bg-white flex flex-col"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", minHeight: 300, padding: 24 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <p className="font-bold text-base" style={{ color: "#0F172A" }}>Aktivitas Sistem</p>
            <span
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#ECFDF5", color: "#059669" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot inline-block" />
              Live
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { text: "Database Firestore terhubung", time: "Baru saja", color: "#0D9488", dot: "#10B981" },
              { text: "Menunggu input data KKA", time: "—", color: "#0369A1", dot: "#60A5FA" },
              { text: "Menunggu input data Temuan", time: "—", color: "#D97706", dot: "#FCD34D" },
              { text: "Rules keamanan aktif", time: "—", color: "#64748B", dot: "#94A3B8" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: a.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "#334155" }}>{a.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#CBD5E1" }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch summary */}
        <div
          className="rounded-2xl bg-white flex flex-col"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", minHeight: 300, padding: 24 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <p className="font-bold text-base" style={{ color: "#0F172A" }}>Penyelesaian per Cabang</p>
            <ChevronRight size={14} style={{ color: "#CBD5E1" }} />
          </div>

          {branchSummaries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#F1F5F9" }}
              >
                <ClipboardList size={18} style={{ color: "#CBD5E1" }} />
              </div>
              <p className="text-sm text-center" style={{ color: "#94A3B8" }}>
                Belum ada data.<br />Mulai dengan menambah Cabang.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {branchSummaries.map((b) => {
                const color = b.rtl >= 90 ? "#0D9488" : b.rtl >= 70 ? "#0369A1" : "#D97706";
                const barColor = b.rtl >= 90
                  ? "linear-gradient(90deg,#0D9488,#14B8A6)"
                  : b.rtl >= 70
                  ? "linear-gradient(90deg,#0369A1,#0891B2)"
                  : "linear-gradient(90deg,#D97706,#F59E0B)";
                return (
                  <div key={b.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium" style={{ color: "#334155" }}>{b.name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: "#F59E0B", fontWeight: 600 }}>{b.temuan} temuan</span>
                        <span style={{ color, fontWeight: 700 }}>{b.rtl}%</span>
                      </div>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 6, background: "#F1F5F9" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${b.rtl}%`, background: barColor, transition: "width 0.8s ease" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
