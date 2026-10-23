import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { demoCamps, demoRegions } from "../lib/demoData";
import { MapPin, AlertTriangle, Mountain, Info } from "lucide-react";
import { formatNumberIN } from "../lib/utils";

function CampLegend() {
  return (
    <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 text-xs space-y-2 z-10 shadow-xl backdrop-blur-sm max-w-xs">
      <div className="text-white font-semibold flex items-center gap-1.5 pb-1 border-b border-slate-800">
        <Mountain className="w-3.5 h-3.5 text-orange-400" />
        <span>Uttarakhand Facilities (Fictional)</span>
      </div>
      <div className="flex items-center gap-2 text-slate-300">
        <span className="w-3 h-3 rounded-full bg-orange-400 inline-block shadow-sm shadow-orange-400/50" />
        <span>Shelter &gt;80% Capacity (High Occupancy)</span>
      </div>
      <div className="flex items-center gap-2 text-slate-300">
        <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
        <span>Shelter &lt;80% Capacity (Normal)</span>
      </div>
      <div className="flex items-center gap-2 text-slate-300">
        <span className="w-3 h-3 rounded-full bg-blue-400 inline-block shadow-sm shadow-blue-400/50" />
        <span>Regional Warehouse / Zone Hub</span>
      </div>
      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 leading-tight">
        Demo locations for training simulation. Does not reflect live government disaster warnings.
      </p>
    </div>
  );
}

export default function MapPage() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Center squarely on Uttarakhand, India (Garhwal & Kumaon Himalayas)
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxzoom: 19,
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [79.2000, 30.1500], // Uttarakhand center
      zoom: 7.6,
    });

    const map = mapRef.current;

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // Region centers (Logistics Hubs)
      demoRegions.forEach((region) => {
        if (!region.center_lat || !region.center_lng) return;
        const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
          `<div style="font-family:system-ui;padding:6px;max-width:220px">
            <div style="font-size:10px;text-transform:uppercase;color:#60a5fa;font-weight:700">Regional Logistics Hub</div>
            <strong style="font-size:13px;color:#f8fafc">${region.name}</strong><br/>
            <span style="font-size:11px;color:#94a3b8;line-height:1.3;display:block;margin-top:3px">${region.description || ""}</span>
          </div>`
        );
        new maplibregl.Marker({ color: "#60a5fa" })
          .setLngLat([region.center_lng, region.center_lat])
          .setPopup(popup)
          .addTo(map);
      });

      // Relief Camps & Evacuation Shelters
      demoCamps.forEach((camp) => {
        if (!camp.lat || !camp.lng) return;
        const pct = camp.capacity ? camp.current_occupancy / camp.capacity : 0;
        const color = pct > 0.8 ? "#fb923c" : "#34d399";
        const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
          `<div style="font-family:system-ui;padding:6px;min-width:190px">
            <div style="font-size:10px;text-transform:uppercase;color:${color};font-weight:700">Fictional Relief Shelter</div>
            <strong style="font-size:13px;color:#f8fafc">${camp.name}</strong><br/>
            <span style="font-size:11px;color:#94a3b8">${camp.address || camp.region_name}</span>
            <div style="margin-top:8px;padding-top:6px;border-top:1px solid #334155">
              <div style="background:#1e293b;border-radius:4px;height:6px;overflow:hidden;border:1px solid #334155">
                <div style="background:${color};width:${Math.min(100, Math.round(pct * 100))}%;height:100%"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#cbd5e1;margin-top:4px">
                <span>Occupancy:</span>
                <strong>${formatNumberIN(camp.current_occupancy)} / ${camp.capacity ? formatNumberIN(camp.capacity) : "—"} (${Math.round(pct * 100)}%)</strong>
              </div>
            </div>
          </div>`
        );
        new maplibregl.Marker({ color })
          .setLngLat([camp.lng, camp.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              <MapPin className="w-6 h-6 text-orange-400" /> Uttarakhand Crisis &amp; Relief Map
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Fictional facilities in Dehradun, Haridwar, Nainital, Chamoli, Rudraprayag, and Pithoragarh districts
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Map Center: Garhwal &amp; Kumaon (30.15° N, 79.20° E)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p>
            Showing {formatNumberIN(demoCamps.length)} synthetic camps across {formatNumberIN(demoRegions.length)} regional zones. Simulation data only; mountain routes are not verified safe corridors.
          </p>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" style={{ minHeight: "520px" }}>
        <div ref={containerRef} className="absolute inset-0" />
        <CampLegend />
      </div>
    </div>
  );
}
