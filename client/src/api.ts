import type {
  Landmark,
  Poi,
  PoiType,
  RouteResult,
  RoutePriority,
  Zone,
  MissingReport,
  FoundReport,
  MatchResult,
} from "./types";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  landmarks: () => get<Landmark[]>("/landmarks"),

  pois: (params: { type?: PoiType; lat?: number; lng?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.type) qs.set("type", params.type);
    if (params.lat != null) qs.set("lat", String(params.lat));
    if (params.lng != null) qs.set("lng", String(params.lng));
    const query = qs.toString();
    return get<Poi[]>(`/pois${query ? `?${query}` : ""}`);
  },

  nearestPoi: (type: PoiType, lat: number, lng: number) =>
    get<Poi>(`/pois/nearest?type=${type}&lat=${lat}&lng=${lng}`),

  crowd: (hour: number) => get<{ hour: number; zones: Zone[]; updatedAt: string }>(`/crowd?hour=${hour}`),

  bestTime: () => get<{ hours: { hour: number; avgOccupancy: number }[]; best: { hour: number; avgOccupancy: number }[] }>(
    "/crowd/best-time"
  ),

  distanceTo: (lat: number, lng: number, destinationId: string) =>
    get<{ destination: Landmark; distanceM: number; etaMinutes: number }>(
      `/route/distance?fromLat=${lat}&fromLng=${lng}&destinationId=${destinationId}`
    ),

  route: (lat: number, lng: number, destinationId: string, priority: RoutePriority, hour: number) =>
    get<RouteResult>(
      `/route?fromLat=${lat}&fromLng=${lng}&destinationId=${destinationId}&priority=${priority}&hour=${hour}`
    ),

  reverseGeocode: (lat: number, lng: number) =>
    get<{ displayName: string; fallback?: boolean }>(`/geocode/reverse?lat=${lat}&lng=${lng}`),

  reportMissing: (payload: Partial<MissingReport>) => post<MissingReport>("/lostfound/missing", payload),
  reportFound: (payload: Partial<FoundReport>) => post<FoundReport>("/lostfound/found", payload),
  listMissing: () => get<MissingReport[]>("/lostfound/missing"),
  listFound: () => get<FoundReport[]>("/lostfound/found"),
  matches: () => get<MatchResult[]>("/lostfound/matches"),

  chat: (message: string, history: { from: "user" | "bot"; text: string }[]) =>
    post<{ intent: string; reply: string }>("/chat", { message, history }),
};
