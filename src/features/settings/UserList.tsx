import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth, type UserProfile, type Role } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logAudit } from "@/utils/audit";
import { ShieldAlert, Edit, Trash2 } from "lucide-react";

export function UserList() {
  const { hasPermission, profile, user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uSnap, rSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "roles"))
      ]);
      setUsers(uSnap.docs.map(doc => doc.data() as UserProfile));
      setRoles(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editingUser || !editingUser.uid) return;
    
    try {
      const userRef = doc(db, "users", editingUser.uid);
      const isNew = !users.find(u => u.uid === editingUser.uid);
      
      const userData = {
        uid: editingUser.uid,
        email: editingUser.email || "",
        displayName: editingUser.displayName || "",
        roleId: editingUser.roleId || "viewer",
        isActive: editingUser.isActive ?? true,
        branchId: editingUser.branchId || null
      };
      
      await setDoc(userRef, userData);
      
      await logAudit({
        action: isNew ? "CREATE" : "UPDATE",
        collectionName: "users",
        docId: editingUser.uid,
        changes: JSON.stringify({ roleId: userData.roleId, isActive: userData.isActive }),
        userId: user?.uid || "",
        userEmail: profile?.email || "",
        userName: profile?.displayName || ""
      });
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to remove access for this user?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      await logAudit({
        action: "DELETE",
        collectionName: "users",
        docId: uid,
        userId: user?.uid || "",
        userEmail: profile?.email || "",
        userName: profile?.displayName || ""
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (!hasPermission("user.view")) {
    return <div style={{ padding: 24, textAlign: "center", color: "#EF4444" }}><ShieldAlert size={48} style={{ margin: "0 auto 16px" }}/> Anda tidak memiliki akses ke halaman ini.</div>;
  }

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || roleId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: 0 }}>Kelola Pengguna</h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>Atur akses pengguna, role, dan penempatan cabang.</p>
        </div>
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
              <TableRow><TableCell colSpan={5} style={{ textAlign: "center" }}>Memuat data...</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell style={{ fontWeight: 600 }}>{u.displayName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{getRoleName(u.roleId)}</TableCell>
                <TableCell>
                  {u.isActive ? (
                    <span style={{ padding: "4px 8px", background: "#D1FAE5", color: "#059669", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Aktif</span>
                  ) : (
                    <span style={{ padding: "4px 8px", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Nonaktif</span>
                  )}
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: 8 }}>
                    {hasPermission("user.update") && (
                      <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsDialogOpen(true); }}><Edit size={16} /></Button>
                    )}
                    {hasPermission("user.delete") && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.uid)} style={{ color: "#EF4444" }}><Trash2 size={16} /></Button>
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
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah Role atau status pengguna. Data profil diambil dari Google Auth.
            </DialogDescription>
          </DialogHeader>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>Nama</Label>
              <Input value={editingUser?.displayName || ""} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editingUser?.email || ""} disabled />
            </div>
            
            <div>
              <Label style={{ marginBottom: 8, display: "block" }}>Role Pengguna</Label>
              <Select 
                value={editingUser?.roleId || "viewer"} 
                onValueChange={(val) => setEditingUser({ ...editingUser, roleId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
