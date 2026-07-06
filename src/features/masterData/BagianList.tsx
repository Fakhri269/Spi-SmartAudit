import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { type Cabang } from "./CabangList";
import { useAuth } from "@/features/auth/AuthContext";
import { logAudit } from "@/utils/audit";

export interface Bagian {
  id: string;
  name: string;
  branchId: string;
}

const bagianSchema = z.object({
  name: z.string().min(3, "Nama bagian minimal 3 karakter"),
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
    defaultValues: {
      name: "",
      branchId: "",
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bagianSnap, cabangSnap] = await Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "branches"))
      ]);
      
      const bgs: Bagian[] = [];
      bagianSnap.forEach((doc) => {
        bgs.push({ id: doc.id, ...doc.data() } as Bagian);
      });
      setData(bgs);

      const cbs: Cabang[] = [];
      cabangSnap.forEach((doc) => {
        cbs.push({ id: doc.id, ...doc.data() } as Cabang);
      });
      setBranches(cbs);

    } catch (error) {
      console.error("Error fetching data: ", error);
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (values: BagianFormValues) => {
    try {
      if (editingId) {
        if (!hasPermission("master.update")) throw new Error("Unauthorized");
        await updateDoc(doc(db, "departments", editingId), values);
        await logAudit({ action: "UPDATE", collectionName: "departments", docId: editingId, changes: JSON.stringify(values), userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data bagian berhasil diperbarui");
      } else {
        if (!hasPermission("master.create")) throw new Error("Unauthorized");
        const newDoc = await addDoc(collection(db, "departments"), values);
        await logAudit({ action: "CREATE", collectionName: "departments", docId: newDoc.id, changes: JSON.stringify(values), userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Bagian baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving department:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleEdit = (bagian: Bagian) => {
    setEditingId(bagian.id);
    form.reset({
      name: bagian.name,
      branchId: bagian.branchId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission("master.delete")) { toast.error("Anda tidak memiliki akses menghapus data"); return; }
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDoc(doc(db, "departments", id));
        await logAudit({ action: "DELETE", collectionName: "departments", docId: id, userId: user?.uid || "", userEmail: profile?.email || "", userName: profile?.displayName || "" });
        toast.success("Data bagian berhasil dihapus");
        fetchData();
      } catch (error) {
        console.error("Error deleting department:", error);
        toast.error("Gagal menghapus data");
      }
    }
  };

  const columns: ColumnDef<Bagian>[] = [
    {
      accessorKey: "name",
      header: "Nama Bagian",
    },
    {
      accessorKey: "branchId",
      header: "Cabang",
      cell: ({ row }) => {
        const branchId = row.getValue("branchId") as string;
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : "Unknown";
      }
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const bagian = row.original;
        return (
          <div className="flex items-center gap-2">
            {hasPermission("master.update") && (
              <Button variant="outline" size="icon" onClick={() => handleEdit(bagian)}>
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
            )}
            {hasPermission("master.delete") && (
              <Button variant="outline" size="icon" onClick={() => handleDelete(bagian.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
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
        <h3 className="text-lg font-medium">Data Bagian</h3>
        {hasPermission("master.create") && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              form.reset();
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Tambah Bagian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Bagian" : "Tambah Bagian Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label htmlFor="name">Nama Bagian</Label>
                  <Input id="name" {...form.register("name")} placeholder="Cth: Bagian Keuangan" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label htmlFor="branchId">Cabang</Label>
                  <Select 
                    onValueChange={(val) => form.setValue("branchId", val ?? "")} 
                    defaultValue={form.getValues("branchId") ?? ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.branchId && (
                    <p className="text-sm text-red-500">{form.formState.errors.branchId.message}</p>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16 }}>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="name" />
      )}
    </div>
  );
}
