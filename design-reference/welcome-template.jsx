/* Still at Nine — Welcome email template (reuses ETHEMES / fonts from email-template.jsx) */

function WelcomeTemplate({ theme = "hybrid", atmosphere = "full", width = 600 }) {
  const t = ETHEMES[theme] || ETHEMES.hybrid;
  const W = window.WELCOME;
  const full = atmosphere === "full";
  const PAD = 44;

  const para = {
    margin:"0 0 22px", fontFamily:BODY_FONT, fontSize:17, lineHeight:1.72,
    color:t.text, fontWeight:400,
  };

  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%"
      style={{ background:t.page, margin:0, padding:0, borderCollapse:"collapse" }}>
      <tbody><tr><td align="center" style={{ padding:0 }}>

        <div style={{ display:"none", maxHeight:0, overflow:"hidden", opacity:0, color:t.page, fontSize:1, lineHeight:1 }}>
          {W.preheader}
        </div>

        <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width={width}
          style={{ width, maxWidth:"100%", background:t.container, borderCollapse:"collapse" }}>
          <tbody>

          {/* MASTHEAD */}
          <tr><td style={{ background:t.mast, padding:`22px ${PAD}px 20px` }}>
            <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%">
              <tbody><tr>
                <td align="left" style={{ verticalAlign:"middle", width:"100%" }}>
                  <Dot c={t.mastAccent} glow={full} />
                  <span style={{ fontFamily:HEAD_FONT, fontWeight:600, fontSize:19, color:t.mastText, letterSpacing:"-0.01em", marginLeft:10, verticalAlign:"middle" }}>Still at Nine</span>
                </td>
                <td align="right" style={{ verticalAlign:"middle", whiteSpace:"nowrap", paddingLeft:20, fontFamily:SC_FONT, fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", color:t.mastAccent }}>Welcome</td>
              </tr></tbody>
            </table>
          </td></tr>

          {/* HERO */}
          <tr><td style={{ background:t.container, padding:`46px ${PAD}px 6px`, textAlign:"center" }}>
            <div style={{ fontFamily:SC_FONT, fontSize:12, letterSpacing:"0.34em", textTransform:"uppercase", color:t.accent, marginBottom:22 }}>{W.eyebrow}</div>
            {full && (
              <div style={{ marginBottom:26 }}>
                <span style={{ display:"inline-block", width:13, height:13, borderRadius:"50%", background:t.accent, boxShadow:`0 0 26px 6px ${t.accent}66, 0 0 0 1px rgba(230,182,99,.4)` }} />
              </div>
            )}
            <h1 style={{ margin:0, fontFamily:HEAD_FONT, fontWeight:600, fontSize:38, lineHeight:1.14, letterSpacing:"-0.015em", color:t.text }}>{W.title}</h1>
          </td></tr>

          {/* LEAD */}
          <tr><td style={{ background:t.container, padding:`28px ${PAD}px 6px`, textAlign:"center" }}>
            <p style={{ margin:"0 auto", maxWidth:430, fontFamily:BODY_FONT, fontStyle:"italic", fontSize:19, lineHeight:1.66, color:t.text }}>{W.lead}</p>
          </td></tr>

          {full ? (
            <tr><td style={{ background:t.container }}><DiamondRule c={t.accent} /></td></tr>
          ) : (
            <tr><td style={{ background:t.container, padding:`8px ${PAD}px` }}><div style={{ height:1, background:t.border }} /></td></tr>
          )}

          {/* INTRO */}
          <tr><td style={{ background:t.container, padding:`8px ${PAD}px 8px` }}>
            <p style={{ ...para, marginBottom:8 }}>{W.intro}</p>
          </td></tr>

          {/* WHAT TO EXPECT */}
          <tr><td style={{ background:t.container, padding:`18px ${PAD}px 8px` }}>
            <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%"><tbody>
              {W.expect.map((e, i) => (
                <tr key={i}><td style={{ paddingBottom: i < W.expect.length - 1 ? 0 : 0 }}>
                  <div style={{ borderTop:`1px solid ${t.border}`, padding:"22px 0 20px" }}>
                    <table role="presentation" cellPadding="0" cellSpacing="0" border="0" width="100%"><tbody><tr>
                      <td style={{ verticalAlign:"top", width:54, paddingTop:3 }}>
                        <span style={{ fontFamily:HEAD_FONT, fontStyle:"italic", fontWeight:500, fontSize:22, color:t.accent }}>{String(i + 1).padStart(2, "0")}</span>
                      </td>
                      <td style={{ verticalAlign:"top" }}>
                        <div style={{ fontFamily:SC_FONT, fontSize:12, letterSpacing:"0.24em", textTransform:"uppercase", color:t.accent, marginBottom:8 }}>{e.label}</div>
                        <div style={{ fontFamily:BODY_FONT, fontSize:16.5, lineHeight:1.62, color:t.text }}>{e.text}</div>
                      </td>
                    </tr></tbody></table>
                  </div>
                </td></tr>
              ))}
            </tbody></table>
            <div style={{ borderTop:`1px solid ${t.border}` }} />
          </td></tr>

          {/* DELIVERABILITY NOTE */}
          <tr><td style={{ background:t.container, padding:`26px ${PAD}px 10px` }}>
            <div style={{ background:t.body, border:`1px solid ${t.border}`, padding:"24px 26px" }}>
              <div style={{ fontFamily:SC_FONT, fontSize:11.5, letterSpacing:"0.24em", textTransform:"uppercase", color:t.accent, marginBottom:12 }}>{W.deliverTitle}</div>
              <p style={{ margin:0, fontFamily:BODY_FONT, fontSize:15, lineHeight:1.66, color:t.muted }}>{W.deliverBody}</p>
            </div>
          </td></tr>

          {/* TONIGHT'S TEASER */}
          <tr><td style={{ background:t.container, padding:`26px ${PAD}px 10px` }}>
            <div style={{ fontFamily:SC_FONT, fontSize:12, letterSpacing:"0.28em", textTransform:"uppercase", color:t.soft, textAlign:"center", marginBottom:18 }}>
              <span style={{ color:t.accent }}>&#10022;</span>&nbsp;&nbsp;{W.teaserKicker}&nbsp;&nbsp;<span style={{ color:t.accent }}>&#10022;</span>
            </div>
            <div style={{ border:`1px solid ${t.border}`, background:t.container, padding:"30px 30px 32px", textAlign:"center" }}>
              <div style={{ fontFamily:SC_FONT, fontSize:11.5, letterSpacing:"0.3em", textTransform:"uppercase", color:t.accent, marginBottom:16 }}>{W.teaserCategory}</div>
              <h2 style={{ margin:0, fontFamily:HEAD_FONT, fontWeight:600, fontSize:26, lineHeight:1.28, letterSpacing:"-0.01em", color:t.text }}>{W.teaserTitle}</h2>
              <div style={{ height:24, lineHeight:"24px", fontSize:0 }}>&nbsp;</div>
              <p style={{ margin:"0 auto 18px", maxWidth:400, fontFamily:BODY_FONT, fontSize:16, lineHeight:1.64, color:t.muted }}>{W.teaserHook}</p>
              <div style={{ fontFamily:BODY_FONT, fontStyle:"italic", fontSize:13.5, color:t.soft }}>{W.teaserNote}</div>
            </div>
          </td></tr>

          {/* SIGN-OFF */}
          <tr><td style={{ background:t.container, padding:`34px ${PAD}px 44px`, textAlign:"center" }}>
            <p style={{ margin:"0 0 6px", fontFamily:BODY_FONT, fontStyle:"italic", fontSize:16, color:t.muted }}>{W.signoff}</p>
            <p style={{ margin:0, fontFamily:HEAD_FONT, fontWeight:600, fontSize:18, color:t.text, letterSpacing:"-0.01em" }}>{W.signName}</p>
          </td></tr>

          {/* FOOTER */}
          <tr><td style={{ background:t.foot, padding:`32px ${PAD}px 40px`, borderTop:`1px solid ${t.footBorder}`, textAlign:"center" }}>
            <Dot c={t.footAccent} glow={full} size={8} />
            <span style={{ fontFamily:HEAD_FONT, fontWeight:600, fontSize:16, color:theme==="cream"?t.text:t.mastText, letterSpacing:"-0.01em", marginLeft:9, verticalAlign:"middle" }}>Still at Nine</span>
            <p style={{ margin:"16px 0 0", fontFamily:BODY_FONT, fontStyle:"italic", fontSize:14, lineHeight:1.6, color:t.footText }}>Your first story arrives tonight at 9 PM.</p>
            <p style={{ margin:"22px 0 0", fontFamily:SC_FONT, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:t.footText }}>
              <a href="#" style={{ color:t.footAccent, textDecoration:"none" }}>Manage delivery</a>
              <span style={{ color:t.footText, margin:"0 10px" }}>&middot;</span>
              <a href="#" style={{ color:t.footAccent, textDecoration:"none" }}>Unsubscribe</a>
            </p>
            <p style={{ margin:"20px 0 0", fontFamily:BODY_FONT, fontSize:12, lineHeight:1.6, color:theme==="cream"?t.muted:"#6E624E" }}>
              Still at Nine &middot; [123 Example Street, City, Country]<br/>
              You&rsquo;re receiving this because you purchased the Still at Nine collection.
            </p>
            <p style={{ margin:"14px 0 0", fontFamily:BODY_FONT, fontSize:11.5, color:theme==="cream"?t.muted:"#5C5240" }}>&copy; 2026 Still at Nine. Reply to this email and it reaches a person.</p>
          </td></tr>

          </tbody>
        </table>

      </td></tr></tbody>
    </table>
  );
}

if (typeof window !== "undefined") window.WelcomeTemplate = WelcomeTemplate;
