import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { Locate, Navigation, Compass, Info } from "lucide-react";
import type { Poi, PoiType, RouteResult, Zone } from "../types";
import {
  CROWD_STATUS_META,
  formatDistance,
  formatEta,
  haversineMeters,
  POI_TYPE_META,
  STATUS_COLOR,
  UJJAIN_CENTER,
} from "../utils";

export interface LayerState {
  crowd: boolean;
  parking: boolean;
  food: boolean;
  medical: boolean;
  toilet: boolean;
  auto: boolean;
}

interface Props {
  userLocation: { lat: number; lng: number } | null;
  zones: Zone[];
  pois: Poi[];
  layers: LayerState;
  route: RouteResult | null;
  onNavigatePoi: (poi: Poi) => void;
  onRequestLocation?: () => void;
}

function userDivIcon() {
  return L.divIcon({
    className: "relative flex items-center justify-center",
    html: `
      <div class="user-radar-pulse"></div>
      <div style="width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center;">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: white;"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function destinationDivIcon() {
  return L.divIcon({
    className: "relative flex items-center justify-center",
    html: `
      <div class="dest-pulse-effect" style="width: 26px; height: 26px; border-radius: 50%; background: #ea580c; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(234,88,12,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
        🚩
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function poiDivIcon(type: string, color: string, occupancyStatus?: string) {
  const meta = POI_TYPE_META[type] || { emoji: "📍", color: "#2563eb", label: type };
  const isCrowded = occupancyStatus === "red";
  return L.divIcon({
    className: "cursor-pointer",
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #ffffff;
        border: 2px solid ${color};
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        ${meta.emoji}
        ${
          isCrowded
            ? `<span style="position:absolute; top:-2px; right:-2px; width:9px; height:9px; background:#ef4444; border:2px solid white; border-radius:50%;"></span>`
            : ""
        }
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

const POI_LAYER_KEY: Record<string, keyof LayerState> = {
  parking: "parking",
  food: "food",
  medical: "medical",
  toilet: "toilet",
  auto: "auto",
};

export default function MapView({
  userLocation,
  zones,
  pois,
  layers,
  route,
  onNavigatePoi,
  onRequestLocation,
}: Props) {
  const [map, setMap] = useState<L.Map | null>(null);
  const center = userLocation || UJJAIN_CENTER;
  const routeLine = useMemo(
    () => (route ? route.path.map((p) => [p.lat, p.lng] as [number, number]) : []),
    [route]
  );

  // Recenter when user location updates
  useEffect(() => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], map.getZoom(), { animate: true });
    }
  }, [userLocation, map]);

  const handleRecenter = () => {
    if (userLocation && map) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 0.8 });
    } else if (onRequestLocation) {
      onRequestLocation();
    } else if (map) {
      map.flyTo([UJJAIN_CENTER.lat, UJJAIN_CENTER.lng], 15, { animate: true });
    }
  };

  const handleResetSimhasth = () => {
    if (map) {
      map.flyTo([UJJAIN_CENTER.lat, UJJAIN_CENTER.lng], 14, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        ref={setMap}
        center={[center.lat, center.lng]}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Crowd Density Zones */}
        {layers.crowd &&
          zones.map((z) => {
            const statusMeta = CROWD_STATUS_META[z.status] || CROWD_STATUS_META.green;
            const distanceAway = userLocation
              ? formatDistance(haversineMeters(userLocation.lat, userLocation.lng, z.lat, z.lng))
              : null;

            return (
              <Circle
                key={z.id}
                center={[z.lat, z.lng]}
                radius={z.radiusM}
                pathOptions={{
                  color: STATUS_COLOR[z.status] || "#10b981",
                  fillColor: STATUS_COLOR[z.status] || "#10b981",
                  fillOpacity: z.status === "red" ? 0.38 : z.status === "orange" ? 0.28 : 0.18,
                  weight: 1.5,
                  dashArray: z.status === "red" ? "4, 4" : undefined,
                }}
              >
                <Popup>
                  <div className="p-3 max-w-[220px]">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 leading-tight">{z.name}</h4>
                        <p className="text-xs text-amber-700 font-hindi font-medium">{z.nameHi}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="my-2 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, z.occupancy)}%`,
                          backgroundColor: STATUS_COLOR[z.status] || "#10b981",
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>Crowd Occupancy</span>
                      <span className="font-bold text-slate-800">{z.occupancy}%</span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-tight">{statusMeta.desc}</p>

                    {distanceAway && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center text-[11px] text-slate-500">
                        <Navigation className="w-3 h-3 text-slate-400 mr-1" />
                        <span>{distanceAway} away from you</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* POI Markers */}
        {pois
          .filter((p) => {
            const layerKey = POI_LAYER_KEY[p.type];
            return layerKey ? layers[layerKey] : true;
          })
          .map((p) => {
            const meta = POI_TYPE_META[p.type] || {
              emoji: "📍",
              color: "#2563eb",
              label: p.type || "Point",
              text: "text-blue-600",
            };
            const color =
              p.type === "parking" && p.status
                ? STATUS_COLOR[p.status] || meta.color
                : meta.color || "#2563eb";
            const distanceAway = userLocation
              ? formatDistance(haversineMeters(userLocation.lat, userLocation.lng, p.lat, p.lng))
              : null;

            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={poiDivIcon(p.type, color, p.status)}
              >
                <Popup>
                  <div className="p-3 min-w-[200px] max-w-[230px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg leading-none">{meta.emoji}</span>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.text || "text-slate-600"}`}>
                          {meta.label}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{p.name}</h4>
                        {p.nameHi && <p className="text-xs text-slate-500 font-hindi">{p.nameHi}</p>}
                      </div>
                    </div>

                    {p.type === "parking" && p.fillPercent != null && (
                      <div className="my-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Capacity</span>
                          <span className="font-bold text-slate-800">{p.fillPercent}% full</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (p.fillPercent || 0) > 85
                                ? "bg-rose-500"
                                : (p.fillPercent || 0) > 60
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, p.fillPercent || 0)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 font-medium">
                          🅿️ {p.availableSpots ?? "Several"} spots free
                        </p>
                      </div>
                    )}

                    {distanceAway && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 mb-2">
                        <Navigation className="w-3 h-3 text-blue-600" />
                        <span>{distanceAway} away</span>
                      </div>
                    )}

                    <button
                      onClick={() => onNavigatePoi(p)}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm active:scale-98 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      Navigate Here
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* User GPS Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userDivIcon()}>
            <Popup>
              <div className="p-2 text-xs">
                <div className="flex items-center gap-1 font-bold text-blue-600">
                  <Locate className="w-3.5 h-3.5" />
                  <span>You Are Here (Live GPS)</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Active Route Display */}
        {route && (
          <>
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: "#3b82f6",
                weight: 7,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: "#2563eb",
                weight: 4,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            <Marker
              position={[route.destination.lat, route.destination.lng]}
              icon={destinationDivIcon()}
            >
              <Popup>
                <div className="p-2 min-w-[170px]">
                  <span className="text-[10px] font-bold uppercase text-orange-600">Destination</span>
                  <h4 className="font-bold text-sm text-slate-900">{route.destination.name}</h4>
                  <div className="mt-1 flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-800">{formatDistance(route.distanceM)}</span>
                    <span className="text-blue-600 font-bold">{formatEta(route.etaMinutes)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Floating Map Corner Controls (Bottom Left, above legend - clear of the AI Copilot FAB) */}
      <div className="absolute bottom-20 left-4 z-[400] flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleRecenter}
          className="w-10 h-10 rounded-2xl bg-white shadow-lg border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
          title="Recenter GPS Location"
          aria-label="Recenter GPS Location"
        >
          <Locate className="w-4 h-4 text-blue-600" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleResetSimhasth}
          className="w-10 h-10 rounded-2xl bg-white shadow-lg border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
          title="Back to Ujjain Simhasth Area"
          aria-label="Back to Ujjain Simhasth Area"
        >
          <Compass className="w-4 h-4 text-amber-600" />
        </motion.button>
      </div>

      {/* Map Legend Indicator (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-[400] flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200/90 text-[11px] font-semibold text-slate-600">
        <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold">
          <Info className="w-3 h-3" /> Crowd:
        </span>
        <span className="flex items-center gap-1 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Low
        </span>
        <span className="flex items-center gap-1 text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium
        </span>
        <span className="flex items-center gap-1 text-rose-700">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Rush
        </span>
      </div>
    </div>
  );
}
