import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
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
  labelHi,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  labelHi: string;
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
        <div className="text-slate-500 text-[10px]">{labelHi}</div>
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
    const lowStock = demoInventory.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 50)).length;
    const totalCampsOccupancy = demoCamps.reduce((a, c) => a + c.current_occupancy, 0);
    const totalCampsCapacity = demoCamps.reduce((a, c) => a + (c.capacity || 0), 0);
    return { pending, allocated, delivered, critical, lowStock, totalCampsOccupancy, totalCampsCapacity };
  }, []);

  const recentRequests = demoRequests.slice(0, 5);

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-orange-400">{user?.full_name}</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              Uttarakhand State Control Node
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-slate-500" />
            Monsoon &amp; Landslide Relief Coordination · {formattedDate} (IST)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition shadow-md shadow-orange-500/20"
          >
            <span>New Supply Request</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Crisis Map</span>
          </Link>
        </div>
      </div>

      {/* Synthetic Scenario Context Alert */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-0.5">
          <p className="text-amber-300 font-bold">
            SYNTHETIC SCENARIO: Monsoon Landslide &amp; Road Blockage Simulation (अलकनंदा व मंदाकिनी घाटी)
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
          labelHi="लंबित अनुरोध"
          value={formatNumberIN(stats.pending)}
          icon={Clock}
          color="border-amber-500/30 text-amber-400"
        />
        <StatCard
          label="Allocated in Transit"
          labelHi="आवंटित आपूर्ति"
          value={formatNumberIN(stats.allocated)}
          icon={Truck}
          color="border-purple-500/30 text-purple-400"
        />
        <StatCard
          label="Delivered Batches"
          labelHi="सफलतापूर्वक वितरित"
          value={formatNumberIN(stats.delivered)}
          icon={CheckCircle}
          color="border-emerald-500/30 text-emerald-400"
        />
        <StatCard
          label="Critical Priority"
          labelHi="अति गंभीर आवश्यकता"
          value={formatNumberIN(stats.critical)}
          icon={AlertTriangle}
          color="border-red-500/30 text-red-400"
        />
        <StatCard
          label="Warehouse Low Stock"
          labelHi="कम स्टॉक चेतावनी"
          value={formatNumberIN(stats.lowStock)}
          icon={TrendingDown}
          color="border-orange-500/30 text-orange-400"
        />
        <StatCard
          label="Persons Sheltered"
          labelHi="कुल शरणार्थी संख्या"
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
              <h2 className="text-white font-bold text-sm tracking-tight">Active Supply Demands (सक्रिय मांग)</h2>
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
                        {priority.label} ({priority.labelHi})
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
              Stock Alerts (स्टॉक चेतावनी)
            </h2>
            <Link to="/inventory" className="text-orange-400 text-xs font-semibold hover:text-orange-300">
              Manage →
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
