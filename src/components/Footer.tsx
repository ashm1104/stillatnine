// Footer. Ported from lp-app.jsx; legal links + contact added in Phase 6.

import Link from "next/link";
import { LogoHorizontal } from "./Logo";

export function Footer() {
  return (
    <footer className="lp-footer">
      <LogoHorizontal dark={true} size={20} />
      <nav className="lp-footer-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="mailto:hello@stillatnine.com">Contact</a>
      </nav>
      <p style={{ marginTop: 20 }}>© 2026 Still at Nine. All rights reserved.</p>
    </footer>
  );
}
