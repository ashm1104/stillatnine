// Shared building blocks — Eyebrow, DiamondRule, SectionWrap.
// Ported verbatim from lp-app.jsx. Pure/presentational (server components).

import type { ReactNode } from "react";
import { AC, AC2 } from "@/lib/theme";

export function DiamondRule({ color }: { color: string }) {
  return (
    <div className="diamond-rule">
      <span style={{ color }}>✦</span>
      <div style={{ background: color }} />
      <span style={{ color }}>✦</span>
    </div>
  );
}

export function SectionWrap({
  dark,
  children,
  className,
  id,
}: {
  dark: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`sec ${dark ? "sec--dk" : "sec--lt"} ${className || ""}`} id={id}>
      <div className="sec-inner">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className="eyebrow" style={{ color: dark ? AC : AC2 }}>
      {children}
    </span>
  );
}
