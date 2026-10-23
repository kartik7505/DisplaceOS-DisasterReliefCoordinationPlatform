import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Shield, AlertTriangle, Info, Lock } from "lucide-react";
import type { UserRole } from "../types";
import { ROLE_LABELS } from "../lib/utils";
import { isSupabaseConfigured } from "../lib/supabase";

const DEMO_ROLES: UserRole[] = ["admin", "regional_coordinator", "camp_manager", "volunteer"];

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, setDemoUser, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Live Supabase authentication is not configured in this environment (.env unconfigured). Please use the Demo Quick Login below.");
      return;
    }

    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    setDemoUser(role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 mb-4 shadow-lg shadow-orange-500/10">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DisplaceOS</h1>
          <p className="text-slate-400 mt-1 text-sm">Disaster Relief Coordination Platform</p>
        </div>

        {/* Demo Mode Notice */}
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <p className="font-semibold text-amber-300">DEMO MODE ACTIVE</p>
            <p>
              Local environment operating on synthetic relief data. Use the explicit Demo Quick Login buttons below to test operational roles.
            </p>
          </div>
        </div>

        {/* Live Authentication Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              Live Operator Authentication
            </h2>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isSupabaseConfigured ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {isSupabaseConfigured ? "Connected" : "Unconfigured"}
            </span>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-normal">
                Supabase credentials (<code className="text-slate-300">VITE_SUPABASE_URL</code>) are not set. Live sign-in is disabled. Use the Demo Quick Login below.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isSupabaseConfigured || isLoading}
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={isSupabaseConfigured ? "operator@displaceos.org" : "Disabled in local demo mode"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isSupabaseConfigured || isLoading}
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-xs p-2 rounded bg-red-500/10 border border-red-500/20">{error}</p>}

            <button
              type="submit"
              disabled={!isSupabaseConfigured || isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
            >
              {isLoading ? "Signing in..." : isSupabaseConfigured ? "Sign In to Live Operations" : "Live Login Disabled"}
            </button>
          </form>
        </div>

        {/* Demo Quick Login Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="text-center mb-3">
            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Demo Quick Login</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Select a synthetic role identity to access the dashboard</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => handleDemoLogin(role)}
                className="bg-slate-800/90 hover:bg-slate-800 hover:border-orange-500/50 text-slate-200 text-xs font-medium p-3 rounded-xl border border-slate-700/80 transition-all text-left group"
              >
                <div className="text-orange-400 font-bold text-[10px] uppercase tracking-wider mb-1 group-hover:text-orange-300">
                  {role.replace("_", " ")}
                </div>
                <div className="font-semibold text-white text-xs">{ROLE_LABELS[role]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
