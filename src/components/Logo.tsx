// The Underscore + Dot logo system. Ported from lp-app.jsx.
// Live components (never redraw, never recolor the dot). See HANDOFF §5.

import { AC, AC2, TDK, TLT, MDK, MLT, PF, SP } from "@/lib/theme";

export function LogoMark({ size, dark }: { size?: number; dark?: boolean }) {
  // Minimal dot mark — the lamp, the period, the point of light at 9 PM.
  const s = size || 12;
  const acc = dark ? AC : AC2;
  return (
    <span
      style={{
        display: "inline-block",
        width: s,
        height: s,
        borderRadius: "50%",
        background: acc,
        boxShadow: `0 0 ${s * 1.1}px ${s * 0.3}px rgba(216,162,76,0.45)`,
      }}
    />
  );
}

export function LogoWordmark({
  color,
  accent,
  size,
}: {
  color: string;
  accent: string;
  size?: number;
}) {
  const sz = size || 48;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: sz * 0.12 }}>
      <span style={{ fontFamily: PF, fontSize: sz, fontWeight: 600, color, letterSpacing: "-0.01em", lineHeight: 1 }}>
        Still at Nine
      </span>
      <div style={{ width: sz * 3.3, height: Math.max(1.5, sz * 0.035), background: accent, borderRadius: 1, opacity: 0.6 }} />
    </div>
  );
}

export function LogoHorizontal({ dark, size }: { dark?: boolean; size?: number }) {
  const sz = size || 24;
  const txt = dark ? TDK : TLT;
  const acc = dark ? AC : AC2;
  const mut = dark ? MDK : MLT;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: sz * 0.55 }}>
        <span style={{ fontFamily: PF, fontSize: sz, fontWeight: 600, color: txt, letterSpacing: "-0.01em", lineHeight: 1 }}>
          Still at Nine
        </span>
        <span style={{ fontFamily: SP, fontSize: sz * 0.52, fontStyle: "italic", color: mut }}>
          Stories after dark.
        </span>
      </div>
      <div style={{ width: "100%", height: Math.max(1, sz * 0.04), background: acc, borderRadius: 1, opacity: 0.5, marginTop: sz * 0.35 }} />
    </div>
  );
}
