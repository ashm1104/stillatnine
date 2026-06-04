/* Still at Nine — Transactional pages app */
const { useState, useEffect } = React;

const AC = '#D8A24C', AC2 = '#9C6B1B', TDK = '#F0E9DC', MDK = '#9C8E78';

/* ---- atmosphere (ported from landing page) ---- */
function Atmosphere({ level = 'subtle' }) {
  const s = level === 'none' ? 0 : level === 'full' ? 0.85 : 0.5;
  if (s === 0) return null;
  const embers = [
    [85,78,2.4,0.8],[80,70,1.5,0.55],[88,60,1.8,0.65],[78,82,1.3,0.45],
    [72,68,1.7,0.5],[82,48,1.2,0.4],[74,80,2.0,0.6],[68,76,1.3,0.38],
    [90,72,1.4,0.5],[64,64,1.1,0.34],[58,72,1.5,0.42],[50,60,1.0,0.3],
  ];
  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo-glow" style={{
        background: `radial-gradient(100% 80% at 50% 108%, rgba(216,162,76,${0.26*s}) 0%, rgba(216,162,76,${0.06*s}) 34%, transparent 62%)`,
      }} />
      <svg className="atmo-arcs" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[30,46,64].map((r,i) => (
          <circle key={i} cx="50" cy="108" r={r} fill="none" stroke={AC} strokeWidth="0.12" opacity={(0.12-i*0.03)*s} />
        ))}
      </svg>
      <svg className="atmo-embers" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {embers.map(([x,y,r,o],i) => (
          <g key={i}>
            {r > 1.5 && <circle cx={x} cy={y} r={r*2.5} fill={AC} className="ember" opacity={o*0.1*s} style={{animationDelay:`${i%10*0.7}s`,animationDuration:`${6+i%6}s`}} />}
            <circle cx={x} cy={y} r={r*0.5} fill={AC} className="ember" opacity={o*s} style={{animationDelay:`${i%8*0.6}s`,animationDuration:`${5+i%5}s`}} />
          </g>
        ))}
      </svg>
      <div className="atmo-nine" style={{ opacity: 0.018 * s, left: 'auto', right: '50%', transform: 'translateX(50%)', bottom: '-8%' }}>9</div>
      <div className="atmo-vig" style={{ opacity: s*0.9 }} />
      <div className="grain" style={{ opacity: 0.045*s }} />
    </div>
  );
}

function Brand() {
  return (
    <a className="tx-brand" href="Landing Page.html">
      <span style={{ display:'inline-block', width:16, height:16, borderRadius:'50%', background:AC, boxShadow:'0 0 16px 3px rgba(216,162,76,0.45)' }} />
      <span className="tx-brand-name">Still at Nine</span>
    </a>
  );
}

function Rule() {
  return <div className="tx-rule"><div /><span>&#10022;</span><div /></div>;
}

function Footer() {
  return (
    <footer className="tx-footer">
      <p>&copy; 2026 Still at Nine &middot; Stories after dark</p>
    </footer>
  );
}

