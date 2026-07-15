import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/features/auth/AuthContext";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";

interface AuditLog {
  id: string;
  module: string;
  action: string;
  doc_id: string;
  created_at: string;
  created_by: string;
  users?: { display_name: string; email: string } | null;
}

export function AuditTrailList() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_trail")
        .select("id, module, action, doc_id, created_at, created_by, users(display_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs((data || []) as unknown as AuditLog[]);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  if (!hasPermission("auditTrail.view")) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#EF4444" }}>
        <ShieldAlert size={48} style={{ margin: "0 auto 16px" }} />
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  const actionColor: Record<string, { bg: string; color: string }> = {
    CREATE: { bg: "#D1FAE5", color: "#059669" },
    UPDATE: { bg: "#FEF3C7", color: "#D97706" },
    DELETE: { bg: "#FEE2E2", color: "#DC2626" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: 0 }}>Audit Trail</h2>
        <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>Log histori seluruh perubahan data di dalam sistem.</p>
      </div>
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Modul</TableHead>
              <TableHead>ID Dokumen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} style={{ textAlign: "center" }}>Memuat data...</TableCell></TableRow>
            ) : logs.map((log) => {
              const ac = actionColor[log.action] || { bg: "#E0E7FF", color: "#4F46E5" };
              return (
                <TableRow key={log.id}>
                  <TableCell style={{ whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{log.users?.display_name || "-"}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{log.users?.email}</div>
                  </TableCell>
                  <TableCell>
                    <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: ac.bg, color: ac.color }}>{log.action}</span>
                  </TableCell>
                  <TableCell style={{ fontWeight: 500, color: "#475569" }}>{log.module}</TableCell>
                  <TableCell style={{ fontSize: 12, fontFamily: "monospace", color: "#94A3B8" }}>{log.doc_id}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
