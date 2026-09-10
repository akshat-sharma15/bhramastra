const express = require("express");
const landmarks = require("../data/landmarks.json");
const pois = require("../data/pois.json");
const zones = require("../data/zones.json");
const { haversineMeters, etaMinutes } = require("../utils/distance");
const { occupancyForZone } = require("../utils/crowdModel");
const { fetchOsrmRoute, fetchOsrmAlternatives } = require("../utils/osrm");

const router = express.Router();

function findLandmark(destinationId) {
  const landmark = landmarks.find(
    (l) => l.id === destinationId || l.name.toLowerCase() === String(destinationId).toLowerCase()
  );
  if (landmark) return landmark;
  const poi = pois.find((p) => p.id === destinationId);
  if (poi) {
    return { id: poi.id, name: poi.name, nameHi: poi.nameHi, lat: poi.lat, lng: poi.lng };
  }
  return null;
}

// Rough crowd-exposure heuristic: which live crowd zones does this street
// route actually pass near, and how busy are they right now.
function crowdExposure(coordinates, hour) {
  let score = 0;
  const zoneIds = [];
  for (const z of zones) {
    const passesNear = coordinates.some(
      (c) => haversineMeters(c.lat, c.lng, z.lat, z.lng) <= z.radiusM + 60
    );
    if (passesNear) {
      score += occupancyForZone(z, hour);
      zoneIds.push(z.id);
    }
  }
  return { score, zoneIds };
}

function labelEndpoints(coordinates, destinationName) {
  if (!coordinates.length) return coordinates;
  const path = coordinates.slice();
  path[0] = { ...path[0], label: "You" };
  path[path.length - 1] = { ...path[path.length - 1], label: destinationName };
  return path;
}

router.get("/distance", (req, res) => {
  const { fromLat, fromLng, destinationId } = req.query;
  const landmark = findLandmark(destinationId);
  if (!landmark) return res.status(404).json({ error: "unknown destination" });
  const distanceM = Math.round(
    haversineMeters(Number(fromLat), Number(fromLng), landmark.lat, landmark.lng)
  );
  res.json({ destination: landmark, distanceM, etaMinutes: etaMinutes(distanceM) });
});

router.get("/", async (req, res) => {
  const { fromLat, fromLng, destinationId, priority = "fastest", hour } = req.query;
  const lat = Number(fromLat);
  const lng = Number(fromLng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "fromLat and fromLng are required" });
  }
  const landmark = findLandmark(destinationId);
  if (!landmark) return res.status(404).json({ error: "unknown destination" });

  const h = hour != null ? Number(hour) : new Date().getHours();

  try {
    if (priority === "parking") {
      const parkingPois = pois.filter((p) => p.type === "parking");
      if (!parkingPois.length) return res.status(404).json({ error: "no parking found" });

      let bestParking = null;
      let bestDist = Infinity;
      for (const p of parkingPois) {
        const d = haversineMeters(lat, lng, p.lat, p.lng);
        if (d < bestDist) {
          bestDist = d;
          bestParking = p;
        }
      }

      const [leg1, leg2] = await Promise.all([
        fetchOsrmRoute(lat, lng, bestParking.lat, bestParking.lng),
        fetchOsrmRoute(bestParking.lat, bestParking.lng, landmark.lat, landmark.lng),
      ]);
      if (!leg1 || !leg2) return res.status(502).json({ error: "Routing service is unavailable right now." });

      const coordinates = [...leg1.coordinates, ...leg2.coordinates];
      const distanceM = leg1.distanceM + leg2.distanceM;
      const turns = [...leg1.turns, `Park at ${bestParking.name}`, ...leg2.turns];
      const { zoneIds } = crowdExposure(coordinates, h);

      return res.json({
        destination: landmark,
        priority: "parking",
        hour: h,
        distanceM: Math.round(distanceM),
        etaMinutes: etaMinutes(distanceM),
        path: labelEndpoints(coordinates, landmark.name),
        turns,
        zonesUsed: zoneIds,
        parking: bestParking,
      });
    }

    if (priority === "crowd") {
      const alternatives = await fetchOsrmAlternatives(lat, lng, landmark.lat, landmark.lng);
      if (!alternatives) return res.status(502).json({ error: "Routing service is unavailable right now." });

      let best = null;
      let bestScore = Infinity;
      for (const candidate of alternatives) {
        const { score, zoneIds } = crowdExposure(candidate.coordinates, h);
        if (score < bestScore) {
          bestScore = score;
          best = { ...candidate, zoneIds };
        }
      }

      return res.json({
        destination: landmark,
        priority: "crowd",
        hour: h,
        distanceM: Math.round(best.distanceM),
        etaMinutes: etaMinutes(best.distanceM),
        path: labelEndpoints(best.coordinates, landmark.name),
        turns: best.turns,
        zonesUsed: best.zoneIds,
      });
    }

    const primary = await fetchOsrmRoute(lat, lng, landmark.lat, landmark.lng);
    if (!primary) return res.status(502).json({ error: "Routing service is unavailable right now." });
    const { zoneIds } = crowdExposure(primary.coordinates, h);

    res.json({
      destination: landmark,
      priority: "fastest",
      hour: h,
      distanceM: Math.round(primary.distanceM),
      etaMinutes: etaMinutes(primary.distanceM),
      path: labelEndpoints(primary.coordinates, landmark.name),
      turns: primary.turns,
      zonesUsed: zoneIds,
    });
  } catch (err) {
    res.status(502).json({ error: "Routing service failed. Please try again." });
  }
});

module.exports = router;
