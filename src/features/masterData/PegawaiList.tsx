import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Users, Mail, Phone } from "lucide-react";

interface Pegawai {
  id: string;
  nip: string;
  name: string;
  jabatan: string;
  email: string;
  phone: string;
}

export function PegawaiList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [nip, setNip] = useState("");
  const [name, setName] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "pegawai"));
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() } as Pegawai)));
    } catch { toast.error("Gagal memuat data pegawai"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setNip(""); setName(""); setJabatan(""); setEmail(""); setPhone(""); };

  const handleOpenAdd = () => { setIsEdit(false); setCurrentId(""); resetForm(); setOpen(true); };

  const handleOpenEdit = (p: Pegawai) => {
    setIsEdit(true); setCurrentId(p.id);
    setNip(p.nip); setName(p.name); setJabatan(p.jabatan); setEmail(p.email); setPhone(p.phone);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip || !name || !jabatan) { toast.error("NIP, Nama, dan Jabatan wajib diisi"); return; }
    setIsSubmitting(true);
    try {
      const payload = { nip, name, jabatan, email, phone };
      if (isEdit) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        await updateDoc(doc(db, "pegawai", currentId), { ...payload, updatedAt: serverTimestamp() });
        await logAudit({ action: "UPDATE", collectionName: "pegawai", docId: currentId, changes: JSON.stringify(payload), userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data pegawai berhasil diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const newDoc = await addDoc(collection(db, "pegawai"), { ...payload, createdAt: serverTimestamp() });
        await logAudit({ action: "CREATE", collectionName: "pegawai", docId: newDoc.id, changes: JSON.stringify(payload), userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Pegawai baru berhasil ditambahkan");
      }
      setOpen(false); fetchData();
    } catch { toast.error("Gagal menyimpan data"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (confirm("Hapus data pegawai ini?")) {
      try { 
        await deleteDoc(doc(db, "pegawai", id)); 
        await logAudit({ action: "DELETE", collectionName: "pegawai", docId: id, userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data pegawai dihapus"); 
        fetchData(); 
      }
      catch { toast.error("Gagal menghapus data"); }
    }
  };

  const columns: ColumnDef<Pegawai>[] = [
    { accessorKey: "nip", header: "NIP", cell: ({ row }) => <span style={{ fontFamily: "monospace", fontSize: 13, color: "#0369A1", fontWeight: 600 }}>{row.getValue("nip")}</span> },
    { accessorKey: "name", header: "Nama Lengkap", cell: ({ row }) => <span style={{ fontWeight: 600, color: "#0F172A" }}>{row.getValue("name")}</span> },
    { accessorKey: "jabatan", header: "Jabatan" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={13} style={{ color: "#94A3B8" }} /><span style={{ fontSize: 13 }}>{row.getValue("email") || "-"}</span></div> },
    { accessorKey: "phone", header: "Telepon", cell: ({ row }) => <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={13} style={{ color: "#94A3B8" }} /><span style={{ fontSize: 13 }}>{row.getValue("phone") || "-"}</span></div> },
    {
      id: "actions", header: "Aksi",
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: 6 }}>
          {hasPermission("master.update") && (
            <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row.original)} style={{ width: 32, height: 32, padding: 0, borderColor: "#BAE6FD" }}><Edit size={13} style={{ color: "#0369A1" }} /></Button>
          )}
          {hasPermission("master.delete") && (
            <Button variant="outline" size="sm" onClick={() => handleDelete(row.original.id)} style={{ width: 32, height: 32, padding: 0, borderColor: "#FECACA" }}><Trash2 size={13} style={{ color: "#EF4444" }} /></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Users size={18} style={{ color: "#0369A1" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Data Pegawai</h3>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Kelola data pegawai PDAM Tirta Kahuripan.</p>
        </div>
        {hasPermission("master.create") && (
          <Button onClick={handleOpenAdd} style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Plus size={15} /> Tambah Pegawai
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 48, gap: 12 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0369A1" }} />
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Memuat data...</p>
        </div>
      ) : <DataTable columns={columns} data={data} searchKey="name" />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Pegawai" : "Tambah Pegawai Baru"}</DialogTitle>
            <DialogDescription>Lengkapi data pegawai di bawah ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { id: "nip", label: "NIP", val: nip, set: setNip, placeholder: "Cth: 19870101 202101 1 001" },
              { id: "name", label: "Nama Lengkap", val: name, set: setName, placeholder: "Nama pegawai" },
              { id: "jabatan", label: "Jabatan", val: jabatan, set: setJabatan, placeholder: "Cth: Staff Keuangan" },
              { id: "email", label: "Email", val: email, set: setEmail, placeholder: "email@pdam.co.id" },
              { id: "phone", label: "No. Telepon", val: phone, set: setPhone, placeholder: "08xxx" },
            ].map(f => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center", gap: 12 }}>
                <Label htmlFor={f.id} style={{ textAlign: "right", fontSize: 13 }}>{f.label}</Label>
                <Input id={f.id} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            <DialogFooter style={{ marginTop: 8 }}>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} style={{ background: "#0369A1", color: "white" }}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
