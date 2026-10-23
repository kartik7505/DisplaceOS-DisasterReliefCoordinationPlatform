import { useMemo } from "react";
import { demoRequests, demoInventory, demoCamps } from "../lib/demoData";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_ICONS,
  timeAgo,
  cn,
  formatNumberIN,
} from "../lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Users,
  TrendingDown,
  Mountain,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className={`bg-slate-900 border rounded-2xl p-4.5 flex items-center gap-4 ${color} shadow-lg shadow-black/20`}>
      <div className="w-12 h-12 rounded-xl bg-current/10 flex items-center justify-center flex-shrink-0 border border-current/20">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="text-slate-300 text-xs font-semibold">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const stats = useMemo(() => {
    const pending = demoRequests.filter((r) => r.status === "pending").length;
    const allocated = demoRequests.filter((r) => r.status === "allocated").length;
    const delivered = demoRequests.filter((r) => r.status === "delivered").length;
    const critical = demoRequests.filter((r) => r.priority === 1).length;
    const lowStock = demoInventory.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 50)).length;
    const totalCampsOccupancy = demoCamps.reduce((acc, c) => acc + c.current_occupancy, 0);

    return {
      pending,
      allocated,
      delivered,
      critical,
      lowStock,
      totalCampsOccupancy,
    };
  }, []);

  const recentRequests = useMemo(() => {
    return [...demoRequests]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">
            <Mountain className="w-3.5 h-3.5" />
            Uttarakhand Relief Operations Dashboard
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Garhwal &amp; Kumaon Coordination Hub
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time status of relief camps, road access consignments, and warehouse stock
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/map"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800 transition shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            Open Crisis Map
          </Link>
          <Link
            to="/requests"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20"
          >
            Manage Requisitions
          </Link>
        </div>
      </div>

      {/* Synthetic Scenario Context Alert */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-0.5">
          <p className="text-amber-300 font-bold">
            SYNTHETIC SCENARIO: Monsoon Landslide &amp; Road Blockage Simulation (Alaknanda &amp; Mandakini Valleys)
          </p>
          <p className="text-slate-400 leading-relaxed">
            Data reflects fictional relief camps in Dehradun, Rudraprayag, Chamoli, Nainital, and Pithoragarh districts.
            Supplies are dynamically allocated and dispatched across mountain corridors. No real emergencies depicted.
          </p>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Pending Requests"
          value={formatNumberIN(stats.pending)}
          icon={Clock}
          color="border-amber-500/30 text-amber-400"
        />
        <StatCard
          label="Allocated in Transit"
          value={formatNumberIN(stats.allocated)}
          icon={Truck}
          color="border-purple-500/30 text-purple-400"
        />
        <StatCard
          label="Delivered Batches"
          value={formatNumberIN(stats.delivered)}
          icon={CheckCircle}
          color="border-emerald-500/30 text-emerald-400"
        />
        <StatCard
          label="Critical Priority"
          value={formatNumberIN(stats.critical)}
          icon={AlertTriangle}
          color="border-red-500/30 text-red-400"
        />
        <StatCard
          label="Warehouse Low Stock"
          value={formatNumberIN(stats.lowStock)}
          icon={TrendingDown}
          color="border-orange-500/30 text-orange-400"
        />
        <StatCard
          label="Persons Sheltered"
          value={formatNumberIN(stats.totalCampsOccupancy)}
          icon={Users}
          color="border-blue-500/30 text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests Section */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-white font-bold text-sm tracking-tight">Active Supply Demands</h2>
              <p className="text-slate-500 text-[11px]">Recent relief requests logged by camp managers across Uttarakhand</p>
            </div>
            <Link to="/requests" className="text-orange-400 text-xs font-semibold hover:text-orange-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentRequests.map((req) => {
              const priority = PRIORITY_LABELS[req.priority];
              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-xs font-bold truncate">{req.camp_name}</span>
                      <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded", priority.color, "bg-slate-800 border border-current/20")}>
                        {priority.label}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">{req.notes}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span>By: <strong className="text-slate-400">{req.requester_name}</strong></span>
                      <span>•</span>
                      <span>{timeAgo(req.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[req.status])}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-400" />
              Stock Alerts
            </h2>
            <Link to="/inventory" className="text-orange-400 text-xs font-semibold hover:text-orange-300">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {demoInventory
              .filter((i) => i.quantity_available <= (i.reorder_threshold ?? 50))
              .map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CATEGORY_ICONS[item.category]}</span>
                      <span className="text-xs text-slate-200 font-bold">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">
                      LOW STOCK
                    </span>
                  </div>
                  <div className="text-red-300 text-xs mt-1.5 font-medium">
                    Available: {formatNumberIN(item.quantity_available)} {item.unit} (Threshold: {formatNumberIN(item.reorder_threshold)})
                  </div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{item.region_name}</div>
                </div>
              ))}

            {demoInventory.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 50)).length === 0 && (
              <p className="text-slate-500 text-xs text-center py-6">All regional warehouse reserves above safety buffer</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
