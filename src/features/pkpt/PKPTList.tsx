import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileSignature, ClipboardList, CheckCircle, Clock, FileEdit } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export interface PKPT {
  id: string;
  year: number;
  title: string;
  status: "Draft" | "Review" | "Approved";
}

const pkptSchema = z.object({
  year: z.number().min(2020).max(2100),
  title: z.string().min(5, "Judul minimal 5 karakter"),
  status: z.enum(["Draft", "Review", "Approved"]),
});

type PKPTFormValues = z.infer<typeof pkptSchema>;

export function PKPTList() {
  const [data, setData] = useState<PKPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<PKPTFormValues>({
    resolver: zodResolver(pkptSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      title: "",
      status: "Draft",
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "pkpt"));
      const pkpts: PKPT[] = [];
      querySnapshot.forEach((d) => {
        pkpts.push({ id: d.id, ...d.data() } as PKPT);
      });
      setData(pkpts);
    } catch (error) {
      console.error("Error fetching PKPT: ", error);
      toast.error("Gagal mengambil data PKPT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (values: PKPTFormValues) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, "pkpt", editingId), { ...values });
        toast.success("PKPT berhasil diperbarui");
      } else {
        await addDoc(collection(db, "pkpt"), { ...values });
        toast.success("PKPT baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving PKPT:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (pkpt: PKPT) => {
    setEditingId(pkpt.id);
    form.reset({ year: pkpt.year, title: pkpt.title, status: pkpt.status });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus PKPT ini?")) {
      try {
        await deleteDoc(doc(db, "pkpt", id));
        toast.success("PKPT berhasil dihapus");
        fetchData();
      } catch (error) {
        console.error("Error deleting PKPT:", error);
        toast.error("Gagal menghapus data");
      }
    }
  };

  const statusConfig = {
    Draft:    { color: "#64748B", bg: "#F1F5F9", label: "Draft" },
    Review:   { color: "#D97706", bg: "#FEF9C3", label: "Review" },
    Approved: { color: "#0D9488", bg: "#CCFBF1", label: "Disetujui" },
  };

  const columns: ColumnDef<PKPT>[] = [
    {
      accessorKey: "year",
      header: "Tahun",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: "#0369A1" }}>
          {row.getValue("year")}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Judul PKPT",
      cell: ({ row }) => (
        <div className="font-medium text-slate-800">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig;
        const cfg = statusConfig[status] || { color: "#64748B", bg: "#F1F5F9", label: status };
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {status === "Approved" && <CheckCircle size={11} />}
            {status === "Review" && <Clock size={11} />}
            {status === "Draft" && <FileEdit size={11} />}
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const pkpt = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              title="Buat Surat Tugas"
              className="h-8 w-8 p-0 border-emerald-200 hover:bg-emerald-50"
            >
              <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(pkpt)}
              className="h-8 w-8 p-0 border-sky-200 hover:bg-sky-50"
            >
              <Edit className="h-3.5 w-3.5 text-sky-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(pkpt.id)}
              className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
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
      {/* Page Header */}
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
              <ClipboardList size={18} style={{ color: "#BAE6FD" }} />
              <h2 className="text-xl font-bold">Program Kerja Pengawasan Tahunan</h2>
            </div>
            <p className="text-sky-200 text-sm">Rencanakan dan kelola agenda audit tahunan.</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { form.reset(); setEditingId(null); }
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="h-9 px-4 text-sm font-semibold gap-1.5 border-0"
                style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.28)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.18)"; }}
              >
                <Plus size={15} /> Buat PKPT Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold" style={{ color: "#0C4A6E" }}>
                  {editingId ? "Edit PKPT" : "Buat PKPT Baru"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="year" className="text-sm font-semibold text-slate-700">Tahun</Label>
                  <Input
                    id="year"
                    type="number"
                    className="h-10"
                    {...form.register("year", { valueAsNumber: true })}
                  />
                  {form.formState.errors.year && (
                    <p className="text-xs text-red-500">{form.formState.errors.year.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Judul PKPT</Label>
                  <Input id="title" className="h-10" {...form.register("title")} placeholder="Cth: PKPT SPI Tahun 2026" />
                  {form.formState.errors.title && (
                    <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Status</Label>
                  <Select
                    onValueChange={(val) => form.setValue("status", val as PKPTFormValues["status"])}
                    defaultValue={form.getValues("status")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
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
          { label: "Total PKPT", value: data.length, color: "#0369A1", bg: "#E0F2FE" },
          { label: "Disetujui", value: totalApproved, color: "#0D9488", bg: "#CCFBF1" },
          { label: "Review", value: totalReview, color: "#D97706", bg: "#FEF9C3" },
          { label: "Draft", value: totalDraft, color: "#64748B", bg: "#F1F5F9" },
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
            <DataTable columns={columns} data={data} searchKey="title" />
          </div>
        )}
      </div>
    </div>
  );
}
