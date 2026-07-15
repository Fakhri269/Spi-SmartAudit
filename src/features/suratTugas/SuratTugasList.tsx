import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileSignature, Calendar, Users } from "lucide-react";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

export interface SuratTugas {
  id: string;
  nomor: string;
  tanggal: string;
  timAudit: string;
  objekAudit: string;
}

export function SuratTugasList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<SuratTugas[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState("");
  
  // Form states
  const [nomor, setNomor] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [timAudit, setTimAudit] = useState("");
  const [objekAudit, setObjekAudit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: suratList, error } = await supabase.from("surat_tugas").select("*").is("deleted_at", null);
      if (error) throw error;
      setData((suratList || []).map(d => ({
        id: d.id,
        nomor: d.nomor,
        tanggal: d.tanggal,
        timAudit: d.tim_audit,
        objekAudit: d.objek_audit
      })));
    } catch (error) {
      console.error("Error fetching surat tugas: ", error);
      // Fallback empty data to avoid crashing if permissions are wrong
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setCurrentId("");
    setNomor("");
    setTanggal(new Date().toISOString().split("T")[0]);
    setTimAudit("");
    setObjekAudit("");
    setOpen(true);
  };

  const handleOpenEdit = (surat: SuratTugas) => {
    setIsEdit(true);
    setCurrentId(surat.id);
    setNomor(surat.nomor);
    setTanggal(surat.tanggal);
    setTimAudit(surat.timAudit);
    setObjekAudit(surat.objekAudit);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomor || !tanggal || !timAudit || !objekAudit) {
      toast.error("Mohon lengkapi semua data");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { nomor, tanggal, tim_audit: timAudit, objek_audit: objekAudit };
      if (isEdit) {
        if (!hasPermission("assignment.update")) throw new Error("Unauthorized");
        const { error } = await supabase.from("surat_tugas").update(payload).eq("id", currentId);
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "surat_tugas", docId: currentId, changes: JSON.stringify(payload), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Surat Tugas berhasil diperbarui");
      } else {
        if (!hasPermission("assignment.create")) throw new Error("Unauthorized");
        const { data: newDoc, error } = await supabase.from("surat_tugas").insert([payload]).select().single();
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "surat_tugas", docId: newDoc.id, changes: JSON.stringify(payload), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Surat Tugas berhasil ditambahkan");
      }
      setOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("assignment.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (confirm("Apakah Anda yakin ingin menghapus surat tugas ini?")) {
      try {
        const { error } = await supabase.from("surat_tugas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        await logAudit({ action: "DELETE", collectionName: "surat_tugas", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Surat Tugas berhasil dihapus");
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus data");
      }
    }
  };

  const columns: ColumnDef<SuratTugas>[] = [
    {
      accessorKey: "nomor",
      header: "Nomor Surat",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileSignature size={15} style={{ color: "#0369A1" }} />
          <span className="font-semibold" style={{ color: "#0F172A" }}>{row.getValue("nomor")}</span>
        </div>
      ),
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={14} style={{ color: "#94A3B8" }} />
          <span className="text-sm" style={{ color: "#475569" }}>{row.getValue("tanggal")}</span>
        </div>
      ),
    },
    {
      accessorKey: "timAudit",
      header: "Tim Audit",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Users size={14} style={{ color: "#94A3B8" }} />
          <span className="text-sm" style={{ color: "#475569" }}>{row.getValue("timAudit")}</span>
        </div>
      ),
    },
    {
      accessorKey: "objekAudit",
      header: "Objek Audit",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("objekAudit")}</span>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const surat = row.original;
        return (
          <div className="flex items-center gap-2">
            {hasPermission("assignment.update") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(surat)}
                className="h-8 w-8 p-0"
                style={{ borderColor: "#BAE6FD" }}
              >
                <Edit size={14} style={{ color: "#0369A1" }} />
              </Button>
            )}
            {hasPermission("assignment.delete") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(surat.id)}
                className="h-8 w-8 p-0"
                style={{ borderColor: "#FECACA" }}
              >
                <Trash2 size={14} style={{ color: "#EF4444" }} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        className="rounded-2xl text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", boxShadow: "0 8px 24px rgba(3,105,161,0.2)", padding: 24 }}
      >
        <div className="absolute -right-10 -top-10 rounded-full" style={{ width: 150, height: 150, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 className="text-xl font-bold mb-1">Surat Tugas Audit</h3>
            <p className="text-sm opacity-80">Kelola dan terbitkan Surat Tugas untuk tim pemeriksa</p>
          </div>
          {hasPermission("assignment.create") && (
            <Button
              className="border-0 shadow-lg"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", color: "white" }}
              onClick={handleOpenAdd}
            >
              <Plus size={16} className="mr-2" />
              Buat Surat Tugas
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl" style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", padding: 24 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, gap: 12 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0369A1" }} />
            <p className="text-sm text-slate-500">Memuat data surat tugas...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={data} searchKey="nomor" />
        )}
      </div>

      {/* Modal Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Surat Tugas" : "Buat Surat Tugas Baru"}</DialogTitle>
            <DialogDescription>Masukkan detail surat tugas di bawah ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nomor" className="text-right">Nomor Surat</Label>
              <Input
                id="nomor"
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                className="col-span-3"
                placeholder="Contoh: ST-001/SPI/2026"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tanggal" className="text-right">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timAudit" className="text-right">Tim Audit</Label>
              <Input
                id="timAudit"
                value={timAudit}
                onChange={(e) => setTimAudit(e.target.value)}
                className="col-span-3"
                placeholder="Contoh: Tim Alpha"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="objekAudit" className="text-right">Objek Audit</Label>
              <Input
                id="objekAudit"
                value={objekAudit}
                onChange={(e) => setObjekAudit(e.target.value)}
                className="col-span-3"
                placeholder="Contoh: Kantor Cabang Utama"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} style={{ background: "#0369A1" }}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
