import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { demoRequests } from "../lib/demoData";
import { cn, STATUS_COLORS, STATUS_LABELS, CATEGORY_ICONS, formatDate, PRIORITY_LABELS } from "../lib/utils";
import { Truck, CheckCircle, Package } from "lucide-react";
import type { SupplyRequest, RequestStatus } from "../types";

export default function DeliveriesPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState(
    demoRequests.filter((r) => r.assigned_volunteer === user?.id || r.status === "allocated")
  );

  const handleAction = (id: string, action: string) => {
    const statusMap: Record<string, RequestStatus> = { dispatch: "dispatched", deliver: "delivered" };
    const newStatus = statusMap[action];
    if (!newStatus) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updates: Partial<SupplyRequest> = { status: newStatus };
        if (action === "dispatch") updates.dispatched_at = new Date().toISOString();
        if (action === "deliver") updates.delivered_at = new Date().toISOString();
        return { ...r, ...updates };
      })
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-orange-400" /> My Deliveries
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Assigned supply runs â€” {user?.full_name}</p>
      </div>

      {requests.length === 0 && (
        <div className="text-center text-slate-500 py-16">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No deliveries assigned to you yet</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req) => {
          const priority = PRIORITY_LABELS[req.priority];
          const canDispatch = req.status === "allocated";
          const canDeliver = req.status === "dispatched";
          return (
            <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-bold">{req.camp_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded border", STATUS_COLORS[req.status])}>
                        {STATUS_LABELS[req.status]}
                      </span>
                      <span className={cn("text-xs font-bold", priority.color)}>P{req.priority} {priority.label}</span>
                    </div>
                  </div>
                  {req.status === "delivered" && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                </div>

                {req.notes && <p className="text-slate-400 text-sm mt-2 italic">&ldquo;{req.notes}&rdquo;</p>}

                {/* Items */}
                <div className="mt-3 space-y-1">
                  {req.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{CATEGORY_ICONS[item.category || "other"]} {item.name}</span>
                      <span className="text-slate-500">{item.quantity_allocated ?? item.quantity_requested} {item.unit}</span>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                  <div>Created: {formatDate(req.created_at)}</div>
                  {req.dispatched_at && <div className="text-orange-400">Dispatched: {formatDate(req.dispatched_at)}</div>}
                  {req.delivered_at && <div className="text-emerald-400">Delivered: {formatDate(req.delivered_at)}</div>}
                </div>
              </div>

              {(canDispatch || canDeliver) && (
                <div className="border-t border-slate-800 p-4 flex gap-3">
                  {canDispatch && (
                    <button
                      onClick={() => handleAction(req.id, "dispatch")}
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-500/20 text-orange-300 border border-orange-500/40 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition"
                    >
                      <Truck className="w-4 h-4" /> Mark as Dispatched
                    </button>
                  )}
                  {canDeliver && (
                    <button
                      onClick={() => handleAction(req.id, "deliver")}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirm Delivery
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
