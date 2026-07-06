import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, AlertTriangle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

export interface Temuan {
  id: string;
  kkaId: string;
  criteria: string;
  condition: string;
  cause: string;
  consequence: string;
  correctiveAction: string;
  status: "Open" | "In Progress" | "Closed";
  createdAt?: string;
}

const temuanSchema = z.object({
  kkaId: z.string().min(1, "KKA harus dipilih"),
  criteria: z.string().min(5, "Kriteria minimal 5 karakter"),
  condition: z.string().min(5, "Kondisi minimal 5 karakter"),
  cause: z.string().min(5, "Penyebab minimal 5 karakter"),
  consequence: z.string().min(5, "Akibat minimal 5 karakter"),
  correctiveAction: z.string().min(5, "Rekomendasi minimal 5 karakter"),
  status: z.enum(["Open", "In Progress", "Closed"]),
});

type TemuanFormValues = z.infer<typeof temuanSchema>;

export function TemuanList() {
  const [data, setData] = useState<Temuan[]>([]);
  const [kkas, setKkas] = useState<{ id: string, objective: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<TemuanFormValues>({
    resolver: zodResolver(temuanSchema),
    defaultValues: {
      kkaId: "", criteria: "", condition: "", cause: "", consequence: "", correctiveAction: "", status: "Open",
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const kkasSnapshot = await getDocs(collection(db, "kka"));
      const kkasData: { id: string, objective: string }[] = [];
      kkasSnapshot.forEach((d) => {
        kkasData.push({ id: d.id, objective: d.data().objective });
      });
      setKkas(kkasData);

      const querySnapshot = await getDocs(collection(db, "findings"));
      const findings: Temuan[] = [];
      querySnapshot.forEach((d) => { findings.push({ id: d.id, ...d.data() } as Temuan); });
      setData(findings);
    } catch {
      toast.error("Gagal mengambil data Temuan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: TemuanFormValues) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, "findings", editingId), { ...values });
        toast.success("Temuan berhasil diperbarui");
      } else {
        await addDoc(collection(db, "findings"), {
          ...values,
          createdAt: new Date().toISOString()
        });
        toast.success("Temuan baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (t: Temuan) => {
    setEditingId(t.id);
    form.reset({
      kkaId: t.kkaId || "", criteria: t.criteria, condition: t.condition, cause: t.cause,
      consequence: t.consequence, correctiveAction: t.correctiveAction, status: t.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus Temuan ini?")) {
      try {
        await deleteDoc(doc(db, "findings", id));
        toast.success("Temuan berhasil dihapus");
        fetchData();
      } catch {
        toast.error("Gagal menghapus data");
      }
    }
  };

  const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    Open:        { color: "#EF4444", bg: "#FEF2F2", icon: <AlertCircle size={11} /> },
    "In Progress": { color: "#D97706", bg: "#FEF9C3", icon: <Clock size={11} /> },
    Closed:      { color: "#0D9488", bg: "#CCFBF1", icon: <CheckCircle size={11} /> },
  };

  const columns: ColumnDef<Temuan>[] = [
    {
      accessorKey: "kkaId",
      header: "Referensi KKA",
      cell: ({ row }) => {
        const kId = row.getValue("kkaId") as string;
        const kka = kkas.find(k => k.id === kId);
        return (
          <div className="max-w-[160px]">
            <p className="text-xs font-semibold text-sky-700 truncate">{kka ? kka.objective : "-"}</p>
          </div>
        );
      }
    },
    {
      accessorKey: "condition",
      header: "Kondisi (Temuan)",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-sm text-slate-800 truncate">{row.getValue("condition")}</p>
        </div>
      ),
    },
    {
      accessorKey: "consequence",
      header: "Akibat / Dampak",
      cell: ({ row }) => (
        <div className="max-w-[180px]">
          <p className="text-sm text-slate-500 truncate">{row.getValue("consequence")}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status RTL",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const cfg = statusConfig[status] || { color: "#64748B", bg: "#F1F5F9", icon: null };
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.icon}
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const temuan = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(temuan)} className="h-8 w-8 p-0 border-sky-200 hover:bg-sky-50">
              <Edit className="h-3.5 w-3.5 text-sky-600" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDelete(temuan.id)} className="h-8 w-8 p-0 border-red-200 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const fieldLabels: Record<string, string> = {
    criteria: "Kriteria (Criteria)",
    condition: "Kondisi (Condition)",
    cause: "Penyebab (Cause)",
    consequence: "Akibat (Consequence)",
    correctiveAction: "Rekomendasi (Corrective Action)",
  };

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        className="rounded-2xl text-white relative overflow-hidden"
        style={{
          padding: 24,
          background: "linear-gradient(135deg, #7C2D12 0%, #B91C1C 60%, #DC2626 100%)",
          boxShadow: "0 4px 20px rgba(185,28,28,0.22)",
        }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <AlertTriangle size={18} style={{ color: "#FCA5A5" }} />
              <h2 className="text-xl font-bold">Temuan Audit (5C)</h2>
            </div>
            <p className="text-red-200 text-sm">Kelola temuan dan pantau status tindak lanjut (RTL).</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { form.reset(); setEditingId(null); }
          }}>
            <DialogTrigger asChild>
              <Button
                className="h-9 px-4 text-sm font-semibold gap-1.5 border-0"
                style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.28)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.18)"; }}
              >
                <Plus size={15} /> Catat Temuan Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold" style={{ color: "#7C2D12" }}>
                  {editingId ? "Edit Temuan" : "Catat Temuan Baru (5C)"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Referensi KKA</Label>
                  <Select
                    onValueChange={(val) => form.setValue("kkaId", val)}
                    defaultValue={form.getValues("kkaId")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih KKA..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kkas.map(k => (
                        <SelectItem key={k.id} value={k.id}>{k.objective}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.kkaId && (
                    <p className="text-xs text-red-500">{form.formState.errors.kkaId.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["criteria", "condition", "cause", "consequence"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label htmlFor={field} className="text-sm font-semibold text-slate-700">{fieldLabels[field]}</Label>
                      <Textarea id={field} {...form.register(field)} rows={3} className="resize-none text-sm" />
                      {form.formState.errors[field] && (
                        <p className="text-xs text-red-500">{form.formState.errors[field]?.message}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="correctiveAction" className="text-sm font-semibold text-slate-700">{fieldLabels.correctiveAction}</Label>
                  <Textarea id="correctiveAction" {...form.register("correctiveAction")} rows={3} className="resize-none text-sm" />
                  {form.formState.errors.correctiveAction && (
                    <p className="text-xs text-red-500">{form.formState.errors.correctiveAction?.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Status RTL</Label>
                  <Select
                    onValueChange={(val) => form.setValue("status", val as TemuanFormValues["status"])}
                    defaultValue={form.getValues("status")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    style={{ background: "linear-gradient(135deg, #7C2D12, #DC2626)" }}
                    className="text-white border-0"
                  >
                    {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Temuan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          { label: "Total Temuan", value: data.length, color: "#0369A1", bg: "#E0F2FE" },
          { label: "Terbuka", value: data.filter(d => d.status === "Open").length, color: "#EF4444", bg: "#FEF2F2" },
          { label: "In Progress", value: data.filter(d => d.status === "In Progress").length, color: "#D97706", bg: "#FEF9C3" },
          { label: "Selesai", value: data.filter(d => d.status === "Closed").length, color: "#0D9488", bg: "#CCFBF1" },
        ].map(chip => (
          <div
            key={chip.label}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: chip.color, background: chip.bg }}
          >
            <span style={{ fontSize: 16, fontWeight: "bold" }}>{chip.value}</span>
            {chip.label}
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: "1px solid #DBEAFE", boxShadow: "0 2px 12px rgba(12,74,110,0.06)" }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64, gap: 12 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#DC2626" }} />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <DataTable columns={columns} data={data} searchKey="condition" />
          </div>
        )}
      </div>
    </div>
  );
}
