import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth, type Role } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { logAudit } from "@/utils/audit";
import { ShieldAlert, Trash2, Edit } from "lucide-react";

export function RoleList() {
  const { hasPermission, profile, user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "roles"));
      const rolesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
      setRoles(rolesData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSave = async () => {
    if (!editingRole || !editingRole.name || !editingRole.id) return;
    
    try {
      const roleRef = doc(db, "roles", editingRole.id.toLowerCase().replace(/\s+/g, '-'));
      const isNew = !roles.find(r => r.id === roleRef.id);
      
      const roleData = {
        name: editingRole.name,
        description: editingRole.description || "",
        permissions: editingRole.permissions || [],
        isSystemRole: editingRole.isSystemRole || false
      };
      
      await setDoc(roleRef, roleData);
      
      await logAudit({
        action: isNew ? "CREATE" : "UPDATE",
        collectionName: "roles",
        docId: roleRef.id,
        changes: JSON.stringify(roleData),
        userId: user?.uid || "",
        userEmail: profile?.email || "",
        userName: profile?.displayName || ""
      });
      
      setIsDialogOpen(false);
      fetchRoles();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string, isSystemRole: boolean) => {
    if (isSystemRole) {
      alert("System roles cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteDoc(doc(db, "roles", id));
      await logAudit({
        action: "DELETE",
        collectionName: "roles",
        docId: id,
        userId: user?.uid || "",
        userEmail: profile?.email || "",
        userName: profile?.displayName || ""
      });
      fetchRoles();
    } catch (error) {
      console.error(error);
    }
  };

  if (!hasPermission("role.view")) {
    return <div style={{ padding: 24, textAlign: "center", color: "#EF4444" }}><ShieldAlert size={48} style={{ margin: "0 auto 16px" }}/> Anda tidak memiliki akses ke halaman ini.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: 0 }}>Kelola Role & Hak Akses</h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>Atur peran dan izin akses pengguna dalam sistem.</p>
        </div>
        {hasPermission("role.create") && (
          <Button onClick={() => { setEditingRole({ permissions: [] }); setIsDialogOpen(true); }}>Tambah Role</Button>
        )}
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Role</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jumlah Izin</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead style={{ width: 100 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} style={{ textAlign: "center" }}>Memuat data...</TableCell></TableRow>
            ) : roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell style={{ fontWeight: 600 }}>{r.name}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.permissions.length} Hak Akses</TableCell>
                <TableCell>{r.isSystemRole ? <span style={{ padding: "4px 8px", background: "#DBEAFE", color: "#1D4ED8", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>System</span> : <span style={{ padding: "4px 8px", background: "#F1F5F9", color: "#475569", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Custom</span>}</TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: 8 }}>
                    {hasPermission("role.update") && (
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRole(r); setIsDialogOpen(true); }}><Edit size={16} /></Button>
                    )}
                    {hasPermission("role.delete") && !r.isSystemRole && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.isSystemRole)} style={{ color: "#EF4444" }}><Trash2 size={16} /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole?.id ? "Edit Role" : "Tambah Role"}</DialogTitle>
            <DialogDescription>
              Tentukan hak akses untuk role ini.
            </DialogDescription>
          </DialogHeader>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>ID Role (Unik, huruf kecil tanpa spasi)</Label>
              <Input 
                value={editingRole?.id || ""} 
                onChange={(e) => setEditingRole({ ...editingRole, id: e.target.value })}
                disabled={!!editingRole?.isSystemRole}
                placeholder="misal: auditor-junior"
              />
            </div>
            <div>
              <Label>Nama Role</Label>
              <Input 
                value={editingRole?.name || ""} 
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                disabled={!!editingRole?.isSystemRole}
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input 
                value={editingRole?.description || ""} 
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                disabled={!!editingRole?.isSystemRole}
              />
            </div>
            
            <div>
              <Label style={{ marginBottom: 8, display: "block" }}>Hak Akses (Permissions)</Label>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Simplified permission selection for brevity, ideally mapped from a constant */}
                {["dashboard.view", "master.view", "master.create", "master.update", "master.delete", "user.view", "user.create", "user.update", "role.view", "kka.view", "kka.create", "kka.approve", "finding.view", "finding.create", "report.view"].map(p => (
                  <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={editingRole?.permissions?.includes(p) || false}
                      onChange={(e) => {
                        const perms = editingRole?.permissions || [];
                        if (e.target.checked) setEditingRole({ ...editingRole, permissions: [...perms, p] });
                        else setEditingRole({ ...editingRole, permissions: perms.filter(x => x !== p) });
                      }}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
