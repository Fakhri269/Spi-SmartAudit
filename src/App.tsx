import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Login } from "./features/auth/Login";
import { AuthProvider } from "./features/auth/AuthContext";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { MasterDataLayout } from "./features/masterData/MasterDataLayout";
import { CabangList } from "./features/masterData/CabangList";
import { BagianList } from "./features/masterData/BagianList";
import { PKPTList } from "./features/pkpt/PKPTList";
import { KKAList } from "./features/kka/KKAList";
import { TemuanList } from "./features/findings/TemuanList";
import { SuratTugasList } from "./features/suratTugas/SuratTugasList";
import { LaporanAudit } from "./features/laporan/LaporanAudit";
import { PegawaiList } from "./features/masterData/PegawaiList";
import { AuditorList } from "./features/masterData/AuditorList";
import { SOPList } from "./features/masterData/SOPList";
import { RisikoList } from "./features/masterData/RisikoList";
import { Pengaturan } from "./features/settings/Pengaturan";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                
                <Route path="master-data" element={<MasterDataLayout />}>
                    <Route index element={<Navigate to="cabang" replace />} />
                    <Route path="cabang" element={<CabangList />} />
                    <Route path="bagian" element={<BagianList />} />
                    <Route path="pegawai" element={<PegawaiList />} />
                    <Route path="auditor" element={<AuditorList />} />
                    <Route path="sop" element={<SOPList />} />
                    <Route path="risiko" element={<RisikoList />} />
                </Route>

                <Route path="pkpt" element={<PKPTList />} />
                <Route path="surat-tugas" element={<SuratTugasList />} />
                <Route path="kka" element={<KKAList />} />
                <Route path="temuan" element={<TemuanList />} />
                <Route path="laporan" element={<LaporanAudit />} />
                <Route path="settings" element={<Pengaturan />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
