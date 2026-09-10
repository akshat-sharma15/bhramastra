const { haversineMeters } = require("./distance");

function ageScore(a, b) {
  if (a == null || b == null) return 0.5;
  const diff = Math.abs(Number(a) - Number(b));
  if (diff <= 1) return 1;
  if (diff >= 10) return 0;
  return 1 - diff / 10;
}

function genderScore(a, b) {
  if (!a || !b) return 0.5;
  return a.toLowerCase() === b.toLowerCase() ? 1 : 0;
}

function locationScore(missing, found) {
  if (
    missing.lat == null ||
    missing.lng == null ||
    found.lat == null ||
    found.lng == null
  )
    return 0.5;
  const meters = haversineMeters(missing.lat, missing.lng, found.lat, found.lng);
  if (meters <= 300) return 1;
  if (meters >= 5000) return 0;
  return 1 - meters / 5000;
}

function timeScore(missingTime, foundTime) {
  if (!missingTime || !foundTime) return 0.5;
  const diffHours = Math.abs(new Date(foundTime) - new Date(missingTime)) / 36e5;
  if (diffHours <= 1) return 1;
  if (diffHours >= 24) return 0;
  return 1 - diffHours / 24;
}

const WEIGHTS = { age: 0.25, gender: 0.15, location: 0.35, time: 0.25 };

function matchScore(missing, found) {
  const s =
    WEIGHTS.age * ageScore(missing.age, found.age) +
    WEIGHTS.gender * genderScore(missing.gender, found.gender) +
    WEIGHTS.location * locationScore(
      { lat: missing.lat, lng: missing.lng },
      { lat: found.lat, lng: found.lng }
    ) +
    WEIGHTS.time * timeScore(missing.lastSeenTime, found.foundTime);
  return Math.round(s * 100);
}

function findMatches(missingList, foundList, threshold = 40) {
  const results = [];
  for (const m of missingList) {
    const candidates = foundList
      .map((f) => ({ found: f, score: matchScore(m, f) }))
      .filter((c) => c.score >= threshold)
      .sort((a, b) => b.score - a.score);
    if (candidates.length > 0) {
      results.push({ missing: m, candidates });
    }
  }
  return results;
}

module.exports = { matchScore, findMatches };
