const express = require("express");

const router = express.Router();

// Proxies OpenStreetMap Nominatim reverse geocoding to avoid browser CORS issues.
// Falls back to a plain coordinate label if the network call fails (offline demo mode).
router.get("/reverse", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=16&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Bhramastra-Simhasth2028-Demo/1.0" },
    });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);
    const data = await response.json();
    res.json({
      displayName: data.display_name || `${lat}, ${lng}`,
      raw: data,
    });
  } catch (err) {
    res.json({
      displayName: `Near ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)} (Ujjain)`,
      fallback: true,
    });
  }
});

module.exports = router;
