/**
 * UpgradePilot wordmark — our own hand-drawn mark: an upward chevron "flight
 * path" inside a rounded diamond, echoing the dependency-upgrade motif.
 */
export function LogoMark({ size = 28, color = "#141420" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M14 1.8 26.2 14 14 26.2 1.8 14 14 1.8Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 15.8 14 10.4l5.4 5.4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10.4v7.8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ color = "#141420", size = 24 }: { color?: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} color={color} />
      <span
        className="font-semibold tracking-tight"
        style={{ color, fontSize: Math.round(size * 0.75), lineHeight: 1 }}
      >
        UpgradePilot
      </span>
    </span>
  );
}
