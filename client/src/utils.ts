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
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  }
  return `${Math.max(1, Math.round(minutes))} min`;
}

export const STATUS_COLOR: Record<string, string> = {
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
};

export const CROWD_STATUS_META = {
  green: {
    label: "Low Crowd",
    labelHi: "सामान्य भीड़",
    desc: "Smooth movement, minimal wait time",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  orange: {
    label: "Moderate Crowd",
    labelHi: "मध्यम भीड़",
    desc: "Steady flow, moderate queues",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  red: {
    label: "High Rush",
    labelHi: "अत्यधिक भीड़",
    desc: "Heavy congestion, long waiting time",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export const POI_TYPE_META: Record<
  string,
  { emoji: string; color: string; label: string; labelHi: string; bg: string; border: string; text: string }
> = {
  parking: {
    emoji: "🅿️",
    color: "#2563eb",
    label: "Parking",
    labelHi: "पार्किंग",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  food: {
    emoji: "🍲",
    color: "#d97706",
    label: "Bhandara / Food",
    labelHi: "अन्नक्षेत्र / भोजन",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  medical: {
    emoji: "➕",
    color: "#dc2626",
    label: "Medical / First Aid",
    labelHi: "चिकित्सा शिविर",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
  toilet: {
    emoji: "🚻",
    color: "#0891b2",
    label: "Washroom / Toilet",
    labelHi: "शौचालय",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
  },
  auto: {
    emoji: "🛺",
    color: "#7c3aed",
    label: "Auto / E-Rickshaw",
    labelHi: "ऑटो / ई-रिक्शा",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
};

export const UJJAIN_CENTER = { lat: 23.1828, lng: 75.7683 };

export const EMERGENCY_HELPLINES = [
  {
    name: "Simhasth Pilgrim Helpline",
    nameHi: "सिंहस्थ तीर्थयात्री हेल्पलाइन",
    phone: "1077",
    desc: "24/7 Mela Support & Information Desk",
    type: "support",
  },
  {
    name: "Medical Emergency / Ambulance",
    nameHi: "एम्बुलेंस / चिकित्सा आपातकाल",
    phone: "108",
    desc: "Emergency Doctors & Mobile Health Units",
    type: "medical",
  },
  {
    name: "Police Mela Assistance",
    nameHi: "मेला पुलिस सहायता केंद्र",
    phone: "100",
    desc: "Emergency Police & Lost Person Unit",
    type: "police",
  },
  {
    name: "Women Safety Line",
    nameHi: "महिला हेल्पलाइन",
    phone: "1090",
    desc: "Dedicated 24x7 Safety Assistance",
    type: "women",
  },
];

export function formatTimeAgo(isoString: string): string {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
