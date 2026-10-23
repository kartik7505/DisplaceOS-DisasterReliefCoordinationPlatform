import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, DEMO_USERS } from "../store/authStore";
import { Shield, AlertTriangle, MapPin, UserCheck } from "lucide-react";
import type { UserRole } from "../types";
import { ROLE_LABELS } from "../lib/utils";

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
  const { user, setDemoUser } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

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
            Disaster Relief Coordination Platform &bull; Uttarakhand Node
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
