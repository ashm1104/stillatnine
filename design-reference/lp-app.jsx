/* Still at Nine — Landing Page: All Section Components + App */
const { useState, useCallback } = React;

/* =============== CONSTANTS =============== */
const AC = '#D8A24C', AC2 = '#9C6B1B', DK = '#130F0A', DK2 = '#1E1811';
const LT = '#F5EFE4', LT2 = '#FFFDF8', TDK = '#F0E9DC', TLT = '#1A140D';
const MDK = '#9C8E78', MLT = '#6B6051', BDK = '#2C231A', BLT = '#E4DBCB';
const PF = "'Playfair Display', Georgia, serif";
const SP = "'Spectral', Georgia, serif";
const SC = "'Spectral SC', 'Spectral', serif";

/* =============== STORY DATA =============== */
const STORIES = [
  {
    num: '04', title: 'The village that appeared on no map',
    preview: "In 1930, a British cartographer working on a survey of the upper Amazon basin marked a settlement that appeared in no colonial record. No census counted its people. No missionary had visited. His field notes contain a single annotation: \"Settlement observed. Approx. 200 souls. No name given.\"\n\nHe never visited the site. Six years later, a follow-up expedition found the coordinates empty — just river and canopy. But the cartographer's original survey plate, examined under magnification decades later, revealed something his published map had not shown: a second settlement, three miles northeast, that he had carefully",
    cutoff: true,
  },
  {
    num: '11', title: 'A signal with no source. Forty years.',
    preview: "On the night of August 15, 1977, astronomer Jerry Ehman was reviewing data from Ohio State University's Big Ear radio telescope when he spotted a sequence so striking he circled it and wrote \"Wow!\" in the margin. The signal lasted 72 seconds. It matched the expected frequency of an interstellar communication. It was thirty times louder than the background noise of deep space.\n\nAnd then it was gone.\n\nIn the forty years since, every attempt to detect it again has failed. The signal came from the direction of Sagittarius, from a region of sky with no remarkable stars. It was not a satellite, not an aircraft, not a terrestrial signal bouncing off debris.\n\nThe Big Ear telescope was demolished in 1998 to make way for a golf course. The source of the Wow! signal has never been identified.",
    cutoff: false,
  },
  {
    num: '18', title: 'The manuscript no one could read',
    preview: "In 1912, a rare book dealer named Wilfrid Voynich purchased a medieval manuscript from a Jesuit college near Rome. The book was roughly 240 pages, illustrated with drawings of unidentified plants, astronomical diagrams, and what appeared to be bathing women connected by elaborate plumbing.\n\nEvery page was written in an unknown script that no linguist, cryptographer, or computer has ever",
    cutoff: true,
  },
];

/* =============== HELPERS =============== */
function isDarkSection(idx, style) {
  if (style === 'alternating') return idx % 2 === 0;
  if (style === 'dark') return ![1, 5].includes(idx);
  return [0, 6].includes(idx); // light
}

function DiamondRule({ color }) {
  return (
    <div className="diamond-rule">
      <span style={{ color }}>✦</span>
      <div style={{ background: color }} />
      <span style={{ color }}>✦</span>
    </div>
  );
}

function SectionWrap({ dark, children, className, id }) {
  return (
    <section className={`sec ${dark ? 'sec--dk' : 'sec--lt'} ${className || ''}`} id={id}>
      <div className="sec-inner">{children}</div>
    </section>
  );
}

function Eyebrow({ children, dark }) {
  return <span className="eyebrow" style={{ color: dark ? AC : AC2 }}>{children}</span>;
}

