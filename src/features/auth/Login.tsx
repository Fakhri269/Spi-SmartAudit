import { useState } from "react";
import { supabase } from "@/config/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Email atau password salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#EBEEF3]">
      {/* Entrance keyframes — kept local to this component */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .anim-item {
          opacity: 0;
          animation: fadeSlideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-error {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both,
            fadeIn 0.3s ease-out both;
        }
        .illustration-in {
          opacity: 0;
          animation: fadeIn 0.9s ease-out 0.1s forwards;
        }
      `}</style>

      {/* ── LEFT — illustration ────────────────────────────────────── */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] items-center justify-center relative overflow-hidden">
        <img
          src="/LoginPage.png"
          alt=""
          className="illustration-in w-full h-auto max-h-[100vh] object-contain object-left"
        />
      </div>

      {/* ── RIGHT — form ───────────────────────────────────────────── */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Title */}
          <h1
            className="anim-item text-[28px] font-bold text-slate-800 text-center tracking-tight mb-2"
            style={{ animationDelay: "0.05s" }}
          >
            Smart Audit SPI
          </h1>
          <p
            className="anim-item text-sm text-slate-400 text-center mb-11"
            style={{ animationDelay: "0.12s" }}
          >
            Masuk untuk melanjutkan ke akun Anda
          </p>

          {error && (
            <div className="anim-error mb-6 flex items-start gap-2.5 p-3 rounded-lg text-sm bg-red-50 border border-red-100 text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="anim-item mb-5" style={{ animationDelay: "0.18s" }}>
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-slate-600 mb-1.5 block"
              >
                Email
              </Label>
              <div className="relative group">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-focus-within:text-sky-500"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="!pl-10 h-[52px] rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-4 focus-visible:ring-sky-500/10 focus-visible:border-sky-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="anim-item mb-2" style={{ animationDelay: "0.24s" }}>
              <Label
                htmlFor="password"
                className="text-[13px] font-medium text-slate-600 mb-1.5 block"
              >
                Password
              </Label>
              <div className="relative group">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-focus-within:text-sky-500"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="!pl-10 !pr-11 h-[52px] rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-4 focus-visible:ring-sky-500/10 focus-visible:border-sky-400 tracking-wide transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Forgot password — right aligned, remember-me removed */}
            <div
              className="anim-item flex justify-end mb-5"
              style={{ animationDelay: "0.28s" }}
            >
              <a
                href="#"
                className="text-[13px] font-medium text-sky-600 hover:text-sky-700 transition-colors"
              >
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <div className="anim-item" style={{ animationDelay: "0.34s" }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg text-sm font-semibold border-0 text-white shadow-md shadow-sky-900/10 transition-all duration-200 hover:shadow-lg hover:shadow-sky-900/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </div>
          </form>

          {/* Sign up */}
          <p
            className="anim-item text-center text-[13px] text-slate-500 mt-8"
            style={{ animationDelay: "0.4s" }}
          >
            Belum punya akun?{" "}
            <a
              href="#"
              className="text-sky-600 font-semibold hover:text-sky-700 transition-colors"
            >
              Daftar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
