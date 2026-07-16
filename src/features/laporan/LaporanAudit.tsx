import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { FileText, Printer, Download, TrendingUp, AlertTriangle, CheckCircle, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import type { KKA } from "@/features/kka/KKAList";
import type { Temuan } from "@/features/findings/TemuanList";

interface Branch { id: string; name: string; }

export function LaporanAudit() {
  const [kkas, setKkas] = useState<KKA[]>([]);
  const [temuans, setTemuans] = useState<Temuan[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKKA, setExpandedKKA] = useState<string | null>(null);
  const [selectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [kkaSnap, temuanSnap, branchSnap] = await Promise.all([
          getDocs(collection(db, "kka")),
          getDocs(collection(db, "temuan")),
          getDocs(collection(db, "branches")),
        ]);
        setKkas(kkaSnap.docs.map(d => ({ id: d.id, ...d.data() } as KKA)));
        setTemuans(temuanSnap.docs.map(d => ({ id: d.id, ...d.data() } as Temuan)));
        setBranches(branchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || id;

  const totalKKA = kkas.length;
  const kkaDone = kkas.filter(k => k.status === "Selesai").length;
  const kkaReview = kkas.filter(k => k.status === "Review").length;
  const kkaDraft = kkas.filter(k => k.status === "Draft").length;

  const totalTemuan = temuans.length;
  const temuanOpen = temuans.filter(t => t.status === "Open").length;
  const temuanProgress = temuans.filter(t => t.status === "In Progress").length;
  const temuanClosed = temuans.filter(t => t.status === "Closed").length;
  const completionRate = totalKKA > 0 ? Math.round((kkaDone / totalKKA) * 100) : 0;
  const rtlRate = totalTemuan > 0 ? Math.round((temuanClosed / totalTemuan) * 100) : 0;

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#0284C7" }} />
        <p style={{ color: "#64748B", fontSize: 14 }}>Menyusun laporan audit...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div
        className="rounded-2xl text-white relative overflow-hidden"
        style={{
          padding: 28,
          background: "linear-gradient(135deg, #0EA5E9 0%, #075985 60%, #0284C7 100%)",
          boxShadow: "0 8px 32px rgba(3,105,161,0.25)",
        }}
      >
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <FileText size={20} style={{ color: "#BAE6FD" }} />
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Laporan Audit SPI</h1>
            </div>
            <p style={{ opacity: 0.8, fontSize: 14, margin: 0 }}>
              PDAM Tirta Kahuripan — Tahun {selectedYear}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.12)", color: "white",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            >
              <Printer size={15} /> Cetak Laporan
            </button>
            <button
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.95)", color: "#0284C7",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "white")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
            >
              <Download size={15} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total KKA", value: totalKKA, sub: `${kkaDone} selesai`, icon: BarChart2, color: "#0284C7", bg: "linear-gradient(135deg, #0EA5E9, #0284C7)", shadow: "rgba(3,105,161,0.3)" },
          { label: "Selesai Audit", value: `${completionRate}%`, sub: `${kkaDone} dari ${totalKKA} KKA`, icon: CheckCircle, color: "#0D9488", bg: "linear-gradient(135deg, #0F766E, #0D9488)", shadow: "rgba(13,148,136,0.3)" },
          { label: "Total Temuan", value: totalTemuan, sub: `${temuanOpen} masih open`, icon: AlertTriangle, color: "#B45309", bg: "linear-gradient(135deg, #92400E, #B45309)", shadow: "rgba(180,83,9,0.3)" },
          { label: "RTL Selesai", value: `${rtlRate}%`, sub: `${temuanClosed} dari ${totalTemuan} temuan`, icon: TrendingUp, color: "#7C3AED", bg: "linear-gradient(135deg, #5B21B6, #7C3AED)", shadow: "rgba(124,58,237,0.3)" },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card-hover rounded-2xl text-white"
              style={{ background: card.bg, boxShadow: `0 8px 24px ${card.shadow}`, padding: 20 }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 10 }}>
                  <Icon size={18} />
                </div>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{card.value}</p>
              <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 3 }}>{card.label}</p>
              <p style={{ fontSize: 11.5, opacity: 0.65 }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Progress bars ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* KKA status */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 4 }}>Status Kertas Kerja (KKA)</p>
          <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Distribusi status pengerjaan</p>
          {[
            { label: "Selesai", val: kkaDone, total: totalKKA, color: "#0D9488" },
            { label: "Review", val: kkaReview, total: totalKKA, color: "#D97706" },
            { label: "Draft", val: kkaDraft, total: totalKKA, color: "#64748B" },
          ].map(bar => (
            <div key={bar.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{bar.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: bar.color }}>{bar.val} KKA</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background: bar.color,
                    width: `${bar.total > 0 ? (bar.val / bar.total) * 100 : 0}%`,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Temuan status */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 4 }}>Status Tindak Lanjut (RTL)</p>
          <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Distribusi status temuan</p>
          {[
            { label: "Closed", val: temuanClosed, total: totalTemuan, color: "#0D9488" },
            { label: "In Progress", val: temuanProgress, total: totalTemuan, color: "#D97706" },
            { label: "Open", val: temuanOpen, total: totalTemuan, color: "#EF4444" },
          ].map(bar => (
            <div key={bar.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{bar.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: bar.color }}>{bar.val} temuan</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background: bar.color,
                    width: `${bar.total > 0 ? (bar.val / bar.total) * 100 : 0}%`,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail KKA & Temuan per KKA ─────────────────── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Detail Kertas Kerja & Temuan</p>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Klik baris untuk melihat temuan terkait</p>
        </div>

        {kkas.length === 0 ? (
          <div style={{ padding: 64, textAlign: "center" }}>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>Belum ada data KKA.</p>
          </div>
        ) : (
          kkas.map((kka, idx) => {
            const kkaTemuans = temuans.filter(t => t.kkaId === kka.id);
            const isExpanded = expandedKKA === kka.id;
            const statusColor = kka.status === "Selesai" ? "#0D9488" : kka.status === "Review" ? "#D97706" : "#64748B";
            const statusBg = kka.status === "Selesai" ? "#CCFBF1" : kka.status === "Review" ? "#FEF9C3" : "#F1F5F9";

            return (
              <div key={kka.id} style={{ borderBottom: idx < kkas.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                {/* KKA row */}
                <div
                  onClick={() => setExpandedKKA(isExpanded ? null : kka.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 24px",
                    cursor: "pointer",
                    background: isExpanded ? "#F8FAFC" : "white",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; }}
                  onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = "white"; }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {kka.objective}
                    </p>
                    <p style={{ fontSize: 12, color: "#94A3B8" }}>{getBranchName(kka.branchId)}</p>
                  </div>
                  <span
                    style={{
                      padding: "3px 10px", borderRadius: 99,
                      fontSize: 11, fontWeight: 700,
                      color: statusColor, background: statusBg, flexShrink: 0,
                    }}
                  >
                    {kka.status}
                  </span>
                  <span
                    style={{
                      padding: "3px 10px", borderRadius: 99,
                      fontSize: 11, fontWeight: 600,
                      color: "#EF4444", background: "#FEF2F2", flexShrink: 0,
                    }}
                  >
                    {kkaTemuans.length} temuan
                  </span>
                  {isExpanded
                    ? <ChevronUp size={15} style={{ color: "#94A3B8", flexShrink: 0 }} />
                    : <ChevronDown size={15} style={{ color: "#94A3B8", flexShrink: 0 }} />
                  }
                </div>

                {/* Temuan accordion */}
                {isExpanded && (
                  <div style={{ background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
                    {kkaTemuans.length === 0 ? (
                      <p style={{ padding: "12px 48px", fontSize: 13, color: "#94A3B8" }}>Tidak ada temuan untuk KKA ini.</p>
                    ) : (
                      kkaTemuans.map((t, ti) => {
                        const tColor = t.status === "Closed" ? "#0D9488" : t.status === "In Progress" ? "#D97706" : "#EF4444";
                        const tBg = t.status === "Closed" ? "#CCFBF1" : t.status === "In Progress" ? "#FEF9C3" : "#FEF2F2";
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "28px 1fr 1fr auto",
                              gap: 12,
                              alignItems: "start",
                              padding: "12px 24px 12px 48px",
                              borderBottom: ti < kkaTemuans.length - 1 ? "1px solid #F1F5F9" : "none",
                            }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", paddingTop: 2 }}>#{ti + 1}</span>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>Kriteria</p>
                              <p style={{ fontSize: 12, color: "#475569" }}>{t.criteria}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>Kondisi</p>
                              <p style={{ fontSize: 12, color: "#475569" }}>{t.condition}</p>
                            </div>
                            <span
                              style={{
                                padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap",
                                fontSize: 11, fontWeight: 700, color: tColor, background: tBg,
                              }}
                            >
                              {t.status}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          aside, header, button { display: none !important; }
          main { padding: 0 !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
