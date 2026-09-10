import { POI_TYPE_META } from "../utils";

interface LayerState {
  crowd: boolean;
  parking: boolean;
  food: boolean;
  medical: boolean;
  toilet: boolean;
  auto: boolean;
}

interface Props {
  layers: LayerState;
  onChange: (layers: LayerState) => void;
}

const OPTIONS: { key: keyof LayerState; label: string; emoji: string }[] = [
  { key: "crowd", label: "Crowd", emoji: "🔥" },
  { key: "parking", label: POI_TYPE_META.parking.label, emoji: POI_TYPE_META.parking.emoji },
  { key: "food", label: POI_TYPE_META.food.label, emoji: POI_TYPE_META.food.emoji },
  { key: "medical", label: POI_TYPE_META.medical.label, emoji: POI_TYPE_META.medical.emoji },
  { key: "toilet", label: POI_TYPE_META.toilet.label, emoji: POI_TYPE_META.toilet.emoji },
  { key: "auto", label: POI_TYPE_META.auto.label, emoji: POI_TYPE_META.auto.emoji },
];

export default function LayerToggle({ layers, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {OPTIONS.map((opt) => {
        const active = layers[opt.key];
        return (
          <button
            key={opt.key}
            onClick={() => onChange({ ...layers, [opt.key]: !active })}
            className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              active
                ? "bg-saffron-500 text-white border-saffron-500"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
