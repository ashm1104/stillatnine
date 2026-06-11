// Shared chrome for the long-form legal pages (/privacy, /terms). Reuses the
// transactional Atmosphere + Brand, adds an article reading column and a footer
// that cross-links the two docs.

import Link from "next/link";
import type { ReactNode } from "react";
import { Atmosphere, Brand } from "@/components/TxChrome";
import "@/styles/transactional.css";
import "@/styles/legal.css";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="tx-page">
      <Atmosphere level="subtle" />
      <Brand />
      <main className="legal-main">
        <header className="legal-head">
          <div className="legal-eyebrow">Still at Nine</div>
          <h1 className="legal-title">{title}</h1>
          <p className="legal-meta">Last updated {updated}</p>
        </header>
        <article className="legal-content">{children}</article>
        <footer className="legal-foot">
          <Link href="/">&larr; Back to Still at Nine</Link>
          <nav className="legal-foot-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
