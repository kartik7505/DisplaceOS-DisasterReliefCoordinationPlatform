import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, DEMO_USERS } from "../store/authStore";
import { Shield, AlertTriangle, Info, Lock, MapPin, UserCheck } from "lucide-react";
import type { UserRole } from "../types";
import { ROLE_LABELS, ROLE_LABELS_HI } from "../lib/utils";
import { isSupabaseConfigured } from "../lib/supabase";

const DEMO_ROLES: UserRole[] = ["admin", "regional_coordinator", "camp_manager", "volunteer"];

const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; location: string }> = {
  admin: {
    title: "State Relief Administration",
    location: "Dehradun State Operations Centre",
  },
  regional_coordinator: {
    title: "Zonal Stock Coordinator",
    location: "Garhwal Division Warehouse (Rishikesh)",
  },
  camp_manager: {
    title: "Shelter Operations In-Charge",
    location: "Maldevta Relief Shelter (Dehradun)",
  },
  volunteer: {
    title: "Mountain Transport Volunteer",
    location: "Garhwal Emergency Courier Network",
  },
};

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
      setError(
        "Live Supabase authentication is not configured in this environment (.env unconfigured). Please use the Demo Quick Login below."
      );
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
      <div className="w-full max-w-lg">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 mb-3.5 shadow-lg shadow-orange-500/10">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DisplaceOS</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Disaster Relief Coordination Platform &bull; Uttarakhand Node (उत्तराखंड)
          </p>
        </div>

        {/* Demo Mode Notice */}
        <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <p className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              Synthetic Simulation Environment Active
            </p>
            <p className="mt-0.5">
              Operating on fictional relief facilities across Garhwal &amp; Kumaon districts. No live operational camps or official government affiliation implied. Select a synthetic operator identity below to test role workflows.
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
                isSupabaseConfigured
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {isSupabaseConfigured ? "Connected" : "Unconfigured"}
            </span>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-normal">
                Supabase credentials (<code className="text-slate-300">VITE_SUPABASE_URL</code>) are unconfigured. Live sign-in is safely disabled. Use the Demo Quick Login below.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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

            {error && <p className="text-red-400 text-xs p-2.5 rounded bg-red-500/10 border border-red-500/20">{error}</p>}

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
          <div className="text-center mb-3.5">
            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Demo Quick Login</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select a synthetic Uttarakhand relief identity to test role-authorized workflows
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_ROLES.map((role) => {
              const demoUser = DEMO_USERS[role];
              const desc = ROLE_DESCRIPTIONS[role];
              return (
                <button
                  key={role}
                  onClick={() => handleDemoLogin(role)}
                  className="bg-slate-800/80 hover:bg-slate-800 hover:border-orange-500/60 text-slate-200 text-xs font-medium p-3.5 rounded-xl border border-slate-700/80 transition-all text-left group shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-orange-400 font-bold text-[10px] uppercase tracking-wider group-hover:text-orange-300">
                        {ROLE_LABELS[role]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{ROLE_LABELS_HI[role]}</span>
                    </div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {demoUser.full_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{desc.title}</div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{desc.location}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
