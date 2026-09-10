import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Zap,
  ShieldAlert,
  Car,
  ChevronDown,
  RotateCcw,
  Footprints,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { api } from "../api";
import type { Landmark, RoutePriority, RouteResult } from "../types";
import { formatDistance, formatEta } from "../utils";

interface Props {
  userLocation: { lat: number; lng: number } | null;
  landmarks: Landmark[];
  hour: number;
  route: RouteResult | null;
  onRoute: (route: RouteResult | null) => void;
}

const PRIORITIES: { key: RoutePriority; label: string; sub: string; icon: typeof Zap }[] = [
  {
    key: "fastest",
    label: "Fastest",
    sub: "Direct Path",
    icon: Zap,
  },
  {
    key: "crowd",
    label: "Safe Flow",
    sub: "Avoid Rush",
    icon: ShieldAlert,
  },
  {
    key: "parking",
    label: "Park & Walk",
    sub: "Via Parking",
    icon: Car,
  },
];

export default function RouteFinder({ userLocation, landmarks, hour, route, onRoute }: Props) {
  const [destinationId, setDestinationId] = useState(landmarks[0]?.id || "mahakal");
  const [priority, setPriority] = useState<RoutePriority>("fastest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTurns, setShowTurns] = useState(false);

  const findRoute = async () => {
    if (!userLocation) {
      setError("Waiting for your GPS location. Please allow browser location access.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.route(userLocation.lat, userLocation.lng, destinationId, priority, hour);
      onRoute(result);
      setShowTurns(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Title & Clear Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
              Smart Navigator
            </span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight">
              Route Planner
            </span>
          </div>
        </div>

        {route && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              onRoute(null);
              setShowTurns(false);
            }}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </motion.button>
        )}
      </div>

      {/* Destination Select and Go Button */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-600 block">Select Destination</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-8 cursor-pointer"
            >
              {landmarks.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.nameHi ? `(${l.nameHi})` : ""}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={findRoute}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Go</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-600 block">Navigation Strategy</label>
        <div className="grid grid-cols-3 gap-1.5">
          {PRIORITIES.map((p) => {
            const active = priority === p.key;
            const Icon = p.icon;
            return (
              <motion.button
                key={p.key}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPriority(p.key)}
                className={`p-2 rounded-xl border text-left transition-colors duration-150 cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80"
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="text-[11px] font-bold leading-none">{p.label}</span>
                </div>
                <span className={`text-[9px] block leading-tight ${active ? "text-slate-300" : "text-slate-400"}`}>
                  {p.sub}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-2.5 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Route Active Summary */}
      <AnimatePresence>
        {route && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100 pt-2.5 space-y-2 overflow-hidden"
          >
            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      {formatEta(route.etaMinutes)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({formatDistance(route.distanceM)})
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-medium block">
                    To {route.destination.name}
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTurns(!showTurns)}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm cursor-pointer"
              >
                {showTurns ? "Hide Steps" : "Directions"}
              </motion.button>
            </div>

            {route.parking && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-xs flex items-center gap-2 text-blue-900">
                <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div className="text-[11px]">
                  <span className="font-bold">Parking:</span> {route.parking.name}
                  {route.parking.availableSpots != null && (
                    <span className="text-blue-700 ml-1">({route.parking.availableSpots} spots free)</span>
                  )}
                </div>
              </div>
            )}

            {showTurns && route.turns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 max-h-36 overflow-y-auto space-y-1.5"
              >
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Step-by-Step Directions
                </p>
                <ol className="space-y-1 text-xs text-slate-700">
                  {route.turns.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-tight text-[11px]">{t}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
