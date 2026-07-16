import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, AlertOctagon } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

interface Risiko {
  id: string;
  kode: string;
  nama: string;
  kategori: "Strategis" | "Operasional" | "Kepatuhan" | "Keuangan";
  level: "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  mitigasi: string;
}

export function RisikoList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<Risiko[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState<Risiko["kategori"]>("Operasional");
  const [level, setLevel] = useState<Risiko["level"]>("Sedang");
  const [mitigasi, setMitigasi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: risks, error } = await supabase.from("risiko").select("*").is("deleted_at", null);
      if (error) throw error;
      setData((risks || []).map(d => ({
        id: d.id,
        kode: d.kode,
        nama: d.nama,
        kategori: d.kategori,
        level: d.level,
        mitigasi: d.mitigasi || "",
      })));
    } catch { toast.error("Gagal memuat data risiko"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => { setIsEdit(false); setCurrentId(""); setKode(""); setNama(""); setKategori("Operasional"); setLevel("Sedang"); setMitigasi(""); setOpen(true); };
  const handleOpenEdit = (r: Risiko) => { setIsEdit(true); setCurrentId(r.id); setKode(r.kode); setNama(r.nama); setKategori(r.kategori); setLevel(r.level); setMitigasi(r.mitigasi); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode || !nama) { toast.error("Kode dan Nama risiko wajib diisi"); return; }
    setIsSubmitting(true);
    try {
      const payload = { kode, nama, kategori, level, mitigasi };
      if (isEdit) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        const { error } = await supabase.from("risiko").update(payload).eq("id", currentId);
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "risiko", docId: currentId, changes: JSON.stringify(payload), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data risiko diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const { data: newDoc, error } = await supabase.from("risiko").insert([payload]).select().single();
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "risiko", docId: newDoc.id, changes: JSON.stringify(payload), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Risiko baru ditambahkan");
      }
      setOpen(false); fetchData();
    } catch (error: any) { toast.error("Gagal menyimpan data: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (confirm("Hapus data risiko ini?")) {
      try { 
        const { error } = await supabase.from("risiko").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        await logAudit({ action: "DELETE", collectionName: "risiko", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Risiko dihapus"); 
        fetchData(); 
      }
      catch { toast.error("Gagal menghapus"); }
    }
  };

  const levelColors: Record<Risiko["level"], { color: string; bg: string }> = {
    Kritis: { color: "#991B1B", bg: "#FEE2E2" },
    Tinggi: { color: "#EF4444", bg: "#FEF2F2" },
    Sedang: { color: "#D97706", bg: "#FEF9C3" },
    Rendah: { color: "#0D9488", bg: "#CCFBF1" },
  };

  const columns: ColumnDef<Risiko>[] = [
    { accessorKey: "kode", header: "Kode", cell: ({ row }) => <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#EF4444", fontWeight: 700 }}>{row.getValue("kode")}</span> },
    { accessorKey: "nama", header: "Nama Risiko", cell: ({ row }) => <div style={{ display: "flex", alignItems: "center", gap: 7 }}><AlertOctagon size={13} style={{ color: "#EF4444", flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{row.getValue("nama")}</span></div> },
    { accessorKey: "kategori", header: "Kategori", cell: ({ row }) => <span style={{ fontSize: 12.5, color: "#475569" }}>{row.getValue("kategori")}</span> },
    {
      accessorKey: "level", header: "Level Risiko",
      cell: ({ row }) => { const lv = row.getValue("level") as Risiko["level"]; const c = levelColors[lv]; return <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, color: c.color, background: c.bg }}>{lv}</span>; }
    },
    { accessorKey: "mitigasi", header: "Rencana Mitigasi", cell: ({ row }) => <p style={{ fontSize: 12.5, color: "#64748B", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.getValue("mitigasi") || "-"}</p> },
    {
      id: "actions", header: "Aksi",
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: 6 }}>
          {hasPermission("master.update") && (
            <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row.original)} style={{ width: 32, height: 32, padding: 0, borderColor: "#BAE6FD" }}><Edit size={13} style={{ color: "#0284C7" }} /></Button>
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
            <AlertOctagon size={18} style={{ color: "#EF4444" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Register Risiko</h3>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Kelola daftar risiko dan rencana mitigasinya.</p>
        </div>
        {hasPermission("master.create") && (
          <Button onClick={handleOpenAdd} style={{ background: "linear-gradient(135deg, #991B1B, #EF4444)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Plus size={15} /> Tambah Risiko
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 12 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#EF4444" }} />
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Memuat data...</p>
        </div>
      ) : <DataTable columns={columns} data={data} searchKey="nama" />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Risiko" : "Tambah Risiko Baru"}</DialogTitle>
            <DialogDescription>Isi informasi risiko dan rencana mitigasinya.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { id: "kode", label: "Kode", val: kode, set: setKode, placeholder: "Cth: RSK-001" },
              { id: "nama", label: "Nama Risiko", val: nama, set: setNama, placeholder: "Risiko..." },
              { id: "mitigasi", label: "Mitigasi", val: mitigasi, set: setMitigasi, placeholder: "Rencana penanganan risiko..." },
            ].map(f => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: 12 }}>
                <Label htmlFor={f.id} style={{ textAlign: "right", fontSize: 13 }}>{f.label}</Label>
                <Input id={f.id} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            {[
              { label: "Kategori", val: kategori, set: setKategori as (v: string) => void, opts: ["Strategis", "Operasional", "Kepatuhan", "Keuangan"] },
              { label: "Level", val: level, set: setLevel as (v: string) => void, opts: ["Rendah", "Sedang", "Tinggi", "Kritis"] },
            ].map(f => (
              <div key={f.label} style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: 12 }}>
                <Label style={{ textAlign: "right", fontSize: 13 }}>{f.label}</Label>
                <Select value={f.val} onValueChange={(val) => f.set(val || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{f.opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            <DialogFooter style={{ marginTop: 8 }}>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} style={{ background: "#EF4444", color: "white" }}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
