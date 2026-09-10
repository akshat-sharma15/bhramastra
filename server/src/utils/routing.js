const roadGraph = require("../data/roadGraph.json");
const zones = require("../data/zones.json");
const { haversineMeters } = require("./distance");
const { occupancyForZone } = require("./crowdModel");

const zonesById = Object.fromEntries(zones.map((z) => [z.id, z]));
const nodesById = Object.fromEntries(roadGraph.nodes.map((n) => [n.id, n]));

function buildAdjacency() {
  const adj = {};
  for (const n of roadGraph.nodes) adj[n.id] = [];
  for (const e of roadGraph.edges) {
    adj[e.from].push({ to: e.to, edge: e });
    adj[e.to].push({ to: e.from, edge: e });
  }
  return adj;
}

const adjacency = buildAdjacency();

function nearestNode(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const n of roadGraph.nodes) {
    const d = haversineMeters(lat, lng, n.lat, n.lng);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return { node: best, distanceM: bestDist };
}

function edgeWeight(edge, priority, hour) {
  if (priority !== "crowd") return edge.distanceM;
  const zone = zonesById[edge.zoneId];
  const occupancy = zone ? occupancyForZone(zone, hour) : 20;
  return edge.distanceM * (1 + occupancy / 50);
}

// Dijkstra shortest weighted path between two graph nodes.
function shortestPath(startNodeId, endNodeId, priority = "fastest", hour = 12) {
  const dist = {};
  const prevEdge = {};
  const prevNode = {};
  const visited = new Set();
  for (const n of roadGraph.nodes) dist[n.id] = Infinity;
  dist[startNodeId] = 0;

  while (true) {
    let u = null;
    let uDist = Infinity;
    for (const n of roadGraph.nodes) {
      if (!visited.has(n.id) && dist[n.id] < uDist) {
        u = n.id;
        uDist = dist[n.id];
      }
    }
    if (u === null || u === endNodeId) break;
    visited.add(u);
    for (const { to, edge } of adjacency[u]) {
      if (visited.has(to)) continue;
      const w = edgeWeight(edge, priority, hour);
      const alt = dist[u] + w;
      if (alt < dist[to]) {
        dist[to] = alt;
        prevNode[to] = u;
        prevEdge[to] = edge;
      }
    }
  }

  if (dist[endNodeId] === Infinity) return null;

  const pathNodeIds = [endNodeId];
  const pathEdges = [];
  let cur = endNodeId;
  while (cur !== startNodeId) {
    pathEdges.unshift(prevEdge[cur]);
    cur = prevNode[cur];
    pathNodeIds.unshift(cur);
  }

  let totalDistanceM = 0;
  const zonesUsed = [];
  for (const e of pathEdges) {
    totalDistanceM += e.distanceM;
    if (e.zoneId && !zonesUsed.includes(e.zoneId)) zonesUsed.push(e.zoneId);
  }

  return {
    nodeIds: pathNodeIds,
    nodes: pathNodeIds.map((id) => nodesById[id]),
    edges: pathEdges,
    totalDistanceM,
    zonesUsed,
  };
}

module.exports = { nearestNode, shortestPath, nodesById, adjacency };
