import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, GitBranch, MapPin, User } from "lucide-react";
import { supabase } from "@/config/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

export interface Cabang {
  id: string;
  code: string;
  name: string;
  region: string;
  managerName: string;
}

const cabangSchema = z.object({
  code: z.string().min(2, "Kode cabang minimal 2 karakter"),
  name: z.string().min(3, "Nama cabang minimal 3 karakter"),
  region: z.string().min(3, "Wilayah minimal 3 karakter"),
  managerName: z.string().min(3, "Nama Manajer minimal 3 karakter"),
});

type CabangFormValues = z.infer<typeof cabangSchema>;

export function CabangList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CabangFormValues>({
    resolver: zodResolver(cabangSchema),
    defaultValues: { code: "", name: "", region: "", managerName: "" },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: branches, error } = await supabase.from("branches").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      
      // Supabase returns an array of objects directly
      const formattedBranches = branches.map(b => ({
        id: b.id,
        code: b.code,
        name: b.name,
        region: b.region,
        managerName: b.manager_name
      })) as Cabang[];
      
      setData(formattedBranches);
    } catch (error) {
      console.error("Error fetching branches: ", error);
      toast.error("Gagal mengambil data cabang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (values: CabangFormValues) => {
    try {
      const dbValues = {
        code: values.code,
        name: values.name,
        region: values.region,
        manager_name: values.managerName
      };

      if (editingId) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        const { error } = await supabase.from("branches").update(dbValues).eq("id", editingId);
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "branches", docId: editingId, changes: JSON.stringify(values), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data cabang berhasil diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const { data: newDoc, error } = await supabase.from("branches").insert(dbValues).select().single();
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "branches", docId: newDoc.id, changes: JSON.stringify(values), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Cabang baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving branch:", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (cabang: Cabang) => {
    setEditingId(cabang.id);
    form.reset({
      code: cabang.code,
      name: cabang.name,
      region: cabang.region,
      managerName: cabang.managerName,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        const { error } = await supabase.from("branches").delete().eq("id", id);
        if (error) throw error;
        await logAudit({ action: "DELETE", collectionName: "branches", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data cabang berhasil dihapus");
        fetchData();
      } catch (error: any) {
        console.error("Error deleting branch:", error);
        toast.error(error.message || "Gagal menghapus data");
      }
    }
  };

  const columns: ColumnDef<Cabang>[] = [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{ background: "#E0F2FE", color: "#0284C7" }}
        >
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Cabang",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <GitBranch size={14} style={{ color: "#0284C7" }} />
          <span className="font-semibold text-slate-800">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "region",
      header: "Wilayah",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={13} style={{ color: "#94A3B8" }} />
          <span className="text-sm text-slate-600">{row.getValue("region")}</span>
        </div>
      ),
    },
    {
      accessorKey: "managerName",
      header: "Manajer / Kacab",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <User size={13} style={{ color: "#94A3B8" }} />
          <span className="text-sm text-slate-600">{row.getValue("managerName")}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const cabang = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {hasPermission("master.update") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(cabang)}
                className="h-8 w-8 p-0 border-sky-200 hover:bg-sky-50"
              >
                <Edit className="h-3.5 w-3.5 text-sky-600" />
              </Button>
            )}
            {hasPermission("master.delete") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(cabang.id)}
                className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 className="text-base font-bold text-slate-800">Data Cabang PDAM</h3>
          <p className="text-sm text-slate-500 mt-0.5">Kelola data seluruh cabang dan unit pelayanan.</p>
        </div>
        {hasPermission("master.create") && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { form.reset(); setEditingId(null); }
          }}>
            <DialogTrigger asChild>
              <Button
                className="h-9 px-4 text-sm font-semibold gap-1.5 text-white border-0"
                style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}
              >
                <Plus size={14} /> Tambah Cabang
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold" style={{ color: "#0EA5E9" }}>
                  {editingId ? "Edit Cabang" : "Tambah Cabang Baru"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-sm font-semibold text-slate-700">Kode Cabang</Label>
                    <Input id="code" className="h-10" {...form.register("code")} placeholder="CBG-01" />
                    {form.formState.errors.code && (
                      <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
                    )}
                  </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label htmlFor="region" className="text-sm font-semibold text-slate-700">Wilayah</Label>
                    <Input id="region" className="h-10" {...form.register("region")} placeholder="Wilayah 1" />
                    {form.formState.errors.region && (
                      <p className="text-xs text-red-500">{form.formState.errors.region.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Nama Cabang</Label>
                  <Input id="name" className="h-10" {...form.register("name")} placeholder="Cabang Cibinong" />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label htmlFor="managerName" className="text-sm font-semibold text-slate-700">Nama Manajer / Kacab</Label>
                  <Input id="managerName" className="h-10" {...form.register("managerName")} placeholder="Nama Manajer" />
                  {form.formState.errors.managerName && (
                    <p className="text-xs text-red-500">{form.formState.errors.managerName.message}</p>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8 }}>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="text-white border-0"
                    style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}
                  >
                    {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, gap: 12 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0284C7" }} />
          <p className="text-sm text-slate-500">Memuat data cabang...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="name" />
      )}
    </div>
  );
}
