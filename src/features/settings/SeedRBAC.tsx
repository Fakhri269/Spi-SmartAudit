import { useState } from "react";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Button } from "@/components/ui/button";

const predefinedRoles = [
  {
    id: "administrator",
    name: "Administrator",
    description: "Hak akses penuh ke seluruh sistem",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view", "master.create", "master.update", "master.delete",
      "user.view", "user.create", "user.update", "user.delete",
      "role.view", "role.create", "role.update", "role.delete",
      "pkpt.view", "pkpt.create", "pkpt.update", "pkpt.delete", "pkpt.approve",
      "assignment.view", "assignment.create", "assignment.update", "assignment.delete",
      "kka.view", "kka.create", "kka.update", "kka.review", "kka.approve",
      "finding.view", "finding.create", "finding.update", "finding.review", "finding.approve",
      "rtl.view", "rtl.create", "rtl.update", "rtl.verify", "rtl.close",
      "evidence.upload", "evidence.download", "evidence.delete",
      "report.view", "report.export", "report.print",
      "auditTrail.view",
      "settings.view", "settings.update"
    ]
  },
  {
    id: "manager-spi",
    name: "Manager SPI",
    description: "Dapat menyetujui seluruh dokumen dan monitoring cabang",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "user.view",
      "pkpt.view", "pkpt.approve",
      "assignment.view", "assignment.approve",
      "kka.view", "kka.approve",
      "finding.view", "finding.approve",
      "rtl.view", "rtl.verify", "rtl.close",
      "evidence.download",
      "report.view", "report.export", "report.print"
    ]
  },
  {
    id: "ketua-tim",
    name: "Ketua Tim Audit",
    description: "Mengelola penugasan dan mereview hasil audit tim",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "user.view",
      "pkpt.view",
      "assignment.view", "assignment.create", "assignment.update",
      "kka.view", "kka.review",
      "finding.view", "finding.review",
      "rtl.view", "rtl.verify",
      "evidence.upload", "evidence.download",
      "report.view"
    ]
  },
  {
    id: "auditor",
    name: "Auditor",
    description: "Mengisi KKA dan Temuan Audit",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "assignment.view",
      "kka.view", "kka.create", "kka.update",
      "finding.view", "finding.create", "finding.update",
      "evidence.upload", "evidence.download", "evidence.delete"
    ]
  },
  {
    id: "kepala-cabang",
    name: "Kepala Cabang",
    description: "Melihat audit pada cabangnya dan memberikan tanggapan",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "finding.view",
      "rtl.view", "rtl.create", "rtl.update",
      "evidence.upload", "evidence.download",
      "report.view"
    ]
  },
  {
    id: "pic-cabang",
    name: "PIC Cabang",
    description: "Melihat temuan yang ditugaskan dan upload bukti RTL",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "finding.view",
      "rtl.view", "rtl.create", "rtl.update",
      "evidence.upload", "evidence.download"
    ]
  },
  {
    id: "direktur-utama",
    name: "Direktur Utama",
    description: "Executive dashboard dan laporan tingkat atas",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "report.view", "report.export", "report.print"
    ]
  },
  {
    id: "direksi",
    name: "Direksi",
    description: "Monitoring KPI dan Temuan",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "report.view", "report.export", "report.print"
    ]
  },
  {
    id: "kepala-bagian",
    name: "Kepala Bagian",
    description: "Melihat audit pada bagiannya dan upload RTL",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "finding.view",
      "rtl.view", "rtl.create", "rtl.update",
      "evidence.upload", "evidence.download"
    ]
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Hak akses baca saja",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "evidence.download"
    ]
  }
];

export function SeedRBAC() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleSeed = async () => {
    setLoading(true);
    setStatus("Seeding...");
    try {
      const rolesRef = collection(db, "roles");
      // Check if already seeded
      const snapshot = await getDocs(rolesRef);
      if (snapshot.size > 0 && !confirm("Roles already exist. Overwrite with default system roles?")) {
        setStatus("Cancelled.");
        setLoading(false);
        return;
      }

      for (const role of predefinedRoles) {
        await setDoc(doc(db, "roles", role.id), {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystemRole: role.isSystemRole
        });
      }
      
      setStatus("Seeding complete! Successfully created 10 roles.");
    } catch (error: any) {
      console.error(error);
      setStatus("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, background: "white", borderRadius: 12, border: "1px solid #E2E8F0" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600 }}>Bootstrap RBAC Rules</h3>
      <p style={{ margin: "0 0 24px", color: "#64748B", fontSize: 14 }}>
        This will initialize the database with 10 default roles and their permissions.
        Use this only during initial setup or to reset system roles.
      </p>
      <Button onClick={handleSeed} disabled={loading} style={{ background: "#0F172A", color: "white" }}>
        {loading ? "Processing..." : "Seed Roles"}
      </Button>
      {status && <p style={{ marginTop: 16, fontSize: 14, color: "#059669", fontWeight: 500 }}>{status}</p>}
    </div>
  );
}
