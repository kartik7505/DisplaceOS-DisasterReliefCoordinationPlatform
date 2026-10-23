import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { cn, ROLE_LABELS } from "../lib/utils";
import {
  LayoutDashboard, Package, MapPin, ClipboardList,
  Truck, LogOut, Shield, AlertTriangle
} from "lucide-react";
import type { UserRole } from "../types";

const DEMO_BANNER_TEXT = "Ã¢Å¡Â Ã¯Â¸Â  DEMO MODE Ã¢â‚¬â€ Synthetic data, not real operations";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "regional_coordinator", "camp_manager", "volunteer"] },
  { to: "/requests", icon: ClipboardList, label: "Supply Requests", roles: ["admin", "regional_coordinator", "camp_manager", "volunteer"] },
  { to: "/inventory", icon: Package, label: "Inventory", roles: ["admin", "regional_coordinator"] },
  { to: "/map", icon: MapPin, label: "Crisis Map", roles: ["admin", "regional_coordinator", "camp_manager", "volunteer"] },
  { to: "/deliveries", icon: Truck, label: "My Deliveries", roles: ["volunteer"] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center gap-2 justify-center">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-300 text-xs font-medium">{DEMO_BANNER_TEXT}</span>
      </div>

      <div className="flex flex-1">
        <nav className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">DisplaceOS</div>
                <div className="text-slate-500 text-[10px]">Relief Coordination</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 space-y-1">
            {visibleNav.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  location.pathname === to
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {user && (
            <div className="p-3 border-t border-slate-800">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-300">
                  {user.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 text-xs font-medium truncate">{user.full_name}</div>
                  <div className="text-slate-500 text-[10px]">{ROLE_LABELS[user.role]}</div>
                </div>
              </div>
              <button
                onClick={async () => { await signOut(); navigate("/login"); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-400 text-xs rounded-lg hover:bg-red-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </nav>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
