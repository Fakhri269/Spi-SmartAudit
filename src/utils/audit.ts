import { collection, addDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

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
    const auditData: AuditLog = {
      ...log,
      timestamp: new Date().toISOString(),
    };
    
    await addDoc(collection(db, "audit_trail"), auditData);
  } catch (error) {
    console.error("Failed to log audit trail:", error);
    // We don't throw here to avoid breaking the main operation if audit logging fails
  }
};