/* =============== ATMOSPHERE =============== */
function HeroAtmosphere({ level }) {
  const s = level === 'none' ? 0 : level === 'subtle' ? 0.5 : 0.85;
  if (s === 0) return null;
  const embers = [
    [85,78,2.4,0.8],[80,70,1.5,0.55],[88,60,1.8,0.65],[78,82,1.3,0.45],
    [72,68,1.7,0.5],[82,48,1.2,0.4],[74,80,2.0,0.6],[68,76,1.3,0.38],
    [89,72,1.4,0.5],[70,55,1.1,0.32],[80,38,1.0,0.28],[86,36,1.3,0.38],
    [64,64,1.0,0.26],[76,28,0.9,0.24],[60,74,1.1,0.28],[56,58,0.8,0.2],
    [66,48,1.4,0.34],[54,68,0.9,0.22],
  ];
  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo-glow" style={{
        background: `radial-gradient(100% 80% at 85% 105%, rgba(216,162,76,${0.30*s}) 0%, rgba(216,162,76,${0.07*s}) 32%, transparent 60%)`,
      }} />
      <svg className="atmo-arcs" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[32,48,66].map((r,i) => (
          <circle key={i} cx="85" cy="105" r={r} fill="none" stroke={AC} strokeWidth="0.12" opacity={(0.13-i*0.03)*s} />
        ))}
      </svg>
      <svg className="atmo-embers" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {embers.map(([x,y,r,o],i) => (
          <g key={i}>
            {r > 1.5 && <circle cx={x} cy={y} r={r*2.5} fill={AC} className="ember" opacity={o*0.1*s} style={{animationDelay:`${i%10*0.7}s`,animationDuration:`${6+i%6}s`}} />}
            <circle cx={x} cy={y} r={r*0.55} fill={AC} className="ember" opacity={o*s} style={{animationDelay:`${i%10*0.7}s`,animationDuration:`${6+i%6}s`}} />
          </g>
        ))}
      </svg>
      <div className="atmo-nine" style={{ opacity: 0.018 * s }}>9</div>
      <div className="atmo-vig" style={{ opacity: s*0.9 }} />
      <div className="grain" style={{ opacity: 0.045*s }} />
    </div>
  );
}

/* =============== LOGO — THE UNDERSCORE + DOT =============== */
function LogoMark({ size, dark }) {
  // Minimal dot mark — the lamp, the period, the point of light at 9 PM
  const s = size || 12;
  const acc = dark ? AC : AC2;
  return (
    <span style={{
      display: 'inline-block', width: s, height: s, borderRadius: '50%',
      background: acc,
      boxShadow: `0 0 ${s * 1.1}px ${s * 0.3}px rgba(216,162,76,0.45)`,
    }} />
  );
}

function LogoWordmark({ color, accent, size }) {
  const sz = size || 48;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: sz * 0.12 }}>
      <span style={{ fontFamily: PF, fontSize: sz, fontWeight: 600, color, letterSpacing: '-0.01em', lineHeight: 1 }}>Still at Nine</span>
      <div style={{ width: sz * 3.3, height: Math.max(1.5, sz * 0.035), background: accent, borderRadius: 1, opacity: 0.6 }} />
    </div>
  );
}

function LogoHorizontal({ dark, size }) {
  const sz = size || 24;
  const txt = dark ? TDK : TLT;
  const acc = dark ? AC : AC2;
  const mut = dark ? MDK : MLT;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: sz * 0.55 }}>
        <span style={{ fontFamily: PF, fontSize: sz, fontWeight: 600, color: txt, letterSpacing: '-0.01em', lineHeight: 1 }}>Still at Nine</span>
        <span style={{ fontFamily: SP, fontSize: sz * 0.52, fontStyle: 'italic', color: mut }}>Stories after dark.</span>
      </div>
      <div style={{ width: '100%', height: Math.max(1, sz * 0.04), background: acc, borderRadius: 1, opacity: 0.5, marginTop: sz * 0.35 }} />
    </div>
  );
}

