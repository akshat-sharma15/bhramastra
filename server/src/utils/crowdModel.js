// Simple mock crowd-prediction model: baseline occupancy per zone "type"
// plus triangular bumps around known peak hours (e.g. dawn bathing, evening aarti).
const TYPE_PROFILES = {
  ghat: {
    baseline: 25,
    bumps: [
      { center: 6, width: 2.5, height: 65 }, // dawn bathing rush
      { center: 18, width: 2, height: 45 },
    ],
  },
  "temple-approach": {
    baseline: 30,
    bumps: [
      { center: 6, width: 1.5, height: 60 },
      { center: 12, width: 2, height: 35 },
      { center: 19, width: 2, height: 65 }, // evening aarti
    ],
  },
  "parking-road": {
    baseline: 20,
    bumps: [
      { center: 8, width: 2.5, height: 55 },
      { center: 16, width: 2, height: 45 },
    ],
  },
  "entry-road": {
    baseline: 25,
    bumps: [{ center: 7, width: 2, height: 25 }],
  },
  "food-street": {
    baseline: 15,
    bumps: [
      { center: 12.5, width: 1.5, height: 55 },
      { center: 20, width: 1.5, height: 65 },
    ],
  },
};

function bumpValue(hour, center, width, height) {
  const diff = Math.abs(hour - center);
  const factor = Math.max(0, 1 - diff / width);
  return height * factor;
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Deterministic pseudo-live noise that changes every ~30s, bounded +/-6.
function liveJitter(zoneId) {
  const bucket = Math.floor(Date.now() / 30000);
  const seed = hashString(zoneId) + bucket;
  const pseudo = Math.sin(seed) * 10000;
  const frac = pseudo - Math.floor(pseudo);
  return (frac - 0.5) * 12; // -6..+6
}

function occupancyForZone(zone, hour, live = true) {
  const profile = TYPE_PROFILES[zone.type] || TYPE_PROFILES["entry-road"];
  let value = profile.baseline;
  for (const b of profile.bumps) {
    value += bumpValue(hour, b.center, b.width, b.height);
  }
  if (live) value += liveJitter(zone.id);
  return Math.max(3, Math.min(100, Math.round(value)));
}

function statusFromOccupancy(occupancy) {
  if (occupancy >= 70) return "red";
  if (occupancy >= 40) return "orange";
  return "green";
}

module.exports = { occupancyForZone, statusFromOccupancy, liveJitter };
