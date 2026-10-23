import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { demoCamps, demoRegions } from "../lib/demoData";
import { MapPin, AlertTriangle } from "lucide-react";

function CampLegend() {
  return (
    <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-xl p-3 text-xs space-y-1.5 z-10">
      <div className="text-white font-semibold mb-1">Legend</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Camp (&gt;80% full)</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Camp (&lt;80% full)</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Region Center</div>
    </div>
  );
}

export default function MapPage() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "osm": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
            maxzoom: 19,
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [78.9629, 20.5937], // India center
      zoom: 4.5,
    });

    const map = mapRef.current;

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-left");

    map.on("load", () => {
      // Region centers
      demoRegions.forEach((region) => {
        if (!region.center_lat || !region.center_lng) return;
        const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
          `<div style="font-family:system-ui;padding:4px">
            <strong>${region.name}</strong><br/>
            <span style="font-size:11px;color:#94a3b8">${region.description || ""}</span>
          </div>`
        );
        new maplibregl.Marker({ color: "#60a5fa" })
          .setLngLat([region.center_lng, region.center_lat])
          .setPopup(popup)
          .addTo(map);
      });

      // Camps
      demoCamps.forEach((camp) => {
        if (!camp.lat || !camp.lng) return;
        const pct = camp.capacity ? camp.current_occupancy / camp.capacity : 0;
        const color = pct > 0.8 ? "#fb923c" : "#34d399";
        const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
          `<div style="font-family:system-ui;padding:4px;min-width:160px">
            <strong>${camp.name}</strong><br/>
            <span style="font-size:11px;color:#94a3b8">${camp.region_name}</span><br/>
            <div style="margin-top:6px">
              <div style="background:#334155;border-radius:4px;height:6px;overflow:hidden">
                <div style="background:${color};width:${Math.round(pct * 100)}%;height:100%"></div>
              </div>
              <span style="font-size:11px">${camp.current_occupancy} / ${camp.capacity ?? "?"} people (${Math.round(pct * 100)}%)</span>
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-orange-400" /> Crisis Map
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-amber-300 text-xs">Showing {demoCamps.length} camps across {demoRegions.length} regions â€” DEMO DATA</p>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800" style={{ minHeight: "500px" }}>
        <div ref={containerRef} className="absolute inset-0" />
        <CampLegend />
      </div>
    </div>
  );
}
