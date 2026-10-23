import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { demoCamps, demoRegions } from "../lib/demoData";
import { MapPin, AlertTriangle, Mountain, Info, Layers, RefreshCw } from "lucide-react";
import { formatNumberIN } from "../lib/utils";

export type TileStyleKey = "esri_topo" | "tactical_dark" | "esri_satellite" | "osm_streets";

// 100% Free, open, watermark-free tile providers with high Himalayan terrain fidelity
const TILE_STYLES: Record<TileStyleKey, { name: string; style: any }> = {
  esri_topo: {
    name: "Mountain Topo",
    style: {
      version: 8,
      sources: {
        base_tiles: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "base_layer",
          type: "raster",
          source: "base_tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  tactical_dark: {
    name: "Tactical Dark",
    style: {
      version: 8,
      sources: {
        base_tiles: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "base_layer",
          type: "raster",
          source: "base_tiles",
          paint: {
            "raster-brightness-max": 0.58,
            "raster-saturation": -0.88,
            "raster-contrast": 0.28,
          },
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  esri_satellite: {
    name: "Satellite View",
    style: {
      version: 8,
      sources: {
        base_tiles: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "base_layer",
          type: "raster",
          source: "base_tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  osm_streets: {
    name: "Street Map",
    style: {
      version: 8,
      sources: {
        base_tiles: {
          type: "raster",
          tiles: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "base_layer",
          type: "raster",
          source: "base_tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
};

function CampLegend({
  activeLayer,
  onSelectLayer,
  onResetView,
}: {
  activeLayer: TileStyleKey;
  onSelectLayer: (layer: TileStyleKey) => void;
  onResetView: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 text-xs space-y-2.5 z-10 shadow-2xl backdrop-blur-md max-w-xs">
      <div className="text-white font-semibold flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Mountain className="w-3.5 h-3.5 text-orange-400" />
          <span>Uttarakhand Facilities (Fictional)</span>
        </div>
        <button
          onClick={onResetView}
          title="Reset map view"
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
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

      {/* Layer Selector */}
      <div className="pt-2 border-t border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-orange-400" />
            <span>Map Theme:</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(TILE_STYLES) as TileStyleKey[]).map((key) => (
            <button
              key={key}
              onClick={() => onSelectLayer(key)}
              className={`px-2 py-1 rounded text-[11px] font-medium border text-left truncate transition ${
                activeLayer === key
                  ? "bg-orange-500/20 border-orange-500/60 text-orange-300 font-semibold shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {TILE_STYLES[key].name}
            </button>
          ))}
        </div>
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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [activeLayer, setActiveLayer] = useState<TileStyleKey>("esri_topo");
  const [mapError, setMapError] = useState<string | null>(null);

  // Helper to add all markers and popups to a map instance
  const populateMarkers = (map: maplibregl.Map) => {
    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Region centers (Logistics Hubs)
    demoRegions.forEach((region) => {
      if (!region.center_lat || !region.center_lng) return;
      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        `<div style="font-family:system-ui;padding:6px;max-width:220px;background:#0f172a;color:#f8fafc;border-radius:6px">
          <div style="font-size:10px;text-transform:uppercase;color:#60a5fa;font-weight:700">Regional Logistics Hub</div>
          <strong style="font-size:13px;color:#f8fafc">${region.name}</strong><br/>
          <span style="font-size:11px;color:#94a3b8;line-height:1.3;display:block;margin-top:3px">${region.description || ""}</span>
        </div>`
      );
      const marker = new maplibregl.Marker({ color: "#60a5fa" })
        .setLngLat([region.center_lng, region.center_lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Relief Camps & Evacuation Shelters
    demoCamps.forEach((camp) => {
      if (!camp.lat || !camp.lng) return;
      const pct = camp.capacity ? camp.current_occupancy / camp.capacity : 0;
      const color = pct > 0.8 ? "#fb923c" : "#34d399";
      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        `<div style="font-family:system-ui;padding:6px;min-width:200px;background:#0f172a;color:#f8fafc;border-radius:6px">
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
      const marker = new maplibregl.Marker({ color })
        .setLngLat([camp.lng, camp.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (!mapRef.current) {
        // Initialize MapLibre centered squarely on Uttarakhand, India
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: TILE_STYLES[activeLayer].style as any,
          center: [79.2000, 30.1500],
          zoom: 7.6,
          attributionControl: { compact: true },
        });

        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl(), "bottom-right");
        map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

        map.on("load", () => {
          populateMarkers(map);
          map.resize();
        });

        map.on("error", (e) => {
          console.warn("MapLibre tile/render warning:", e);
        });

        // Ensure markers are populated immediately
        populateMarkers(map);

        // Multiple resize triggers to guarantee layout calculation
        requestAnimationFrame(() => map.resize());
        const t1 = setTimeout(() => map.resize(), 150);
        const t2 = setTimeout(() => map.resize(), 600);

        const handleResize = () => map.resize();
        window.addEventListener("resize", handleResize);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          window.removeEventListener("resize", handleResize);
          map.remove();
          mapRef.current = null;
        };
      }
    } catch (err: any) {
      console.error("Map initialization error:", err);
      setMapError(err?.message || "WebGL initialization failed in current browser context.");
    }
  }, []);

  // Layer select handler
  const handleSelectLayer = (nextLayer: TileStyleKey) => {
    if (!mapRef.current || nextLayer === activeLayer) return;
    setActiveLayer(nextLayer);
    mapRef.current.setStyle(TILE_STYLES[nextLayer].style as any);
    mapRef.current.once("style.load", () => {
      if (mapRef.current) {
        populateMarkers(mapRef.current);
        mapRef.current.resize();
      }
    });
  };

  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [79.2000, 30.1500],
      zoom: 7.6,
      essential: true,
    });
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
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

        <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p>
            Showing {formatNumberIN(demoCamps.length)} synthetic camps across {formatNumberIN(demoRegions.length)} regional zones. Simulation data only; mountain routes are not verified safe corridors.
          </p>
        </div>
      </div>

      {/* Map Card Container with explicit height */}
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950"
        style={{ width: "100%", height: "640px", minHeight: "640px" }}
      >
        {/* MapLibre DOM Target */}
        <div
          ref={containerRef}
          style={{ width: "100%", height: "100%", minHeight: "640px" }}
        />

        {/* Floating Legend & Layer Controller */}
        <CampLegend
          activeLayer={activeLayer}
          onSelectLayer={handleSelectLayer}
          onResetView={handleResetView}
        />

        {/* Fallback Display if WebGL fails */}
        {mapError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
            <h3 className="text-white font-bold text-base mb-1">WebGL Acceleration Notice</h3>
            <p className="text-slate-400 text-xs max-w-md mb-4 leading-relaxed">
              Your browser environment could not initialize WebGL hardware rendering. Please ensure hardware acceleration is enabled in Chrome settings (Settings &gt; System &gt; Use hardware acceleration when available).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-2xl w-full text-left">
              {demoCamps.map((camp) => (
                <div key={camp.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs">
                  <div className="text-white font-bold truncate">{camp.name}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{camp.address}</div>
                  <div className="text-emerald-400 text-[11px] font-semibold mt-1">
                    Occupancy: {camp.current_occupancy} / {camp.capacity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
