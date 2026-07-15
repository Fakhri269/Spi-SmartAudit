import { useState } from "react";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, AlertTriangle, RefreshCw, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";

export const ALL_PERMISSIONS: { group: string; perms: { key: string; label: string }[] }[] = [
  { group: "Dashboard", perms: [{ key: "dashboard.view", label: "Lihat Dashboard" }] },
  {
    group: "Master Data", perms: [
      { key: "master.view", label: "Lihat Master Data" },
      { key: "master.create", label: "Tambah Master Data" },
      { key: "master.update", label: "Edit Master Data" },
      { key: "master.delete", label: "Hapus Master Data" },
    ]
  },
  {
    group: "Pengguna", perms: [
      { key: "user.view", label: "Lihat Pengguna" },
      { key: "user.create", label: "Tambah Pengguna" },
      { key: "user.update", label: "Edit Pengguna" },
      { key: "user.delete", label: "Hapus Pengguna" },
    ]
  },
  {
    group: "Role & Izin", perms: [
      { key: "role.view", label: "Lihat Role" },
      { key: "role.create", label: "Tambah Role" },
      { key: "role.update", label: "Edit Role" },
      { key: "role.delete", label: "Hapus Role" },
    ]
  },
  {
    group: "PKPT", perms: [
      { key: "pkpt.view", label: "Lihat PKPT" },
      { key: "pkpt.create", label: "Buat PKPT" },
      { key: "pkpt.update", label: "Edit PKPT" },
      { key: "pkpt.delete", label: "Hapus PKPT" },
      { key: "pkpt.approve", label: "Setujui PKPT" },
    ]
  },
  {
    group: "Surat Tugas", perms: [
      { key: "assignment.view", label: "Lihat Surat Tugas" },
      { key: "assignment.create", label: "Buat Surat Tugas" },
      { key: "assignment.update", label: "Edit Surat Tugas" },
      { key: "assignment.delete", label: "Hapus Surat Tugas" },
      { key: "assignment.approve", label: "Setujui Surat Tugas" },
    ]
  },
  {
    group: "KKA (Kertas Kerja)", perms: [
      { key: "kka.view", label: "Lihat KKA" },
      { key: "kka.create", label: "Buat KKA" },
      { key: "kka.update", label: "Edit KKA" },
      { key: "kka.review", label: "Review KKA" },
      { key: "kka.approve", label: "Setujui KKA" },
    ]
  },
  {
    group: "Temuan", perms: [
      { key: "finding.view", label: "Lihat Temuan" },
      { key: "finding.create", label: "Buat Temuan" },
      { key: "finding.update", label: "Edit Temuan" },
      { key: "finding.review", label: "Review Temuan" },
      { key: "finding.approve", label: "Setujui Temuan" },
    ]
  },
  {
    group: "RTL (Rencana Tindak Lanjut)", perms: [
      { key: "rtl.view", label: "Lihat RTL" },
      { key: "rtl.create", label: "Buat RTL" },
      { key: "rtl.update", label: "Edit RTL" },
      { key: "rtl.verify", label: "Verifikasi RTL" },
      { key: "rtl.close", label: "Tutup RTL" },
    ]
  },
  {
    group: "Bukti / Evidence", perms: [
      { key: "evidence.upload", label: "Upload Bukti" },
      { key: "evidence.download", label: "Download Bukti" },
      { key: "evidence.delete", label: "Hapus Bukti" },
    ]
  },
  {
    group: "Laporan Audit", perms: [
      { key: "report.view", label: "Lihat Laporan" },
      { key: "report.export", label: "Export Laporan" },
      { key: "report.print", label: "Cetak Laporan" },
    ]
  },
  {
    group: "Audit Trail & Pengaturan", perms: [
      { key: "auditTrail.view", label: "Lihat Audit Trail" },
      { key: "settings.view", label: "Lihat Pengaturan Sistem" },
      { key: "settings.update", label: "Edit Pengaturan Sistem" },
    ]
  },
];

