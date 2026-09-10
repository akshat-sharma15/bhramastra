// Real street-following routing via the public OSRM demo server (OpenStreetMap
// road network) - so plotted routes hug actual streets instead of drawing a
// straight "as the crow flies" line between the sparse mock checkpoint graph.
const OSRM_BASE = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";

function stepToInstruction(step) {
  const name = step.name && step.name.trim() ? step.name.trim() : "the road";
  const type = step.maneuver && step.maneuver.type;
  const modifier = step.maneuver && step.maneuver.modifier;

  if (type === "depart") return `Head out on ${name}`;
  if (type === "arrive") return "Arrive at your destination";
  if (type === "roundabout" || type === "rotary") return `Go through the roundabout onto ${name}`;
  if (modifier) return `Turn ${modifier} onto ${name}`;
  return `Continue onto ${name}`;
}

function toResult(route) {
  const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng, label: "" }));
  const turns = [];
  for (const leg of route.legs) {
    for (const step of leg.steps) {
      turns.push(stepToInstruction(step));
    }
  }
  return {
    coordinates,
    distanceM: route.distance,
    durationSec: route.duration,
    turns,
  };
}

async function requestOsrm(fromLat, fromLng, toLat, toLng, { alternatives = false } = {}) {
  const url =
    `${OSRM_BASE}/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=${alternatives}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const data = await response.json();
  if (data.code !== "Ok" || !Array.isArray(data.routes) || !data.routes.length) return null;
  return data.routes.map(toResult);
}

async function fetchOsrmRoute(fromLat, fromLng, toLat, toLng) {
  const routes = await requestOsrm(fromLat, fromLng, toLat, toLng, { alternatives: false });
  return routes ? routes[0] : null;
}

async function fetchOsrmAlternatives(fromLat, fromLng, toLat, toLng) {
  return requestOsrm(fromLat, fromLng, toLat, toLng, { alternatives: true });
}

module.exports = { fetchOsrmRoute, fetchOsrmAlternatives };
