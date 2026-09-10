const express = require("express");
const landmarks = require("../data/landmarks.json");
const pois = require("../data/pois.json");
const { haversineMeters, etaMinutes } = require("../utils/distance");
const { nearestNode, shortestPath, nodesById } = require("../utils/routing");

const router = express.Router();

function findLandmark(destinationId) {
  const landmark = landmarks.find(
    (l) => l.id === destinationId || l.name.toLowerCase() === String(destinationId).toLowerCase()
  );
  if (landmark) return landmark;
  const poi = pois.find((p) => p.id === destinationId);
  if (poi) {
    return { id: poi.id, name: poi.name, nameHi: poi.nameHi, lat: poi.lat, lng: poi.lng, nodeId: poi.nodeId };
  }
  return null;
}

function pathToLatLngs(userLat, userLng, pathResult) {
  return [{ lat: userLat, lng: userLng, label: "You" }, ...pathResult.nodes.map((n) => ({
    lat: n.lat,
    lng: n.lng,
    label: n.label,
  }))];
}

function buildTurns(pathResult) {
  return pathResult.nodes.map((n, i) => {
    if (i === 0) return `Start: head towards ${n.label}`;
    if (i === pathResult.nodes.length - 1) return `Arrive at ${n.label}`;
    return `Continue via ${n.label}`;
  });
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

router.get("/", (req, res) => {
  const { fromLat, fromLng, destinationId, priority = "fastest", hour } = req.query;
  const lat = Number(fromLat);
  const lng = Number(fromLng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "fromLat and fromLng are required" });
  }
  const landmark = findLandmark(destinationId);
  if (!landmark) return res.status(404).json({ error: "unknown destination" });

  const h = hour != null ? Number(hour) : new Date().getHours();
  const startNode = nearestNode(lat, lng);
  const destNodeId = landmark.nodeId;

  const buildResponse = (legsPathResults, label) => {
    const allNodes = [{ lat, lng, label: "You" }];
    let totalDistanceM = 0;
    const zonesUsedSet = new Set();
    const turns = [];
    legsPathResults.forEach((pr) => {
      pr.nodes.forEach((n) => allNodes.push({ lat: n.lat, lng: n.lng, label: n.label }));
      totalDistanceM += pr.totalDistanceM;
      pr.zonesUsed.forEach((z) => zonesUsedSet.add(z));
      turns.push(...buildTurns(pr));
    });
    totalDistanceM += startNode.distanceM;
    return {
      destination: landmark,
      priority: label,
      hour: h,
      distanceM: Math.round(totalDistanceM),
      etaMinutes: etaMinutes(totalDistanceM),
      path: allNodes,
      turns,
      zonesUsed: [...zonesUsedSet],
    };
  };

  if (priority === "parking") {
    const parkingPois = pois.filter((p) => p.type === "parking");
    let best = null;
    for (const p of parkingPois) {
      const leg1 = shortestPath(startNode.node.id, p.nodeId, "fastest", h);
      const leg2 = shortestPath(p.nodeId, destNodeId, "fastest", h);
      if (!leg1 || !leg2) continue;
      const total = leg1.totalDistanceM + leg2.totalDistanceM;
      if (!best || total < best.total) {
        best = { total, leg1, leg2, parking: p };
      }
    }
    if (!best) return res.status(404).json({ error: "no route found via parking" });
    const response = buildResponse([best.leg1, best.leg2], "parking");
    response.parking = best.parking;
    return res.json(response);
  }

  const p = shortestPath(startNode.node.id, destNodeId, priority === "crowd" ? "crowd" : "fastest", h);
  if (!p) return res.status(404).json({ error: "no route found" });
  res.json(buildResponse([p], priority));
});

module.exports = router;
