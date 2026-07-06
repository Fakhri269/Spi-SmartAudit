import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, BarChart3, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch {
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #020617 0%, #082F49 50%, #0369A1 100%)",
          padding: "3rem",
        }}
      >
        {/* Glow Effects */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: "#38BDF8" }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: "#22D3EE" }}
        />

        {/* Giant Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none w-[120%] flex justify-center">
           <img
              src="/logo-tirta-kahuripan.svg"
              alt="Watermark"
              className="w-full h-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
        </div>

        {/* Abstract Liquid Waves / Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#bae6fd 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

        {/* Top left text */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <ShieldCheck size={20} className="text-sky-300" />
          </div>
          <p className="text-sky-200 font-bold text-xs tracking-[0.2em] uppercase">
            Internal Audit System
          </p>
        </div>

        {/* Main Center Content */}
        <div className="relative z-10 w-full flex flex-col justify-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 backdrop-blur-sm w-fit">
            <p className="text-sky-300 text-xs font-semibold tracking-wide">
              Secure Enterprise Portal
            </p>
          </div>
          <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight drop-shadow-lg">
            SPI <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-300">SmartAudit</span>
          </h1>
          <p className="text-lg xl:text-xl font-medium leading-relaxed max-w-[400px]" style={{ color: "#E0F2FE" }}>
            Sistem Informasi Audit Internal untuk <strong className="text-white">PERUMDA Air Minum Tirta Kahuripan</strong>.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-sm font-medium text-sky-200/60">
            &copy; {new Date().getFullYear()} Satuan Pengawas Internal
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-[400px]">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-10">
            <img
              src="/logo-tirta-kahuripan.svg"
              alt="Logo Tirta Kahuripan"
              className="h-16 w-auto object-contain mb-6"
            />
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              Selamat Datang
            </h2>
            <p className="text-base text-slate-500 font-medium text-center">
              Silakan masuk dengan akun Anda
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 flex items-start gap-3 p-4 rounded-xl text-sm font-medium"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700">
                Email
              </Label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@pdam-kahuripan.co.id"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="!pl-11 h-12 rounded-xl border-slate-300 bg-slate-50 focus-visible:ring-sky-600 focus-visible:ring-offset-0 focus-visible:bg-white text-base shadow-sm"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">
                  Password
                </Label>
                <a href="#" className="text-sm font-bold text-sky-700 hover:underline">
                  Lupa password?
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="!pl-11 !pr-12 h-12 rounded-xl border-slate-300 bg-slate-50 focus-visible:ring-sky-600 focus-visible:ring-offset-0 focus-visible:bg-white text-base tracking-wider shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-bold mt-8 shadow-lg shadow-sky-900/20 hover:shadow-sky-900/30 transition-all border-0"
              style={{
                background: "linear-gradient(135deg, #0C4A6E 0%, #0369A1 100%)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </Button>
          </form>
        </div>

        {/* Mobile footer */}
        <p className="lg:hidden text-center text-sm font-medium text-slate-400 mt-12">
          &copy; {new Date().getFullYear()} SPI · PERUMDA Tirta Kahuripan
        </p>
      </div>
    </div>
  );
}
