import { motion } from "framer-motion";
import { Flame, Car, Utensils, HeartPulse, Bath, Shield, Check } from "lucide-react";
import type { LayerState } from "./MapView";

interface Props {
  layers: LayerState;
  onChange: (layers: LayerState) => void;
  compact?: boolean;
}

interface LayerOption {
  key: keyof LayerState;
  label: string;
  emoji: string;
  icon: typeof Flame;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const OPTIONS: LayerOption[] = [
  {
    key: "crowd",
    label: "Crowd Heat",
    emoji: "🔥",
    icon: Flame,
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-400",
    activeText: "text-amber-800 font-bold",
  },
  {
    key: "parking",
    label: "Parking",
    emoji: "🅿️",
    icon: Car,
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-400",
    activeText: "text-blue-800 font-bold",
  },
  {
    key: "food",
    label: "Bhandara / Food",
    emoji: "🍲",
    icon: Utensils,
    activeBg: "bg-orange-50",
    activeBorder: "border-orange-400",
    activeText: "text-orange-800 font-bold",
  },
  {
    key: "medical",
    label: "Medical Camp",
    emoji: "➕",
    icon: HeartPulse,
    activeBg: "bg-rose-50",
    activeBorder: "border-rose-400",
    activeText: "text-rose-800 font-bold",
  },
  {
    key: "toilet",
    label: "Washrooms",
    emoji: "🚻",
    icon: Bath,
    activeBg: "bg-cyan-50",
    activeBorder: "border-cyan-400",
    activeText: "text-cyan-800 font-bold",
  },
  {
    key: "auto",
    label: "Auto Stand",
    emoji: "🛺",
    icon: Shield,
    activeBg: "bg-purple-50",
    activeBorder: "border-purple-400",
    activeText: "text-purple-800 font-bold",
  },
];

export default function LayerToggle({ layers, onChange, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {OPTIONS.map((opt) => {
          const active = layers[opt.key];
          return (
            <motion.button
              key={opt.key}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange({ ...layers, [opt.key]: !active })}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs transition-colors duration-150 ${
                active
                  ? `${opt.activeBg} ${opt.activeBorder} ${opt.activeText} border shadow-sm`
                  : "bg-white/90 text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">{opt.emoji}</span>
              <span>{opt.label}</span>
              {active && <Check className="w-3 h-3 ml-0.5 opacity-80" />}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>Map Layers &amp; Services</span>
        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
          {Object.values(layers).filter(Boolean).length} / {OPTIONS.length} active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = layers[opt.key];
          return (
            <motion.button
              key={opt.key}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ ...layers, [opt.key]: !active })}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors duration-150 cursor-pointer ${
                active
                  ? `${opt.activeBg} ${opt.activeBorder} ${opt.activeText} border shadow-sm`
                  : "bg-slate-50/90 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm shrink-0">{opt.emoji}</span>
                <span className="truncate font-semibold">{opt.label}</span>
              </div>
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  active ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
