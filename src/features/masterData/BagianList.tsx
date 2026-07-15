import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/config/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { type Cabang } from "./CabangList";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

export interface Bagian {
  id: string;
  name: string;
  code: string;
  branchId: string;
}

const bagianSchema = z.object({
  name: z.string().min(3, "Nama bagian minimal 3 karakter"),
  code: z.string().min(2, "Kode bagian minimal 2 karakter"),
  branchId: z.string().min(1, "Cabang harus dipilih"),
});

type BagianFormValues = z.infer<typeof bagianSchema>;

export function BagianList() {
  const { hasPermission, user, profile } = useAuth();
  const [data, setData] = useState<Bagian[]>([]);
  const [branches, setBranches] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<BagianFormValues>({
    resolver: zodResolver(bagianSchema),
    defaultValues: { name: "", code: "", branchId: "" },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: depts, error: deptErr }, { data: brs, error: brErr }] = await Promise.all([
        supabase.from("departments").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("branches").select("*").is("deleted_at", null).order("name"),
      ]);
      if (deptErr) throw deptErr;
      if (brErr) throw brErr;

      setData((depts || []).map(d => ({ id: d.id, name: d.name, code: d.code, branchId: d.branch_id || "" })));
      setBranches((brs || []).map(b => ({ id: b.id, code: b.code, name: b.name, region: b.region, managerName: b.manager_name })));
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: BagianFormValues) => {
    try {
      const dbValues = { name: values.name, code: values.code };
      if (editingId) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        const { error } = await supabase.from("departments").update(dbValues).eq("id", editingId);
        if (error) throw error;
        await logAudit({ action: "UPDATE", collectionName: "departments", docId: editingId, changes: JSON.stringify(values), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data bagian berhasil diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const { data: newDoc, error } = await supabase.from("departments").insert(dbValues).select().single();
        if (error) throw error;
        await logAudit({ action: "CREATE", collectionName: "departments", docId: newDoc.id, changes: JSON.stringify(values), userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Bagian baru berhasil ditambahkan");
      }
      setIsDialogOpen(false); form.reset(); setEditingId(null); fetchData();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (bagian: Bagian) => {
    setEditingId(bagian.id);
    form.reset({ name: bagian.name, code: bagian.code, branchId: bagian.branchId });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        const { error } = await supabase.from("departments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        await logAudit({ action: "DELETE", collectionName: "departments", docId: id, userId: user?.id || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data bagian berhasil dihapus");
        fetchData();
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus data");
      }
    }
  };

  const columns: ColumnDef<Bagian>[] = [
    { accessorKey: "code", header: "Kode" },
    { accessorKey: "name", header: "Nama Bagian" },
    {
      accessorKey: "branchId",
      header: "Cabang",
      cell: ({ row }) => {
        const branch = branches.find(b => b.id === row.getValue("branchId"));
        return branch ? branch.name : "-";
      }
    },
    {
      id: "actions", header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {hasPermission("master.update") && (
            <Button variant="outline" size="icon" onClick={() => handleEdit(row.original)}>
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          {hasPermission("master.delete") && (
            <Button variant="outline" size="icon" onClick={() => handleDelete(row.original.id)}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 className="text-lg font-medium">Data Bagian / Departemen</h3>
        {hasPermission("master.create") && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { form.reset(); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Tambah Bagian</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit Bagian" : "Tambah Bagian Baru"}</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label htmlFor="code">Kode Bagian</Label>
                  <Input id="code" {...form.register("code")} placeholder="Cth: KEU" />
                  {form.formState.errors.code && <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label htmlFor="name">Nama Bagian</Label>
                  <Input id="name" {...form.register("name")} placeholder="Cth: Bagian Keuangan" />
                  {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label>Cabang</Label>
                  <Select onValueChange={(val) => form.setValue("branchId", val ?? "")} defaultValue={form.getValues("branchId") ?? ""}>
                    <SelectTrigger><SelectValue placeholder="Pilih Cabang" /></SelectTrigger>
                    <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {form.formState.errors.branchId && <p className="text-sm text-red-500">{form.formState.errors.branchId.message}</p>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16 }}>
                  <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="name" />
      )}
    </div>
  );
}
