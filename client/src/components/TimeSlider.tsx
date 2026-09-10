import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import { api } from "../api";

interface Props {
  hour: number;
  onChange: (hour: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
}

function formatHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

function getHourRushLevel(h: number): { label: string; color: string; height: string } {
  if (h >= 4 && h <= 6) return { label: "Bhasma Aarti Peak", color: "bg-rose-500", height: "h-5" };
  if (h >= 7 && h <= 9) return { label: "Morning Snan Rush", color: "bg-amber-500", height: "h-4" };
  if (h >= 10 && h <= 12) return { label: "Darshan Flow", color: "bg-amber-400", height: "h-3" };
  if (h >= 13 && h <= 15) return { label: "Afternoon Low", color: "bg-emerald-500", height: "h-2" };
  if (h >= 16 && h <= 18) return { label: "Evening Buildup", color: "bg-amber-500", height: "h-3.5" };
  if (h >= 19 && h <= 21) return { label: "Sandhya Aarti Rush", color: "bg-rose-500", height: "h-5" };
  return { label: "Moderate", color: "bg-emerald-400", height: "h-2.5" };
}

export default function TimeSlider({ hour, onChange, isLive, onToggleLive }: Props) {
  const [bestHours, setBestHours] = useState<number[]>([]);

  useEffect(() => {
    api
      .bestTime()
      .then((res) => setBestHours(res.best.map((b) => b.hour)))
      .catch(() => setBestHours([5, 6, 14]));
  }, []);

  const bestLabel = bestHours.length
    ? bestHours
        .slice()
        .sort((a, b) => a - b)
        .map((h) => `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "PM" : "AM"}`)
        .join(", ")
    : "5 AM, 2 PM, 3 PM";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
              Forecast Time
            </span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight">
              {formatHour(hour)}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onToggleLive}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            isLive
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
          }`}
          title={isLive ? "Currently showing live real-time crowd data" : "Click to switch to live crowd"}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
          <span>{isLive ? "LIVE NOW" : "FORECAST"}</span>
        </motion.button>
      </div>

      {/* Hourly Heatmap Timeline */}
      <div className="space-y-1.5">
        <div className="flex items-end gap-1 h-6 px-1.5 pt-1 bg-slate-50 rounded-lg border border-slate-100">
          {Array.from({ length: 17 }, (_, i) => i + 5).map((h) => {
            const rush = getHourRushLevel(h);
            const isSelected = h === hour;
            return (
              <motion.button
                key={h}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange(h)}
                className={`flex-1 rounded-t-xs transition-all relative cursor-pointer ${rush.color} ${
                  isSelected
                    ? "ring-2 ring-slate-900 ring-offset-1 scale-110 z-10 brightness-110"
                    : "opacity-70 hover:opacity-100"
                } ${rush.height}`}
                title={`${formatHour(h)} - ${rush.label}`}
              />
            );
          })}
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={5}
          max={21}
          step={1}
          value={hour}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          aria-label="Select forecast hour"
        />

        <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-0.5">
          <span>5 AM</span>
          <span>1 PM</span>
          <span>9 PM</span>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="flex items-center gap-2 text-xs text-slate-700 bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="text-[11px] leading-tight">
          Optimal Darshan: <strong className="text-amber-900 font-bold">{bestLabel}</strong>
        </span>
      </div>
    </div>
  );
}
