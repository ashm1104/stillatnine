// Shared chrome for the transactional pages (welcome / error / unsubscribe /
// 404 / loading). Ported from design-reference/tx-app.jsx — keep visuals exact.

const AC = "#D8A24C";

/* ---- atmosphere (ported from the landing page) ---- */
export function Atmosphere({ level = "subtle" }: { level?: "none" | "subtle" | "full" }) {
  const s = level === "none" ? 0 : level === "full" ? 0.85 : 0.5;
  if (s === 0) return null;
  const embers: [number, number, number, number][] = [
    [85, 78, 2.4, 0.8], [80, 70, 1.5, 0.55], [88, 60, 1.8, 0.65], [78, 82, 1.3, 0.45],
    [72, 68, 1.7, 0.5], [82, 48, 1.2, 0.4], [74, 80, 2.0, 0.6], [68, 76, 1.3, 0.38],
    [90, 72, 1.4, 0.5], [64, 64, 1.1, 0.34], [58, 72, 1.5, 0.42], [50, 60, 1.0, 0.3],
  ];
  return (
    <div className="atmo" aria-hidden="true">
      <div
        className="atmo-glow"
        style={{
          background: `radial-gradient(100% 80% at 50% 108%, rgba(216,162,76,${0.26 * s}) 0%, rgba(216,162,76,${0.06 * s}) 34%, transparent 62%)`,
        }}
      />
      <svg className="atmo-arcs" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[30, 46, 64].map((r, i) => (
          <circle key={i} cx="50" cy="108" r={r} fill="none" stroke={AC} strokeWidth="0.12" opacity={(0.12 - i * 0.03) * s} />
        ))}
      </svg>
      <svg className="atmo-embers" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {embers.map(([x, y, r, o], i) => (
          <g key={i}>
            {r > 1.5 && (
              <circle cx={x} cy={y} r={r * 2.5} fill={AC} className="ember" opacity={o * 0.1 * s} style={{ animationDelay: `${(i % 10) * 0.7}s`, animationDuration: `${6 + (i % 6)}s` }} />
            )}
            <circle cx={x} cy={y} r={r * 0.5} fill={AC} className="ember" opacity={o * s} style={{ animationDelay: `${(i % 8) * 0.6}s`, animationDuration: `${5 + (i % 5)}s` }} />
          </g>
        ))}
      </svg>
      <div className="atmo-nine" style={{ opacity: 0.018 * s, left: "auto", right: "50%", transform: "translateX(50%)", bottom: "-8%" }}>9</div>
      <div className="atmo-vig" style={{ opacity: s * 0.9 }} />
      <div className="grain" style={{ opacity: 0.045 * s }} />
    </div>
  );
}

export function Brand() {
  return (
    <a className="tx-brand" href="/">
      <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", background: AC, boxShadow: "0 0 16px 3px rgba(216,162,76,0.45)" }} />
      <span className="tx-brand-name">Still at Nine</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="tx-footer">
      <p>© 2026 Still at Nine · Stories after dark</p>
    </footer>
  );
}