/* =============== NAVBAR =============== */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => scrollTo('hero')}>
          <LogoMark size={16} dark={true} />
          <span className="navbar-name">Still at Nine</span>
        </button>
        <div className="navbar-links">
          <button className="navbar-link" onClick={() => scrollTo('stories')}>Preview</button>
          <button className="navbar-link" onClick={() => scrollTo('how')}>How it works</button>
          <button className="navbar-link" onClick={() => scrollTo('final-cta')}>Pricing</button>
        </div>
      </div>
    </nav>
  );
}

/* =============== SECTION 1 — HERO =============== */
function HeroSection({ tw }) {
  const [hover, setHover] = useState(false);
  const layout = tw.heroLayout;
  const isCine = layout === 'cinematic';
  const isEdit = layout === 'editorial';

  const content = (
    <div className="hero-content">
      <Eyebrow dark>Three nights a week · 9 PM</Eyebrow>
      <h1 className={`hero-title ${isCine ? 'hero-title--cine' : ''}`}>Still at Nine</h1>
      <div className="hero-underscore" style={{ width: isCine ? 200 : 160, height: 2, background: AC, opacity: 0.55, borderRadius: 1, margin: isCine ? '16px auto 0' : '16px 0 0' }} />
      <p className="hero-tagline">Strange, true stories. Delivered after dark.</p>
      <p className="hero-lead">A series of real-world mysteries, strange histories, and unexplained events. 24 stories over 8 weeks — delivered to your inbox at 9 PM.</p>
      <button className="cta-btn" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ background: hover ? '#E6B663' : AC, width: isCine ? '100%' : undefined, maxWidth: isCine ? 420 : undefined }}>
        Get Still at Nine — <span className="strike">$24</span> $19 one time
      </button>
      <p className="hero-sub">One payment. No subscription. Yours to keep.</p>
    </div>
  );

  return (
    <section className={`hero hero--${layout}`} id="hero">
      <HeroAtmosphere level={tw.atmosphere} />
      <div className="hero-inner">
        {isEdit ? (
          <div className="hero-edit-grid">
            <div className="hero-edit-text">{content}</div>
            <div className="hero-edit-mark">
              <LogoMark size={28} dark={true} />
            </div>
          </div>
        ) : (
          <div>
            {content}
          </div>
        )}
      </div>
    </section>
  );
}

/* =============== SECTION 2 — WHAT YOU'LL READ =============== */
function WhatYoullRead({ dark }) {
  const acc = dark ? AC : AC2;
  return (
    <SectionWrap dark={dark} id="what">
      <Eyebrow dark={dark}>What you'll read</Eyebrow>
      <h2 className="sec-h2">Some stories were never resolved.</h2>
      <p className="sec-body sec-body--read">
        A village that vanished without evacuation. A signal that repeated for decades with no known source.
        A manuscript no one has ever been able to read. Still at Nine is a collection of 24 stories like
        these — meticulously researched, grippingly told, and delivered to your inbox three nights a week.
      </p>
      <DiamondRule color={acc} />
    </SectionWrap>
  );
}

/* =============== SECTION 3 — STORIES LIKE THESE =============== */
function StoriesSection({ dark, tw, onStory }) {
  const style = tw.storyCards;
  return (
    <SectionWrap dark={dark} id="stories" className="stories-sec">
      <Eyebrow dark={dark}>Stories like these</Eyebrow>
      <p className="sec-subtitle" style={{ color: dark ? MDK : MLT, fontStyle: 'italic' }}>
        Land in your inbox at nine.
      </p>
      <div className={`story-list story-list--${style}`}>
        {STORIES.map((s, i) => (
          <button key={i} className={`story-item story-item--${style}`} onClick={() => onStory(i)}
            style={style === 'cards' ? { background: dark ? DK2 : LT2, borderColor: dark ? BDK : BLT } : undefined}>
            <span className="story-num" style={{ color: dark ? AC : AC2 }}>
              {style === 'archive' ? `Still at Nine #${s.num}` : `#${s.num}`}
            </span>
            <span className="story-title" style={{ color: dark ? TDK : TLT }}>{s.title}</span>
            <span className="story-arrow" style={{ color: dark ? MDK : MLT }}>→</span>
          </button>
        ))}
      </div>
      <p className="story-hint" style={{ color: dark ? MDK : MLT }}>Tap a story to preview it.</p>
    </SectionWrap>
  );
}

