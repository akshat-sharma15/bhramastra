import { useState } from "react";
import { api } from "../api";
import type { Landmark, RoutePriority, RouteResult } from "../types";
import { formatDistance, formatEta } from "../utils";

interface Props {
  userLocation: { lat: number; lng: number } | null;
  landmarks: Landmark[];
  hour: number;
  route: RouteResult | null;
  onRoute: (route: RouteResult | null) => void;
}

const PRIORITIES: { key: RoutePriority; label: string }[] = [
  { key: "fastest", label: "Fastest" },
  { key: "crowd", label: "Least Crowded" },
  { key: "parking", label: "With Parking" },
];

export default function RouteFinder({ userLocation, landmarks, hour, route, onRoute }: Props) {
  const [destinationId, setDestinationId] = useState(landmarks[0]?.id || "mahakal");
  const [priority, setPriority] = useState<RoutePriority>("fastest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findRoute = async () => {
    if (!userLocation) {
      setError("Waiting for your location...");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.route(userLocation.lat, userLocation.lng, destinationId, priority, hour);
      onRoute(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find a route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 space-y-2">
      <div className="flex gap-2">
        <select
          value={destinationId}
          onChange={(e) => setDestinationId(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm"
        >
          {landmarks.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          onClick={findRoute}
          disabled={loading}
          className="bg-saffron-500 hover:bg-saffron-600 disabled:opacity-60 text-white text-sm font-semibold px-4 rounded-lg"
        >
          {loading ? "..." : "Go"}
        </button>
      </div>

      <div className="flex gap-1.5">
        {PRIORITIES.map((p) => (
          <button
            key={p.key}
            onClick={() => setPriority(p.key)}
            className={`flex-1 text-xs font-medium rounded-lg py-1.5 border ${
              priority === p.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {route && (
        <div className="border-t pt-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>
              {formatDistance(route.distanceM)} &middot; {formatEta(route.etaMinutes)}
            </span>
            <button onClick={() => onRoute(null)} className="text-xs text-gray-400 font-normal">
              Clear
            </button>
          </div>
          {route.parking && (
            <p className="text-xs text-gray-600 mt-1">Via parking: {route.parking.name}</p>
          )}
          <ol className="mt-1 text-xs text-gray-500 list-decimal list-inside space-y-0.5 max-h-24 overflow-y-auto">
            {route.turns.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
