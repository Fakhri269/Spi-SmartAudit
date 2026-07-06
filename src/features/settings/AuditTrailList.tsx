import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";
import { type AuditLog } from "@/utils/audit";

export function AuditTrailList() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<(AuditLog & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "audit_trail"), orderBy("timestamp", "desc"), limit(100));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog & { id: string })));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (!hasPermission("auditTrail.view")) {
    return <div style={{ padding: 24, textAlign: "center", color: "#EF4444" }}><ShieldAlert size={48} style={{ margin: "0 auto 16px" }}/> Anda tidak memiliki akses ke halaman ini.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: 0 }}>Audit Trail</h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>Log histori seluruh perubahan data di dalam sistem.</p>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Koleksi</TableHead>
              <TableHead>ID Dokumen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} style={{ textAlign: "center" }}>Memuat data...</TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell style={{ whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleString("id-ID")}</TableCell>
                <TableCell>
                  <div style={{ fontWeight: 500 }}>{log.userName}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{log.userEmail}</div>
                </TableCell>
                <TableCell>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: 6, 
                    fontSize: 12, 
                    fontWeight: 600,
                    background: log.action === "CREATE" ? "#D1FAE5" : log.action === "UPDATE" ? "#FEF3C7" : log.action === "DELETE" ? "#FEE2E2" : "#E0E7FF",
                    color: log.action === "CREATE" ? "#059669" : log.action === "UPDATE" ? "#D97706" : log.action === "DELETE" ? "#DC2626" : "#4F46E5"
                  }}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell style={{ fontWeight: 500, color: "#475569" }}>{log.collectionName}</TableCell>
                <TableCell style={{ fontSize: 12, fontFamily: "monospace", color: "#94A3B8" }}>{log.docId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
