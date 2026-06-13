"use client";

// Fixed navbar. Adds .navbar--scrolled past 60px; links smooth-scroll to anchors.
// Ported from lp-app.jsx.

import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => scrollTo("hero")}>
          <LogoMark size={16} dark={true} />
          <span className="navbar-name">Still at Nine</span>
        </button>
        <div className="navbar-links">
          <button className="navbar-link" onClick={() => scrollTo("stories")}>
            Preview
          </button>
          <a className="navbar-link" href="/stories">
            Archive
          </a>
          <button className="navbar-link" onClick={() => scrollTo("how")}>
            How it works
          </button>
          <button className="navbar-link" onClick={() => scrollTo("final-cta")}>
            Pricing
          </button>
          <button className="navbar-link" onClick={() => scrollTo("faq")}>
            FAQ
          </button>
        </div>
      </div>
    </nav>
  );
}
