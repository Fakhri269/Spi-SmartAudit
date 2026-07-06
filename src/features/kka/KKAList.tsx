import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, FolderOpen, GitBranch } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

export interface KKA {
  id: string;
  auditId: string;
  branchId: string;
  objective: string;
  scope: string;
  status: "Draft" | "Review" | "Selesai";
  createdAt?: string;
}

const kkaSchema = z.object({
  branchId: z.string().min(1, "Cabang harus dipilih"),
  objective: z.string().min(5, "Tujuan minimal 5 karakter"),
  scope: z.string().min(5, "Ruang lingkup minimal 5 karakter"),
  status: z.enum(["Draft", "Review", "Selesai"]),
});

type KKAFormValues = z.infer<typeof kkaSchema>;

export function KKAList() {
  const [data, setData] = useState<KKA[]>([]);
  const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<KKAFormValues>({
    resolver: zodResolver(kkaSchema),
    defaultValues: { branchId: "", objective: "", scope: "", status: "Draft" },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchesSnapshot = await getDocs(collection(db, "branches"));
      const branchesData: { id: string, name: string }[] = [];
      branchesSnapshot.forEach((d) => {
        branchesData.push({ id: d.id, name: d.data().name });
      });
      setBranches(branchesData);

      const querySnapshot = await getDocs(collection(db, "kka"));
      const kkas: KKA[] = [];
      querySnapshot.forEach((d) => {
        kkas.push({ id: d.id, ...d.data() } as KKA);
      });
      setData(kkas);
    } catch (error) {
      console.error("Error fetching KKA: ", error);
      toast.error("Gagal mengambil data KKA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: KKAFormValues) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, "kka", editingId), { ...values });
        toast.success("KKA berhasil diperbarui");
      } else {
        await addDoc(collection(db, "kka"), {
          ...values,
          auditId: "",
          createdAt: new Date().toISOString()
        });
        toast.success("KKA baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving KKA:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (kka: KKA) => {
    setEditingId(kka.id);
    form.reset({ branchId: kka.branchId || "", objective: kka.objective, scope: kka.scope, status: kka.status });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus KKA ini?")) {
      try {
        await deleteDoc(doc(db, "kka", id));
        toast.success("KKA berhasil dihapus");
        fetchData();
      } catch {
        toast.error("Gagal menghapus data");
      }
    }
  };

  const statusConfig: Record<string, { color: string; bg: string }> = {
    Draft:   { color: "#64748B", bg: "#F1F5F9" },
    Review:  { color: "#D97706", bg: "#FEF9C3" },
    Selesai: { color: "#0D9488", bg: "#CCFBF1" },
  };

  const columns: ColumnDef<KKA>[] = [
    {
      accessorKey: "branchId",
      header: "Cabang",
      cell: ({ row }) => {
        const bId = row.getValue("branchId") as string;
        const branch = branches.find(b => b.id === bId);
        return (
          <div className="flex items-center gap-1.5">
            <GitBranch size={13} style={{ color: "#0369A1" }} />
            <span className="font-semibold text-sm text-slate-700">{branch ? branch.name : "-"}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "objective",
      header: "Tujuan Audit",
      cell: ({ row }) => (
        <div className="max-w-[220px]">
          <p className="text-sm text-slate-800 truncate">{row.getValue("objective")}</p>
        </div>
      ),
    },
    {
      accessorKey: "scope",
      header: "Ruang Lingkup",
      cell: ({ row }) => (
        <div className="max-w-[180px]">
          <p className="text-sm text-slate-500 truncate">{row.getValue("scope")}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const cfg = statusConfig[status] || { color: "#64748B", bg: "#F1F5F9" };
        return (
          <span
            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const kka = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(kka)} className="h-8 w-8 p-0 border-sky-200 hover:bg-sky-50">
              <Edit className="h-3.5 w-3.5 text-sky-600" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDelete(kka.id)} className="h-8 w-8 p-0 border-red-200 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        className="rounded-2xl text-white relative overflow-hidden"
        style={{
          padding: 24,
          background: "linear-gradient(135deg, #0C4A6E 0%, #0369A1 100%)",
          boxShadow: "0 4px 20px rgba(12,74,110,0.18)",
        }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <FolderOpen size={18} style={{ color: "#BAE6FD" }} />
              <h2 className="text-xl font-bold">Kertas Kerja Audit (KKA)</h2>
            </div>
            <p className="text-sky-200 text-sm">Kelola kertas kerja dan dokumentasi pengujian audit.</p>
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
                <Plus size={15} /> Buat KKA Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold" style={{ color: "#0C4A6E" }}>
                  {editingId ? "Edit KKA" : "Buat KKA Baru"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Cabang PDAM</Label>
                  <Select
                    onValueChange={(val) => form.setValue("branchId", val)}
                    defaultValue={form.getValues("branchId")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih Cabang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.branchId && (
                    <p className="text-xs text-red-500">{form.formState.errors.branchId.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="objective" className="text-sm font-semibold text-slate-700">Tujuan Audit</Label>
                  <Input id="objective" className="h-10" {...form.register("objective")} placeholder="Menilai kepatuhan prosedur..." />
                  {form.formState.errors.objective && (
                    <p className="text-xs text-red-500">{form.formState.errors.objective.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scope" className="text-sm font-semibold text-slate-700">Ruang Lingkup</Label>
                  <Textarea id="scope" {...form.register("scope")} placeholder="Periode pemeriksaan, area fisik..." rows={3} className="resize-none" />
                  {form.formState.errors.scope && (
                    <p className="text-xs text-red-500">{form.formState.errors.scope.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Status</Label>
                  <Select
                    onValueChange={(val) => form.setValue("status", val as KKAFormValues["status"])}
                    defaultValue={form.getValues("status")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)" }}
                    className="text-white border-0"
                  >
                    {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
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
          { label: "Total KKA", value: data.length, color: "#0369A1", bg: "#E0F2FE" },
          { label: "Selesai", value: data.filter(d => d.status === "Selesai").length, color: "#0D9488", bg: "#CCFBF1" },
          { label: "Review", value: data.filter(d => d.status === "Review").length, color: "#D97706", bg: "#FEF9C3" },
          { label: "Draft", value: data.filter(d => d.status === "Draft").length, color: "#64748B", bg: "#F1F5F9" },
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0369A1" }} />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <DataTable columns={columns} data={data} searchKey="objective" />
          </div>
        )}
      </div>
    </div>
  );
}
