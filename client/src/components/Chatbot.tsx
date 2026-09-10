import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  X,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Navigation,
} from "lucide-react";
import intents from "../data/intents.json";
import { api } from "../api";
import type { Landmark, Poi, PoiType, RouteResult } from "../types";
import { formatDistance, formatEta } from "../utils";

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
  action?: { label: string; run: () => void };
  timestamp: string;
}

interface Props {
  userLocation: { lat: number; lng: number } | null;
  requestLocation: () => void;
  landmarks: Landmark[];
  hour: number;
  onRoute: (route: RouteResult) => void;
  onClose: () => void;
}

type IntentName = keyof typeof intents;

const POI_INTENT_TYPE: Partial<Record<IntentName, PoiType>> = {
  nearestParking: "parking",
  nearestFood: "food",
  nearestMedical: "medical",
  nearestToilet: "toilet",
  nearestAuto: "auto",
};

function classifyIntent(text: string): IntentName {
  const lower = text.toLowerCase();
  for (const [name, def] of Object.entries(intents) as [IntentName, { keywords: string[] }][]) {
    if (def.keywords.some((kw) => lower.includes(kw.toLowerCase()))) return name;
  }
  return "fallback" as IntentName;
}

function extractDestination(text: string, landmarks: Landmark[]): Landmark | null {
  const lower = text.toLowerCase();
  for (const l of landmarks) {
    const words = l.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (words.some((w) => lower.includes(w))) return l;
    if (l.nameHi && text.includes(l.nameHi)) return l;
    if (lower.includes(l.id)) return l;
  }
  return null;
}

const WELCOME =
  "Namaste! 🙏 I am your **Bhramastra AI Pilgrim Copilot**. How may I guide your Simhasth journey today? Ask me about crowd rush, shortest routes, free bhandara, or nearest parking!";

const SUGGESTIONS = [
  { label: "📍 Where am I?", query: "Where am I right now?" },
  { label: "🛕 Route to Mahakal", query: "Less crowded route to Mahakaleshwar Temple" },
  { label: "🅿️ Nearest Parking", query: "Where is the nearest parking?" },
  { label: "🍲 Free Food / Bhandara", query: "Find nearest food bhandara" },
  { label: "⏰ Best time to avoid rush", query: "Best time to visit temple today" },
  { label: "🚑 Medical Emergency", query: "Nearest medical first aid" },
];

