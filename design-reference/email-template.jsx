/* Still at Nine — Story Email template (email-safe table markup, themed) */

const HEAD_FONT = "'Playfair Display', Georgia, 'Times New Roman', serif";
const BODY_FONT = "'Spectral', Georgia, 'Times New Roman', serif";
const SC_FONT   = "'Spectral SC', 'Spectral', Georgia, serif";

const ETHEMES = {
  hybrid: {
    page:"#100B06", container:"#FFFDF8", body:"#F7F1E6",
    text:"#1A140D", muted:"#6B6051", soft:"#8A7C68", accent:"#9C6B1B", border:"#E4DBCB",
    mast:"#130F0A", mastText:"#F0E9DC", mastMuted:"#9C8E78", mastAccent:"#D8A24C",
    foot:"#130F0A", footText:"#9C8E78", footAccent:"#D8A24C", footBorder:"#2C231A",
  },
  dark: {
    page:"#080502", container:"#1B150E", body:"#1B150E",
    text:"#F0E9DC", muted:"#9C8E78", soft:"#7E7259", accent:"#D8A24C", border:"#2C231A",
    mast:"#130F0A", mastText:"#F0E9DC", mastMuted:"#9C8E78", mastAccent:"#D8A24C",
    foot:"#0F0B07", footText:"#9C8E78", footAccent:"#D8A24C", footBorder:"#2C231A",
  },
  cream: {
    page:"#E7DDCB", container:"#FFFDF8", body:"#F7F1E6",
    text:"#1A140D", muted:"#6B6051", soft:"#8A7C68", accent:"#9C6B1B", border:"#E4DBCB",
    mast:"#F5EFE4", mastText:"#1A140D", mastMuted:"#6B6051", mastAccent:"#9C6B1B",
    foot:"#EFE6D6", footText:"#6B6051", footAccent:"#9C6B1B", footBorder:"#E0D6C4",
  },
};

function Dot({ c, glow, size = 9 }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size, borderRadius:"50%",
      background:c, verticalAlign:"middle",
      boxShadow: glow ? `0 0 14px 2px ${c}88` : "none",
    }} />
  );
}

function DiamondRule({ c, w = 60 }) {
  return (
    <div style={{ textAlign:"center", margin:"34px 0", color:c, lineHeight:1 }}>
      <span style={{ display:"inline-block", width:w, height:1, background:c, opacity:.45, verticalAlign:"middle" }} />
      <span style={{ fontSize:11, opacity:.8, margin:"0 12px", verticalAlign:"middle" }}>&#10022;</span>
      <span style={{ display:"inline-block", width:w, height:1, background:c, opacity:.45, verticalAlign:"middle" }} />
    </div>
  );
}

