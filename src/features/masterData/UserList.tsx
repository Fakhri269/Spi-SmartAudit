import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { createClient } from "@supabase/supabase-js";
import { useAuth, type UserProfile, type Role } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logAudit } from "@/utils/audit";
import { toast } from "sonner";
import { ShieldAlert, Edit, Trash2, Plus, UserPlus } from "lucide-react";

export function UserList() {
  const { hasPermission, profile, user, role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New user form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, bRes] = await Promise.all([
        supabase.from("users").select("*").is("deleted_at", null),
        supabase.from("roles").select("*").is("deleted_at", null),
        supabase.from("branches").select("id, name").is("deleted_at", null),
      ]);
      
      if (uRes.error) throw uRes.error;
      if (rRes.error) throw rRes.error;
      
      setUsers((uRes.data || []).map(u => ({
        uid: u.id,
        email: u.email,
        displayName: u.display_name || "",
        roleId: u.role_id || "",
        branchId: u.branch_id,
        isActive: u.is_active,
      })));
      setRoles((rRes.data || []).map(r => ({
        id: r.id, name: r.name, description: r.description,
        isSystemRole: r.is_system_role, permissions: [],
      })));
      setBranches(bRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data pengguna");
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setIsCreating(true);
    setNewEmail("");
    setNewName("");
    setNewPassword("");
    setEditingUser({
      roleId: roles.length > 0 ? roles[0].id : "",
      isActive: true,
      branchId: undefined
    });
    setIsDialogOpen(true);
  };

  const openEdit = (u: UserProfile) => {
    setIsCreating(false);
    setEditingUser(u);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    try {
      if (isCreating) {
        if (!newEmail || !newName || !newPassword) {
          toast.error("Nama, Email, dan Password wajib diisi");
          return;
        }
        
        // Buat temporary client agar admin yang sedang login tidak ter-logout saat memanggil signUp
        const tempClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
            auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
          }
        );

        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: newEmail,
          password: newPassword,
        });

        if (authError) throw authError;
        
        const newId = authData.user?.id;
        if (!newId) throw new Error("Gagal membuat kredensial auth");

        const { error } = await supabase.from("users").insert({
          id: newId,
          email: newEmail,
          display_name: newName,
          role_id: editingUser.roleId || null,
          branch_id: editingUser.branchId || null,
          is_active: editingUser.isActive ?? true,
        });
        
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "users", docId: newId, changes: JSON.stringify({ email: newEmail, roleId: editingUser.roleId }), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Pengguna berhasil ditambahkan");
      } else {
        if (!editingUser.uid) return;
        
        const { error } = await supabase.from("users").update({
          role_id: editingUser.roleId || null,
          branch_id: editingUser.branchId || null,
          is_active: editingUser.isActive ?? true,
        }).eq("id", editingUser.uid);
        
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "users", docId: editingUser.uid, changes: JSON.stringify({ roleId: editingUser.roleId }), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data pengguna berhasil diperbarui");
      }
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan");
    }
  };

  const confirmDelete = (uid: string) => {
    setUserToDelete(uid);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const { error } = await supabase.from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", userToDelete);
        
      if (error) throw error;
      await logAudit({ action: "DELETE", collectionName: "users", docId: userToDelete, changes: "Soft delete", userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
      toast.success("Pengguna berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus pengguna");
    }
  };

  // Hanya administrator atau role yang punya user.view
  if (!hasPermission("user.view")) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#EF4444" }}>
        <ShieldAlert size={48} style={{ margin: "0 auto 16px" }} />
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  const isAdmin = role?.name === "administrator" || hasPermission("user.update");

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || roleId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: 0 }}>Kelola Pengguna</h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>Atur akses pengguna, role, dan penempatan cabang.</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} style={{ display: "flex", gap: 8, background: "#0284C7" }}>
            <UserPlus size={16} /> Tambah Pengguna
          </Button>
        )}
      </div>
      
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: 100 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} style={{ textAlign: "center", padding: 32 }}>Memuat data...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>Belum ada data pengguna.</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell style={{ fontWeight: 600 }}>{u.displayName || "Belum ada nama"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <span style={{ background: "#F1F5F9", color: "#475569", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {getRoleName(u.roleId)}
                  </span>
                </TableCell>
                <TableCell>
                  {u.isActive
                    ? <span style={{ padding: "4px 8px", background: "#D1FAE5", color: "#059669", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Aktif</span>
                    : <span style={{ padding: "4px 8px", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Nonaktif</span>
                  }
                </TableCell>
                <TableCell>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Edit">
                        <Edit size={16} color="#0284C7" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(u.uid)} title="Hapus">
                        <Trash2 size={16} color="#EF4444" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{isCreating ? "Tambah Pengguna Baru" : "Edit Pengguna"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Masukkan detail pengguna baru dan tentukan rolenya." : "Ubah Role atau status pengguna."}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            <div>
              <Label>Nama Lengkap</Label>
              <Input 
                value={isCreating ? newName : (editingUser?.displayName || "")} 
                onChange={(e) => isCreating && setNewName(e.target.value)}
                disabled={!isCreating}
                style={{ marginTop: 6 }}
                placeholder="Masukkan nama pengguna"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={isCreating ? newEmail : (editingUser?.email || "")} 
                onChange={(e) => isCreating && setNewEmail(e.target.value)}
                disabled={!isCreating} 
                style={{ marginTop: 6 }}
                placeholder="contoh@tirtakahuripan.co.id"
              />
            </div>
            {isCreating && (
              <div>
                <Label>Password Akun</Label>
                <Input 
                  type="password"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ marginTop: 6 }}
                  placeholder="Password minimal 6 karakter"
                />
              </div>
            )}
            <div>
              <Label style={{ marginBottom: 8, display: "block" }}>Role Pengguna</Label>
              <Select value={editingUser?.roleId || ""} onValueChange={(val) => setEditingUser(prev => prev ? { ...prev, roleId: val || "" } : null)}>
                <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ marginBottom: 8, display: "block" }}>Penempatan Cabang (Opsional)</Label>
              <Select value={editingUser?.branchId || "none"} onValueChange={(val) => setEditingUser(prev => prev ? { ...prev, branchId: val === "none" ? undefined : val } : null)}>
                <SelectTrigger><SelectValue placeholder="Pilih cabang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Pusat / Tidak Ada Cabang --</SelectItem>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!isCreating && (
              <div>
                <Label style={{ marginBottom: 8, display: "block" }}>Status Akun</Label>
                <Select value={editingUser?.isActive ? "true" : "false"} onValueChange={(val) => setEditingUser(prev => prev ? { ...prev, isActive: val === "true" } : null)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Nonaktif (Diblokir)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} style={{ background: "#0284C7" }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus Pengguna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