/* =============== SECTION 4 — HOW IT WORKS =============== */
const STEPS = [
  { num: '01', label: 'Pay once, keep forever', desc: '$19. No subscription, no renewal. The full collection is yours.', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  { num: '02', label: '9 PM, three nights a week', desc: 'Your phone lights up. A new story lands. The night begins.', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' },
  { num: '03', label: 'Read at your pace', desc: 'Each story is 5–8 minutes. Open it tonight, or save it for later.', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' },
  { num: '04', label: 'Just email, nothing else', desc: 'No app. No algorithm. No feed. Just you and the story.', icon: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
];

function HowItWorks({ dark }) {
  const acc = dark ? AC : AC2;
  const txt = dark ? TDK : TLT;
  const mut = dark ? MDK : MLT;
  const bdr = dark ? BDK : BLT;
  const surf = dark ? DK2 : LT2;

  return (
    <SectionWrap dark={dark} id="how" className="how-sec">
      <Eyebrow dark={dark}>How it works</Eyebrow>
      <h2 className="sec-h2">Simple. On purpose.</h2>
      <div className="how-grid">
        {STEPS.map((step, i) => (
          <div key={i} className="how-step" style={{ borderColor: bdr }}>
            <div className="how-step-head">
              <span className="how-step-num" style={{ color: acc }}>{step.num}</span>
              <div className="how-step-dot" style={{ background: acc }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill={dark ? DK : LT}>
                  <path d={step.icon} />
                </svg>
              </div>
            </div>
            <h3 className="how-step-label" style={{ color: txt }}>{step.label}</h3>
            <p className="how-step-desc" style={{ color: mut }}>{step.desc}</p>
            {i < STEPS.length - 1 && <div className="how-step-thread" style={{ background: acc }} />}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

/* =============== SECTION 5 — WHAT THIS IS NOT =============== */
function WhatThisIsNot({ dark }) {
  return (
    <SectionWrap dark={dark} id="not" className="sec--narrow">
      <Eyebrow dark={dark}>What this is not</Eyebrow>
      <h2 className="sec-h2">Not horror. Not true crime. Not clickbait.</h2>
      <p className="sec-body sec-body--read">
        A quiet archive of things that happened and were never fully explained.
      </p>
    </SectionWrap>
  );
}

/* =============== SECTION 6 — EVERY STORY IS REAL =============== */
function EveryStoryIsReal({ dark }) {
  return (
    <SectionWrap dark={dark} id="real" className="sec--narrow">
      <Eyebrow dark={dark}>Every story is real</Eyebrow>
      <h2 className="sec-h2">Based on documented sources.</h2>
      <p className="sec-body sec-body--read">
        Reports, public records, archives, first-hand accounts. No fiction. No invented explanations.
        When the truth ends in uncertainty, the story ends there too.
      </p>
      <DiamondRule color={dark ? AC : AC2} />
    </SectionWrap>
  );
}

/* =============== SECTION 7 — FINAL CTA =============== */
function FinalCTA({ dark }) {
  const [hover, setHover] = useState(false);
  return (
    <SectionWrap dark={dark} id="final-cta" className="sec--cta">
      <p className="cta-kicker" style={{ color: dark ? MDK : MLT, fontStyle: 'italic' }}>
        One payment. No subscription. Just the stories after dark.
      </p>
      <h2 className="sec-h2 sec-h2--lg">24 stories. 8 weeks.<br />Delivered at nine.</h2>
      <button className="cta-btn cta-btn--lg" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ background: hover ? '#E6B663' : AC }}>
        Get Still at Nine — <span className="strike">$24</span> $19 one time
      </button>
    </SectionWrap>
  );
}

/* =============== SECTION 8 — WHO'S BEHIND THIS =============== */
function WhosBehind({ dark }) {
  return (
    <SectionWrap dark={dark} id="who" className="sec--narrow sec--who">
      <Eyebrow dark={dark}>Who's behind this</Eyebrow>
      <div className="who-card" style={{ borderColor: dark ? BDK : BLT }}>
        <div className="who-avatar" style={{ background: dark ? DK2 : BLT }}>
          <LogoMark size={14} dark={dark} />
        </div>
        <div>
          <p className="who-name" style={{ color: dark ? TDK : TLT }}>The Archivist</p>
          <p className="who-bio" style={{ color: dark ? MDK : MLT }}>
            I've spent too many nights reading about things that never got explained.
            Still at Nine is the newsletter I wanted in my own inbox.
          </p>
        </div>
      </div>
    </SectionWrap>
  );
}

/* =============== STORY MODAL =============== */
function StoryModal({ story, onClose }) {
  if (story == null) return null;
  const s = STORIES[story];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <span className="modal-num">Still at Nine #{s.num}</span>
        <h3 className="modal-title">{s.title}</h3>
        <div className="modal-body">
          {s.preview.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          {s.cutoff && <span className="modal-ellipsis">…</span>}
        </div>
        {s.cutoff && (
          <div className="modal-tease">
            <p>This story continues in your inbox.</p>
            <button className="cta-btn cta-btn--sm" onClick={onClose}>
              Get Still at Nine — $19
            </button>
          </div>
        )}
        {!s.cutoff && (
          <div className="modal-tease modal-tease--full">
            <p>This is one of 24 stories.</p>
            <button className="cta-btn cta-btn--sm" onClick={onClose}>
              Get all 24 — $19
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============== FOOTER =============== */
function Footer() {
  return (
    <footer className="lp-footer">
      <LogoHorizontal dark={true} size={20} />
      <p style={{ marginTop: 20 }}>© 2026 Still at Nine. All rights reserved.</p>
    </footer>
  );
}

/* =============== APP =============== */
const LP_DEFAULTS = {
  heroLayout: 'cinematic',
  sectionStyle: 'alternating',
  storyCards: 'archive',
  atmosphere: 'subtle',
};

function LandingPage() {
  const [tw, setTweak] = useTweaks(LP_DEFAULTS);
  const [activeStory, setActiveStory] = useState(null);

  const secDark = (i) => isDarkSection(i, tw.sectionStyle);

  return (
    <div className="lp">
      <Navbar />
      <HeroSection tw={tw} />
      <WhatYoullRead dark={secDark(1)} />
      <StoriesSection dark={secDark(2)} tw={tw} onStory={setActiveStory} />
      <HowItWorks dark={secDark(3)} />
      <WhatThisIsNot dark={secDark(4)} />
      <EveryStoryIsReal dark={secDark(5)} />
      <FinalCTA dark={secDark(6)} />
      <WhosBehind dark={secDark(7)} />
      <Footer />

      <StoryModal story={activeStory} onClose={() => setActiveStory(null)} />

      <TweaksPanel>
        <TweakSection label="Design Direction" />
        <TweakRadio label="Hero layout" value={tw.heroLayout}
          options={['centered', 'editorial', 'cinematic']}
          onChange={v => setTweak('heroLayout', v)} />
        <TweakRadio label="Page tone" value={tw.sectionStyle}
          options={['alternating', 'dark', 'light']}
          onChange={v => setTweak('sectionStyle', v)} />
        <TweakSection label="Components" />
        <TweakRadio label="Story cards" value={tw.storyCards}
          options={['archive', 'cards', 'list']}
          onChange={v => setTweak('storyCards', v)} />
        <TweakRadio label="Atmosphere" value={tw.atmosphere}
          options={['rich', 'subtle', 'none']}
          onChange={v => setTweak('atmosphere', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LandingPage />);
