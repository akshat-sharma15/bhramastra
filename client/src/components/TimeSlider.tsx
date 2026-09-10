import { useEffect, useState } from "react";
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
  return `${display} ${period}`;
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
        .map(formatHour)
        .join(", ")
    : "5-6 AM or 2-4 PM";

  return (
    <div className="bg-white rounded-xl shadow p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-700">
          Crowd forecast: <span className="text-saffron-600">{formatHour(hour)}</span>
        </span>
        <button
          onClick={onToggleLive}
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {isLive ? "● Live" : "Predicted"}
        </button>
      </div>
      <input
        type="range"
        min={5}
        max={21}
        step={1}
        value={hour}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-orange-500"
      />
      <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
        <span>5 AM</span>
        <span>1 PM</span>
        <span>9 PM</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        💡 Best time to visit: <span className="font-medium text-gray-700">{bestLabel}</span>
      </p>
    </div>
  );
}
