import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Users,
  Shield,
  PhoneCall,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Locate,
  CheckCircle2,
  X,
  Phone,
  Sliders,
  Menu,
} from "lucide-react";
import MapView, { LayerState } from "./components/MapView";
import BhramastraLogo from "./components/BhramastraLogo";
import LayerToggle from "./components/LayerToggle";
import TimeSlider from "./components/TimeSlider";
import RouteFinder from "./components/RouteFinder";
import Chatbot from "./components/Chatbot";
import LostFound from "./components/LostFound";
import AdminMatches from "./components/AdminMatches";
import { api } from "./api";
import type { Landmark, Poi, RouteResult, Zone } from "./types";
import { EMERGENCY_HELPLINES, UJJAIN_CENTER } from "./utils";

type Tab = "map" | "lostfound" | "admin";

function currentHourClamped() {
  const h = new Date().getHours();
  return Math.min(21, Math.max(5, h));
}

interface Toast {
  id: number;
  message: string;
  type?: "info" | "success" | "warn";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const toastIdRef = useRef(1);

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation not supported - defaulting to Ujjain Mahakal center.");
      setUserLocation(UJJAIN_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
        addToast("GPS Location locked (Ujjain Simhasth)", "success");
      },
      () => {
        setLocationError("Location permission not granted - centered on Mahakal.");
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
      if (next) {
        setHour(currentHourClamped());
        addToast("Switched to Live Real-time Crowd Feed", "info");
      } else {
        addToast("Switched to Predicted Hourly Timeline", "info");
      }
      return next;
    });
  };

  const handleNavigatePoi = async (poi: Poi) => {
    if (!userLocation) {
      addToast("Please allow GPS location to plot navigation", "warn");
      return;
    }
    const effectiveHour = isLive ? currentHourClamped() : hour;
    const result = await api.route(userLocation.lat, userLocation.lng, poi.id, "fastest", effectiveHour);
    setRoute(result);
    setSidebarOpen(true);
    addToast(`Navigating to ${poi.name}`, "success");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-800 overflow-hidden font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800/90 z-30 shadow-md">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <BhramastraLogo className="w-9 h-9 bhramastra-glow-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-white leading-none">
                Bhramastra
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SIMHASTH 2028
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5 hidden sm:block">
              Smart Pilgrim Guide &bull; Ujjain Mahakumbh
            </p>
          </div>
        </div>

        {/* Center Segmented Tabs with Smooth Sliding Pill */}
        <nav className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shadow-inner relative">
          <button
            onClick={() => setTab("map")}
            className={`relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors z-10 ${
              tab === "map" ? "text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {tab === "map" && (
              <motion.div
                layoutId="mainNavTab"
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Compass className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Live Map &amp; Guide</span>
          </button>

          <button
            onClick={() => setTab("lostfound")}
            className={`relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors z-10 ${
              tab === "lostfound" ? "text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {tab === "lostfound" && (
              <motion.div
                layoutId="mainNavTab"
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Users className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Lost &amp; Found</span>
          </button>

          <button
            onClick={() => setTab("admin")}
            className={`relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors z-10 ${
              tab === "admin" ? "text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {tab === "admin" && (
              <motion.div
                layoutId="mainNavTab"
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Shield className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Admin Desk</span>
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 min-w-[160px] justify-end">
          {/* GPS Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300">
            <Locate className={`w-3.5 h-3.5 ${userLocation ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
            <span className="text-[11px]">{userLocation ? "GPS Active" : "Searching GPS"}</span>
          </div>

          {/* SOS Helpline Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSosModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md border border-rose-500/40 transition-shadow"
            title="Emergency Helplines & Assistance"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce-soft" />
            <span>SOS Helpline</span>
          </motion.button>
        </div>
      </header>

      {/* Main App Body */}
      <main className="relative flex-1 min-h-0 bg-slate-900 flex overflow-hidden">
        {/* TAB 1: LIVE MAP & COMMAND SIDEBAR */}
        {tab === "map" && (
          <div className="relative w-full h-full flex overflow-hidden">
            {/* Dedicated Left Command Sidebar (Desktop) with Smooth Framer Motion */}
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: -380, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -380, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="hidden lg:flex flex-col w-[380px] bg-white border-r border-slate-200/90 z-20 shrink-0 h-full shadow-xl"
                >
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-none">Pilgrim Command Hub</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Ujjain Simhasth Mela Area</p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title="Collapse Sidebar"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Sidebar Scrollable Section Cards */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Section 1: Map Layers & Services */}
                    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
                      <LayerToggle layers={layers} onChange={setLayers} />
                    </div>

                    {/* Section 2: Crowd Forecast & Timeline */}
                    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
                      <TimeSlider
                        hour={isLive ? currentHourClamped() : hour}
                        onChange={handleHourChange}
                        isLive={isLive}
                        onToggleLive={handleToggleLive}
                      />
                    </div>

                    {/* Section 3: Smart Route Navigator */}
                    {landmarks.length > 0 && (
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
                        <RouteFinder
                          userLocation={userLocation}
                          landmarks={landmarks}
                          hour={isLive ? currentHourClamped() : hour}
                          route={route}
                          onRoute={setRoute}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sidebar Footer: Bhramastra Emblem */}
                  <button
                    onClick={() => setComingSoonOpen(true)}
                    className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-t border-slate-100 bg-slate-50/70 hover:bg-amber-50/70 transition-colors group"
                    title="Bhramastra"
                  >
                    <div className="bhramastra-float">
                      <BhramastraLogo className="w-8 h-8 bhramastra-glow-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-amber-700 leading-none">
                        Bhramastra
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Divine feature &bull; Coming soon</p>
                    </div>
                  </button>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Sidebar Expand Button (when collapsed) */}
            <AnimatePresence>
              {!sidebarOpen && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 absolute top-4 left-4 z-[450] bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 transition-all"
                >
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Open Command Hub</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Mobile / Tablet Floating Header Bar */}
            <div className="lg:hidden absolute top-3 left-3 right-3 z-[450] flex items-center justify-between pointer-events-none gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileDrawerOpen(true)}
                className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-2 rounded-xl shadow-lg border border-slate-200/90"
              >
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Controls &amp; Routes</span>
              </motion.button>

              <div className="pointer-events-auto flex-1 max-w-[240px]">
                <LayerToggle layers={layers} onChange={setLayers} compact />
              </div>
            </div>

            {/* Mobile Controls Drawer with AnimatePresence */}
            <AnimatePresence>
              {mobileDrawerOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 z-[600] bg-black/60 backdrop-blur-xs flex flex-col justify-end"
                >
                  <div
                    className="absolute inset-0"
                    onClick={() => setMobileDrawerOpen(false)}
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                    className="relative bg-white rounded-t-3xl max-h-[82vh] flex flex-col p-4 shadow-2xl space-y-4 overflow-y-auto z-10"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                        <Sliders className="w-4 h-4 text-amber-600" />
                        <span>Pilgrim Command Hub</span>
                      </div>
                      <button
                        onClick={() => setMobileDrawerOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <TimeSlider
                          hour={isLive ? currentHourClamped() : hour}
                          onChange={handleHourChange}
                          isLive={isLive}
                          onToggleLive={handleToggleLive}
                        />
                      </div>

                      {landmarks.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                          <RouteFinder
                            userLocation={userLocation}
                            landmarks={landmarks}
                            hour={isLive ? currentHourClamped() : hour}
                            route={route}
                            onRoute={(r) => {
                              setRoute(r);
                              setMobileDrawerOpen(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unobstructed Map Area */}
            <div className="flex-1 relative w-full h-full">
              <MapView
                userLocation={userLocation}
                zones={zones}
                pois={pois}
                layers={layers}
                route={route}
                onNavigatePoi={handleNavigatePoi}
                onRequestLocation={requestLocation}
              />
            </div>

            {/* Location Notice Banner if geolocation is blocked */}
            <AnimatePresence>
              {locationError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[450] bg-amber-500 text-white text-xs font-semibold rounded-2xl p-3 shadow-xl border border-amber-400 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
                    <span>{locationError}</span>
                  </div>
                  <button
                    onClick={requestLocation}
                    className="bg-white text-amber-900 font-bold px-2.5 py-1 rounded-lg shrink-0 text-[11px] shadow-sm hover:bg-amber-50"
                  >
                    Enable GPS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating AI Copilot FAB */}
            <AnimatePresence>
              {!chatOpen && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChatOpen(true)}
                  className="absolute bottom-20 sm:bottom-6 right-4 z-[450] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl shadow-xl p-3.5 flex items-center gap-2.5 border border-white/25"
                  aria-label="Open AI Copilot"
                >
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                  </div>
                  <span className="font-extrabold text-xs tracking-wide">AI Copilot</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Floating AI Chat Window with AnimatePresence */}
            <AnimatePresence>
              {chatOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 20 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className="absolute inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[580px] z-[550]"
                >
                  <Chatbot
                    userLocation={userLocation}
                    requestLocation={requestLocation}
                    landmarks={landmarks}
                    hour={isLive ? currentHourClamped() : hour}
                    onRoute={(r) => {
                      setRoute(r);
                      setSidebarOpen(true);
                    }}
                    onClose={() => setChatOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 2: LOST & FOUND */}
        {tab === "lostfound" && (
          <div className="w-full h-full overflow-y-auto bg-slate-50 pb-20 sm:pb-8">
            <LostFound userLocation={userLocation} />
          </div>
        )}

        {/* TAB 3: ADMIN DESK */}
        {tab === "admin" && (
          <div className="w-full h-full overflow-y-auto bg-slate-50 pb-20 sm:pb-8">
            <AdminMatches />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar with Smooth Indicator */}
      <div className="md:hidden bg-slate-900 border-t border-slate-800 py-1 px-4 flex items-center justify-around z-40 shadow-2xl">
        <button
          onClick={() => setTab("map")}
          className={`relative flex flex-col items-center gap-0.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all ${
            tab === "map" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Map Guide</span>
        </button>

        <button
          onClick={() => setTab("lostfound")}
          className={`relative flex flex-col items-center gap-0.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all ${
            tab === "lostfound" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lost &amp; Found</span>
        </button>

        <button
          onClick={() => setTab("admin")}
          className={`relative flex flex-col items-center gap-0.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all ${
            tab === "admin" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => setChatOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold py-1.5 px-3 text-amber-400"
        >
          <Sparkles className="w-4 h-4" />
          <span>Copilot</span>
        </button>
      </div>

      {/* Emergency SOS Modal with AnimatePresence */}
      <AnimatePresence>
        {sosModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0"
              onClick={() => setSosModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 text-rose-600">
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      Emergency Helplines
                    </h3>
                    <p className="text-[11px] text-slate-500">24/7 Simhasth 2028 Rapid Response</p>
                  </div>
                </div>
                <button
                  onClick={() => setSosModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {EMERGENCY_HELPLINES.map((hl, i) => (
                  <motion.a
                    key={i}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    href={`tel:${hl.phone}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 transition-all group"
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-rose-900">
                        {hl.name}
                      </h4>
                      <p className="text-[10px] text-slate-500">{hl.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-rose-600 group-hover:bg-rose-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm shrink-0">
                      <Phone className="w-3 h-3" />
                      <span>Dial {hl.phone}</span>
                    </div>
                  </motion.a>
                ))}
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Tip:</strong> If separated from family, head to the nearest <em>Police Sahayata Kendra (Pillars 1–24)</em>.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bhramastra "Coming Soon" Page */}
      <AnimatePresence>
        {comingSoonOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[750] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="absolute inset-0" onClick={() => setComingSoonOpen(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 flex flex-col items-center gap-5 text-center max-w-sm"
            >
              <button
                onClick={() => setComingSoonOpen(false)}
                className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bhramastra-float">
                <BhramastraLogo className="w-28 h-28 bhramastra-glow-pulse" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">Bhramastra</h2>
              <p className="text-amber-300 font-extrabold text-lg tracking-wide">Coming Soon</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                This divine feature is being forged for Simhasth 2028. Stay tuned for its arrival.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Toast Notifications with AnimatePresence */}
      <div className="fixed top-20 right-4 z-[800] space-y-2 pointer-events-none flex flex-col items-end">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5"
            >
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === "warn" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              {t.type === "info" && <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
