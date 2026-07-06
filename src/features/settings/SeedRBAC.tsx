import { useState } from "react";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, AlertTriangle, RefreshCw, Shield } from "lucide-react";

export const ALL_PERMISSIONS: { group: string; perms: { key: string; label: string }[] }[] = [
  {
    group: "Dashboard",
    perms: [
      { key: "dashboard.view", label: "Lihat Dashboard" },
    ]
  },
  {
    group: "Master Data",
    perms: [
      { key: "master.view", label: "Lihat Master Data" },
      { key: "master.create", label: "Tambah Master Data" },
      { key: "master.update", label: "Edit Master Data" },
      { key: "master.delete", label: "Hapus Master Data" },
    ]
  },
  {
    group: "Pengguna",
    perms: [
      { key: "user.view", label: "Lihat Pengguna" },
      { key: "user.create", label: "Tambah Pengguna" },
      { key: "user.update", label: "Edit Pengguna" },
      { key: "user.delete", label: "Hapus Pengguna" },
    ]
  },
  {
    group: "Role & Izin",
    perms: [
      { key: "role.view", label: "Lihat Role" },
      { key: "role.create", label: "Tambah Role" },
      { key: "role.update", label: "Edit Role" },
      { key: "role.delete", label: "Hapus Role" },
    ]
  },
  {
    group: "PKPT",
    perms: [
      { key: "pkpt.view", label: "Lihat PKPT" },
      { key: "pkpt.create", label: "Buat PKPT" },
      { key: "pkpt.update", label: "Edit PKPT" },
      { key: "pkpt.delete", label: "Hapus PKPT" },
      { key: "pkpt.approve", label: "Setujui PKPT" },
    ]
  },
  {
    group: "Surat Tugas",
    perms: [
      { key: "assignment.view", label: "Lihat Surat Tugas" },
      { key: "assignment.create", label: "Buat Surat Tugas" },
      { key: "assignment.update", label: "Edit Surat Tugas" },
      { key: "assignment.delete", label: "Hapus Surat Tugas" },
      { key: "assignment.approve", label: "Setujui Surat Tugas" },
    ]
  },
  {
    group: "KKA (Kertas Kerja)",
    perms: [
      { key: "kka.view", label: "Lihat KKA" },
      { key: "kka.create", label: "Buat KKA" },
      { key: "kka.update", label: "Edit KKA" },
      { key: "kka.review", label: "Review KKA" },
      { key: "kka.approve", label: "Setujui KKA" },
    ]
  },
  {
    group: "Temuan",
    perms: [
      { key: "finding.view", label: "Lihat Temuan" },
      { key: "finding.create", label: "Buat Temuan" },
      { key: "finding.update", label: "Edit Temuan" },
      { key: "finding.review", label: "Review Temuan" },
      { key: "finding.approve", label: "Setujui Temuan" },
    ]
  },
  {
    group: "RTL (Rencana Tindak Lanjut)",
    perms: [
      { key: "rtl.view", label: "Lihat RTL" },
      { key: "rtl.create", label: "Buat RTL" },
      { key: "rtl.update", label: "Edit RTL" },
      { key: "rtl.verify", label: "Verifikasi RTL" },
      { key: "rtl.close", label: "Tutup RTL" },
    ]
  },
  {
    group: "Bukti / Evidence",
    perms: [
      { key: "evidence.upload", label: "Upload Bukti" },
      { key: "evidence.download", label: "Download Bukti" },
      { key: "evidence.delete", label: "Hapus Bukti" },
    ]
  },
  {
    group: "Laporan Audit",
    perms: [
      { key: "report.view", label: "Lihat Laporan" },
      { key: "report.export", label: "Export Laporan" },
      { key: "report.print", label: "Cetak Laporan" },
    ]
  },
  {
    group: "Audit Trail & Pengaturan",
    perms: [
      { key: "auditTrail.view", label: "Lihat Audit Trail" },
      { key: "settings.view", label: "Lihat Pengaturan Sistem" },
      { key: "settings.update", label: "Edit Pengaturan Sistem" },
    ]
  },
];

