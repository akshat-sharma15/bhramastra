import { useMemo } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { Poi, PoiType, RouteResult, Zone } from "../types";
import { formatDistance, formatEta, haversineMeters, POI_TYPE_META, STATUS_COLOR, UJJAIN_CENTER } from "../utils";

interface LayerState {
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
}

function userDivIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function poiDivIcon(type: PoiType, color: string) {
  const meta = POI_TYPE_META[type];
  return L.divIcon({
    className: "",
    html: `<div style="font-size:16px;line-height:22px;width:24px;height:24px;border-radius:50%;background:white;border:2px solid ${color};display:flex;align-items:center;justify-content:center">${meta.emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function Recenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  return null;
}

const POI_LAYER_KEY: Record<PoiType, keyof LayerState> = {
  parking: "parking",
  food: "food",
  medical: "medical",
  toilet: "toilet",
  auto: "auto",
};

export default function MapView({ userLocation, zones, pois, layers, route, onNavigatePoi }: Props) {
  const center = userLocation || UJJAIN_CENTER;
  const routeLine = useMemo(
    () => (route ? route.path.map((p) => [p.lat, p.lng] as [number, number]) : []),
    [route]
  );

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={16} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && <Recenter center={userLocation} />}

      {layers.crowd &&
        zones.map((z) => (
          <Circle
            key={z.id}
            center={[z.lat, z.lng]}
            radius={z.radiusM}
            pathOptions={{
              color: STATUS_COLOR[z.status],
              fillColor: STATUS_COLOR[z.status],
              fillOpacity: 0.35,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{z.name}</p>
                <p className="text-xs text-gray-500">{z.nameHi}</p>
                <p>
                  Occupancy: <span className="font-semibold">{z.occupancy}%</span>{" "}
                  <span
                    className="inline-block w-2 h-2 rounded-full align-middle"
                    style={{ background: STATUS_COLOR[z.status] }}
                  />
                </p>
                {userLocation && (
                  <p className="text-xs text-gray-500">
                    {formatDistance(haversineMeters(userLocation.lat, userLocation.lng, z.lat, z.lng))} away
                  </p>
                )}
              </div>
            </Popup>
          </Circle>
        ))}

      {pois
        .filter((p) => layers[POI_LAYER_KEY[p.type]])
        .map((p) => {
          const color = p.type === "parking" && p.status ? STATUS_COLOR[p.status] : POI_TYPE_META[p.type].color;
          return (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={poiDivIcon(p.type, color)}>
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.nameHi}</p>
                  {p.type === "parking" && (
                    <p>
                      Fill: <span className="font-semibold">{p.fillPercent}%</span> &middot;{" "}
                      {p.availableSpots} spots free
                    </p>
                  )}
                  {userLocation && (
                    <p className="text-xs text-gray-500 mb-1">
                      {formatDistance(haversineMeters(userLocation.lat, userLocation.lng, p.lat, p.lng))} away
                    </p>
                  )}
                  <button
                    onClick={() => onNavigatePoi(p)}
                    className="mt-1 w-full bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-semibold py-1.5 px-3 rounded"
                  >
                    Navigate
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userDivIcon()}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {route && (
        <>
          <Polyline positions={routeLine} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.85 }} />
          <CircleMarker center={[route.destination.lat, route.destination.lng]} radius={8} pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{route.destination.name}</p>
                <p>
                  {formatDistance(route.distanceM)} &middot; {formatEta(route.etaMinutes)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
