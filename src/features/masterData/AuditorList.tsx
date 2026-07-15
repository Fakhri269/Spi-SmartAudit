import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ShieldCheck, Award } from "lucide-react";

interface Auditor {
  id: string;
  nip: string;
  name: string;
  jabatan: string;
  sertifikasi: string;
  level: "Junior" | "Senior" | "Lead";
}

export function AuditorList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [nip, setNip] = useState("");
  const [name, setName] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [sertifikasi, setSertifikasi] = useState("");
  const [level, setLevel] = useState<Auditor["level"]>("Junior");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("pegawai")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setData((rows || []).map(r => ({
        id: r.id, nip: r.nip, name: r.name,
        jabatan: r.jabatan, sertifikasi: r.sertifikasi || "", level: r.level || "Junior"
      })));
    } catch { toast.error("Gagal memuat data auditor"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => { setIsEdit(false); setCurrentId(""); setNip(""); setName(""); setJabatan(""); setSertifikasi(""); setLevel("Junior"); setOpen(true); };
  const handleOpenEdit = (a: Auditor) => { setIsEdit(true); setCurrentId(a.id); setNip(a.nip); setName(a.name); setJabatan(a.jabatan); setSertifikasi(a.sertifikasi); setLevel(a.level); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nip) { toast.error("NIP dan Nama wajib diisi"); return; }
    setIsSubmitting(true);
    try {
      const payload = { nip, name, jabatan, sertifikasi, level };
      if (isEdit) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        const { error } = await supabase.from("pegawai").update(payload).eq("id", currentId);
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "pegawai", docId: currentId, changes: JSON.stringify(payload), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data auditor diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const { data: newRow, error } = await supabase.from("pegawai").insert(payload).select().single();
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "pegawai", docId: newRow.id, changes: JSON.stringify(payload), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Auditor baru ditambahkan");
      }
      setOpen(false); fetchData();
    } catch (err: any) { toast.error(err.message || "Gagal menyimpan data"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (confirm("Hapus data auditor ini?")) {
      try {
        const { error } = await supabase.from("pegawai").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        await logAudit({ action: "DELETE", collectionName: "pegawai", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Auditor dihapus"); fetchData();
      } catch { toast.error("Gagal menghapus"); }
    }
  };

  const levelColors: Record<Auditor["level"], { color: string; bg: string }> = {
    Lead: { color: "#7C3AED", bg: "#EDE9FE" },
    Senior: { color: "#0369A1", bg: "#E0F2FE" },
    Junior: { color: "#64748B", bg: "#F1F5F9" },
  };

  const columns: ColumnDef<Auditor>[] = [
    { accessorKey: "nip", header: "NIP", cell: ({ row }) => <span style={{ fontFamily: "monospace", fontSize: 13, color: "#0369A1", fontWeight: 600 }}>{row.getValue("nip")}</span> },
    { accessorKey: "name", header: "Nama Auditor", cell: ({ row }) => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldCheck size={14} style={{ color: "#0369A1" }} /><span style={{ fontWeight: 600, color: "#0F172A" }}>{row.getValue("name")}</span></div> },
    { accessorKey: "jabatan", header: "Jabatan" },
    { accessorKey: "sertifikasi", header: "Sertifikasi", cell: ({ row }) => <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Award size={13} style={{ color: "#D97706" }} /><span style={{ fontSize: 13 }}>{row.getValue("sertifikasi") || "-"}</span></div> },
    {
      accessorKey: "level", header: "Level",
      cell: ({ row }) => {
        const lv = row.getValue("level") as Auditor["level"];
        const c = levelColors[lv] || levelColors.Junior;
        return <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, color: c.color, background: c.bg }}>{lv}</span>;
      }
    },
    {
      id: "actions", header: "Aksi",
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: 6 }}>
          {hasPermission("master.update") && <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row.original)} style={{ width: 32, height: 32, padding: 0, borderColor: "#BAE6FD" }}><Edit size={13} style={{ color: "#0369A1" }} /></Button>}
          {hasPermission("master.delete") && <Button variant="outline" size="sm" onClick={() => handleDelete(row.original.id)} style={{ width: 32, height: 32, padding: 0, borderColor: "#FECACA" }}><Trash2 size={13} style={{ color: "#EF4444" }} /></Button>}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={18} style={{ color: "#0369A1" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Data Auditor</h3>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Kelola data tim auditor internal SPI.</p>
        </div>
        {hasPermission("master.create") && (
          <Button onClick={handleOpenAdd} style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Plus size={15} /> Tambah Auditor
          </Button>
        )}
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 12 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0369A1" }} />
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Memuat data...</p>
        </div>
      ) : <DataTable columns={columns} data={data} searchKey="name" />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Auditor" : "Tambah Auditor Baru"}</DialogTitle>
            <DialogDescription>Isi data auditor internal SPI.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { id: "nip", label: "NIP", val: nip, set: setNip, placeholder: "Nomor Induk Pegawai" },
              { id: "name", label: "Nama Lengkap", val: name, set: setName, placeholder: "Nama auditor" },
              { id: "jabatan", label: "Jabatan", val: jabatan, set: setJabatan, placeholder: "Cth: Auditor Muda" },
              { id: "sertifikasi", label: "Sertifikasi", val: sertifikasi, set: setSertifikasi, placeholder: "Cth: QIA, CIA, CISA" },
            ].map(f => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 12 }}>
                <Label htmlFor={f.id} style={{ textAlign: "right", fontSize: 13 }}>{f.label}</Label>
                <Input id={f.id} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 12 }}>
              <Label style={{ textAlign: "right", fontSize: 13 }}>Level</Label>
              <Select value={level} onValueChange={v => setLevel(v as Auditor["level"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