/* ================= THANK YOU ================= */
function ThankYou({ atmo }) {
  return (
    <div className="tx-page">
      <Atmosphere level={atmo} />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner tx-inner--wide">
          <div className="tx-lamp"><span className="tx-dot" /></div>
          <div className="tx-eyebrow">Order confirmed</div>
          <h1 className="tx-title">You&rsquo;re in.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">The lamp is lit. Your first story arrives tonight at 9.</p>

          <div className="tx-card">
            <div className="tx-card-head">
              <div>
                <h2 className="tx-card-title">Still at Nine &mdash; The Collection</h2>
                <p className="tx-card-sub">24 stories &middot; 8 weeks &middot; delivered 9 PM</p>
              </div>
              <div className="tx-card-paid">
                <span className="tx-card-amount"><span className="tx-card-strike">$24</span>$19</span>
                <span>Paid &middot; one time</span>
              </div>
            </div>
            <ul className="tx-steps">
              <li className="tx-step">
                <span className="tx-step-ic">1</span>
                <span className="tx-step-txt">Your first story lands <b>tonight at 9 PM</b>, then three nights a week.</span>
              </li>
              <li className="tx-step">
                <span className="tx-step-ic">2</span>
                <span className="tx-step-txt">Add <b>stories@stillatnine.com</b> to your contacts so it always reaches you.</span>
              </li>
              <li className="tx-step">
                <span className="tx-step-ic">3</span>
                <span className="tx-step-txt">Reply to any story anytime &mdash; it reaches a person, not a void.</span>
              </li>
            </ul>
          </div>

          <p className="tx-note">A receipt is on its way to your inbox. Nothing to download, nothing to log into.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ================= UNSUBSCRIBE ================= */
function Unsubscribe({ atmo }) {
  const [resubbed, setResubbed] = useState(false);
  return (
    <div className="tx-page">
      <Atmosphere level={atmo === 'full' ? 'subtle' : atmo} />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-lamp"><span className={"tx-dot" + (resubbed ? "" : " tx-dot--out")} /></div>
          {resubbed ? (
            <React.Fragment>
              <div className="tx-eyebrow">Welcome back</div>
              <h1 className="tx-title">The lamp is lit again.</h1>
              <div className="tx-underscore" />
              <p className="tx-tagline">Good. The stories resume at the next nine o&rsquo;clock.</p>
              <div className="tx-actions">
                <a className="tx-cta" href="Landing Page.html">Back to Still at Nine</a>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="tx-eyebrow tx-eyebrow--mute">Unsubscribed</div>
              <h1 className="tx-title">The lamp is out.</h1>
              <div className="tx-underscore tx-underscore--out" />
              <p className="tx-tagline">You&rsquo;ve been unsubscribed. No more stories will arrive at nine.</p>
              <p className="tx-body">The stories already in your inbox are yours to keep. If this was a quiet evening&rsquo;s mistake, you can light it again.</p>
              <div className="tx-actions">
                <button className="tx-cta" onClick={() => setResubbed(true)}>Light it again</button>
                <a className="tx-link" href="Landing Page.html">Return to Still at Nine instead &rsaquo;</a>
              </div>
            </React.Fragment>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ================= 404 ================= */
function NotFound({ atmo }) {
  return (
    <div className="tx-page">
      <Atmosphere level={atmo} />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-404">4<span className="nine-dot">0</span>4</div>
          <div className="tx-eyebrow tx-eyebrow--mute" style={{ marginTop: 8 }}>Nothing here</div>
          <h1 className="tx-title">This page went dark.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">The story you&rsquo;re after isn&rsquo;t here &mdash; or the light&rsquo;s gone out on this link.</p>
          <Rule />
          <div className="tx-actions">
            <a className="tx-cta" href="Landing Page.html">Back to Still at Nine</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ================= ERROR ================= */
function ErrorState({ atmo }) {
  const [busy, setBusy] = useState(false);
  const retry = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 2200);
  };
  return (
    <div className="tx-page">
      <Atmosphere level={atmo} />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-lamp"><span className="tx-dot tx-dot--flicker" /></div>
          <div className="tx-eyebrow tx-eyebrow--mute">Something went wrong</div>
          <h1 className="tx-title">The light flickered.</h1>
          <div className="tx-underscore" />
          <p className="tx-tagline">Your payment didn&rsquo;t go through &mdash; and nothing was charged.</p>
          <p className="tx-body">It happens. Try once more, or write to us and we&rsquo;ll light the way. If a charge ever appears, it reverses on its own within a few days.</p>
          <div className="tx-actions">
            <button className={"tx-cta" + (busy ? " tx-cta--busy" : "")} onClick={retry}>
              {busy ? (<React.Fragment><span className="tx-spin" />Processing&hellip;</React.Fragment>) : "Try again"}
            </button>
            <a className="tx-link" href="Landing Page.html">Return to Still at Nine instead &rsaquo;</a>
          </div>
          <p className="tx-help">Stuck? Write to <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a> &mdash; it reaches a person.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ================= LOADING ================= */
function Loading({ atmo }) {
  return (
    <div className="tx-page">
      <Atmosphere level={atmo === 'full' ? 'subtle' : atmo} />
      <Brand />
      <main className="tx-main">
        <div className="tx-inner">
          <div className="tx-loader">
            <div style={{ position: 'relative', width: 18, height: 18 }}>
              <span className="tx-loader-halo" />
              <span className="tx-loader-lamp" />
            </div>
            <div className="tx-loader-text">One moment</div>
            <div className="tx-loader-sub">Finding your place in the dark&hellip;</div>
            <div className="tx-progress" />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= APP + SWITCHER ================= */
const PAGES = [
  { id: 'thanks', label: 'Thank you', C: ThankYou },
  { id: 'unsub', label: 'Unsubscribe', C: Unsubscribe },
  { id: '404', label: '404', C: NotFound },
  { id: 'error', label: 'Error', C: ErrorState },
  { id: 'loading', label: 'Loading', C: Loading },
];

function App() {
  const [page, setPage] = useState(() => {
    const h = (location.hash || '').replace('#', '');
    return PAGES.some(p => p.id === h) ? h : 'thanks';
  });
  const [atmo] = useState('subtle');

  useEffect(() => { location.hash = page; }, [page]);

  const Current = (PAGES.find(p => p.id === page) || PAGES[0]).C;

  return (
    <React.Fragment>
      <Current atmo={atmo} key={page} />
      <div className="tx-switch" role="tablist" aria-label="Preview page">
        {PAGES.map(p => (
          <button key={p.id} className={page === p.id ? 'on' : ''} onClick={() => setPage(p.id)}>{p.label}</button>
        ))}
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