const predefinedRoles = [
  { id: "administrator", name: "Administrator", description: "Hak akses penuh ke seluruh sistem", is_system_role: true, permissions: ALL_PERMISSIONS.flatMap(g => g.perms.map(p => p.key)) },
  { id: "manager_spi", name: "Manager SPI", description: "Menyetujui seluruh dokumen dan monitoring cabang", is_system_role: true, permissions: ["dashboard.view", "master.view", "user.view", "pkpt.view", "pkpt.approve", "assignment.view", "assignment.approve", "kka.view", "kka.approve", "finding.view", "finding.approve", "rtl.view", "rtl.verify", "rtl.close", "evidence.download", "report.view", "report.export", "report.print"] },
  { id: "ketua_tim", name: "Ketua Tim Audit", description: "Mengelola penugasan dan mereview hasil audit tim", is_system_role: true, permissions: ["dashboard.view", "master.view", "user.view", "pkpt.view", "assignment.view", "assignment.create", "assignment.update", "kka.view", "kka.review", "finding.view", "finding.review", "rtl.view", "rtl.verify", "evidence.upload", "evidence.download", "report.view"] },
  { id: "auditor", name: "Auditor", description: "Mengisi KKA dan mencatat Temuan Audit", is_system_role: true, permissions: ["dashboard.view", "master.view", "assignment.view", "kka.view", "kka.create", "kka.update", "finding.view", "finding.create", "finding.update", "evidence.upload", "evidence.download", "evidence.delete"] },
  { id: "kepala_cabang", name: "Kepala Cabang", description: "Melihat audit pada cabangnya dan memberikan tanggapan RTL", is_system_role: true, permissions: ["dashboard.view", "master.view", "finding.view", "rtl.view", "rtl.create", "rtl.update", "evidence.upload", "evidence.download", "report.view"] },
  { id: "pic_cabang", name: "PIC Cabang", description: "Melihat temuan yang ditugaskan dan upload bukti RTL", is_system_role: true, permissions: ["dashboard.view", "finding.view", "rtl.view", "rtl.create", "rtl.update", "evidence.upload", "evidence.download"] },
  { id: "direksi", name: "Direksi", description: "Executive dashboard dan laporan tingkat atas", is_system_role: true, permissions: ["dashboard.view", "finding.view", "report.view", "report.export", "report.print"] },
  { id: "viewer", name: "Viewer", description: "Hak akses baca saja", is_system_role: true, permissions: ["dashboard.view", "master.view", "evidence.download"] },
];

export function SeedRBAC() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Upsert all roles
      for (const role of predefinedRoles) {
        const { error } = await supabase.from("roles").upsert({
          id: role.id,
          name: role.name,
          description: role.description,
          is_system_role: role.is_system_role,
        });
        if (error) throw error;

        // Upsert permissions for this role
        for (const permKey of role.permissions) {
          // ensure permission exists
          await supabase.from("permissions").upsert({ id: permKey, name: permKey, module: permKey.split(".")[0] });
          // upsert role_permission
          await supabase.from("role_permissions").upsert({ role_id: role.id, permission_id: permKey });
        }
      }
      toast.success(`${predefinedRoles.length} role berhasil diinisialisasi!`);
      setResult({ success: true, message: `Berhasil! ${predefinedRoles.length} role berhasil diinisialisasi ke Supabase.` });
    } catch (error: any) {
      console.error(error);
      setResult({ success: false, message: "Error: " + error.message });
    }
    setLoading(false);
  };

  const handleMakeMeAdmin = async () => {
    if (!user) { setResult({ success: false, message: "Error: Anda belum login." }); return; }
    setAdminLoading(true);
    setResult(null);
    try {
      const { error } = await supabase.from("users").update({ role_id: "administrator" }).eq("id", user.id);
      if (error) throw error;
      setResult({ success: true, message: "Berhasil! Akun Anda telah diset sebagai Administrator. Silakan refresh halaman." });
      toast.success("Akun Anda kini Administrator!");
    } catch (error: any) {
      setResult({ success: false, message: "Error: " + error.message });
    }
    setAdminLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Inisialisasi Role Sistem</h2>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Klik tombol di bawah untuk mengisi database Supabase dengan role default sesuai spesifikasi sistem.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {predefinedRoles.map(role => (
          <div key={role.id} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Shield size={14} style={{ color: "#0369A1", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{role.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#DBEAFE", color: "#1D4ED8", fontWeight: 600 }}>{role.permissions.length} perm</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{role.description}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Button onClick={handleSeed} disabled={loading || adminLoading} style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, padding: "10px 20px" }}>
          {loading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Database size={14} />}
          {loading ? "Memproses..." : "Inisialisasi Role Default"}
        </Button>
        <Button onClick={handleMakeMeAdmin} disabled={loading || adminLoading} style={{ background: adminLoading ? "#94A3B8" : "#F59E0B", color: "white", border: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, padding: "10px 20px" }}>
          {adminLoading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <UserCog size={14} />}
          {adminLoading ? "Memproses..." : "Jadikan Saya Administrator"}
        </Button>
        {result && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: result.success ? "#059669" : "#DC2626", width: "100%" }}>
            {result.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
