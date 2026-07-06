import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, FileCode, ExternalLink } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

interface SOP {
  id: string;
  kode: string;
  judul: string;
  kategori: "SOP" | "Peraturan" | "SK";
  status: "Aktif" | "Revisi" | "Tidak Aktif";
  tahun: string;
}

export function SOPList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [kode, setKode] = useState("");
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState<SOP["kategori"]>("SOP");
  const [status, setStatus] = useState<SOP["status"]>("Aktif");
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "sop"));
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() } as SOP)));
    } catch { toast.error("Gagal memuat data SOP"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => { setIsEdit(false); setCurrentId(""); setKode(""); setJudul(""); setKategori("SOP"); setStatus("Aktif"); setTahun(String(new Date().getFullYear())); setOpen(true); };
  const handleOpenEdit = (s: SOP) => { setIsEdit(true); setCurrentId(s.id); setKode(s.kode); setJudul(s.judul); setKategori(s.kategori); setStatus(s.status); setTahun(s.tahun); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode || !judul) { toast.error("Kode dan Judul wajib diisi"); return; }
    setIsSubmitting(true);
    try {
      const payload = { kode, judul, kategori, status, tahun };
      if (isEdit) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        await updateDoc(doc(db, "sop", currentId), { ...payload, updatedAt: serverTimestamp() });
        await logAudit({ action: "UPDATE", collectionName: "sop", docId: currentId, changes: JSON.stringify(payload), userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("SOP/Peraturan diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const newDoc = await addDoc(collection(db, "sop"), { ...payload, createdAt: serverTimestamp() });
        await logAudit({ action: "CREATE", collectionName: "sop", docId: newDoc.id, changes: JSON.stringify(payload), userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("SOP/Peraturan baru ditambahkan");
      }
      setOpen(false); fetchData();
    } catch (error: any) { toast.error("Gagal menyimpan data: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (confirm("Hapus data ini?")) {
      try { 
        await deleteDoc(doc(db, "sop", id)); 
        await logAudit({ action: "DELETE", collectionName: "sop", docId: id, userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data dihapus"); 
        fetchData(); 
      }
      catch { toast.error("Gagal menghapus"); }
    }
  };

  const statusColors: Record<SOP["status"], { color: string; bg: string }> = {
    Aktif: { color: "#0D9488", bg: "#CCFBF1" },
    Revisi: { color: "#D97706", bg: "#FEF9C3" },
    "Tidak Aktif": { color: "#94A3B8", bg: "#F1F5F9" },
  };

  const kategoriColors: Record<SOP["kategori"], { color: string; bg: string }> = {
    SOP: { color: "#0369A1", bg: "#E0F2FE" },
    Peraturan: { color: "#7C3AED", bg: "#EDE9FE" },
    SK: { color: "#B45309", bg: "#FEF3C7" },
  };

  const columns: ColumnDef<SOP>[] = [
    { accessorKey: "kode", header: "Kode Dokumen", cell: ({ row }) => <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#0369A1", fontWeight: 700 }}>{row.getValue("kode")}</span> },
    {
      accessorKey: "kategori", header: "Kategori",
      cell: ({ row }) => { const k = row.getValue("kategori") as SOP["kategori"]; const c = kategoriColors[k]; return <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: c.color, background: c.bg }}>{k}</span>; }
    },
    { accessorKey: "judul", header: "Judul Dokumen", cell: ({ row }) => <div style={{ display: "flex", alignItems: "center", gap: 7 }}><FileCode size={13} style={{ color: "#94A3B8", flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{row.getValue("judul")}</span></div> },
    { accessorKey: "tahun", header: "Tahun", cell: ({ row }) => <span style={{ fontSize: 13, color: "#64748B" }}>{row.getValue("tahun")}</span> },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => { const s = row.getValue("status") as SOP["status"]; const c = statusColors[s]; return <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, color: c.color, background: c.bg }}>{s}</span>; }
    },
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
            <FileCode size={18} style={{ color: "#0369A1" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>SOP & Peraturan</h3>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Kelola dokumen SOP, peraturan, dan Surat Keputusan.</p>
        </div>
        {hasPermission("master.create") && (
          <Button onClick={handleOpenAdd} style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Plus size={15} /> Tambah Dokumen
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 12 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0369A1" }} />
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Memuat data...</p>
        </div>
      ) : <DataTable columns={columns} data={data} searchKey="judul" />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Dokumen" : "Tambah SOP / Peraturan"}</DialogTitle>
            <DialogDescription>Isi detail dokumen referensi audit.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { id: "kode", label: "Kode Dok.", val: kode, set: setKode, placeholder: "Cth: SOP-KE-001" },
              { id: "judul", label: "Judul", val: judul, set: setJudul, placeholder: "Judul dokumen" },
              { id: "tahun", label: "Tahun", val: tahun, set: setTahun, placeholder: "2026" },
            ].map(f => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 12 }}>
                <Label htmlFor={f.id} style={{ textAlign: "right", fontSize: 13 }}>{f.label}</Label>
                <Input id={f.id} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            {[
              { label: "Kategori", val: kategori, set: setKategori as (v: string) => void, opts: ["SOP", "Peraturan", "SK"] },
              { label: "Status", val: status, set: setStatus as (v: string) => void, opts: ["Aktif", "Revisi", "Tidak Aktif"] },
            ].map(f => (
              <div key={f.label} style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 12 }}>
                <Label style={{ textAlign: "right", fontSize: 13 }}>{f.label}</Label>
                <Select value={f.val} onValueChange={f.set}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{f.opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
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
