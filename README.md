# 🕉️ Bhramastra — Ujjain Simhasth 2028 Pilgrim Guide

A hackathon-grade web app that helps pilgrims answer:

- **"Where am I?"**
- **"How do I reach Mahakal Temple with the least crowd?"**
- **"Where is the nearest parking / food / medical / toilet / auto-stand?"**
- **"What is the best time to go?"**

Built for a demo, not production scale — data is mocked, in-memory, and refreshes every 30 seconds to simulate a live feed.

## Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React + Vite + TypeScript, Tailwind CSS |
| Map       | Leaflet + React-Leaflet (OpenStreetMap tiles) |
| Backend   | Node.js + Express (mock REST API, in-memory data) |
| AI        | Rule-based intent chatbot over a JSON keyword knowledge base + Dijkstra crowd-weighted routing + weighted-score Lost & Found matcher |

## Project structure

```
bhramastra/
├── server/                     Express mock backend (port 4000)
│   └── src/
│       ├── data/                landmarks, road graph, crowd zones, POIs (JSON)
│       ├── routes/               pois, crowd, route, geocode, lostfound
│       ├── utils/                 haversine distance, crowd model, Dijkstra routing, LF matching
│       └── index.js
└── client/                     React + Vite frontend (port 5173)
    └── src/
        ├── components/           MapView, LayerToggle, TimeSlider, RouteFinder,
        │                         Chatbot, LostFound, AdminMatches
        ├── data/intents.json      chatbot keyword knowledge base (Hindi + English)
        ├── api.ts / types.ts / utils.ts
        └── App.tsx
```

## Features

### 1. AI Pilgrim Chatbot ("Bhramastra Copilot")
Floating chat bubble (bottom-right) with a rule-based intent classifier (`src/data/intents.json`) that matches Hindi/Hinglish/English keywords:
- **Where am I?** → browser geolocation + reverse geocode (OpenStreetMap Nominatim, proxied server-side to dodge CORS).
- **Distance to X** → haversine distance + walking ETA, with a "Show route" action.
- **Nearest parking / food / medical / toilet / auto** → nearest POI by distance with a "Navigate there" action.
- **Less crowded route to X** → calls the crowd-weighted Dijkstra router and draws it on the map.
- **Best time to visit** → reads the hourly crowd forecast.

### 2. Interactive map with toggleable layers
- 🔥 **Crowd heatmap** — zones colored green/orange/red from a mock hourly occupancy model (dawn bathing rush, evening aarti rush, etc.) plus small live jitter that shifts every ~30s.
- 🅿️ **Parking** — capacity-based fill % (green = available, orange = filling, red = full).
- 🍲 Food stalls, ➕ Medical booths, 🚻 Toilets, 🛺 Auto-rickshaw stands.
- Clicking any zone/marker shows a popup with name, occupancy/fill %, distance from you, and a **Navigate** button.

### 3. Best Route Finder
- Destination dropdown (Mahakaleshwar Temple, Ram Ghat, Harsiddhi, Kal Bhairav, Sandipani Ashram).
- Priority toggle: **Fastest** / **Least Crowded** / **With Parking**.
- Routing runs Dijkstra over a small mock road graph (`server/src/data/roadGraph.json`), weighting each road segment by its live crowd occupancy when "Least Crowded" is selected — so it will genuinely pick a different street than the fastest option when the direct route is jammed.
- "With Parking" finds the nearest parking lot that minimizes total (you → parking → destination) walking distance.
- Output: highlighted route polyline, total distance, ETA, and a turn-by-turn junction list.

### 4. Time-Slider Crowd Predictor
- Slider from 5 AM–9 PM recolors the crowd layer using the same hourly model used for live data (deterministic bumps around known peak windows: dawn snan, midday, evening aarti).
- "Live" toggle switches back to the real current hour and resumes 30s polling.
- Shows a computed tip: "Best time to visit: ...", derived from whichever hours have the lowest average occupancy across all zones.

### 5. Lost & Found Lite
- **Report Missing Person** / **Found Person** forms (age, gender, location, time, description, contact), optionally tagging your live GPS.
- Backend AI matcher (`server/src/utils/matching.js`) scores every missing↔found pair by weighted age closeness (25%), gender match (15%), location proximity (35%), and time proximity (25%), surfacing candidates above a 40% threshold.
- **Admin** tab lists open missing/found reports and ranks match candidates by score.

## Running locally

Requires **Node.js 18+** (uses the built-in `fetch` for the geocode proxy).

```bash
# 1. Backend
cd server
npm install
npm run dev        # http://localhost:4000

# 2. Frontend (separate terminal)
cd client
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173` in a mobile-width browser window (or your phone on the same network with `vite --host`) and allow location access when prompted — the app falls back to a default Ujjain-center point if you deny it.

The Vite dev server proxies `/api/*` to the Express backend on port 4000, so no extra config is needed.

## Demo flow (suggested walkthrough)

1. **Land on the Map tab.** Allow location — a blue dot shows "You are here" (or the Ujjain city center fallback).
2. **Toggle layers** — turn on Crowd, Parking, Food, Medical and watch the colored zones/pins populate.
3. **Drag the time slider** to 6 AM — watch Ram Ghat and the temple approach turn red (dawn snan rush); drag to 11 AM — watch them turn green.
4. **Open the Route Finder**, pick "Ram Ghat" as start context (walk from wherever you are) → Mahakaleshwar Temple, try **Fastest** vs **Least Crowded** at hour 19 (7 PM, aarti time) — the least-crowded route reroutes via Chappan Dukan instead of the jammed Ghat Road.
5. **Open the chat bubble** and type: `"Nearest medical"` or `"मुझे पार्किंग चाहिए"` (Hindi for "I need parking") — the bot replies with distance + a Navigate action that draws the route.
6. Ask the bot `"Less crowded route to Mahakal"` and `"best time to visit"`.
7. **Switch to Lost & Found**, submit a Missing report and a similar Found report (same age/gender, nearby location, close time).
8. **Switch to Admin** — see the AI-suggested match with its score, contact numbers, and description.

## Notes & limitations (by design, for hackathon scope)

- 2D map only, no 3D/AR.
- All data — crowd occupancy, parking fill, POIs, road graph — is mocked with deterministic-but-time-varying formulas, not real sensors.
- Lost & Found reports live in server memory and reset on restart.
- The "road graph" is a small hand-authored set of ~10 junctions around the real Mahakaleshwar/Ram Ghat area — enough to demonstrate crowd-aware routing, not a full street network (a production version would swap this for OSRM/GraphHopper over real OSM road data).
