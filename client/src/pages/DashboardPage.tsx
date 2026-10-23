import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { demoRequests, demoInventory, demoCamps } from "../lib/demoData";
import { PRIORITY_LABELS, STATUS_LABELS, STATUS_COLORS, CATEGORY_ICONS, timeAgo, cn } from "../lib/utils";
import { AlertTriangle, CheckCircle, Clock, Truck, Users, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-slate-400 text-sm">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = useMemo(() => {
    const pending = demoRequests.filter((r) => r.status === "pending").length;
    const allocated = demoRequests.filter((r) => r.status === "allocated").length;
    const delivered = demoRequests.filter((r) => r.status === "delivered").length;
    const critical = demoRequests.filter((r) => r.priority === 1).length;
    const lowStock = demoInventory.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 10)).length;
    const totalCampsOccupancy = demoCamps.reduce((a, c) => a + c.current_occupancy, 0);
    return { pending, allocated, delivered, critical, lowStock, totalCampsOccupancy };
  }, []);

  const recentRequests = demoRequests.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="text-orange-400">{user?.full_name}</span>
        </h1>
        <p className="text-slate-400 mt-0.5">Disaster Relief Coordination Â· {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Pending Requests" value={stats.pending} icon={Clock} color="border-amber-500/30 text-amber-400" />
        <StatCard label="Allocated Deliveries" value={stats.allocated} icon={Truck} color="border-purple-500/30 text-purple-400" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle} color="border-emerald-500/30 text-emerald-400" />
        <StatCard label="Critical Priority" value={stats.critical} icon={AlertTriangle} color="border-red-500/30 text-red-400" />
        <StatCard label="Low Stock Alerts" value={stats.lowStock} icon={TrendingDown} color="border-orange-500/30 text-orange-400" />
        <StatCard label="People Sheltered" value={stats.totalCampsOccupancy.toLocaleString()} icon={Users} color="border-blue-500/30 text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent requests */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Requests</h2>
            <Link to="/requests" className="text-orange-400 text-xs hover:underline">View all ?</Link>
          </div>
          <div className="space-y-2">
            {recentRequests.map((req) => {
              const priority = PRIORITY_LABELS[req.priority];
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{req.camp_name}</span>
                      <span className={cn("text-[10px] font-bold uppercase", priority.color)}>{priority.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded border", STATUS_COLORS[req.status])}>
                        {STATUS_LABELS[req.status]}
                      </span>
                      <span className="text-slate-500 text-xs">{timeAgo(req.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-400" />
              Low Stock
            </h2>
            <Link to="/inventory" className="text-orange-400 text-xs hover:underline">Manage ?</Link>
          </div>
          <div className="space-y-2">
            {demoInventory
              .filter((i) => i.quantity_available <= (i.reorder_threshold ?? 10))
              .map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-1.5">
                    <span>{CATEGORY_ICONS[item.category]}</span>
                    <span className="text-sm text-slate-200 font-medium">{item.name}</span>
                  </div>
                  <div className="text-red-400 text-xs mt-1">
                    {item.quantity_available} {item.unit} left (threshold: {item.reorder_threshold})
                  </div>
                  <div className="text-slate-500 text-[10px]">{item.region_name}</div>
                </div>
              ))}
            {demoInventory.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 10)).length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">All stock levels OK</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
