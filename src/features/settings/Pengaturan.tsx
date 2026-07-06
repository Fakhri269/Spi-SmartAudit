import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, User, Bell, Lock, Shield, Save, Eye, EyeOff, Users, Database, FileClock } from "lucide-react";
import { RoleList } from "./RoleList";
import { UserList } from "./UserList";
import { AuditTrailList } from "./AuditTrailList";
import { SeedRBAC } from "./SeedRBAC";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

type Tab = "profil" | "notifikasi" | "keamanan" | "pengguna" | "role" | "audit" | "sistem";

export function Pengaturan() {
  const { profile, hasPermission, role, refreshProfile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [email] = useState(profile?.email || "");
  const [showPass, setShowPass] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [saving, setSaving] = useState(false);

  const [notifTemuan, setNotifTemuan] = useState(true);
  const [notifKKA, setNotifKKA] = useState(true);
  const [notifLaporan, setNotifLaporan] = useState(false);

  // Keep form in sync if profile loads async
  useEffect(() => {
    if (profile?.displayName) setDisplayName(profile.displayName);
  }, [profile?.displayName]);

  const handleSaveProfil = async () => {
    if (!displayName.trim()) { toast.error("Nama tidak boleh kosong"); return; }
    if (!user?.uid) { toast.error("Sesi tidak valid, silakan login ulang"); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { displayName: displayName.trim() });
      await refreshProfile();
      toast.success("Profil berhasil disimpan!");
    } catch (e: any) {
      toast.error("Gagal menyimpan: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!oldPass || !newPass || !confPass) { toast.error("Semua kolom password wajib diisi"); return; }
    if (newPass !== confPass) { toast.error("Konfirmasi password tidak cocok"); return; }
    if (newPass.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    toast.success("Password berhasil diubah");
    setOldPass(""); setNewPass(""); setConfPass("");
  };

  const personalTabs = [
    { key: "profil" as Tab, label: "Profil Pengguna", icon: User },
    { key: "notifikasi" as Tab, label: "Notifikasi", icon: Bell },
    { key: "keamanan" as Tab, label: "Keamanan", icon: Lock },
  ];

  const adminTabs = [
    ...(hasPermission("user.view") ? [{ key: "pengguna" as Tab, label: "Kelola Pengguna", icon: Users }] : []),
    ...(hasPermission("role.view") ? [{ key: "role" as Tab, label: "Kelola Role", icon: Shield }] : []),
    ...(hasPermission("auditTrail.view") ? [{ key: "audit" as Tab, label: "Audit Trail", icon: FileClock }] : []),
    ...(hasPermission("role.create") ? [{ key: "sistem" as Tab, label: "Sistem & Database", icon: Database }] : []),
  ];

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div
        className="rounded-2xl text-white relative overflow-hidden"
        style={{ padding: 24, background: "linear-gradient(135deg, #1E293B, #334155)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
      >
        <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #0369A1, #0891B2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "white", boxShadow: "0 0 0 3px rgba(56,189,248,0.25)" }}>
            {(profile?.displayName || "U")[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{profile?.displayName || "User"}</p>
            <p style={{ fontSize: 13, opacity: 0.7, margin: "4px 0 0" }}>{role?.name || profile?.roleId || "SPI Auditor"} · {profile?.email}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Sidebar tabs */}
        <div
          style={{
            width: 220, flexShrink: 0, background: "white", borderRadius: 16,
            border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            padding: 10, display: "flex", flexDirection: "column", gap: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", margin: "8px 0 4px 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Personal</div>
          {personalTabs.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10, border: "none",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#0369A1" : "#64748B",
                  background: isActive ? "#E0F2FE" : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = "#F8FAFC"); }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = "transparent"); }}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}

          {adminTabs.length > 0 && (
            <>
              <div style={{ height: 1, background: "#F1F5F9", margin: "12px 10px" }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", margin: "0 0 4px 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Sistem</div>
              {adminTabs.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 10, border: "none",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#0F172A" : "#64748B",
                      background: isActive ? "#F1F5F9" : "transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = "#F8FAFC"); }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = "transparent"); }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: 28 }}>

          {activeTab === "profil" && (
            <div className="fade-in-up">
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Informasi Profil</p>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Perbarui nama tampilan dan informasi akun Anda.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 440 }}>
                <div>
                  <Label htmlFor="displayName" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Nama Tampilan</Label>
                  <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ marginTop: 6 }} placeholder="Nama lengkap" />
                </div>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Email</Label>
                  <Input value={email} disabled style={{ marginTop: 6, background: "#F8FAFC", color: "#94A3B8" }} />
                  <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>Email tidak dapat diubah.</p>
                </div>
                <div>
                  <Label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Role / Jabatan</Label>
                  <Input value={role?.name || profile?.roleId || "Viewer"} disabled style={{ marginTop: 6, background: "#F8FAFC", color: "#94A3B8" }} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <Button onClick={handleSaveProfil} disabled={saving} style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                    <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifikasi" && (
            <div className="fade-in-up">
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Pengaturan Notifikasi</p>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Atur kapan Anda ingin menerima notifikasi sistem.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                {[
                  { label: "Temuan Audit Baru", desc: "Notifikasi saat ada temuan baru yang dicatat", val: notifTemuan, set: setNotifTemuan },
                  { label: "Update Status KKA", desc: "Notifikasi perubahan status Kertas Kerja Audit", val: notifKKA, set: setNotifKKA },
                  { label: "Laporan Siap", desc: "Notifikasi saat laporan audit selesai disusun", val: notifLaporan, set: setNotifLaporan },
                ].map(n => (
                  <div
                    key={n.label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", borderRadius: 12, border: "1px solid #E2E8F0",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>{n.label}</p>
                      <p style={{ fontSize: 12.5, color: "#94A3B8", margin: "4px 0 0" }}>{n.desc}</p>
                    </div>
                    <button
                      onClick={() => { n.set(!n.val); toast.success(`Notifikasi "${n.label}" ${!n.val ? "diaktifkan" : "dinonaktifkan"}`); }}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                        background: n.val ? "#0369A1" : "#CBD5E1",
                        position: "relative", flexShrink: 0, transition: "background 0.2s",
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "white",
                        position: "absolute", top: 3, left: n.val ? 23 : 3,
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "keamanan" && (
            <div className="fade-in-up">
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Keamanan Akun</p>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Ubah password untuk menjaga keamanan akun Anda.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 440 }}>
                {[
                  { id: "oldPass", label: "Password Lama", val: oldPass, set: setOldPass },
                  { id: "newPass", label: "Password Baru", val: newPass, set: setNewPass },
                  { id: "confPass", label: "Konfirmasi", val: confPass, set: setConfPass },
                ].map(f => (
                  <div key={f.id}>
                    <Label htmlFor={f.id} style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{f.label}</Label>
                    <div style={{ position: "relative", marginTop: 6 }}>
                      <Input
                        id={f.id}
                        type={showPass ? "text" : "password"}
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "#F0F9FF", border: "1px solid #BAE6FD", display: "flex", gap: 10 }}>
                  <Shield size={16} style={{ color: "#0369A1", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12.5, color: "#0369A1", margin: 0 }}>Password minimal 6 karakter. Gunakan kombinasi huruf, angka, dan simbol untuk keamanan optimal.</p>
                </div>
                <Button onClick={handleChangePassword} style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #1E293B, #334155)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <Lock size={14} /> Ubah Password
                </Button>
              </div>
            </div>
          )}

          {activeTab === "pengguna" && hasPermission("user.view") && <div className="fade-in-up"><UserList /></div>}
          {activeTab === "role" && hasPermission("role.view") && <div className="fade-in-up"><RoleList /></div>}
          {activeTab === "audit" && hasPermission("auditTrail.view") && <div className="fade-in-up"><AuditTrailList /></div>}
          {activeTab === "sistem" && hasPermission("role.create") && <div className="fade-in-up"><SeedRBAC /></div>}

        </div>
      </div>
    </div>
  );
}
