const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// Rough walking speed for pilgrim crowds (km/h) -> m/min
const WALK_SPEED_M_PER_MIN = (4 * 1000) / 60;

function etaMinutes(meters) {
  return Math.max(1, Math.round(meters / WALK_SPEED_M_PER_MIN));
}

module.exports = { haversineMeters, etaMinutes, WALK_SPEED_M_PER_MIN };
