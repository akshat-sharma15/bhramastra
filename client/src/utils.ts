export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatEta(minutes: number) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }
  return `${minutes} min`;
}

export const STATUS_COLOR: Record<string, string> = {
  green: "#16a34a",
  orange: "#f59e0b",
  red: "#dc2626",
};

export const POI_TYPE_META: Record<string, { emoji: string; color: string; label: string }> = {
  parking: { emoji: "🅿️", color: "#2563eb", label: "Parking" },
  food: { emoji: "🍲", color: "#ca8a04", label: "Food" },
  medical: { emoji: "➕", color: "#dc2626", label: "Medical" },
  toilet: { emoji: "🚻", color: "#0891b2", label: "Toilet" },
  auto: { emoji: "🛺", color: "#7c3aed", label: "Auto Stand" },
};

export const UJJAIN_CENTER = { lat: 23.1828, lng: 75.7683 };
