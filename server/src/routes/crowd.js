const express = require("express");
const zones = require("../data/zones.json");
const { occupancyForZone, statusFromOccupancy } = require("../utils/crowdModel");

const router = express.Router();

router.get("/", (req, res) => {
  const hour = req.query.hour != null ? Number(req.query.hour) : new Date().getHours();
  const live = req.query.live !== "false";
  const data = zones.map((z) => {
    const occupancy = occupancyForZone(z, hour, live);
    return {
      ...z,
      hour,
      occupancy,
      status: statusFromOccupancy(occupancy),
    };
  });
  res.json({ hour, zones: data, updatedAt: new Date().toISOString() });
});

router.get("/best-time", (req, res) => {
  const hours = [];
  for (let h = 5; h <= 21; h++) {
    const avg =
      zones.reduce((sum, z) => sum + occupancyForZone(z, h, false), 0) / zones.length;
    hours.push({ hour: h, avgOccupancy: Math.round(avg) });
  }
  const sorted = [...hours].sort((a, b) => a.avgOccupancy - b.avgOccupancy);
  res.json({ hours, best: sorted.slice(0, 3) });
});

module.exports = router;
