import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useAuth, type Role } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { logAudit } from "@/utils/audit";
import { ALL_PERMISSIONS } from "./SeedRBAC";
import { ShieldAlert, Trash2, Edit, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

export function RoleList() {
  const { hasPermission, profile, user } = useAuth();
  const [roles, setRoles] = useState<(Role & { is_system_role?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role & { is_system_role: boolean }> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("roles").select("*, role_permissions(permission_id)").is("deleted_at", null);
      if (error) throw error;
      setRoles((data || []).map(r => ({
        id: r.id, name: r.name, description: r.description,
        isSystemRole: r.is_system_role,
        is_system_role: r.is_system_role,
        permissions: (r.role_permissions || []).map((rp: any) => rp.permission_id),
      })).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      toast.error("Gagal memuat data role");
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleOpenAdd = () => {
    setEditingRole({ id: "", name: "", description: "", permissions: [], isSystemRole: false });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole({ ...role });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRole?.name?.trim()) { toast.error("Nama role tidak boleh kosong"); return; }
    if (!editingRole?.id?.trim()) { toast.error("ID role tidak boleh kosong"); return; }
    setIsSaving(true);
    try {
      const roleId = editingRole.id.toLowerCase().replace(/\s+/g, "_");
      const isNew = !roles.find(r => r.id === roleId);
      const { error: roleErr } = await supabase.from("roles").upsert({ id: roleId, name: editingRole.name, description: editingRole.description || "", is_system_role: editingRole.isSystemRole || false });
      if (roleErr) throw roleErr;

      // Delete old permissions then insert new ones
      await supabase.from("role_permissions").delete().eq("role_id", roleId);
      const permsToInsert = (editingRole.permissions || []).map(p => ({ role_id: roleId, permission_id: p }));
      if (permsToInsert.length > 0) {
        // Ensure permissions exist
        for (const p of editingRole.permissions || []) {
          await supabase.from("permissions").upsert({ id: p, name: p, module: p.split(".")[0] });
        }
        const { error: permErr } = await supabase.from("role_permissions").insert(permsToInsert);
        if (permErr) throw permErr;
      }

      await logAudit({ action: isNew ? "CREATE" : "UPDATE", collectionName: "roles", docId: roleId, changes: JSON.stringify({ permissions: editingRole.permissions }), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
      toast.success(isNew ? "Role berhasil ditambahkan" : "Role berhasil diperbarui");
      setIsDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, isSystemRole: boolean) => {
    if (isSystemRole) { toast.error("Role sistem tidak dapat dihapus"); return; }
    if (!confirm(`Hapus role "${id}"?`)) return;
    try {
      const { error } = await supabase.from("roles").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await logAudit({ action: "DELETE", collectionName: "roles", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
      toast.success("Role berhasil dihapus"); fetchRoles();
    } catch { toast.error("Gagal menghapus role"); }
  };

  const togglePermission = (perm: string) => {
    const perms = editingRole?.permissions || [];
    const updated = perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
    setEditingRole(prev => ({ ...prev, permissions: updated }));
  };

  const toggleGroupAll = (groupPerms: string[]) => {
    const perms = editingRole?.permissions || [];
    const allSelected = groupPerms.every(p => perms.includes(p));
    const updated = allSelected ? perms.filter(p => !groupPerms.includes(p)) : [...new Set([...perms, ...groupPerms])];
    setEditingRole(prev => ({ ...prev, permissions: updated }));
  };

  if (!hasPermission("role.view")) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#EF4444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <ShieldAlert size={48} /><p style={{ fontWeight: 600, fontSize: 16 }}>Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Kelola Role & Hak Akses</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>Atur peran dan izin akses pengguna dalam sistem.</p>
        </div>
        {hasPermission("role.create") && (
          <Button onClick={handleOpenAdd} style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Plus size={15} /> Tambah Role
          </Button>
        )}
      </div>
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Role</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead style={{ textAlign: "center" }}>Jumlah Izin</TableHead>
              <TableHead style={{ textAlign: "center" }}>Tipe</TableHead>
              <TableHead style={{ width: 90 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>Memuat data...</TableCell></TableRow>
            ) : roles.length === 0 ? (
              <TableRow><TableCell colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>Belum ada role. Pergi ke tab "Sistem & Database" untuk inisialisasi role default.</TableCell></TableRow>
            ) : roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={15} style={{ color: "#1D4ED8" }} />
                    </div>
                    <span style={{ fontWeight: 600, color: "#0F172A" }}>{r.name}</span>
                  </div>
                </TableCell>
                <TableCell><code style={{ fontSize: 12, padding: "2px 6px", background: "#F1F5F9", borderRadius: 4, color: "#475569" }}>{r.id}</code></TableCell>
                <TableCell style={{ color: "#64748B", fontSize: 13 }}>{r.description}</TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  <span style={{ padding: "4px 10px", background: "#F0FDF4", color: "#16A34A", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{(r.permissions || []).length}</span>
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {r.isSystemRole
                    ? <span style={{ padding: "4px 10px", background: "#DBEAFE", color: "#1D4ED8", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>System</span>
                    : <span style={{ padding: "4px 10px", background: "#F1F5F9", color: "#475569", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Custom</span>
                  }
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: 4 }}>
                    {hasPermission("role.update") && (
                      <button onClick={() => handleOpenEdit(r)} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #BAE6FD", background: "#F0F9FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Edit size={13} style={{ color: "#0369A1" }} />
                      </button>
                    )}
                    {hasPermission("role.delete") && !r.isSystemRole && (
                      <button onClick={() => handleDelete(r.id, r.isSystemRole || false)} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #FECACA", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={13} style={{ color: "#EF4444" }} />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent style={{ maxWidth: 620 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              {editingRole?.isSystemRole ? `Detail Role: ${editingRole?.name}` : (editingRole?.id && roles.find(r => r.id === editingRole.id) ? "Edit Role" : "Tambah Role Baru")}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.isSystemRole ? "Role sistem tidak dapat diubah." : "Atur ID, nama, dan hak akses untuk role ini."}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>ID Role</Label>
                <Input value={editingRole?.id || ""} onChange={(e) => setEditingRole(prev => ({ ...prev, id: e.target.value }))} disabled={!!(editingRole?.isSystemRole || (editingRole?.id && roles.find(r => r.id === editingRole.id)))} placeholder="misal: auditor_junior" style={{ marginTop: 4 }} />
              </div>
              <div>
                <Label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nama Role</Label>
                <Input value={editingRole?.name || ""} onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))} disabled={!!editingRole?.isSystemRole} placeholder="misal: Auditor Junior" style={{ marginTop: 4 }} />
              </div>
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Deskripsi</Label>
              <Input value={editingRole?.description || ""} onChange={(e) => setEditingRole(prev => ({ ...prev, description: e.target.value }))} disabled={!!editingRole?.isSystemRole} placeholder="Deskripsi singkat role ini" style={{ marginTop: 4 }} />
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8, display: "block" }}>
                Hak Akses — <span style={{ color: "#0369A1" }}>{(editingRole?.permissions || []).length} dipilih</span>
              </Label>
              <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                {ALL_PERMISSIONS.map((group, gi) => {
                  const groupKeys = group.perms.map(p => p.key);
                  const allGroupSelected = groupKeys.every(k => (editingRole?.permissions || []).includes(k));
                  const someGroupSelected = groupKeys.some(k => (editingRole?.permissions || []).includes(k));
                  return (
                    <div key={group.group} style={{ borderBottom: gi < ALL_PERMISSIONS.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F8FAFC" }}>
                        <input type="checkbox" checked={allGroupSelected} ref={el => { if (el) el.indeterminate = !allGroupSelected && someGroupSelected; }} onChange={() => !editingRole?.isSystemRole && toggleGroupAll(groupKeys)} disabled={!!editingRole?.isSystemRole} style={{ width: 14, height: 14, cursor: "pointer" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.group}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "6px 12px 8px", gap: "4px 0" }}>
                        {group.perms.map(perm => (
                          <label key={perm.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, cursor: editingRole?.isSystemRole ? "default" : "pointer", padding: "3px 0" }}>
                            <input type="checkbox" checked={(editingRole?.permissions || []).includes(perm.key)} onChange={() => !editingRole?.isSystemRole && togglePermission(perm.key)} disabled={!!editingRole?.isSystemRole} style={{ width: 13, height: 13 }} />
                            <span style={{ color: "#475569" }}>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter style={{ marginTop: 8 }}>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Tutup</Button>
            {!editingRole?.isSystemRole && (
              <Button onClick={handleSave} disabled={isSaving} style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", fontWeight: 600 }}>
                {isSaving ? "Menyimpan..." : "Simpan Role"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
