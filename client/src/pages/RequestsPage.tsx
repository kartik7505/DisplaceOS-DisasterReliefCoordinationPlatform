import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { demoRequests, demoInventory } from "../lib/demoData";
import {
  cn,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_ICONS,
  formatDate,
  formatNumberIN,
} from "../lib/utils";
import { Plus, ChevronDown, ChevronUp, Check, Truck, AlertTriangle, UserCheck, X } from "lucide-react";
import type { RequestStatus, SupplyRequest } from "../types";

function RequestCard({ req, onAction }: { req: SupplyRequest; onAction: (id: string, action: string) => void }) {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_LABELS[req.priority];

  const canApprove = user && ["admin", "regional_coordinator"].includes(user.role) && req.status === "pending";
  const canDispatch =
    user && ["admin", "volunteer"].includes(user.role) && req.status === "allocated" && req.assigned_volunteer === user.id;
  const canDeliver =
    user && ["admin", "volunteer"].includes(user.role) && req.status === "dispatched" && req.assigned_volunteer === user.id;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold">{req.camp_name}</span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wide", priority.color)}>
                P{req.priority} {priority.label}
              </span>
              {req.status === "pending" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn("text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1", STATUS_COLORS[req.status])}>
                <span>{STATUS_LABELS[req.status]}</span>
              </span>
              {req.volunteer_name && (
                <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-orange-400" />
                  {req.volunteer_name}
                </span>
              )}
              <span className="text-xs text-slate-500">{formatDate(req.created_at)}</span>
            </div>
            {req.notes && <p className="text-slate-400 text-xs mt-1.5 italic">&ldquo;{req.notes}&rdquo;</p>}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 transition p-1"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Items summary */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {req.items?.map((item) => (
            <span key={item.id} className="text-xs bg-slate-800/90 border border-slate-700/50 rounded-md px-2 py-0.5 text-slate-300">
              {CATEGORY_ICONS[item.category || "other"]} {item.name} &times; {formatNumberIN(item.quantity_requested)} {item.unit}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 bg-slate-800/30">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="text-left py-1.5 font-medium">Item Details</th>
                <th className="text-right py-1.5 font-medium">Requested</th>
                <th className="text-right py-1.5 font-medium">Allocated</th>
              </tr>
            </thead>
            <tbody>
              {req.items?.map((item) => (
                <tr key={item.id} className="text-slate-300 border-t border-slate-800/60">
                  <td className="py-2">
                    <span className="mr-1.5">{CATEGORY_ICONS[item.category || "other"]}</span>
                    <span className="font-medium">{item.name}</span>
                  </td>
                  <td className="text-right py-2 font-mono text-slate-200">
                    {formatNumberIN(item.quantity_requested)} {item.unit}
                  </td>
                  <td className="text-right py-2 font-mono text-slate-200">
                    {item.quantity_allocated !== undefined ? `${formatNumberIN(item.quantity_allocated)} ${item.unit}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap gap-4 text-xs text-slate-400">
            {req.dispatched_at && (
              <span className="text-orange-400 inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Dispatched: {formatDate(req.dispatched_at)}
              </span>
            )}
            {req.delivered_at && (
              <span className="text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Delivered: {formatDate(req.delivered_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(canApprove || canDispatch || canDeliver) && (
        <div className="border-t border-slate-800 p-3 bg-slate-900/60 flex gap-2">
          {canApprove && (
            <button
              onClick={() => onAction(req.id, "approve")}
              className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-500/30 transition font-medium"
            >
              <Check className="w-3.5 h-3.5" /> Approve &amp; Allocate Stock
            </button>
          )}
          {canDispatch && (
            <button
              onClick={() => onAction(req.id, "dispatch")}
              className="flex items-center gap-1.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs px-3.5 py-1.5 rounded-lg hover:bg-orange-500/30 transition font-medium"
            >
              <Truck className="w-3.5 h-3.5" /> Mark Dispatched (Mountain Transit)
            </button>
          )}
          {canDeliver && (
            <button
              onClick={() => onAction(req.id, "deliver")}
              className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-500/30 transition font-medium"
            >
              <Check className="w-3.5 h-3.5" /> Confirm Camp Delivery
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NewRequestModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const [priority, setPriority] = useState(2);
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ inventory_id: string; quantity: number }[]>([]);

  const addItem = (inventory_id: string) => {
    if (!selectedItems.find((i) => i.inventory_id === inventory_id)) {
      setSelectedItems([...selectedItems, { inventory_id, quantity: 10 }]);
    }
  };
  const removeItem = (id: string) => setSelectedItems(selectedItems.filter((i) => i.inventory_id !== id));
  const updateQty = (id: string, qty: number) =>
    setSelectedItems(selectedItems.map((i) => (i.inventory_id === id ? { ...i, quantity: qty } : i)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("✓ Synthetic relief request recorded (fictional simulation mode — in-memory demonstration).");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">New Relief Supply Request</h2>
            <p className="text-slate-400 text-xs mt-1">
              Camp: <span className="text-orange-400 font-medium">{user?.camp_id ? `Assigned (${user.camp_id})` : "Maldevta Relief Shelter (Fictional Demo Camp)"}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block font-medium">Urgency Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  P{p} — {PRIORITY_LABELS[p].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block font-medium">Situation &amp; Access Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-500"
              placeholder="e.g., Landslide blockage on approach road; urgent requirement for warm blankets and potable water..."
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-2 block font-medium">Available Himalayan Relief Items</label>
            <div className="grid grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {demoInventory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item.id)}
                  disabled={!!selectedItems.find((i) => i.inventory_id === item.id)}
                  className="text-left text-xs bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 hover:bg-slate-700 transition disabled:opacity-40"
                >
                  <div className="text-slate-200 font-medium">
                    {CATEGORY_ICONS[item.category]} {item.name}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {formatNumberIN(item.quantity_available)} {item.unit} in depot
                  </div>
                </button>
              ))}
            </div>
            {selectedItems.length > 0 && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <p className="text-xs text-slate-400 font-medium">Selected Requisitions:</p>
                {selectedItems.map((si) => {
                  const inv = demoInventory.find((i) => i.id === si.inventory_id)!;
                  return (
                    <div key={si.inventory_id} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border border-slate-700/60">
                      <span className="text-xs text-slate-200 flex-1 truncate">{inv.name}</span>
                      <input
                        type="number"
                        min={1}
                        max={inv.quantity_available}
                        value={si.quantity}
                        onChange={(e) => updateQty(si.inventory_id, Number(e.target.value))}
                        className="w-20 bg-slate-700 text-white text-xs rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-slate-400 text-xs w-14">{inv.unit}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(si.inventory_id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        aria-label="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-lg text-sm hover:bg-slate-700 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-md shadow-orange-500/20"
            >
              Submit Relief Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const { user } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const [requests, setRequests] = useState(demoRequests);

  const filtered = requests.filter((r) => filterStatus === "all" || r.status === filterStatus);

  const handleAction = (id: string, action: string) => {
    const statusMap: Record<string, RequestStatus> = {
      approve: "allocated",
      dispatch: "dispatched",
      deliver: "delivered",
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updates: Partial<SupplyRequest> = { status: newStatus };
        if (action === "dispatch") updates.dispatched_at = new Date().toISOString();
        if (action === "deliver") updates.delivered_at = new Date().toISOString();
        if (action === "approve") updates.volunteer_name = "Ravi Bisht (Volunteer)";
        return { ...r, ...updates };
      })
    );
  };

  const STATUSES = ["all", "pending", "allocated", "dispatched", "delivered", "cancelled"];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Supply Requests</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Operational Lifecycle: Request &rarr; Allocate &rarr; Dispatch &rarr; Deliver
          </p>
        </div>
        {user && ["camp_manager", "admin"].includes(user.role) && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition",
              filterStatus === s
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            )}
          >
            {s === "all"
              ? `All (${requests.length})`
              : `${STATUS_LABELS[s as RequestStatus]} (${requests.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12 bg-slate-900/40 rounded-xl border border-slate-800">
            No requests found in this view.
          </div>
        )}
        {filtered.map((req) => (
          <RequestCard key={req.id} req={req} onAction={handleAction} />
        ))}
      </div>

      {showNew && <NewRequestModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