function EmailTemplate({ theme = "hybrid", atmosphere = "restrained", width = 600 }) {
  const t = ETHEMES[theme] || ETHEMES.hybrid;
  const E = window.EMAIL;
  const full = atmosphere === "full";
  const PAD = 44;

  const cell = { padding: `0 ${PAD}px` };
  const para = {
    margin:"0 0 22px", fontFamily:BODY_FONT, fontSize:17, lineHeight:1.72,
    color:t.text, fontWeight:400, letterSpacing:"0.005em",
  };

  let firstLead = true;

  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%"
      style={{ background:t.page, margin:0, padding:0, borderCollapse:"collapse" }}>
      <tbody><tr><td align="center" style={{ padding:"0 0" }}>

        {/* preheader (hidden) */}
        <div style={{ display:"none", maxHeight:0, overflow:"hidden", opacity:0, color:t.page, fontSize:1, lineHeight:1 }}>
          {E.preheader}
        </div>

        <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width={width}
          style={{ width, maxWidth:"100%", background:t.container, borderCollapse:"collapse" }}>
          <tbody>

          {/* ---------- MASTHEAD ---------- */}
          <tr><td style={{ background:t.mast, padding:`22px ${PAD}px 20px` }}>
            <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%">
              <tbody><tr>
                <td align="left" style={{ verticalAlign:"middle", width:"100%" }}>
                  <Dot c={t.mastAccent} glow={full} />
                  <span style={{ fontFamily:HEAD_FONT, fontWeight:600, fontSize:19, color:t.mastText, letterSpacing:"-0.01em", marginLeft:10, verticalAlign:"middle" }}>
                    Still at Nine
                  </span>
                </td>
                <td align="right" style={{ verticalAlign:"middle", whiteSpace:"nowrap", paddingLeft:20, fontFamily:SC_FONT, fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", color:t.mastMuted }}>
                  Story {E.storyNo} / {E.storyTotal}
                </td>
              </tr></tbody>
            </table>
          </td></tr>

          {/* ---------- TITLE BLOCK ---------- */}
          <tr><td style={{ background:t.container, padding:`40px ${PAD}px 6px` }}>
            <div style={{ fontFamily:SC_FONT, fontSize:12, letterSpacing:"0.3em", textTransform:"uppercase", color:t.accent, marginBottom:18 }}>
              {E.category}
            </div>
            <h1 style={{ margin:0, fontFamily:HEAD_FONT, fontWeight:600, fontSize:34, lineHeight:1.16, letterSpacing:"-0.015em", color:t.text }}>
              {E.title}
            </h1>
            <div style={{ marginTop:18, fontFamily:SC_FONT, fontSize:11.5, letterSpacing:"0.16em", textTransform:"uppercase", color:t.soft }}>
              {E.dateLabel} &nbsp;&middot;&nbsp; {E.readMins} min read
            </div>
            <div style={{ height:1, background:t.border, margin:"26px 0 4px" }} />
          </td></tr>

          {/* ---------- BODY ---------- */}
          <tr><td style={{ background:t.container, padding:`24px ${PAD}px 8px` }}>
            {E.body.map((b, i) => {
              if (b.kind === "lead") {
                const useCap = full && firstLead;
                firstLead = false;
                return (
                  <p key={i} style={{ ...para, fontSize:19.5, lineHeight:1.66, color:t.text, marginBottom:24 }}>
                    {useCap && (
                      <span style={{ float:"left", fontFamily:HEAD_FONT, fontWeight:600, fontSize:62, lineHeight:0.84, color:t.accent, padding:"4px 12px 0 0" }}>
                        {b.text.trim().charAt(0)}
                      </span>
                    )}
                    {useCap ? b.text.trim().slice(1) : b.text}
                  </p>
                );
              }
              if (b.kind === "section") {
                return (
                  <div key={i} style={{ margin:"38px 0 22px" }}>
                    {full ? <DiamondRule c={t.accent} /> : null}
                    <div style={{ fontFamily:SC_FONT, fontSize:12.5, letterSpacing:"0.26em", textTransform:"uppercase", color:t.accent, display:"flex", alignItems:"center", gap:12 }}>
                      <span>{b.label}</span>
                      <span style={{ flex:1, height:1, background:t.border }} />
                    </div>
                  </div>
                );
              }
              if (b.kind === "quote") {
                return (
                  <div key={i} style={{ margin:"32px 0", textAlign:"center", padding:"0 12px" }}>
                    <div style={{ color:t.accent, fontSize:13, marginBottom:14, letterSpacing:"0.3em" }}>&#10022;</div>
                    <p style={{ margin:0, fontFamily:HEAD_FONT, fontStyle:"italic", fontWeight:500, fontSize:23, lineHeight:1.5, color:t.text }}>
                      {b.text}
                    </p>
                    <div style={{ color:t.accent, fontSize:13, marginTop:14, letterSpacing:"0.3em" }}>&#10022;</div>
                  </div>
                );
              }
              return <p key={i} style={para}>{b.text}</p>;
            })}
          </td></tr>

          {/* ---------- SOURCES & DISCLAIMER ---------- */}
          <tr><td style={{ background:t.container, padding:`14px ${PAD}px 40px` }}>
            <div style={{ background:t.body, border:`1px solid ${t.border}`, padding:"26px 28px", marginTop:18 }}>
              <div style={{ fontFamily:SC_FONT, fontSize:11.5, letterSpacing:"0.24em", textTransform:"uppercase", color:t.accent, marginBottom:16 }}>
                Sources &amp; record
              </div>
              <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%"><tbody>
                {E.sources.map((s, i) => (
                  <tr key={i}><td style={{ paddingBottom:10, verticalAlign:"top", fontFamily:BODY_FONT, fontSize:13.5, lineHeight:1.55, color:t.muted }}>
                    <span style={{ color:t.accent, marginRight:8 }}>&middot;</span>{s}
                  </td></tr>
                ))}
              </tbody></table>
              <div style={{ height:1, background:t.border, margin:"16px 0" }} />
              <p style={{ margin:0, fontFamily:BODY_FONT, fontStyle:"italic", fontSize:13.5, lineHeight:1.6, color:t.soft }}>
                {E.disclaimer}
              </p>
            </div>
          </td></tr>

          {/* ---------- FOOTER ---------- */}
          <tr><td style={{ background:t.foot, padding:`34px ${PAD}px 40px`, borderTop:`1px solid ${t.footBorder}` }}>
            <div style={{ textAlign:"center" }}>
              <Dot c={t.footAccent} glow={full} size={8} />
              <span style={{ fontFamily:HEAD_FONT, fontWeight:600, fontSize:16, color:theme==="cream"?t.text:t.mastText, letterSpacing:"-0.01em", marginLeft:9, verticalAlign:"middle" }}>
                Still at Nine
              </span>
              <p style={{ margin:"16px 0 0", fontFamily:BODY_FONT, fontStyle:"italic", fontSize:14, lineHeight:1.6, color:t.footText }}>
                You&rsquo;ve just read story {E.storyNo} of {E.storyTotal}. The next arrives at 9 PM.
              </p>
              <p style={{ margin:"22px 0 0", fontFamily:SC_FONT, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:t.footText }}>
                <a href="#" style={{ color:t.footAccent, textDecoration:"none" }}>Manage delivery</a>
                <span style={{ color:t.footText, margin:"0 10px" }}>&middot;</span>
                <a href="#" style={{ color:t.footAccent, textDecoration:"none" }}>Unsubscribe</a>
              </p>
              <p style={{ margin:"20px 0 0", fontFamily:BODY_FONT, fontSize:12, lineHeight:1.6, color:theme==="cream"?t.muted:"#6E624E" }}>
                Still at Nine &middot; [123 Example Street, City, Country]<br/>
                You&rsquo;re receiving this because you purchased the Still at Nine collection.
              </p>
              <p style={{ margin:"14px 0 0", fontFamily:BODY_FONT, fontSize:11.5, color:theme==="cream"?t.muted:"#5C5240" }}>
                &copy; 2026 Still at Nine. Reply to this email and it reaches a person.
              </p>
            </div>
          </td></tr>

          </tbody>
        </table>

      </td></tr></tbody>
    </table>
  );
}

if (typeof window !== "undefined") window.EmailTemplate = EmailTemplate;
