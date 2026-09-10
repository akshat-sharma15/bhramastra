const express = require("express");
const { randomUUID } = require("crypto");
const { findMatches } = require("../utils/matching");

const router = express.Router();

// In-memory store - fine for a hackathon demo, resets on server restart.
const missingReports = [];
const foundReports = [];

router.post("/missing", (req, res) => {
  const { name, age, gender, lastSeenLocationName, lat, lng, lastSeenTime, description, reporterContact } =
    req.body || {};
  if (!age || !gender || !reporterContact) {
    return res.status(400).json({ error: "age, gender and reporterContact are required" });
  }
  const report = {
    id: randomUUID(),
    name: name || "Unknown",
    age: Number(age),
    gender,
    lastSeenLocationName: lastSeenLocationName || "",
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    lastSeenTime: lastSeenTime || new Date().toISOString(),
    description: description || "",
    reporterContact,
    createdAt: new Date().toISOString(),
  };
  missingReports.push(report);
  res.status(201).json(report);
});

router.post("/found", (req, res) => {
  const { age, gender, foundLocationName, lat, lng, foundTime, description, finderContact } = req.body || {};
  if (!age || !gender || !finderContact) {
    return res.status(400).json({ error: "age, gender and finderContact are required" });
  }
  const report = {
    id: randomUUID(),
    age: Number(age),
    gender,
    foundLocationName: foundLocationName || "",
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    foundTime: foundTime || new Date().toISOString(),
    description: description || "",
    finderContact,
    createdAt: new Date().toISOString(),
  };
  foundReports.push(report);
  res.status(201).json(report);
});

router.get("/missing", (req, res) => res.json(missingReports));
router.get("/found", (req, res) => res.json(foundReports));

router.get("/matches", (req, res) => {
  const threshold = req.query.threshold ? Number(req.query.threshold) : 40;
  res.json(findMatches(missingReports, foundReports, threshold));
});

module.exports = router;