const predefinedRoles = [
  {
    id: "administrator",
    name: "Administrator",
    description: "Hak akses penuh ke seluruh sistem",
    isSystemRole: true,
    permissions: ALL_PERMISSIONS.flatMap(g => g.perms.map(p => p.key))
  },
  {
    id: "manager-spi",
    name: "Manager SPI",
    description: "Menyetujui seluruh dokumen dan monitoring cabang",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "user.view",
      "pkpt.view", "pkpt.approve",
      "assignment.view", "assignment.approve",
      "kka.view", "kka.approve",
      "finding.view", "finding.approve",
      "rtl.view", "rtl.verify", "rtl.close",
      "evidence.download",
      "report.view", "report.export", "report.print"
    ]
  },
  {
    id: "ketua-tim",
    name: "Ketua Tim Audit",
    description: "Mengelola penugasan dan mereview hasil audit tim",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "user.view",
      "pkpt.view",
      "assignment.view", "assignment.create", "assignment.update",
      "kka.view", "kka.review",
      "finding.view", "finding.review",
      "rtl.view", "rtl.verify",
      "evidence.upload", "evidence.download",
      "report.view"
    ]
  },
  {
    id: "auditor",
    name: "Auditor",
    description: "Mengisi KKA dan mencatat Temuan Audit",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "assignment.view",
      "kka.view", "kka.create", "kka.update",
      "finding.view", "finding.create", "finding.update",
      "evidence.upload", "evidence.download", "evidence.delete"
    ]
  },
  {
    id: "kepala-cabang",
    name: "Kepala Cabang",
    description: "Melihat audit pada cabangnya dan memberikan tanggapan RTL",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "finding.view",
      "rtl.view", "rtl.create", "rtl.update",
      "evidence.upload", "evidence.download",
      "report.view"
    ]
  },
  {
    id: "pic-cabang",
    name: "PIC Cabang",
    description: "Melihat temuan yang ditugaskan dan upload bukti RTL",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "finding.view",
      "rtl.view", "rtl.create", "rtl.update",
      "evidence.upload", "evidence.download"
    ]
  },
  {
    id: "direktur-utama",
    name: "Direktur Utama",
    description: "Executive dashboard dan laporan tingkat atas",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "report.view", "report.export", "report.print"
    ]
  },
  {
    id: "direksi",
    name: "Direksi",
    description: "Monitoring KPI dan Temuan seluruh cabang",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "finding.view",
      "report.view", "report.export", "report.print"
    ]
  },
  {
    id: "kepala-bagian",
    name: "Kepala Bagian",
    description: "Melihat audit pada bagiannya dan upload RTL",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "finding.view",
      "rtl.view", "rtl.create", "rtl.update",
      "evidence.upload", "evidence.download"
    ]
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Hak akses baca saja",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "evidence.download"
    ]
  }
];

export function SeedRBAC() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      const rolesRef = collection(db, "roles");
      const snapshot = await getDocs(rolesRef);
      if (snapshot.size > 0 && !confirm(`Sudah ada ${snapshot.size} role di database. Timpa dengan role default sistem?`)) {
        setLoading(false);
        return;
      }

      for (const role of predefinedRoles) {
        await setDoc(doc(db, "roles", role.id), {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystemRole: role.isSystemRole,
          permissionCount: role.permissions.length,
        });
      }

      setResult({ success: true, message: `Berhasil! ${predefinedRoles.length} role berhasil diinisialisasi ke Firestore.` });
    } catch (error: any) {
      console.error(error);
      setResult({ success: false, message: "Error: " + error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Inisialisasi Role Sistem</h2>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Klik tombol di bawah untuk mengisi database Firestore dengan role default sesuai spesifikasi sistem.
        </p>
      </div>

      {/* Roles preview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {predefinedRoles.map(role => (
          <div key={role.id} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Shield size={14} style={{ color: "#0369A1", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{role.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#DBEAFE", color: "#1D4ED8", fontWeight: 600 }}>
                {role.permissions.length} perm
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{role.description}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          onClick={handleSeed}
          disabled={loading}
          style={{
            background: loading ? "#94A3B8" : "linear-gradient(135deg, #0C4A6E, #0369A1)",
            color: "white",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            padding: "10px 20px",
          }}
        >
          {loading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Database size={14} />}
          {loading ? "Memproses..." : "Inisialisasi Role Default"}
        </Button>

        {result && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: result.success ? "#059669" : "#DC2626" }}>
            {result.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
