import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { cn, ROLE_LABELS } from "../lib/utils";
import {
  LayoutDashboard,
  Package,
  MapPin,
  ClipboardList,
  Truck,
  LogOut,
  Shield,
  AlertTriangle,
  Mountain,
} from "lucide-react";
import type { UserRole } from "../types";

const DEMO_BANNER_TEXT = "⚠️ SYNTHETIC DEMO — Uttarakhand Disaster Relief Simulation (Not Real Operations)";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "regional_coordinator", "camp_manager", "volunteer"],
  },
  {
    to: "/requests",
    icon: ClipboardList,
    label: "Supply Requests",
    roles: ["admin", "regional_coordinator", "camp_manager", "volunteer"],
  },
  {
    to: "/inventory",
    icon: Package,
    label: "Warehouses & Stock",
    roles: ["admin", "regional_coordinator"],
  },
  {
    to: "/map",
    icon: MapPin,
    label: "Crisis Map",
    roles: ["admin", "regional_coordinator", "camp_manager", "volunteer"],
  },
  {
    to: "/deliveries",
    icon: Truck,
    label: "My Dispatches",
    roles: ["volunteer"],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center gap-2 justify-center text-center">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-amber-300 text-xs font-medium tracking-wide">{DEMO_BANNER_TEXT}</span>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-md shadow-orange-500/10">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-white font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  DisplaceOS <Mountain className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-slate-400 text-[10px] leading-tight">Uttarakhand Relief Node</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 space-y-1">
            {visibleNav.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  location.pathname === to
                    ? "bg-orange-500/15 text-orange-300 border border-orange-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                )}
              >
                <Icon className="w-4 h-4 text-orange-400/90" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {user && (
            <div className="p-3 border-t border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-300">
                  {user.full_name ? user.full_name[0] : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-100 text-xs font-bold truncate">{user.full_name}</div>
                  <div className="text-slate-400 text-[10px] truncate">{ROLE_LABELS[user.role]}</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/login");
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </nav>

        <main className="flex-1 overflow-auto bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
