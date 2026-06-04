// The "lamplight" atmosphere system. Ported verbatim from lp-app.jsx.
// Pure/presentational — all motion is CSS (honors prefers-reduced-motion).
// Levels: rich = 0.85, subtle = 0.5, none. See HANDOFF §4.

import { AC } from "@/lib/theme";

type Level = "rich" | "subtle" | "none";

// [x, y, r, o]
const EMBERS: [number, number, number, number][] = [
  [85, 78, 2.4, 0.8], [80, 70, 1.5, 0.55], [88, 60, 1.8, 0.65], [78, 82, 1.3, 0.45],
  [72, 68, 1.7, 0.5], [82, 48, 1.2, 0.4], [74, 80, 2.0, 0.6], [68, 76, 1.3, 0.38],
  [89, 72, 1.4, 0.5], [70, 55, 1.1, 0.32], [80, 38, 1.0, 0.28], [86, 36, 1.3, 0.38],
  [64, 64, 1.0, 0.26], [76, 28, 0.9, 0.24], [60, 74, 1.1, 0.28], [56, 58, 0.8, 0.2],
  [66, 48, 1.4, 0.34], [54, 68, 0.9, 0.22],
];

export function HeroAtmosphere({ level }: { level: Level }) {
  const s = level === "none" ? 0 : level === "subtle" ? 0.5 : 0.85;
  if (s === 0) return null;

  return (
    <div className="atmo" aria-hidden="true">
      <div
        className="atmo-glow"
        style={{
          background: `radial-gradient(100% 80% at 85% 105%, rgba(216,162,76,${0.3 * s}) 0%, rgba(216,162,76,${0.07 * s}) 32%, transparent 60%)`,
        }}
      />
      <svg className="atmo-arcs" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[32, 48, 66].map((r, i) => (
          <circle key={i} cx="85" cy="105" r={r} fill="none" stroke={AC} strokeWidth="0.12" opacity={(0.13 - i * 0.03) * s} />
        ))}
      </svg>
      <svg className="atmo-embers" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {EMBERS.map(([x, y, r, o], i) => (
          <g key={i}>
            {r > 1.5 && (
              <circle
                cx={x}
                cy={y}
                r={r * 2.5}
                fill={AC}
                className="ember"
                opacity={o * 0.1 * s}
                style={{ animationDelay: `${(i % 10) * 0.7}s`, animationDuration: `${6 + (i % 6)}s` }}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={r * 0.55}
              fill={AC}
              className="ember"
              opacity={o * s}
              style={{ animationDelay: `${(i % 10) * 0.7}s`, animationDuration: `${6 + (i % 6)}s` }}
            />
          </g>
        ))}
      </svg>
      <div className="atmo-nine" style={{ opacity: 0.018 * s }}>9</div>
      <div className="atmo-vig" style={{ opacity: s * 0.9 }} />
      <div className="grain" style={{ opacity: 0.045 * s }} />
    </div>
  );
}
