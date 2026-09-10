interface BhramastraLogoProps {
  className?: string;
  glow?: boolean;
}

export default function BhramastraLogo({ className = "w-9 h-9", glow = true }: BhramastraLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Bhramastra"
      style={
        glow
          ? {
              filter:
                "drop-shadow(0 0 6px rgba(251,191,36,0.9)) drop-shadow(0 0 16px rgba(217,119,6,0.6))",
            }
          : undefined
      }
    >
      <defs>
        <linearGradient id="bhGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="30%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id="bhCore" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0b1120" />
        </radialGradient>
      </defs>

      {/* Outer emblem ring */}
      <circle cx="60" cy="60" r="57" fill="url(#bhCore)" stroke="url(#bhGold)" strokeWidth="3" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="url(#bhGold)" strokeWidth="1.4" opacity="0.75" />

      {/* Radiating divine energy spikes */}
      <g stroke="url(#bhGold)" strokeWidth="2.6" strokeLinecap="round">
        <line x1="60" y1="9" x2="60" y2="21" />
        <line x1="60" y1="9" x2="60" y2="21" transform="rotate(32 60 60)" />
        <line x1="60" y1="9" x2="60" y2="21" transform="rotate(-32 60 60)" />
        <line x1="60" y1="9" x2="60" y2="21" transform="rotate(64 60 60)" />
        <line x1="60" y1="9" x2="60" y2="21" transform="rotate(-64 60 60)" />
      </g>

      {/* Central divine astra (arrow) */}
      <path d="M60 25 L71 53 L60 46.5 L49 53 Z" fill="url(#bhGold)" />
      <rect x="57" y="46" width="6" height="35" rx="1.6" fill="url(#bhGold)" />
      <path d="M41 89 L60 78 L79 89 L60 101 Z" fill="url(#bhGold)" />
      <circle cx="60" cy="80.5" r="4.6" fill="url(#bhGold)" />
    </svg>
  );
}
