import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileSignature, ClipboardList, CheckCircle, Clock, FileEdit } from "lucide-react";
import { supabase } from "@/config/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

export interface PKPT {
  id: string;
  tahun: string;
  judul: string;
  kategori: string;
  status: string;
}

const pkptSchema = z.object({
  tahun: z.string().min(4, "Tahun wajib diisi"),
  judul: z.string().min(5, "Judul minimal 5 karakter"),
  kategori: z.string().min(1, "Kategori wajib dipilih"),
  status: z.enum(["Draft", "Review", "Approved"]),
});

type PKPTFormValues = z.infer<typeof pkptSchema>;

export function PKPTList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<PKPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<PKPTFormValues>({
    resolver: zodResolver(pkptSchema),
    defaultValues: { tahun: String(new Date().getFullYear()), judul: "", kategori: "Reguler", status: "Draft" },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("pkpt")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setData((rows || []).map(r => ({ id: r.id, tahun: r.tahun, judul: r.judul, kategori: r.kategori, status: r.status })));
    } catch (error) {
      toast.error("Gagal mengambil data PKPT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: PKPTFormValues) => {
    try {
      const dbValues = { tahun: values.tahun, judul: values.judul, kategori: values.kategori, status: values.status };
      if (editingId) {
        if (!hasPermission("pkpt.update")) throw new Error("Unauthorized");
        const { error } = await supabase.from("pkpt").update(dbValues).eq("id", editingId);
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "pkpt", docId: editingId, changes: JSON.stringify(values), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("PKPT berhasil diperbarui");
      } else {
        if (!hasPermission("pkpt.create")) throw new Error("Unauthorized");
        const { data: newRow, error } = await supabase.from("pkpt").insert(dbValues).select().single();
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "pkpt", docId: newRow.id, changes: JSON.stringify(values), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("PKPT baru berhasil ditambahkan");
      }
      setIsDialogOpen(false); form.reset(); setEditingId(null); fetchData();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (pkpt: PKPT) => {
    setEditingId(pkpt.id);
    form.reset({ tahun: pkpt.tahun, judul: pkpt.judul, kategori: pkpt.kategori, status: pkpt.status as PKPTFormValues["status"] });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("pkpt.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (window.confirm("Apakah Anda yakin ingin menghapus PKPT ini?")) {
      try {
        const { error } = await supabase.from("pkpt").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        await logAudit({ action: "DELETE", collectionName: "pkpt", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("PKPT berhasil dihapus"); fetchData();
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus data");
      }
    }
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    Draft:    { color: "#64748B", bg: "#F1F5F9", label: "Draft" },
    Review:   { color: "#D97706", bg: "#FEF9C3", label: "Review" },
    Approved: { color: "#0D9488", bg: "#CCFBF1", label: "Disetujui" },
  };

  const columns: ColumnDef<PKPT>[] = [
    { accessorKey: "tahun", header: "Tahun", cell: ({ row }) => <span className="font-bold text-sm" style={{ color: "#0284C7" }}>{row.getValue("tahun")}</span> },
    { accessorKey: "judul", header: "Judul PKPT", cell: ({ row }) => <div className="font-medium text-slate-800">{row.getValue("judul")}</div> },
    { accessorKey: "kategori", header: "Kategori" },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const cfg = statusConfig[status] || { color: "#64748B", bg: "#F1F5F9", label: status };
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: cfg.color, background: cfg.bg }}>
            {status === "Approved" && <CheckCircle size={11} />}
            {status === "Review" && <Clock size={11} />}
            {status === "Draft" && <FileEdit size={11} />}
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: "actions", header: "Aksi",
      cell: ({ row }) => {
        const pkpt = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {hasPermission("assignment.create") && (
              <Button variant="outline" size="sm" title="Buat Surat Tugas" className="h-8 w-8 p-0 border-emerald-200 hover:bg-emerald-50">
                <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
              </Button>
            )}
            {hasPermission("pkpt.update") && (
              <Button variant="outline" size="sm" onClick={() => handleEdit(pkpt)} className="h-8 w-8 p-0 border-sky-200 hover:bg-sky-50">
                <Edit className="h-3.5 w-3.5 text-sky-600" />
              </Button>
            )}
            {hasPermission("pkpt.delete") && (
              <Button variant="outline" size="sm" onClick={() => handleDelete(pkpt.id)} className="h-8 w-8 p-0 border-red-200 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const totalApproved = data.filter(d => d.status === "Approved").length;
  const totalReview = data.filter(d => d.status === "Review").length;
  const totalDraft = data.filter(d => d.status === "Draft").length;

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="rounded-2xl text-white relative overflow-hidden" style={{ padding: 24, background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", boxShadow: "0 4px 20px rgba(12,74,110,0.18)" }}>
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <ClipboardList size={18} style={{ color: "#BAE6FD" }} />
              <h2 className="text-xl font-bold">Program Kerja Pengawasan Tahunan</h2>
            </div>
            <p className="text-sky-200 text-sm">Rencanakan dan kelola agenda audit tahunan.</p>
          </div>
          {hasPermission("pkpt.create") && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { form.reset(); setEditingId(null); } }}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 text-sm font-semibold gap-1.5 border-0" style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                  <Plus size={15} /> Buat PKPT Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold" style={{ color: "#0EA5E9" }}>{editingId ? "Edit PKPT" : "Buat PKPT Baru"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Tahun</Label>
                    <Input className="h-10" {...form.register("tahun")} placeholder="Cth: 2026" />
                    {form.formState.errors.tahun && <p className="text-xs text-red-500">{form.formState.errors.tahun.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Judul PKPT</Label>
                    <Input id="judul" className="h-10" {...form.register("judul")} placeholder="Cth: PKPT SPI Tahun 2026" />
                    {form.formState.errors.judul && <p className="text-xs text-red-500">{form.formState.errors.judul.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Kategori</Label>
                    <Select onValueChange={(val) => form.setValue("kategori", val || "")} defaultValue={form.getValues("kategori")}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reguler">Reguler</SelectItem>
                        <SelectItem value="Khusus">Khusus</SelectItem>
                        <SelectItem value="Investigasi">Investigasi</SelectItem>
                        <SelectItem value="Kepatuhan">Kepatuhan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Status</Label>
                    <Select onValueChange={(val) => form.setValue("status", val as PKPTFormValues["status"])} defaultValue={form.getValues("status")}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        {hasPermission("pkpt.approve") && <SelectItem value="Approved">Approved</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting} style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }} className="text-white border-0">
                      {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          { label: "Total PKPT", value: data.length, color: "#0284C7", bg: "#E0F2FE" },
          { label: "Disetujui", value: totalApproved, color: "#0D9488", bg: "#CCFBF1" },
          { label: "Review", value: totalReview, color: "#D97706", bg: "#FEF9C3" },
          { label: "Draft", value: totalDraft, color: "#64748B", bg: "#F1F5F9" },
        ].map(chip => (
          <div key={chip.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: chip.color, background: chip.bg }}>
            <span style={{ fontSize: 16, fontWeight: "bold" }}>{chip.value}</span>
            {chip.label}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #DBEAFE", boxShadow: "0 2px 12px rgba(12,74,110,0.06)" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64, gap: 12 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0284C7" }} />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <DataTable columns={columns} data={data} searchKey="judul" />
          </div>
        )}
      </div>
    </div>
  );
}