function getCurrentTimeString() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chatbot({
  userLocation,
  requestLocation,
  landmarks,
  hour,
  onRoute,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      from: "bot",
      text: WELCOME,
      timestamp: getCurrentTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const addBotMessage = (text: string, action?: ChatMessage["action"]) => {
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, from: "bot", text, action, timestamp: getCurrentTimeString() },
    ]);
  };

  const handlePoiIntent = async (type: PoiType) => {
    if (!userLocation) {
      addBotMessage("I need your GPS location first. Please allow location access, then ask again.");
      requestLocation();
      return;
    }
    try {
      const poi: Poi = await api.nearestPoi(type, userLocation.lat, userLocation.lng);
      addBotMessage(
        `Nearest **${type.toUpperCase()}**: **${poi.name}**\n\n📍 Distance: ${formatDistance(
          poi.distanceM || 0
        )} (${formatEta(poi.etaMinutes || 0)} walking)`,
        {
          label: `Navigate to ${poi.name}`,
          run: async () => {
            const route = await api.route(userLocation.lat, userLocation.lng, poi.id, "fastest", hour);
            onRoute(route);
          },
        }
      );
    } catch {
      addBotMessage(`Sorry, could not locate a nearby ${type} in the Simhasth zone right now.`);
    }
  };

  const KNOWN_INTENT_KEYS = new Set(Object.keys(intents));

  const runKnownIntent = async (intent: IntentName, text: string) => {
    if (intent === "whereAmI") {
      if (!userLocation) {
        addBotMessage("Fetching your current GPS location...");
        requestLocation();
        return;
      }
      const geo = await api.reverseGeocode(userLocation.lat, userLocation.lng);
      addBotMessage(`You are currently located near **${geo.displayName}** in Ujjain.`);
      return;
    }

    if (intent in POI_INTENT_TYPE) {
      await handlePoiIntent(POI_INTENT_TYPE[intent]!);
      return;
    }

    if (intent === "distance" || intent === "lessCrowdedRoute") {
      if (!userLocation) {
        addBotMessage("Please allow location access so I can calculate the route from your exact spot.");
        requestLocation();
        return;
      }
      const destination = extractDestination(text, landmarks) || landmarks.find((l) => l.id === "mahakal")!;
      if (intent === "lessCrowdedRoute") {
        const route = await api.route(userLocation.lat, userLocation.lng, destination.id, "crowd", hour);
        onRoute(route);
        addBotMessage(
          `Plotted a **safe, less-crowded route** to **${destination.name}**.\n\n🚶 Distance: ${formatDistance(
            route.distanceM
          )} | ETA: ~${formatEta(route.etaMinutes)}.`
        );
      } else {
        const d = await api.distanceTo(userLocation.lat, userLocation.lng, destination.id);
        addBotMessage(
          `**${destination.name}** is **${formatDistance(d.distanceM)}** away (approx. **${formatEta(
            d.etaMinutes
          )}** on foot).`,
          {
            label: `Show Route to ${destination.name}`,
            run: async () => {
              const route = await api.route(userLocation.lat, userLocation.lng, destination.id, "fastest", hour);
              onRoute(route);
            },
          }
        );
      }
      return;
    }

    if (intent === "bestTime") {
      const res = await api.bestTime();
      const best = res.best
        .slice()
        .sort((a, b) => a.hour - b.hour)
        .map((b) => `${b.hour % 12 === 0 ? 12 : b.hour % 12}${b.hour >= 12 ? "PM" : "AM"}`)
        .join(", ");
      addBotMessage(
        `Least crowded hours for Darshan today are: **${best}**.\n\n⚠️ Tip: Avoid the 6:00 PM – 8:30 PM Sandhya Aarti surge if you prefer shorter queues.`
      );
      return;
    }

    if (intent === "greeting" || intent === "help") {
      addBotMessage(WELCOME);
      return;
    }
  };

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const history = messages.map((m) => ({ from: m.from, text: m.text }));
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, from: "user", text, timestamp: getCurrentTimeString() },
    ]);
    setInput("");
    setBusy(true);

    try {
      const localIntent = classifyIntent(text);

      if (localIntent !== ("fallback" as IntentName)) {
        await runKnownIntent(localIntent, text);
        return;
      }

      // No local keyword match - ask the AI to classify + answer, but any
      // health/location/route intent still resolves through our real POI/route data.
      try {
        const { intent: aiIntent, reply } = await api.chat(text, history);
        if (aiIntent && aiIntent !== "general" && KNOWN_INTENT_KEYS.has(aiIntent)) {
          await runKnownIntent(aiIntent as IntentName, text);
        } else {
          addBotMessage(reply);
        }
      } catch (err) {
        addBotMessage(
          err instanceof Error && err.message
            ? err.message
            : "I couldn't reach the AI service just now. Please try again in a moment."
        );
      }
    } catch {
      addBotMessage("An error occurred while connecting to the guide service. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 0,
        from: "bot",
        text: WELCOME,
        timestamp: getCurrentTimeString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200/90 sm:rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm leading-none">Bhramastra Copilot</p>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-amber-100 font-medium">AI Simhasth Pilgrim Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
            title="Close Copilot"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-amber-50/40 via-white to-slate-50">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.from === "bot" && (
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  m.from === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none font-medium"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {m.action && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={m.action.run}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2 px-3 rounded-xl shadow-sm transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {m.action.label}
                  </motion.button>
                )}

                <span
                  className={`block text-[9px] mt-1 text-right ${
                    m.from === "user" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {m.from === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="p-2 bg-white/90 border-t border-slate-200/80 overflow-x-auto no-scrollbar flex gap-1.5">
        {SUGGESTIONS.map((s, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend(s.query)}
            className="whitespace-nowrap text-[11px] font-semibold bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 border border-slate-200/80 rounded-full px-3 py-1 transition-colors shrink-0 shadow-2xs"
          >
            {s.label}
          </motion.button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 p-2.5 bg-white border-t border-slate-200/80"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in Hindi or English (e.g. कम भीड़ वाला रास्ता)..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          type="submit"
          disabled={!input.trim() || busy}
          className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 disabled:opacity-40 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-shadow shrink-0"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
}
