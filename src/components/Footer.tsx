// Footer. Ported from lp-app.jsx.

import { LogoHorizontal } from "./Logo";

export function Footer() {
  return (
    <footer className="lp-footer">
      <LogoHorizontal dark={true} size={20} />
      <p style={{ marginTop: 20 }}>© 2026 Still at Nine. All rights reserved.</p>
    </footer>
  );
}
