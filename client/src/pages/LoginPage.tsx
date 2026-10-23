import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Shield, AlertTriangle } from "lucide-react";
import type { UserRole } from "../types";
import { ROLE_LABELS } from "../lib/utils";

const DEMO_ROLES: UserRole[] = ["admin", "regional_coordinator", "camp_manager", "volunteer"];

export default function LoginPage() {
  const { signIn, setDemoUser, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 mb-4">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">DisplaceOS</h1>
          <p className="text-slate-400 mt-1">Disaster Relief Coordination Platform</p>
        </div>

        {/* Demo Mode Banner */}
        <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300">
            <p className="font-semibold">?? DEMO MODE</p>
            <p>Use demo login buttons below for instant access with synthetic data. Connect Supabase for live operations.</p>
          </div>
        </div>

        {/* Sign-in form */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Demo quick-login */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <p className="text-xs text-slate-500 mb-3 text-center font-medium uppercase tracking-wide">Demo Quick Login (Synthetic Data)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setDemoUser(role)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition text-left"
              >
                <div className="text-orange-400 font-semibold text-[10px] uppercase tracking-wide mb-0.5">
                  {role.replace("_", " ")}
                </div>
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
