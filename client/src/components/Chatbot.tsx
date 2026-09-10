import { useEffect, useRef, useState } from "react";
import intents from "../data/intents.json";
import { api } from "../api";
import type { Landmark, Poi, PoiType, RouteResult } from "../types";
import { formatDistance, formatEta } from "../utils";

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
  action?: { label: string; run: () => void };
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
  "Namaste 🙏 Main Bhramastra Copilot hoon. Try: \"Where am I\", \"Distance to Mahakal\", \"Nearest parking\", or \"Less crowded route to Ram Ghat\".";

export default function Chatbot({ userLocation, requestLocation, landmarks, hour, onRoute, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, from: "bot", text: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (text: string, action?: ChatMessage["action"]) => {
    setMessages((prev) => [...prev, { id: idRef.current++, from: "bot", text, action }]);
  };

  const handlePoiIntent = async (type: PoiType) => {
    if (!userLocation) {
      addBotMessage("I need your location first — please allow location access, then try again.");
      requestLocation();
      return;
    }
    try {
      const poi: Poi = await api.nearestPoi(type, userLocation.lat, userLocation.lng);
      addBotMessage(
        `Nearest ${type}: ${poi.name} — ${formatDistance(poi.distanceM || 0)} away (${formatEta(
          poi.etaMinutes || 0
        )} walk).`,
        {
          label: "Navigate there",
          run: async () => {
            const route = await api.route(userLocation.lat, userLocation.lng, poi.id, "fastest", hour);
            onRoute(route);
          },
        }
      );
    } catch {
      addBotMessage(`Sorry, couldn't find a nearby ${type} right now.`);
    }
  };

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: idRef.current++, from: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const intent = classifyIntent(text);

      if (intent === "whereAmI") {
        if (!userLocation) {
          addBotMessage("Fetching your location...");
          requestLocation();
          return;
        }
        const geo = await api.reverseGeocode(userLocation.lat, userLocation.lng);
        addBotMessage(`You're near: ${geo.displayName}`);
        return;
      }

      if (intent in POI_INTENT_TYPE) {
        await handlePoiIntent(POI_INTENT_TYPE[intent]!);
        return;
      }

      if (intent === "distance" || intent === "lessCrowdedRoute") {
        if (!userLocation) {
          addBotMessage("I need your location first — please allow location access, then try again.");
          requestLocation();
          return;
        }
        const destination = extractDestination(text, landmarks) || landmarks.find((l) => l.id === "mahakal")!;
        if (intent === "lessCrowdedRoute") {
          const route = await api.route(userLocation.lat, userLocation.lng, destination.id, "crowd", hour);
          onRoute(route);
          addBotMessage(
            `Least-crowded route to ${destination.name} plotted: ${formatDistance(route.distanceM)}, ~${formatEta(
              route.etaMinutes
            )}.`
          );
        } else {
          const d = await api.distanceTo(userLocation.lat, userLocation.lng, destination.id);
          addBotMessage(
            `${destination.name} is ${formatDistance(d.distanceM)} away, about ${formatEta(d.etaMinutes)} on foot.`,
            {
              label: "Show route",
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
        addBotMessage(`Least crowded hours today: ${best}. Try to avoid the 6-8 PM aarti rush if possible.`);
        return;
      }

      if (intent === "greeting" || intent === "help") {
        addBotMessage(WELCOME);
        return;
      }

      addBotMessage(
        "Sorry, I didn't get that. Try: \"Where am I\", \"Nearest medical\", or \"Less crowded route to Mahakal\"."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-saffron-500 text-white">
        <div>
          <p className="font-semibold text-sm leading-none">Bhramastra Copilot</p>
          <p className="text-[11px] opacity-90">AI Pilgrim Assistant</p>
        </div>
        <button onClick={onClose} className="text-white text-xl leading-none">
          &times;
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-orange-50/40">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                m.from === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm"
              }`}
            >
              <p>{m.text}</p>
              {m.action && (
                <button
                  onClick={m.action.run}
                  className="mt-1.5 text-xs font-semibold text-saffron-600 underline"
                >
                  {m.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-xs text-gray-400 px-1">Bhramastra is typing...</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex gap-2 p-2 border-t"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type in Hindi or English..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        />
        <button
          type="submit"
          className="bg-saffron-500 hover:bg-saffron-600 text-white rounded-full w-10 h-10 flex items-center justify-center"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
