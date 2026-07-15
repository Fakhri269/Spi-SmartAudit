import { supabase } from "@/config/supabase";

export interface AuditLog {
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "VERIFY" | "CLOSE" | "LOGIN";
  collectionName: string;
  docId: string;
  changes?: string; // JSON stringified details
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
}

export const logAudit = async (log: Omit<AuditLog, "timestamp">) => {
  try {
    const auditData = {
      action: log.action,
      collection_name: log.collectionName,
      doc_id: log.docId,
      changes: log.changes ? JSON.parse(log.changes) : null,
      user_id: log.userId || null,
      user_email: log.userEmail,
      user_name: log.userName,
    };
    
    await supabase.from("audit_trail").insert(auditData);
  } catch (error) {
    console.error("Failed to log audit trail:", error);
    // We don't throw here to avoid breaking the main operation if audit logging fails
  }
};
