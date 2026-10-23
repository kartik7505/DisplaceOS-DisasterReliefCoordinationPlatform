import { useState } from "react";
import { demoInventory } from "../lib/demoData";
import { CATEGORY_ICONS, cn } from "../lib/utils";
import type { InventoryItem, SupplyCategory } from "../types";
import { Package, TrendingDown, Plus, RefreshCw } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const CATEGORIES: (SupplyCategory | "all")[] = ["all", "food", "water", "medicine", "shelter", "clothing", "hygiene", "tools", "other"];

function StockBar({ available, reserved, threshold }: { available: number; reserved: number; threshold?: number }) {
  const total = available + reserved;
  const pct = total > 0 ? (available / (total + (threshold ?? 0))) * 100 : 0;
  const isLow = available <= (threshold ?? 10);
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5">
      <div
        className={cn("h-1.5 rounded-full transition-all", isLow ? "bg-red-500" : "bg-emerald-500")}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function InventoryCard({ item, onRestock }: { item: InventoryItem; onRestock: (id: string, qty: number) => void }) {
  const isLow = item.quantity_available <= (item.reorder_threshold ?? 10);
  const [showRestock, setShowRestock] = useState(false);
  const [qty, setQty] = useState(50);

  return (
    <div className={cn("bg-slate-900 border rounded-xl p-4 transition", isLow ? "border-red-500/40" : "border-slate-800")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_ICONS[item.category]}</span>
          <div>
            <div className="text-white font-semibold text-sm">{item.name}</div>
            <div className="text-slate-500 text-xs">{item.region_name} Â· {item.category}</div>
          </div>
        </div>
        {isLow && (
          <div className="flex items-center gap-1 bg-red-500/15 border border-red-500/30 rounded px-2 py-0.5 text-xs text-red-400">
            <TrendingDown className="w-3 h-3" /> Low
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-emerald-400 font-bold text-lg">{item.quantity_available}</div>
          <div className="text-slate-500 text-[10px]">Available</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-amber-400 font-bold text-lg">{item.quantity_reserved}</div>
          <div className="text-slate-500 text-[10px]">Reserved</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-slate-300 font-bold text-lg">{item.reorder_threshold ?? 10}</div>
          <div className="text-slate-500 text-[10px]">Threshold</div>
        </div>
      </div>

      <StockBar available={item.quantity_available} reserved={item.quantity_reserved} threshold={item.reorder_threshold} />
      <div className="text-slate-600 text-[10px] mt-1 text-right">Unit: {item.unit}</div>

      {!showRestock ? (
        <button
          onClick={() => setShowRestock(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 bg-slate-800 rounded-lg py-1.5 transition"
        >
          <RefreshCw className="w-3 h-3" /> Restock
        </button>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5"
          />
          <button
            onClick={() => { onRestock(item.id, qty); setShowRestock(false); }}
            className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition"
          >Add</button>
          <button onClick={() => setShowRestock(false)} className="text-slate-500 text-xs px-2">?</button>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState(demoInventory);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");

  const regions = [...new Set(items.map((i) => i.region_name).filter(Boolean))];
  const filtered = items.filter((i) =>
    (filterCat === "all" || i.category === filterCat) &&
    (filterRegion === "all" || i.region_name === filterRegion)
  );

  const handleRestock = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, quantity_available: i.quantity_available + qty } : i)
    );
  };

  const canManage = user && ["admin", "regional_coordinator"].includes(user.role);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-400" /> Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Regional warehouse stock levels</p>
        </div>
        {canManage && (
          <button
            onClick={() => alert("Add item form â€” connect to API to persist")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{items.reduce((a, i) => a + i.quantity_available, 0).toLocaleString()}</div>
          <div className="text-emerald-400 text-xs mt-0.5">Total Available</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{items.reduce((a, i) => a + i.quantity_reserved, 0).toLocaleString()}</div>
          <div className="text-amber-400 text-xs mt-0.5">Total Reserved</div>
        </div>
        <div className="bg-slate-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{items.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 10)).length}</div>
          <div className="text-red-400 text-xs mt-0.5">Low Stock Alerts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5">
          <option value="all">All Regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={cn("text-xs px-2.5 py-1.5 rounded-lg transition capitalize", filterCat === cat ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}
          >
            {cat !== "all" && CATEGORY_ICONS[cat as SupplyCategory]} {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <InventoryCard key={item.id} item={item} onRestock={canManage ? handleRestock : () => {}} />
        ))}
      </div>
    </div>
  );
}
