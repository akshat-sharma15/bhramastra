import { useEffect, useRef, useState } from "react";
import MapView from "./components/MapView";
import LayerToggle from "./components/LayerToggle";
import TimeSlider from "./components/TimeSlider";
import RouteFinder from "./components/RouteFinder";
import Chatbot from "./components/Chatbot";
import LostFound from "./components/LostFound";
import AdminMatches from "./components/AdminMatches";
import { api } from "./api";
import type { Landmark, Poi, RouteResult, Zone } from "./types";
import { UJJAIN_CENTER } from "./utils";

type Tab = "map" | "lostfound" | "admin";

interface LayerState {
  crowd: boolean;
  parking: boolean;
  food: boolean;
  medical: boolean;
  toilet: boolean;
  auto: boolean;
}

function currentHourClamped() {
  const h = new Date().getHours();
  return Math.min(21, Math.max(5, h));
}

export default function App() {
  const [tab, setTab] = useState<Tab>("map");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);
  const [hour, setHour] = useState(currentHourClamped());
  const [isLive, setIsLive] = useState(true);
  const [layers, setLayers] = useState<LayerState>({
    crowd: true,
    parking: true,
    food: true,
    medical: true,
    toilet: false,
    auto: false,
  });
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation not supported - using Ujjain center.");
      setUserLocation(UJJAIN_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocationError("Location permission denied - using Ujjain center.");
        setUserLocation(UJJAIN_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    if (watchIdRef.current == null && "geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000 }
      );
    }
  };

  useEffect(() => {
    requestLocation();
    api.landmarks().then(setLandmarks).catch(() => setLandmarks([]));
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCrowd = () => {
      const h = isLive ? currentHourClamped() : hour;
      api
        .crowd(h)
        .then((res) => mounted && setZones(res.zones))
        .catch(() => {});
    };
    loadCrowd();
    if (!isLive) return;
    const t = setInterval(loadCrowd, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [hour, isLive]);

  useEffect(() => {
    let mounted = true;
    const loadPois = () => {
      api
        .pois(userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {})
        .then((res) => mounted && setPois(res))
        .catch(() => {});
    };
    loadPois();
    const t = setInterval(loadPois, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [userLocation?.lat, userLocation?.lng]);

  const handleHourChange = (h: number) => {
    setHour(h);
    setIsLive(false);
  };

  const handleToggleLive = () => {
    setIsLive((v) => {
      const next = !v;
      if (next) setHour(currentHourClamped());
      return next;
    });
  };

  const handleNavigatePoi = async (poi: Poi) => {
    if (!userLocation) return;
    const effectiveHour = isLive ? currentHourClamped() : hour;
    const result = await api.route(userLocation.lat, userLocation.lng, poi.id, "fastest", effectiveHour);
    setRoute(result);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-saffron-600 to-saffron-500 text-white shadow z-20">
        <div>
          <h1 className="font-bold text-base leading-none">🕉️ Bhramastra</h1>
          <p className="text-[11px] opacity-90 leading-none mt-0.5">Ujjain Simhasth 2028 Pilgrim Guide</p>
        </div>
        <nav className="flex gap-1 bg-white/20 rounded-full p-1">
          {(["map", "lostfound", "admin"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                tab === t ? "bg-white text-saffron-700" : "text-white/90"
              }`}
            >
              {t === "map" ? "Map" : t === "lostfound" ? "Lost & Found" : "Admin"}
            </button>
          ))}
        </nav>
      </header>

      {tab === "map" && (
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0">
            <MapView
              userLocation={userLocation}
              zones={zones}
              pois={pois}
              layers={layers}
              route={route}
              onNavigatePoi={handleNavigatePoi}
            />
          </div>

          <div className="absolute top-2 left-2 right-2 z-[500] space-y-2 pointer-events-none">
            <div className="pointer-events-auto">
              <LayerToggle layers={layers} onChange={setLayers} />
            </div>
            {controlsOpen && (
              <div className="pointer-events-auto space-y-2 max-w-md">
                <TimeSlider hour={isLive ? currentHourClamped() : hour} onChange={handleHourChange} isLive={isLive} onToggleLive={handleToggleLive} />
                {landmarks.length > 0 && (
                  <RouteFinder
                    userLocation={userLocation}
                    landmarks={landmarks}
                    hour={isLive ? currentHourClamped() : hour}
                    route={route}
                    onRoute={setRoute}
                  />
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setControlsOpen((v) => !v)}
            className="absolute top-2 right-2 z-[500] bg-white rounded-full shadow px-2 py-1 text-xs font-semibold text-gray-600 pointer-events-auto"
            style={{ marginTop: controlsOpen ? 0 : 0 }}
          >
            {controlsOpen ? "Hide panel ▲" : "Show panel ▼"}
          </button>

          {locationError && (
            <div className="absolute bottom-20 left-2 right-2 z-[500] bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs rounded-lg px-3 py-2">
              {locationError}
            </div>
          )}

          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="absolute bottom-5 right-4 z-[500] bg-saffron-500 hover:bg-saffron-600 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl"
              aria-label="Open Bhramastra Copilot"
            >
              💬
            </button>
          )}

          {chatOpen && (
            <div className="absolute inset-0 z-[600] sm:inset-auto sm:bottom-4 sm:right-4 sm:w-96 sm:h-[560px] sm:rounded-2xl overflow-hidden shadow-2xl">
              <Chatbot
                userLocation={userLocation}
                requestLocation={requestLocation}
                landmarks={landmarks}
                hour={isLive ? currentHourClamped() : hour}
                onRoute={(r) => setRoute(r)}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {tab === "lostfound" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <LostFound userLocation={userLocation} />
        </div>
      )}

      {tab === "admin" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AdminMatches />
        </div>
      )}
    </div>
  );
}
