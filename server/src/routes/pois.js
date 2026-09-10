const express = require("express");
const pois = require("../data/pois.json");
const { haversineMeters, etaMinutes } = require("../utils/distance");

const router = express.Router();

// Deterministic pseudo-live parking fill % that drifts slowly over time.
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function parkingFillPercent(poi) {
  const bucket = Math.floor(Date.now() / 30000);
  const hour = new Date().getHours();
  const rushBoost = hour >= 5 && hour <= 9 ? 35 : hour >= 15 && hour <= 19 ? 25 : 5;
  const seed = hashString(poi.id) + bucket;
  const pseudo = Math.sin(seed) * 10000;
  const frac = pseudo - Math.floor(pseudo);
  const base = 20 + rushBoost + frac * 30;
  return Math.max(5, Math.min(100, Math.round(base)));
}

function statusFromFill(fill) {
  if (fill >= 85) return "red";
  if (fill >= 55) return "orange";
  return "green";
}

function enrich(poi) {
  if (poi.type !== "parking") return { ...poi };
  const fillPercent = parkingFillPercent(poi);
  return {
    ...poi,
    fillPercent,
    status: statusFromFill(fillPercent),
    availableSpots: Math.max(0, Math.round(poi.capacity * (1 - fillPercent / 100))),
  };
}

router.get("/", (req, res) => {
  const { type, lat, lng } = req.query;
  let list = pois.map(enrich);
  if (type) list = list.filter((p) => p.type === type);
  if (lat && lng) {
    list = list
      .map((p) => ({
        ...p,
        distanceM: Math.round(haversineMeters(Number(lat), Number(lng), p.lat, p.lng)),
      }))
      .map((p) => ({ ...p, etaMinutes: etaMinutes(p.distanceM) }))
      .sort((a, b) => a.distanceM - b.distanceM);
  }
  res.json(list);
});

router.get("/nearest", (req, res) => {
  const { type, lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });
  let list = pois.map(enrich);
  if (type) list = list.filter((p) => p.type === type);
  if (list.length === 0) return res.status(404).json({ error: "no POIs of that type" });
  const withDist = list.map((p) => ({
    ...p,
    distanceM: Math.round(haversineMeters(Number(lat), Number(lng), p.lat, p.lng)),
  }));
  withDist.sort((a, b) => a.distanceM - b.distanceM);
  const nearest = withDist[0];
  res.json({ ...nearest, etaMinutes: etaMinutes(nearest.distanceM) });
});

module.exports = router;
